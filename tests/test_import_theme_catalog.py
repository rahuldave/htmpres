"""Focused maintenance-tool tests; no sibling repositories or downloads needed."""

import importlib.util
from pathlib import Path
import unittest
import tempfile

spec = importlib.util.spec_from_file_location("theme_import", Path(__file__).resolve().parents[1] / "scripts/import-theme-catalog.py")
theme_import = importlib.util.module_from_spec(spec)
spec.loader.exec_module(theme_import)


class ThemeImportTests(unittest.TestCase):
    def test_notice_normalization_preserves_text_and_binary_fonts(self):
        with tempfile.TemporaryDirectory() as folder:
            notice, font = Path(folder) / "FONT-OFL.txt", Path(folder) / "font.ttf"
            notice.write_bytes(b"Copyright Authors \r\nPermission granted.\r\n")
            font.write_bytes(b"\x00\xff\r\n ")
            self.assertEqual(theme_import.asset_bytes(notice), b"Copyright Authors\nPermission granted.\n")
            self.assertEqual(theme_import.asset_bytes(font), b"\x00\xff\r\n ")

    def test_modes_inherit_roots_and_ignore_component_tokens(self):
        modes = theme_import.variables('''
          :root, [data-bs-theme="light"] { --bs-body-bg: #fff; --bs-body-color: #222; --bs-primary: #123456; }
          [data-bs-theme=dark] { --bs-body-bg: #111; }
          .card { --bs-body-bg: #ff0000; }
        ''')
        self.assertEqual(modes["light"]["--bs-body-bg"], "#fff")
        self.assertEqual(modes["dark"]["--bs-body-bg"], "#111")
        self.assertEqual(modes["dark"]["--bs-primary"], "#123456")

    def test_colors_and_alpha_composite(self):
        self.assertEqual(theme_import.color("#abc"), "#aabbcc")
        self.assertEqual(theme_import.color("rgba(255, 255, 255, 0.4)", "#000000"), "#666666")
        with self.assertRaises(ValueError):
            theme_import.rgb("transparent")

    def test_complementary_modes_change_paper_and_keep_readable_accents(self):
        p = dict(paper="#ffffff", ink="#212529", muted="#666666", panel="#eeeeee", line="#cccccc",
                 accent="#593196", secondary="#593196", code="#eeeeee")
        dark = theme_import.counterpart(p, "dark")
        self.assertLess(theme_import.luminance(dark["paper"]), .1)
        a, b = sorted((theme_import.luminance(dark["accent"]), theme_import.luminance(dark["paper"])))
        self.assertGreaterEqual((b + .05) / (a + .05), 4.5)
        self.assertNotEqual(dark["paper"], p["paper"])


if __name__ == "__main__":
    unittest.main()
