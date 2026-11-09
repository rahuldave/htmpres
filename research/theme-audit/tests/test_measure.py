"""Check measurement math and known catalog failure cases independently."""

import numpy as np
import pytest

from measure import contrast, luminance, HERE
import pandas as pd


def test_reference_luminance_and_contrast() -> None:
    """Black/white anchors and symmetry catch common gamma/ratio mistakes."""
    black, white = np.zeros(3), np.ones(3)
    assert luminance(white) == pytest.approx(1)
    assert luminance(black) == 0
    assert contrast(black, white) == pytest.approx(21)
    assert contrast(white, black) == pytest.approx(21)
    assert contrast(white, white) == pytest.approx(1)
    assert luminance(np.array([1, 0, 0])) == pytest.approx(.2126)


def test_all_modes_and_surface_specific_failure() -> None:
    """An accent passing on paper can fail on its panel; do not collapse roles."""
    rows = pd.read_csv(HERE / "results/theme-roles.csv").set_index(["theme", "mode"])
    assert len(rows) == 70
    assert not rows.index.has_duplicates
    pulse = rows.loc[("pulse-reading", "dark")]
    assert pulse.accent_on_paper >= 4.5
    assert pulse.accent_on_panel < 4.5
    assert rows.loc[("morph", "light")].ink_on_paper < 3
    assert rows.loc[("atelier", "dark")].accent_on_panel > 7
