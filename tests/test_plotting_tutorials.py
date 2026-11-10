"""Protect exact tutorial pairing and the static Website publication boundary."""

import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "plotting_tutorials", ROOT / "scripts/plotting_tutorials.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TutorialPublicationTests(unittest.TestCase):
    def test_reviewed_bundle_and_inline_sources_match(self):
        result = module.validate(ROOT / module.BUNDLE, ROOT)
        self.assertEqual(len(result["cases"]), 10)
        self.assertEqual(len(result["files"]), 50)

    def test_traversal_and_symlinks_rejected(self):
        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            for path in ("../private", "/absolute", "x/../../private", "x\\private"):
                with self.assertRaises(ValueError):
                    module.safe(root, path)
            (root / "linked").symlink_to(ROOT, target_is_directory=True)
            with self.assertRaises(ValueError):
                module.safe(root, "linked/README.md")

    def test_changed_export_and_unlisted_file_are_rejected(self):
        with tempfile.TemporaryDirectory() as work:
            bundle = Path(work) / "bundle"
            shutil.copytree(ROOT / module.BUNDLE, bundle)
            target = bundle / "python-electricity.png"
            before = target.read_bytes()
            target.write_bytes(before + b"altered")
            with self.assertRaisesRegex(ValueError, "inventory"):
                module.validate(bundle, ROOT)
            target.write_bytes(before)
            (bundle / "private.txt").write_text("not allowlisted")
            with self.assertRaisesRegex(ValueError, "inventory"):
                module.validate(bundle, ROOT)

    def test_source_drift_is_rejected_even_if_bundle_hashes_match(self):
        with tempfile.TemporaryDirectory() as work:
            bundle = Path(work) / "bundle"
            shutil.copytree(ROOT / module.BUNDLE, bundle)
            manifest = json.loads((bundle / "manifest.json").read_text())
            source = bundle / "python-electricity.py"
            source.write_text(source.read_text() + "\n# changed\n")
            manifest["files"][source.name] = module.digest(source.read_bytes())
            (bundle / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "canonical"):
                module.validate(bundle, ROOT)

    def test_stale_runtime_pin_and_duplicate_keys_rejected(self):
        with tempfile.TemporaryDirectory() as work:
            bundle = Path(work) / "bundle"
            shutil.copytree(ROOT / module.BUNDLE, bundle)
            path = bundle / "manifest.json"
            manifest = json.loads(path.read_text())
            manifest["inputs"][next(iter(manifest["inputs"]))] = "0" * 64
            path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "Stale"):
                module.validate(bundle, ROOT)
            path.write_text('{"schemaVersion":1,"schemaVersion":2}')
            with self.assertRaisesRegex(ValueError, "Duplicate"):
                module.validate(bundle, ROOT)

    def test_profile_variants_only_change_declared_profile_resolution_and_name(self):
        for stem, suffix, replacements in (
            (
                "python-electricity",
                "py",
                [
                    ('profile="reading"', 'profile="presentation"'),
                    (
                        '"python-electricity", dpi=80',
                        '"python-electricity-presentation", dpi=144',
                    ),
                ],
            ),
            (
                "r-yield",
                "R",
                [
                    ('profile = "reading"', 'profile = "presentation"'),
                    (
                        '"r-yield", plot = p, height_inches = 4.8, dpi = 80',
                        '"r-yield-presentation", plot = p, height_inches = 4.8, dpi = 144',
                    ),
                ],
            ),
        ):
            source = (ROOT / module.SOURCE / (stem + "." + suffix)).read_text()
            for before, after in replacements:
                source = source.replace(before, after)
            self.assertEqual(
                source,
                (ROOT / module.SOURCE / (stem + "-presentation." + suffix)).read_text(),
            )


class TutorialPromotionSafetyTests(unittest.TestCase):
    def test_coherently_rehashed_report_metadata_and_false_cases_fail(self):
        for mutation in ("case-extra", "report-extra", "wrong-case", "wrong-placement"):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as work:
                bundle = Path(work) / "bundle"
                shutil.copytree(ROOT / module.BUNDLE, bundle)
                manifest = json.loads((bundle / "manifest.json").read_text())
                report_path = bundle / "python-electricity.report.json"
                report = json.loads(report_path.read_text())
                if mutation == "case-extra":
                    manifest["cases"][0]["host"] = "/Users/private"
                elif mutation == "report-extra":
                    report["host"] = "https://private.example"
                elif mutation == "wrong-case":
                    report["case"] = "folio/dark/reading/paper"
                    manifest["cases"][0]["themeCase"] = report["case"]
                else:
                    report["placedWidthCssPx"] = 999
                report_path.write_text(json.dumps(report))
                manifest["files"][report_path.name] = module.digest(
                    report_path.read_bytes()
                )
                (bundle / "manifest.json").write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    module.validate(bundle, ROOT)

    def make_repo(self, work):
        repo = Path(work) / "repo"
        for relative in (
            module.SOURCE,
            *module.INPUTS,
            "docs/plotting-python.qmd",
            "docs/plotting-r.qmd",
            "packages/spec/data/spec.json",
            module.BUNDLE,
        ):
            source = ROOT / relative
            target = repo / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir():
                shutil.copytree(source, target, dirs_exist_ok=True)
            else:
                shutil.copyfile(source, target)
        outputs = Path(work) / "outputs"
        outputs.mkdir()
        executed = {
            f"{stem}.{module.extension(stem)}": module.digest(
                (repo / module.SOURCE / f"{stem}.{module.extension(stem)}").read_bytes()
            )
            for stem in module.IDS
        }
        (outputs / "execution.json").write_text(json.dumps({"sources": executed}))
        return repo, outputs

    def test_promotion_rejects_existing_symlink_without_touching_external_file(self):
        with tempfile.TemporaryDirectory() as work:
            repo, outputs = self.make_repo(work)
            sentinel = Path(work) / "outside.png"
            sentinel.write_text("preserve")
            target = repo / module.BUNDLE / "python-electricity.png"
            target.unlink()
            target.symlink_to(sentinel)
            with self.assertRaisesRegex(ValueError, "Symlink"):
                module.promote(outputs, repo, {"python": "0" * 64, "r": "1" * 64})
            self.assertEqual(sentinel.read_text(), "preserve")
            self.assertTrue(target.is_symlink())

    def test_failed_input_preparation_preserves_complete_old_bundle(self):
        with tempfile.TemporaryDirectory() as work:
            repo, outputs = self.make_repo(work)
            before = module.inventory(repo / module.BUNDLE)
            # The source ledger is valid, but native export capture is incomplete.
            with self.assertRaises(FileNotFoundError):
                module.promote(outputs, repo, {"python": "0" * 64, "r": "1" * 64})
            self.assertEqual(before, module.inventory(repo / module.BUNDLE))
            self.assertFalse(list((repo / "docs").glob(".tutorial-candidate-*")))

    def test_failed_directory_publication_restores_old_bundle(self):
        from unittest.mock import patch

        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            old, candidate = root / "old", root / "candidate"
            old.mkdir()
            candidate.mkdir()
            (old / "sentinel").write_text("keep")
            (candidate / "replacement").write_text("new")
            rename = Path.rename

            def fail_candidate(self, target):
                if self == candidate:
                    raise OSError("simulated publication failure")
                return rename(self, target)

            with patch.object(Path, "rename", fail_candidate), self.assertRaises(
                OSError
            ):
                module.replace_managed(candidate, old)
            self.assertEqual((old / "sentinel").read_text(), "keep")
            self.assertTrue((candidate / "replacement").is_file())

    def test_failed_publication_and_restore_preserve_backup(self):
        from unittest.mock import patch

        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            old, candidate = root / "old", root / "candidate"
            old.mkdir()
            candidate.mkdir()
            (old / "sentinel").write_text("only old copy")
            rename = Path.rename

            def fail_both(self, target):
                if self == candidate or self.name.startswith(".tutorial-backup-"):
                    raise OSError("simulated rename failure")
                return rename(self, target)

            with patch.object(Path, "rename", fail_both), self.assertRaisesRegex(
                RuntimeError, "retained at"
            ):
                module.replace_managed(candidate, old)
            backups = list(root.glob(".tutorial-backup-*"))
            self.assertEqual(len(backups), 1)
            self.assertEqual((backups[0] / "sentinel").read_text(), "only old copy")


if __name__ == "__main__":
    unittest.main()
