"""Actual72case raster/vector acceptance evidence, separate from fast unit checks."""

import json
from pathlib import Path
import unittest
from PIL import Image
from pypdf import PdfReader
from matplotlib.colors import to_rgb

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".build/packages/python-gallery"


class PythonGalleryTests(unittest.TestCase):
    def test_all_cases_have_real_exports_fonts_and_missing_cues(self) -> None:
        """Check rendered artifacts rather than only planned configuration values."""
        reports = json.loads((OUTPUT / "manifest.json").read_text())
        self.assertEqual(len(reports), 72)
        self.assertEqual(len({r["case"] for r in reports}), 72)
        for report in reports:
            with self.subTest(case=report["case"]):
                self.assertTrue(
                    all(
                        report["observed"][key]
                        for key in (
                            "titleLaneClear",
                            "footerClear",
                            "legendClear",
                            "textFits",
                        )
                    )
                )
                self.assertEqual(report["observed"]["lines"], 3)
                self.assertEqual(report["observed"]["scatterGroups"], 5)
                self.assertEqual(report["observed"]["missingCells"], [1, 1])
                expected = {Path(f["file"]).name for f in report["fonts"].values()}
                self.assertEqual(set(report["observed"]["fonts"]), expected)
                prefix = OUTPUT / report["case"].replace("/", "-")
                with Image.open(prefix.with_suffix(".png")) as image:
                    self.assertEqual(list(image.size), report["canvasPixels"])
                    background = tuple(
                        round(v * 255)
                        for v in to_rgb(report["observed"]["roles"]["background"])
                    )
                    self.assertEqual(image.convert("RGB").getpixel((0, 0)), background)
                svg = prefix.with_suffix(".svg").read_text()
                self.assertNotIn("<text", svg)
                self.assertIn("<path", svg)
                reader = PdfReader(prefix.with_suffix(".pdf"))
                page = reader.pages[0]
                self.assertEqual(float(page.mediabox.width), 576)
                self.assertEqual(float(page.mediabox.height), 576)
                fonts = page["/Resources"]["/Font"].get_object()
                self.assertTrue(fonts)
                for font in fonts.values():
                    descendants = font.get_object()["/DescendantFonts"]
                    descriptor = (
                        descendants[0].get_object()["/FontDescriptor"].get_object()
                    )
                    self.assertIn("/FontFile2", descriptor)
                    self.assertGreater(
                        len(descriptor["/FontFile2"].get_object().get_data()), 0
                    )


if __name__ == "__main__":
    unittest.main()
