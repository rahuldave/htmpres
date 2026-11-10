"""Static website closure tests need no Node/R/native plotting dependencies."""

import importlib.util
from pathlib import Path
import tempfile
import shutil
import unittest
import re
import hashlib
import json
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "stage_js", ROOT / "scripts/stage-javascript-docs.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BrowserDocsTests(unittest.TestCase):
    def test_complete_modules_are_the_documented_code(self):
        for name in ["deliveries", "energy", "changes", "native"]:
            source = (
                module.SOURCE / "examples/standalone" / (name + ".js")
            ).read_text()
            source = re.sub(
                r"^globalThis\.plotfoundryExample = .*\n", "", source, flags=re.M
            )
            for path in [
                module.SOURCE / "README.md",
                ROOT / "docs/plotting-javascript.qmd",
            ]:
                self.assertIn("```js\n" + source + "```", path.read_text(), name)
            self.assertEqual(
                (module.SOURCE / "examples/output" / (name + ".png")).read_bytes(),
                (ROOT / "docs/assets/javascript" / (name + ".png")).read_bytes(),
            )

    def test_browser_closure_and_stale_input(self):
        files = module.snapshot()
        self.assertIn("resources/data/spec.json", files)
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "package"
            shutil.copytree(
                module.SOURCE,
                source,
                ignore=shutil.ignore_patterns("node_modules", "tests", "tools"),
            )
            (source / "src/index.js").write_text("changed")
            with self.assertRaisesRegex(ValueError, "Stale browser input"):
                module.snapshot(source)

    def test_stage_rejects_symlink_ancestor_without_deleting_external_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            outside = root / "outside"
            outside.mkdir()
            (outside / "existing").mkdir()
            sentinel = outside / "existing/sentinel"
            sentinel.write_text("preserve")
            alias = root / "alias"
            alias.symlink_to(outside, target_is_directory=True)
            with patch.object(module, "OUTPUT", alias / "existing"):
                with self.assertRaisesRegex(ValueError, "symlink"):
                    module.stage()
            self.assertEqual(sentinel.read_text(), "preserve")

    def test_coherently_rehashed_extra_resource_is_not_published(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "package"
            shutil.copytree(
                module.SOURCE,
                source,
                ignore=shutil.ignore_patterns("node_modules", "tests", "tools"),
            )
            for prefix in ["resources", "vendor"]:
                extra = source / prefix / "private-book.pdf"
                extra.write_bytes(b"private")
                path = source / "browser-manifest.json"
                manifest = json.loads(path.read_text())
                manifest["files"][prefix + "/private-book.pdf"] = hashlib.sha256(
                    b"private"
                ).hexdigest()
                path.write_text(json.dumps(manifest))
                with self.assertRaisesRegex(ValueError, "closure"):
                    module.snapshot(source)
                extra.unlink()
                del manifest["files"][prefix + "/private-book.pdf"]
                path.write_text(json.dumps(manifest))

    def test_extra_resource_and_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "package"
            shutil.copytree(
                module.SOURCE,
                source,
                ignore=shutil.ignore_patterns("node_modules", "tests", "tools"),
            )
            extra = source / "resources/private.txt"
            extra.write_text("never publish")
            with self.assertRaisesRegex(ValueError, "closure"):
                module.snapshot(source)
            extra.unlink()
            extra.symlink_to(source / "resources/data/spec.json")
            with self.assertRaisesRegex(ValueError, "symlink"):
                module.snapshot(source)


if __name__ == "__main__":
    unittest.main()
