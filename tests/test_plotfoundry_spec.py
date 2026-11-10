"""Scientific promotion contracts; no plotting library or native adapter required."""

import copy
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path
import unittest

SPEC = Path(__file__).resolve().parents[1] / "packages/spec"


sys.path.insert(0, str(SPEC / "tools"))
from reference import category_slots, lookup_index, normalize, points
from validate_spec import (
    ContractError,
    load_json,
    safe_path,
    validate_bundle,
    validate_schema,
    validate_values,
)
from promote import build_archive, promote, verify_sources, SOURCE_RUN


class PlotfoundrySpecTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(SPEC / "data/spec.json")
        cls.schema = load_json(SPEC / "schema.json")
        cls.lock = load_json(SPEC / "source-lock.json")
        cls.foundations = {
            name: load_json(SPEC / f"data/foundations/{name}.json")
            for name in cls.lock["upstream"]
        }

    def assert_rejected(self, mutate):
        data = copy.deepcopy(self.data)
        mutate(data)
        with self.assertRaises((ContractError, KeyError, TypeError, ValueError)):
            validate_schema(data, self.schema)
            validate_values(data, self.lock, self.foundations)

    def test_resolved_coverage_is_exactly_seventy_two(self):
        data = json.loads((SPEC / "data/spec.json").read_text())
        keys = {
            (c["theme"], c["mode"], c["profile"], c["surface"]) for c in data["cases"]
        }
        self.assertEqual(len(keys), 72)
        self.assertEqual(len(data["cases"]), 72)

    def test_schema_names_the_versioned_required_contracts(self):
        schema = json.loads((SPEC / "schema.json").read_text())
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], 1)
        self.assertTrue(
            {
                "maps",
                "categories",
                "themes",
                "cases",
                "fonts",
                "normalization",
                "placement",
            }.issubset(schema["required"])
        )

    def test_golden_fixtures_define_center_and_bin_edges(self):
        fixture = json.loads((SPEC / "conformance.json").read_text())
        self.assertTrue(
            any(
                row["center"] == 0 and row["value"] == 0 and row["expected"] == 0.5
                for row in fixture["diverging"]
            )
        )
        self.assertTrue(
            any(
                row["size"] == 257 and row["u"] == 0.5 and row["expected"] == 128
                for row in fixture["lookup"]
            )
        )

    def test_authority_is_locked_separately_from_generated_values(self):
        lock = json.loads((SPEC / "source-lock.json").read_text())
        self.assertEqual(len(lock["upstream"]), 9)
        self.assertIn("results/palette-samples.json", lock["files"])
        self.assertIn("results/font-resolution.json", lock["files"])
        self.assertTrue(lock["evidenceManifestSha256"])

    def test_authority_mutations_fail_independently_of_inventory(self):
        changes = {
            "sample": lambda d: d["maps"]["cividis"]["samples"][0].__setitem__(0, 0.5),
            "center": lambda d: d["maps"]["BrBG"].__setitem__("centerIndex", 127),
            "selection": lambda d: d["mapSelection"]["sequential"].__setitem__(
                "default", "viridis"
            ),
            "color space": lambda d: d["lut"].__setitem__(
                "color_space", "linear-light"
            ),
            "category": lambda d: d["categories"]["variants"]["colorblind-subset-3"][
                "slots"
            ][0].__setitem__("color", "#000000"),
            "duplicate category": lambda d: d["categories"]["variants"][
                "colorblind-subset-3"
            ]["slots"][1].__setitem__("id", "A"),
            "capacity": lambda d: d["categories"]["variants"][
                "colorblind-subset-3"
            ].__setitem__("capacity", 4),
            "font notice": lambda d: next(iter(d["fonts"].values())).__setitem__(
                "noticePaths", []
            ),
            "font reference": lambda d: d["themes"]["folio"]["fontRoles"][
                "ui"
            ].__setitem__("font", "0" * 64),
            "profile": lambda d: d["themes"]["folio"]["profiles"][
                "reading"
            ].__setitem__("body_annotation", 18),
            "role": lambda d: d["cases"][0]["roles"].__setitem__("ink", "#000000"),
            "duplicate case": lambda d: d["cases"].__setitem__(
                0, copy.deepcopy(d["cases"][1])
            ),
            "provenance": lambda d: d["provenance"].__setitem__(
                "researchCommit", "0" * 40
            ),
            "unsupported map": lambda d: d["maps"].__setitem__(
                "turbo", d["maps"]["cividis"]
            ),
            "nonfinite": lambda d: d["maps"]["cividis"]["samples"][0].__setitem__(
                0, float("nan")
            ),
        }
        for label, change in changes.items():
            with self.subTest(label=label):
                self.assert_rejected(change)

    def test_coherent_generated_profile_change_cannot_redefine_source(self):
        data = copy.deepcopy(self.data)
        data["themes"]["folio"]["profiles"]["reading"]["body_annotation"] = 18
        for case in data["cases"]:
            if case["theme"] == "folio" and case["profile"] == "reading":
                case["typography"]["body_annotation"] = 18
        with self.assertRaisesRegex(ContractError, "profile drift"):
            validate_values(data, self.lock, self.foundations)

    def test_numeric_edges_and_large_finite_ranges(self):
        self.assertEqual(normalize(0, -1e308, 1e308), 0.5)
        self.assertEqual(normalize(1e308, -1e308, 1e308), 1)
        self.assertEqual(normalize(0, -1e308, 1.5e308, 1e308), 0.25)
        self.assertIsNone(normalize(float("nan"), -1, 1, 0))
        self.assertIsNone(normalize(None, -1, 1, 0))
        self.assertEqual(lookup_index(0.5, 257), 128)
        edge = 1 / 256
        self.assertEqual(lookup_index(math.nextafter(edge, 0), 256), 0)
        self.assertEqual(lookup_index(edge, 256), 1)
        self.assertEqual(lookup_index(1, 256), 255)
        for args in [
            (0, 0, 0),
            (0, 1, -1),
            (0, 0, 1, 1),
            (0, False, 1),
            (0, 0, math.inf),
        ]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                normalize(*args)
        for args in [(0, 8, 640), (16, 0, 640), (16, 8, -1)]:
            with self.assertRaises(ValueError):
                points(*args)

    def test_explicit_category_domains_and_variant_identity(self):
        variants = self.data["categories"]["variants"]
        three, five = variants["colorblind-subset-3"], variants["colorblind-subset-5"]
        self.assertNotEqual(three["slots"][2]["color"], five["slots"][2]["color"])
        selected = category_slots(["a", "b", "c"], ["c", "a"], three)
        self.assertEqual([s["id"] for s in selected], ["C", "A"])
        self.assertEqual(category_slots([], [], three), [])
        for domain, observed in [
            (["a", "a"], ["a"]),
            (["a"], ["b"]),
            (["a", "b", "c", "d"], ["a"]),
        ]:
            with self.assertRaises(ValueError):
                category_slots(domain, observed, three)

    def test_nonfinite_json_and_unsafe_resource_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            bad = root / "bad.json"
            bad.write_text('{"number": NaN}')
            with self.assertRaises(ContractError):
                load_json(bad)
            (root / "link").symlink_to(SPEC / "data", target_is_directory=True)
            for path in [
                "../private",
                "/private",
                "a/../private",
                "a//b",
                "link/spec.json",
                "a\\b",
            ]:
                with self.subTest(path=path), self.assertRaises(ContractError):
                    safe_path(root, path)

    def test_promotion_rejects_managed_output_symlinks_before_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            target = root / "target"
            target.mkdir()
            output = root / "output"
            output.symlink_to(target, target_is_directory=True)
            with self.assertRaises(ContractError):
                promote(SOURCE_RUN, output)
            self.assertEqual(list(target.iterdir()), [])
            output.unlink()
            output.mkdir()
            sentinel = root / "sentinel"
            sentinel.write_text("preserve")
            (output / "foundations.schema.json").symlink_to(sentinel)
            with self.assertRaises(ContractError):
                promote(SOURCE_RUN, output)
            self.assertEqual(sentinel.read_text(), "preserve")

    def test_frozen_source_hash_change_is_not_promoted(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for relative in ["evidence-manifest.json", *self.lock["files"]]:
                target = root / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(SOURCE_RUN / relative, target)
            source = root / "results/palette-samples.json"
            source.write_bytes(source.read_bytes() + b" ")
            with self.assertRaisesRegex(ContractError, "Frozen source bytes changed"):
                verify_sources(root, self.lock)

    def test_deterministic_archive_validates_outside_checkout(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first = build_archive(SPEC, root / "first")
            second = build_archive(SPEC, root / "second")
            first_path = Path(first["archive"])
            second_path = Path(second["archive"])
            self.assertEqual(first_path.read_bytes(), second_path.read_bytes())
            extracted = root / "consumer"
            extracted.mkdir()
            with tarfile.open(first_path) as archive:
                archive.extractall(extracted, filter="data")
            bundle = extracted / "plotfoundry-spec-0.1.0"
            env = {**os.environ, "PYTHONPATH": "", "PYTHONDONTWRITEBYTECODE": "1"}
            result = subprocess.run(
                [
                    sys.executable,
                    "-B",
                    "tools/validate_spec.py",
                    ".",
                    "--verify-font-conversions",
                ],
                cwd=bundle,
                env=env,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('"cases": 72', result.stdout)
            self.assertTrue((bundle / "uv.lock").is_file())
            self.assertFalse((bundle / "tools/promote.py").exists())
            self.assertFalse((bundle / "research").exists())
            self.assertEqual(validate_bundle(bundle)["resources"], 40)
            font_path = next((bundle / "data/fonts").glob("*.ttf"))
            font_path.write_bytes(font_path.read_bytes() + b"corrupt")
            with self.assertRaises(ContractError):
                validate_bundle(bundle)


if __name__ == "__main__":
    unittest.main()
