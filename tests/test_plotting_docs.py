"""Static plotting publication is a closed, stale-checked asset pipeline."""

import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PlottingDocsTests(unittest.TestCase):
    def test_reviewed_public_bundle_exists_and_covers_all_interfaces(self):
        loader = importlib.util.spec_from_file_location(
            "plotting_docs", ROOT / "scripts/plotting_docs.py"
        )
        module = importlib.util.module_from_spec(loader)
        loader.loader.exec_module(module)
        manifest = module.validate(ROOT / "docs/_plotting", ROOT)
        self.assertEqual(len(manifest["views"]), 216)
        self.assertEqual(
            {v["interface"] for v in manifest["views"]},
            {"python", "r-ggplot", "r-base"},
        )


if __name__ == "__main__":
    unittest.main()


class StaticPublicationSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import tempfile, shutil

        loader = importlib.util.spec_from_file_location(
            "plotting_docs_safety", ROOT / "scripts/plotting_docs.py"
        )
        cls.module = importlib.util.module_from_spec(loader)
        loader.loader.exec_module(cls.module)
        cls.temporary = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temporary.name).resolve()
        cls.bundle = cls.root / "bundle"
        shutil.copytree(ROOT / "docs/_plotting", cls.bundle)
        cls.repo = cls.root.resolve() / "repo"
        cls.repo.mkdir()
        canonical = set(cls.module.canonical_sources(ROOT).values()) | {
            ROOT / "packages/spec/data/spec.json",
            ROOT / "docs/_plotting-evidence.json",
        }
        for source in canonical:
            target = cls.repo / source.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        for name in ("runtime.py", "example.py", "spec.json"):
            (cls.repo / name).write_text("reviewed")

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def setUp(self):
        import json
        from unittest.mock import patch

        self.patch = patch.object(
            self.module, "FINGERPRINT_ROOTS", ("runtime.py", "example.py", "spec.json")
        )
        self.patch.start()
        self.original = (self.bundle / "manifest.json").read_bytes()
        self.manifest = json.loads(self.original)
        self.manifest["inputFingerprints"] = self.module.fingerprints(self.repo)
        self.write_manifest()

    def tearDown(self):
        (self.bundle / "manifest.json").write_bytes(self.original)
        self.patch.stop()

    def write_manifest(self):
        import json

        (self.bundle / "manifest.json").write_text(json.dumps(self.manifest))

    def test_stage_closes_exact_assets(self):
        output = self.root / "output"
        self.module.stage(self.bundle, output, self.repo)
        self.assertEqual(
            self.module.regular_files(output), self.module.regular_files(self.bundle)
        )

    def test_stale_runtime_example_and_spec_rejected(self):
        for name in ("runtime.py", "example.py", "spec.json"):
            (self.repo / name).write_text("changed")
            try:
                with self.assertRaisesRegex(ValueError, "Stale"):
                    self.module.validate(self.bundle, self.repo)
            finally:
                (self.repo / name).write_text("reviewed")

    def test_extra_missing_and_altered_payload_rejected(self):
        extra = self.bundle / "private-book.pdf"
        extra.write_text("private")
        try:
            with self.assertRaisesRegex(ValueError, "Unexpected/missing"):
                self.module.validate(self.bundle, self.repo)
        finally:
            extra.unlink()
        name = next(name for name in self.manifest["files"] if name.endswith(".png"))
        path = self.bundle / name
        original = path.read_bytes()
        try:
            path.unlink()
            with self.assertRaisesRegex(ValueError, "Unexpected/missing"):
                self.module.validate(self.bundle, self.repo)
            path.write_bytes(original + b"changed")
            with self.assertRaisesRegex(ValueError, "Altered"):
                self.module.validate(self.bundle, self.repo)
        finally:
            path.write_bytes(original)

    def test_unsafe_reference_and_symlink_rejected(self):
        self.manifest["views"][0]["downloads"]["png"] = "../outside.png"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            self.module.validate(self.bundle, self.repo)
        self.manifest["views"][0]["downloads"]["png"] = "/tmp/private.png"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            self.module.validate(self.bundle, self.repo)
        self.manifest["views"][0]["downloads"]["png"] = next(
            name for name in self.manifest["files"] if name.endswith(".png")
        )
        self.write_manifest()
        extra = self.bundle / "escape.png"
        extra.symlink_to("/tmp")
        try:
            with self.assertRaisesRegex(ValueError, "Symlink"):
                self.module.validate(self.bundle, self.repo)
        finally:
            extra.unlink()

    def test_private_metadata_and_duplicate_views_rejected(self):
        self.manifest["views"].append(self.manifest["views"][0])
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.module.validate(self.bundle, self.repo)
        self.manifest["views"].pop()
        self.write_manifest()
        path = self.bundle / self.manifest["views"][0]["report"]
        original = path.read_bytes()
        import json

        report = json.loads(original)
        report["host"] = "/Users/private"
        payload = json.dumps(report).encode()
        path.write_bytes(payload)
        self.manifest["files"][path.relative_to(self.bundle).as_posix()] = {
            "bytes": len(payload),
            "sha256": self.module.digest(payload),
        }
        self.write_manifest()
        try:
            with self.assertRaisesRegex(ValueError, "Private/local"):
                self.module.validate(self.bundle, self.repo)
        finally:
            path.write_bytes(original)

    def test_coherently_rehashed_sources_notices_and_reports_rejected(self):
        import json

        targets = [
            ("source/python-gallery.py", "Canonical"),
            ("source/r-ggplot-gallery.R", "Canonical"),
            ("notices/python-MIT.txt", "Canonical"),
            (self.manifest["views"][0]["report"], "Unexpected public report"),
        ]
        for name, message in targets:
            with self.subTest(name=name):
                path = self.bundle / name
                original = path.read_bytes()
                entry = self.manifest["files"][name].copy()
                if name.startswith("reports/"):
                    report = json.loads(original)
                    report["host"] = "https://host.example"
                    payload = json.dumps(report).encode()
                else:
                    payload = original + b"\nchanged"
                path.write_bytes(payload)
                self.manifest["files"][name] = {
                    "sha256": self.module.digest(payload),
                    "bytes": len(payload),
                }
                self.write_manifest()
                try:
                    with self.assertRaisesRegex(ValueError, message):
                        self.module.validate(self.bundle, self.repo)
                finally:
                    path.write_bytes(original)
                    self.manifest["files"][name] = entry
                    self.write_manifest()

    def test_unsafe_output_preserves_external_and_source_sentinels(self):
        outside = self.root / "external"
        outside.mkdir(exist_ok=True)
        destination = outside / "output"
        destination.mkdir(exist_ok=True)
        sentinel = destination / "sentinel"
        sentinel.write_text("untouched")
        link = self.root / "alias"
        link.symlink_to(outside, target_is_directory=True)
        try:
            with self.assertRaisesRegex(ValueError, "Unsafe managed"):
                self.module.stage(self.bundle, link / "output", self.repo)
            self.assertEqual(sentinel.read_text(), "untouched")
        finally:
            link.unlink()
        with self.assertRaisesRegex(ValueError, "overlaps"):
            self.module.stage(self.bundle, self.bundle, self.repo)
        with self.assertRaisesRegex(ValueError, "managed plotting|overlaps"):
            self.module.stage(self.bundle, self.repo, self.repo)
        self.assertTrue((self.bundle / "manifest.json").is_file())

    def test_rehashed_unreferenced_asset_is_rejected(self):
        name = "private-book.pdf"
        path = self.bundle / name
        payload = b"private book"
        path.write_bytes(payload)
        self.manifest["files"][name] = {
            "sha256": self.module.digest(payload),
            "bytes": len(payload),
        }
        self.write_manifest()
        try:
            with self.assertRaisesRegex(ValueError, "Unreferenced"):
                self.module.validate(self.bundle, self.repo)
        finally:
            path.unlink()

    def test_url_schemes_and_encoded_traversal_rejected(self):
        for value in (
            "javascript:alert(1).png",
            "exports/%2e%2e/secret.png",
            "exports/x.png?other=1",
            "exports/x.png#other",
        ):
            with self.subTest(value=value), self.assertRaisesRegex(
                ValueError, "Unsafe"
            ):
                self.module.safe(self.bundle, value)

    def test_manifest_root_and_file_entries_are_closed(self):
        self.manifest["host"] = "https://unapproved.example"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "manifest root"):
            self.module.validate(self.bundle, self.repo)
        del self.manifest["host"]
        name = next(iter(self.manifest["files"]))
        self.manifest["files"][name]["host"] = "local"
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, "file entry"):
            self.module.validate(self.bundle, self.repo)
