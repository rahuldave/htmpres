"""Reject documentation of nonexistent Python/R plotting callables."""

import ast
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class NativeApiDocsTests(unittest.TestCase):
    def test_python_tables_and_imports_match_real_public_functions(self):
        definitions = set()
        for file in (ROOT / "packages/python/src/plotfoundry").glob("*.py"):
            definitions.update(
                n.name
                for n in ast.parse(file.read_text()).body
                if isinstance(n, (ast.FunctionDef, ast.ClassDef))
            )
        guide = (ROOT / "docs/plotting-python.qmd").read_text()
        for line in guide.splitlines():
            if line.startswith("| `"):
                for name in re.findall(r"`([a-z_]+)\(", line):
                    self.assertIn(name, definitions)
        for block in re.findall(r"```python\n(.*?)\n```", guide, re.S):
            for node in ast.walk(ast.parse(block)):
                if (
                    isinstance(node, ast.ImportFrom)
                    and node.module
                    and node.module.startswith("plotfoundry")
                ):
                    for name in node.names:
                        self.assertIn(name.name, definitions)

    def test_r_api_table_matches_native_exports(self):
        exports = set(
            re.findall(
                r"export\(([^)]+)\)", (ROOT / "packages/r/NAMESPACE").read_text()
            )
        )
        guide = (ROOT / "docs/plotting-r.qmd").read_text()
        for line in guide.splitlines():
            if line.startswith("| `"):
                for name in re.findall(r"`(pf_[a-z_]+)\(", line):
                    self.assertIn(name, exports)
        source = (ROOT / "examples/plotting/r-quickstart.qmd").read_text()
        self.assertIn("](observations.png){width=640px}", source)
        self.assertIn('pf_export(s,"observations",plot=p)', source)


if __name__ == "__main__":
    unittest.main()
