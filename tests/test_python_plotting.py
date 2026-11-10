"""Installed Python reference behavior, including scientific rendering contracts."""

import copy
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages/python/src"))


class PythonPlottingTests(unittest.TestCase):
    def test_core_resource_and_placement_api(self):
        import plotfoundry

        data = plotfoundry.load_spec()
        self.assertEqual(len(data["cases"]), 72)
        config = plotfoundry.theme("folio", profile="reading", surface="panel")
        self.assertEqual(config.points(16), 14.4)
        self.assertEqual(config.case["typography"]["body_annotation"], 20)
        data["cases"].clear()
        self.assertEqual(len(plotfoundry.load_spec()["cases"]), 72)

    def test_optional_import_has_no_plotting_side_effects(self):
        code = "import sys; import plotfoundry; plotfoundry.load_spec(); assert 'matplotlib' not in sys.modules; assert 'numpy' not in sys.modules"
        env = dict(os.environ, PYTHONPATH=str(ROOT / "packages/python/src"))
        subprocess.run([sys.executable, "-B", "-c", code], env=env, check=True)

    def test_scoped_context_restores_nested_exception_and_overrides(self):
        import matplotlib as mpl
        from plotfoundry import theme
        from plotfoundry.matplotlib import context

        before = mpl.rcParams.copy()
        with context(theme("folio"), overrides={"axes.grid": True}):
            self.assertTrue(mpl.rcParams["axes.grid"])
            outer = mpl.rcParams.copy()
            with self.assertRaises(RuntimeError):
                with context(theme("tufte", mode="dark")):
                    raise RuntimeError("expected")
            self.assertEqual(mpl.rcParams, outer)
        self.assertEqual(mpl.rcParams, before)

    def test_native_maps_and_asymmetric_norm(self):
        from plotfoundry import theme, load_spec
        from plotfoundry.matplotlib import colorscale

        config = theme("folio")
        cmap, norm = colorscale(config, kind="diverging", vmin=-2, vmax=1, center=0)
        self.assertEqual(norm(0), 0.5)
        self.assertEqual(
            cmap(norm(0))[:3], tuple(load_spec()["maps"]["BrBG"]["samples"][128])
        )
        self.assertTrue(__import__("numpy").ma.is_masked(norm(float("nan"))))
        self.assertEqual(norm(-1), 0.25)
        self.assertEqual(norm(-5), 0)
        self.assertEqual(norm(5), 1)

    def test_line_treatment_domain_missing_and_failure_atomicity(self):
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import context, line

        config = theme("folio")
        with context(config):
            fig, ax = plt.subplots()
            artist, label = line(
                ax, [0, 1, 2], [1, None, 3], config, domain=["a", "b"], category="b"
            )
            self.assertEqual(artist.get_label(), "b")
            self.assertEqual(label.get_text(), "b")
            self.assertTrue(math.isnan(artist.get_ydata()[1]))
            self.assertEqual(artist.get_linewidth(), config.points(2.5))
            self.assertEqual(
                artist.get_path_effects()[0]._gc["linewidth"], config.points(5.5)
            )
            count = (len(ax.lines), len(ax.texts))
            for domain, category in [
                (["a", "a"], "a"),
                (["a"], "b"),
                (["a", "b", "c", "d"], "a"),
            ]:
                with self.assertRaises(ValueError):
                    line(ax, [0], [1], config, domain=domain, category=category)
                self.assertEqual((len(ax.lines), len(ax.texts)), count)
            plt.close(fig)

    def test_exact_fonts_and_explicit_canvas_exports(self):
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import context, line, style_axes, export

        config = theme("tufte", mode="dark")
        with context(config):
            fig, ax = plt.subplots(figsize=(8, 4))
            line(ax, [0, 1], [0, 1], config, domain=["a"], category="a")
            ax.set(title="Exact heading", xlabel="Value", ylabel="Reading")
            ax.legend()
            style_axes(ax, config)
            self.assertEqual(
                Path(ax.title.get_fontproperties().get_file()).name,
                "et-book-bold-line-figures.ttf",
            )
            with tempfile.TemporaryDirectory() as temp:
                report = export(
                    fig,
                    config,
                    Path(temp) / "figure",
                    formats=["png", "svg", "pdf"],
                    dpi=100,
                )
                self.assertEqual(set(report["files"]), {"png", "svg", "pdf"})
                self.assertEqual(report["canvasPixels"], [800, 400])
                self.assertTrue(
                    all(Path(p["path"]).is_file() for p in report["files"].values())
                )
                svg = (Path(temp) / "figure.svg").read_text()
                self.assertNotIn("<text", svg)
                self.assertIn("ETBembo", svg)
            plt.close(fig)

    def test_masked_missing_and_bool_rejection_before_artist_mutation(self):
        import numpy as np
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import (
            ExplicitNorm,
            heatmap,
            scatter,
            scatter_values,
        )

        config = theme("folio", mode="dark", surface="panel")
        fig, ax = plt.subplots()
        norm = ExplicitNorm(-2, 1, 0)
        for value in [True, "1", [True, 1.0], ["1", 2.0]]:
            with self.assertRaises(ValueError):
                norm(value)
        masked = np.ma.array([[0, 1]], mask=[[False, True]])
        image = heatmap(ax, masked, config, vmin=0, vmax=1)
        self.assertEqual(image.get_array().mask.tolist(), [[False, True]])
        self.assertEqual(len(ax.patches), 1)
        from matplotlib.colors import to_rgba

        self.assertEqual(
            ax.patches[0].get_edgecolor(), to_rgba(config.case["roles"]["background"])
        )
        before = (len(ax.images), len(ax.patches), len(ax.collections))
        for bad in [[[True, 1.0]], [[float("inf")]], [["1"]]]:
            with self.assertRaises(ValueError):
                heatmap(ax, bad, config, vmin=0, vmax=1)
            self.assertEqual(
                (len(ax.images), len(ax.patches), len(ax.collections)), before
            )
        for bad in [[True, 2], ["1", 2]]:
            with self.assertRaises(ValueError):
                scatter_values(ax, [0, 1], [0, 1], bad, config, vmin=0, vmax=2)
        plt.close(fig)

    def test_dark_caller_owned_axes_and_late_fonts(self):
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import style_axes, export, context

        config = theme("folio", mode="dark")
        with context(config):
            fig, ax = plt.subplots(figsize=(8, 4))
        ax.set_title("Dark heading")
        text = ax.text(0.5, 0.5, "Native text")
        style_axes(ax, config)
        self.assertEqual(ax.title.get_color(), config.case["roles"]["ink"])
        self.assertEqual(text.get_color(), config.case["roles"]["ink"])
        ax.title.set_fontsize(17)
        ax.title.set_color("red")
        with tempfile.TemporaryDirectory() as temp:
            export(fig, config, Path(temp) / "override", formats=["svg"])
        self.assertEqual(ax.title.get_fontsize(), 17)
        self.assertEqual(ax.title.get_color(), "red")
        plt.close(fig)

    def test_strict_plain_text_scope_rejects_log_math_and_missing_glyph(self):
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import context, export

        config = theme("tufte")
        with context(config), tempfile.TemporaryDirectory() as temp:
            for kind in ["log", "glyph"]:
                fig, ax = plt.subplots(figsize=(8, 4))
                if kind == "log":
                    ax.set_xscale("log")
                    ax.set_xlim(0.01, 100)
                else:
                    ax.set_title("Missing " + chr(0x4E00))
                target = Path(temp) / kind
                with self.assertRaises(ValueError):
                    export(fig, config, target, formats=["svg"])
                self.assertFalse(target.with_suffix(".report.json").exists())
                plt.close(fig)

    def test_shared_dash_geometry_and_explicit_variant_capacity(self):
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import line, context

        config = theme("folio", profile="presentation")
        with context(config):
            fig, ax = plt.subplots()
            artist, _ = line(
                ax, [0, 1], [1, 2], config, domain=["a", "b"], category="b"
            )
            self.assertEqual(
                artist._dash_pattern[1],
                [3.7 * config.points(2.5), 1.6 * config.points(2.5)],
            )
            for index, key in enumerate("abcde"):
                line(
                    ax,
                    [0, 1],
                    [index, index + 1],
                    config,
                    domain=list("abcde"),
                    category=key,
                    variant="colorblind-subset-5",
                )
            self.assertEqual(len(ax.lines), 6)
            plt.close(fig)

    def test_rehashed_resource_mutation_cannot_redefine_approved_values(self):
        from unittest.mock import patch
        import shutil
        import hashlib
        import plotfoundry.core as core

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "resources"
            shutil.copytree(core._root(), root)
            data = json.loads((root / "data/spec.json").read_text())
            data["maps"]["cividis"]["samples"][0][0] = 0.5
            payload = json.dumps(data).encode()
            (root / "data/spec.json").write_bytes(payload)
            manifest = json.loads((root / "data/manifest.json").read_text())
            manifest["files"]["spec.json"]["sha256"] = hashlib.sha256(
                payload
            ).hexdigest()
            (root / "data/manifest.json").write_text(json.dumps(manifest))
            with patch.object(core, "_root", return_value=root), self.assertRaises(
                ValueError
            ):
                core.load_spec()

    def test_numpy_limits_and_figure_heading(self) -> None:
        import numpy as np
        import matplotlib.pyplot as plt
        from plotfoundry import theme
        from plotfoundry.matplotlib import ExplicitNorm, export, context

        self.assertEqual(
            ExplicitNorm(np.int64(-2), np.float32(1), np.float64(0))(0), 0.5
        )
        config = theme("tufte")
        with context(config), tempfile.TemporaryDirectory() as temp:
            fig, ax = plt.subplots(figsize=(8, 4))
            title = fig.suptitle("Figure heading", fontsize=19, color="red")
            export(fig, config, Path(temp) / "heading", formats=["svg"])
            self.assertEqual(
                Path(title.get_fontproperties().get_file()), config.font_path("heading")
            )
            self.assertEqual(title.get_fontsize(), 19)
            self.assertEqual(title.get_color(), "red")
            plt.close(fig)

    def test_snapshot_failure_preserves_previous_destination(self) -> None:
        import importlib.util
        import shutil
        from unittest.mock import patch

        path = ROOT / "scripts/promote-python-spec.py"
        module_spec = importlib.util.spec_from_file_location("snapshot_test", path)
        module = importlib.util.module_from_spec(module_spec)
        module_spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "spec"
            shutil.copytree(ROOT / "packages/spec/data", source / "data")
            shutil.copytree(
                ROOT / "packages/spec/tools",
                source / "tools",
                ignore=shutil.ignore_patterns("__pycache__"),
            )
            for name in [
                "schema.json",
                "source-lock.json",
                "foundations.schema.json",
                "conformance.json",
            ]:
                shutil.copyfile(ROOT / "packages/spec" / name, source / name)
            target = root / "previous"
            target.mkdir()
            (target / "sentinel").write_text("unchanged")
            for kind in ["extra", "symlink"]:
                bad = source / "data/unknown"
                if kind == "extra":
                    bad.write_text("must not ship")
                else:
                    bad.symlink_to(source / "data/spec.json")
                with patch.object(module, "SPEC", source), patch.object(
                    module, "TARGET", target
                ), patch.object(sys, "argv", ["promote", "--write"]), self.assertRaises(
                    ValueError
                ):
                    module.main()
                self.assertEqual((target / "sentinel").read_text(), "unchanged")
                bad.unlink()

    def test_exact_font_survives_conflicting_registered_family(self) -> None:
        code = """from pathlib import Path
import tempfile
from fontTools.ttLib import TTFont
from matplotlib import font_manager
import matplotlib.pyplot as plt
from plotfoundry import theme
from plotfoundry.matplotlib import style_axes
config=theme('folio')
with tempfile.TemporaryDirectory() as temp:
 source=next(config.font_path().parent.glob('dejavu-sans-400.ttf'))
 with TTFont(source) as font:
  for record in font['name'].names:
   if record.nameID in (1,4,6,16):record.string='DM Sans'.encode(record.getEncoding())
  path=Path(temp)/'conflict.ttf'; font.save(path)
 font_manager.fontManager.addfont(path)
 assert Path(font_manager.findfont('DM Sans'))!=config.font_path()
 fig,ax=plt.subplots();ax.set(title='Heading',xlabel='Value');style_axes(ax,config)
 for text in fig.findobj(__import__('matplotlib').text.Text):
  if text.get_visible() and text.get_text():assert Path(text.get_fontproperties().get_file()) in (config.font_path(),config.font_path('heading'))
 plt.close(fig)
"""
        env = {
            **os.environ,
            "PYTHONPATH": str(ROOT / "packages/python/src"),
            "MPLBACKEND": "Agg",
        }
        subprocess.run([sys.executable, "-B", "-c", code], env=env, check=True)

    def test_rehashed_case_and_notice_binding_mutations_fail(self) -> None:
        import shutil
        import hashlib
        from unittest.mock import patch
        import plotfoundry.core as core

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "resources"
            shutil.copytree(core._root(), root)
            original = json.loads((root / "data/spec.json").read_text())
            changes = [
                lambda d: d["cases"][0].__setitem__("id", "bad/id"),
                lambda d: d["categories"]["treatment"].__setitem__(
                    "foreground_css_px", 0.01
                ),
                lambda d: d["normalization"]["diverging"].__setitem__(
                    "centerOutput", 0.1
                ),
                lambda d: d["cases"][0]["placement"].__setitem__(
                    "placedWidthCssPx", 64
                ),
                lambda d: next(iter(d["fonts"].values())).__setitem__(
                    "noticePaths", ["notices/DejaVu-LICENSE"]
                ),
            ]
            for change in changes:
                data = copy.deepcopy(original)
                change(data)
                payload = json.dumps(data).encode()
                (root / "data/spec.json").write_bytes(payload)
                manifest = json.loads((root / "data/manifest.json").read_text())
                manifest["files"]["spec.json"]["sha256"] = hashlib.sha256(
                    payload
                ).hexdigest()
                (root / "data/manifest.json").write_text(json.dumps(manifest))
                with patch.object(core, "_root", return_value=root), self.assertRaises(
                    ValueError
                ):
                    core.load_spec()

    def test_unreferenced_resource_rehashed_inventory_is_rejected(self) -> None:
        import shutil
        from unittest.mock import patch
        import plotfoundry.core as core

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "resources"
            shutil.copytree(core._root(), root)
            manifest = json.loads((root / "data/manifest.json").read_text())
            original = "notices/DejaVu-LICENSE"
            shutil.copyfile(root / "data" / original, root / "data/extra-notice")
            manifest["files"]["extra-notice"] = manifest["files"][original]
            (root / "data/manifest.json").write_text(json.dumps(manifest))
            with patch.object(core, "_root", return_value=root), self.assertRaises(
                ValueError
            ):
                core.load_spec()

    def test_fractional_dpi_report_uses_actual_raster_dimensions(self) -> None:
        import matplotlib.pyplot as plt
        from PIL import Image
        from plotfoundry import theme
        from plotfoundry.matplotlib import context, export

        config = theme("folio")
        with context(config), tempfile.TemporaryDirectory() as temp:
            fig, ax = plt.subplots(figsize=(8, 4))
            report = export(
                fig, config, Path(temp) / "fractional", formats=["png"], dpi=100.1
            )
            with Image.open(Path(temp) / "fractional.png") as image:
                self.assertEqual(report["canvasPixels"], list(image.size))
            self.assertEqual(report["canvasPixels"], [800, 400])
            self.assertEqual(report["requestedRasterPixels"], [800.8, 400.4])
            vector = export(
                fig, config, Path(temp) / "vector", formats=["svg"], dpi=100.1
            )
            self.assertIsNone(vector["canvasPixels"])
            plt.close(fig)


if __name__ == "__main__":
    unittest.main()
