"""Focused maintenance-tool tests; no sibling repositories or downloads needed."""

import importlib.util
from pathlib import Path
import unittest
import tempfile
import json
import copy
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "theme_import",
    Path(__file__).resolve().parents[1] / "scripts/import-theme-catalog.py",
)
theme_import = importlib.util.module_from_spec(spec)
spec.loader.exec_module(theme_import)


class ThemeImportTests(unittest.TestCase):
    def test_notice_normalization_preserves_text_and_binary_fonts(self):
        with tempfile.TemporaryDirectory() as folder:
            notice, font = Path(folder) / "FONT-OFL.txt", Path(folder) / "font.ttf"
            notice.write_bytes(b"Copyright Authors \r\nPermission granted.\r\n")
            font.write_bytes(b"\x00\xff\r\n ")
            self.assertEqual(
                theme_import.asset_bytes(notice),
                b"Copyright Authors\nPermission granted.\n",
            )
            self.assertEqual(theme_import.asset_bytes(font), b"\x00\xff\r\n ")

    def test_modes_inherit_roots_and_ignore_component_tokens(self):
        modes = theme_import.variables("""
          :root, [data-bs-theme="light"] { --bs-body-bg: #fff; --bs-body-color: #222; --bs-primary: #123456; }
          [data-bs-theme=dark] { --bs-body-bg: #111; }
          .card { --bs-body-bg: #ff0000; }
        """)
        self.assertEqual(modes["light"]["--bs-body-bg"], "#fff")
        self.assertEqual(modes["dark"]["--bs-body-bg"], "#111")
        self.assertEqual(modes["dark"]["--bs-primary"], "#123456")

    def test_published_foundation_schema_and_reference_validation(self):
        file = theme_import.DEST / "foundations/folio.json"
        valid = json.loads(file.read_text())
        theme_import.validate_foundation(valid)
        for mutation in ["version", "reference", "missing-mode", "color", "unknown"]:
            data = copy.deepcopy(valid)
            if mutation == "version":
                data["schemaVersion"] = 2
            if mutation == "reference":
                data["modes"]["light"]["roles"]["ink"] = "missing"
            if mutation == "missing-mode":
                del data["modes"]["dark"]
            if mutation == "color":
                data["modes"]["light"]["swatches"]["anchor-paper"] = "transparent"
            if mutation == "unknown":
                data["unexpected"] = "no"
            with self.assertRaises(ValueError, msg=mutation):
                theme_import.validate_foundation(data)

    def test_committed_asset_guard_rejects_dirty_or_untracked_inputs(self):
        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder)
            asset = repo / "fonts.css"
            asset.write_bytes(b"committed")
            with patch.object(
                theme_import.subprocess, "check_output", return_value=b"committed"
            ):
                self.assertEqual(
                    theme_import.committed_bytes(repo, asset, "abc"), b"committed"
                )
                asset.write_bytes(b"working changes")
                with self.assertRaisesRegex(ValueError, "Uncommitted import asset"):
                    theme_import.committed_bytes(repo, asset, "abc")

    def test_imported_notice_and_font_registry_coverage(self):
        catalog = json.loads((theme_import.DEST / "catalog.json").read_text())
        self.assertTrue(
            catalog["fonts"], "Full imports need a reusable stock font registry"
        )
        for name, entry in catalog["themes"].items():
            if "foundation" not in entry:
                continue
            notice = f"licenses/{name}-LICENSE"
            self.assertIn(notice, entry["assets"])
            self.assertTrue((theme_import.DEST / notice).read_text())
            for font in entry["assets"]:
                if font.startswith("fonts/") and font.endswith(".ttf"):
                    self.assertIn(Path(font).name, catalog["fonts"])

    def test_import_into_empty_registry_keeps_reusable_fonts_and_full_notice(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            repo, dest = root / "repo", root / "dest"
            ext = repo / "_extensions/folio"
            (ext / "fonts").mkdir(parents=True)
            (repo / "src").mkdir()
            (dest / "fonts").mkdir(parents=True)
            (dest / "licenses").mkdir()
            raw = (theme_import.DEST / "foundations/folio.json").read_bytes()
            (ext / "foundations.json").write_bytes(raw)
            (ext / "fonts/test.ttf").write_bytes(b"font data")
            (repo / "src/fonts.css").write_text(
                "@font-face { font-family: 'Source Serif 4'; src: url(fonts/test.ttf); }"
            )
            (repo / "LICENSE").write_text("MIT License\nFull permission notice.\n")
            catalog = dict(themes={}, sources={}, fonts={})
            with patch.object(theme_import, "DEST", dest), patch.object(
                theme_import, "revision", return_value="a" * 40
            ), patch.object(theme_import, "validate_foundation"), patch.object(
                theme_import,
                "committed_bytes",
                side_effect=lambda repo, file, commit: file.read_bytes(),
            ):
                theme_import.import_owned(catalog, "folio", repo)
            self.assertIn("test.ttf", catalog["fonts"])
            self.assertIn(
                "licenses/folio-LICENSE", catalog["themes"]["folio"]["assets"]
            )
            self.assertEqual(
                (dest / "licenses/folio-LICENSE").read_text(),
                "MIT License\nFull permission notice.\n",
            )

    def test_owned_ledger_requires_exact_coverage(self):
        with self.assertRaisesRegex(ValueError, "exactly the nine"):
            theme_import.refresh_owned([])

    def test_colors_and_alpha_composite(self):
        self.assertEqual(theme_import.color("#abc"), "#aabbcc")
        self.assertEqual(
            theme_import.color("rgba(255, 255, 255, 0.4)", "#000000"), "#666666"
        )
        with self.assertRaises(ValueError):
            theme_import.rgb("transparent")

    def test_complementary_modes_change_paper_and_keep_readable_accents(self):
        p = dict(
            paper="#ffffff",
            ink="#212529",
            muted="#666666",
            panel="#eeeeee",
            line="#cccccc",
            accent="#593196",
            secondary="#593196",
            code="#eeeeee",
        )
        dark = theme_import.counterpart(p, "dark")
        self.assertLess(theme_import.luminance(dark["paper"]), 0.1)
        a, b = sorted(
            (
                theme_import.luminance(dark["accent"]),
                theme_import.luminance(dark["paper"]),
            )
        )
        self.assertGreaterEqual((b + 0.05) / (a + 0.05), 4.5)
        self.assertNotEqual(dark["paper"], p["paper"])


if __name__ == "__main__":
    unittest.main()
