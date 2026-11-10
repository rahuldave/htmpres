"""Managed-output safety; scientific source validation itself remains shared-spec-owned."""

import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "promote_js", ROOT / "scripts/promote-javascript-spec.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PromotionTests(unittest.TestCase):
    def test_output_symlinks_preserve_external_sentinel(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            outside = root / "outside"
            outside.mkdir()
            sentinel = outside / "sentinel"
            sentinel.write_text("preserve")
            package = root / "package"
            package.mkdir()
            (package / "src").mkdir()
            target = package / "resources"
            target.symlink_to(outside, target_is_directory=True)
            with patch.object(module, "TARGET", target), patch.object(
                module, "snapshot", return_value=({"data/spec.json": b"{}"}, "pins")
            ), patch.object(sys, "argv", ["promote", "--write"]):
                with self.assertRaisesRegex(ValueError, "symlink"):
                    module.main()
            self.assertEqual(sentinel.read_text(), "preserve")
            target.unlink()
            target.mkdir()
            (target / "old").write_text("old")
            (package / "src/pins.js").symlink_to(sentinel)
            with patch.object(module, "TARGET", target), patch.object(
                module, "snapshot", return_value=({"data/spec.json": b"{}"}, "pins")
            ), patch.object(sys, "argv", ["promote", "--write"]):
                with self.assertRaisesRegex(ValueError, "symlink"):
                    module.main()
            self.assertEqual(sentinel.read_text(), "preserve")
            self.assertEqual((target / "old").read_text(), "old")


if __name__ == "__main__":
    unittest.main()
