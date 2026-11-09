"""Scientific invariants and published-model anchors for the research harness."""

import json
import numpy as np
import pandas as pd
import pytest
import matplotlib.pyplot as plt

from experiments import (profile, minimum_distance, palette_samples, simulate,
                         rendered_contrast, white_veil)
from measure import contrast
from measure import HERE, PRIORITY


def test_ordered_and_rainbow_controls() -> None:
    """Uniform controls must order lightness; rainbow controls must reveal reversals."""
    for name in ["viridis", "cividis", "Blues"]:
        assert profile(palette_samples(name))["reversals"] == 0
    for name in ["jet", "rainbow", "turbo"]:
        assert profile(palette_samples(name))["reversals"] > 50
    assert profile(palette_samples("viridis"))["step_cv"] < .02
    assert profile(palette_samples("Blues"))["step_cv"] > .2


def test_diverging_is_ordered_on_each_arm_not_whole() -> None:
    """A legitimate diverging center must not be diagnosed as a sequential defect."""
    rgb = palette_samples("BrBG")
    assert profile(rgb)["reversals"] > 0
    assert profile(rgb[:128])["reversals"] == 0
    assert profile(rgb[128:])["reversals"] == 0


def test_cvd_direction_against_machado_red_anchor() -> None:
    """Severity-100 deuteranomaly red uses the published linear-RGB matrix column."""
    red = np.array([[1., 0., 0.]])
    shown, clipped = simulate(red, "deuteranomaly")
    # First column of Machado et al.'s severity-1.0 deuteranomaly matrix.
    linear = np.maximum([.367322, .280085, -.011820], 0)
    expected = np.where(linear <= .0031308, 12.92 * linear,
                        1.055 * linear ** (1 / 2.4) - .055)
    assert shown[0] == pytest.approx(expected, abs=1e-6)
    assert clipped == 1
    normal, clip = simulate(red, "normal")
    assert np.array_equal(normal, red)
    assert clip == 0


def test_duplicate_category_colors_are_not_distinct() -> None:
    """The five UI aliases can collapse to one or two colors; preserve that failure."""
    assert minimum_distance(np.array([[.2, .3, .4], [.7, .5, .2], [.2, .3, .4]])) == pytest.approx(0, abs=1e-10)


def test_composite_precedes_clipped_simulation() -> None:
    """CVD clipping and compositing do not commute; test the actual display order."""
    rgb = np.array([[1., 0., 0.]])
    bg = np.ones(3)
    rendered, _ = simulate(.4 * rgb + .6 * bg, "deuteranomaly")
    rendered_bg, _ = simulate(bg[None], "deuteranomaly")
    expected = float(contrast(rendered, rendered_bg[0]).min())
    assert rendered_contrast(rgb, bg, "deuteranomaly", alpha=.4) == pytest.approx(expected)
    wrong, _ = simulate(rgb, "deuteranomaly")
    assert not np.isclose(expected, contrast(.4 * wrong + .6 * rendered_bg, rendered_bg).min())
    assert white_veil(np.zeros(3), .2)[0] == pytest.approx(.4845292)


def test_generated_styles_load_and_have_all_modes() -> None:
    """Exported style files must work in Matplotlib rather than just look plausible."""
    proposals = json.loads((HERE / "results/candidate-styles.json").read_text())
    for theme in PRIORITY:
        for mode in ["light", "dark"]:
            name = f"{theme}-{mode}"
            with plt.style.context(HERE / f"styles/{name}.mplstyle"):
                assert plt.rcParams["axes.facecolor"].lstrip("#") == proposals[name]["rc"]["axes.facecolor"].lstrip("#")
                assert not plt.rcParams["savefig.transparent"]


def test_category_screen_preserves_surface_specific_failure() -> None:
    """A cycle that clears paper can fail panel; don't collapse the two surfaces."""
    results = pd.read_csv(HERE / "results/category-metrics.csv")
    case = results.query("theme == 'atelier' and mode == 'dark' and palette == 'colorblind' and count == 3 and vision == 'normal'").set_index("surface")
    assert set(case.index) == {"paper", "panel"}
    assert case.loc["paper", "min_mark_contrast"] >= 3
    assert case.loc["panel", "min_mark_contrast"] < 3
