"""Build-only promotion must reject drift before replacing native R resources."""

import importlib.util
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
loader = importlib.util.spec_from_file_location(
    "r_promotion", ROOT / "scripts/promote-r-spec.py"
)
module = importlib.util.module_from_spec(loader)
loader.loader.exec_module(module)


class RPromotionTests(unittest.TestCase):
    def test_snapshot_exact_allowlist(self):
        self.assertEqual(len(module.snapshot()), 45)

    def test_bad_source_cannot_replace_existing_output(self):
        for mutation in ("extra", "symlink", "hash"):
            with self.subTest(
                mutation=mutation
            ), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                source = root / "spec"
                source.mkdir()
                for name in (
                    "schema.json",
                    "source-lock.json",
                    "foundations.schema.json",
                    "conformance.json",
                ):
                    shutil.copy2(module.SPEC / name, source / name)
                shutil.copytree(module.SPEC / "data", source / "data")
                if mutation == "extra":
                    (source / "data/extra.json").write_text("{}")
                elif mutation == "symlink":
                    (source / "data/spec.json").unlink()
                    (source / "data/spec.json").symlink_to(
                        module.SPEC / "data/spec.json"
                    )
                else:
                    (source / "data/spec.json").write_text("{}")
                output = root / "output"
                output.mkdir()
                (output / "sentinel").write_text("untouched")
                with patch.object(module, "SPEC", source), patch.object(
                    module, "TARGET", output
                ), patch.object(sys, "argv", ["promote-r-spec", "--write"]):
                    with self.assertRaises((ValueError, AssertionError)):
                        module.main()
                self.assertEqual((output / "sentinel").read_text(), "untouched")


if __name__ == "__main__":
    unittest.main()
