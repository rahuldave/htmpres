"""Contract tests for the independent identity-only package boundaries."""

import json
from pathlib import Path
import tomllib
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PackageBoundaryTests(unittest.TestCase):
    def test_python_has_no_runtime_dependencies(self):
        data = tomllib.loads((ROOT / "packages/python/pyproject.toml").read_text())
        self.assertEqual(data["project"]["name"], "plotfoundry")
        self.assertEqual(data["project"]["dependencies"], [])
        self.assertTrue((ROOT / "packages/python/LICENSE").is_file())

    def test_javascript_is_independent_browser_esm(self):
        data = json.loads((ROOT / "packages/javascript/package.json").read_text())
        self.assertEqual(data["name"], "plotfoundry")
        self.assertEqual(data["type"], "module")
        self.assertFalse(data.get("private", False))
        self.assertFalse(data.get("dependencies", {}))
        entry = ROOT / "packages/javascript" / data["exports"]["."]
        source = entry.read_text()
        self.assertNotIn("node:", source)
        self.assertNotIn("process.", source)
        self.assertNotIn("require(", source)

    def test_r_has_no_added_runtime_packages(self):
        source = (ROOT / "packages/r/DESCRIPTION").read_text()
        self.assertIn("Package: plotfoundry\n", source)
        self.assertNotIn("Imports:", source)
        self.assertNotIn("LinkingTo:", source)
        self.assertNotIn("Suggests:", source)
        self.assertTrue((ROOT / "packages/r/man/package_info.Rd").is_file())

    def test_spec_is_owned_without_premature_scientific_data(self):
        spec = json.loads((ROOT / "packages/spec/boundary.json").read_text())
        self.assertEqual(spec["status"], "identity-scaffold")
        self.assertEqual(spec["runtimeDependencies"], [])
        self.assertFalse(spec["scientificContractPromoted"])
        for directory in ("python", "r", "javascript"):
            path = ROOT / "packages" / directory
            self.assertTrue((path / "README.md").is_file())
            for suffix in ("*.ttf", "*.woff", "*palette*.json", "*foundations*.json"):
                self.assertEqual(list(path.rglob(suffix)), [])
        root = json.loads((ROOT / "package.json").read_text())
        self.assertEqual(root["name"], "htmpres")
        self.assertTrue(root["private"])


if __name__ == "__main__":
    unittest.main()
