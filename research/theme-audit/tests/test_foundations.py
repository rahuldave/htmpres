import json
import numpy as np
from colorspacious import cspace_convert
from matplotlib.colors import to_rgb
from foundations import generate, ratio, SIZES, SPACING
from measure import PRIORITY


def test_coverage_anchors_and_references():
    d, checks, cat = generate()
    assert {(m["theme"], m["mode"]) for m in d["modes"]} == {
        (n, x) for n in PRIORITY for x in ["light", "dark"]
    }
    for m in d["modes"]:
        assert all(v in m["swatches"] for v in m["roles"].values())
        for k, v in cat[m["theme"]]["palettes"][m["mode"]].items():
            assert m["swatches"]["anchor-" + k] == v
        assert (
            m["swatches"][m["roles"]["paper"]]
            == cat[m["theme"]]["palettes"][m["mode"]]["paper"]
        )
    assert len(checks) == 18 * 19


def test_rounded_role_reserves_and_state_pairs():
    d, checks, _ = generate()
    assert all(r["after"] >= r["minimum"] for r in checks)
    for m in d["modes"]:
        s = m["swatches"]
        r = m["roles"]
        assert ratio(s[r["button-ink"]], s[r["primary-fill"]]) >= 4.5
    for mode in d["states"].values():
        for state in mode.values():
            assert ratio(state["ink"], state["bg"]) >= 5
            assert ratio(state["border"], state["bg"]) >= 3


def test_ramp_lightness_order_and_anchor():
    d, _, cat = generate()
    for m in d["modes"]:
        for name, ramp in m["families"].items():
            levels = [
                float(cspace_convert(to_rgb(v), "sRGB1", "CIELab")[0])
                for v in ramp.values()
            ]
            assert all(a >= b for a, b in zip(levels, levels[1:]))
            source = (
                "ink"
                if name == "neutral"
                else "accent" if name == "primary" else "secondary"
            )
            assert (
                ramp["500"].lower()
                == cat[m["theme"]]["palettes"]["light"][source].lower()
            )
    darkly = next(
        m for m in d["modes"] if m["theme"] == "darkly-reading" and m["mode"] == "dark"
    )
    assert darkly["swatches"][darkly["roles"]["primary-fill"]] == "#375a7f"
    assert SIZES == [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]
    assert SPACING == [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]


def test_foundation_role_policy_and_visual_examples():
    from foundations import fragment

    d, _, cat = generate()
    for m in d["modes"]:
        sw, roles = m["swatches"], m["roles"]
        if m["theme"] in [
            "zephyr-reading",
            "simplex-reading",
            "pulse-reading",
            "litera-reading",
            "tufte",
        ]:
            assert sw[roles["secondary-text"]] == sw[roles["muted"]]
        if m["theme"] == "tufte":
            assert (
                ratio(
                    sw[roles["optional-highlight-ink"]],
                    sw[roles["optional-highlight-fill"]],
                )
                >= 5
            )
            assert "optional-blue-highlight" not in sw
        if m["theme"] == "folio":
            assert "Source Serif 4" in m["fonts"]["heading"]
            assert "Libre Caslon" in m["fonts"]["display"]
        if m["theme"].endswith("-reading") and m["mode"] == cat[m["theme"]]["native"]:
            assert sw[roles["button-ink"]] == "#ffffff"
    html = fragment(d, cat)
    assert html.count("Static visual examples") == 18
    assert html.count("Control boundary + focus") == 18
    assert all(f'id="foundation-{n}"' in html for n in PRIORITY)
    assert "metadata 14" in html


def test_static_samples_show_fonts_unboxed_tufte_and_state_words():
    from foundations import render_role_sample, fragment

    data, _, catalog = generate()
    for mode in data["modes"]:
        sample = render_role_sample(mode)
        assert "text-decoration:underline" in sample
        assert "font-family:" in sample
        if mode["theme"] == "tufte":
            assert "background:transparent;padding:0px" in sample
        if mode["theme"] == "folio":
            assert "Source Serif 4" in sample and "DM Sans" in sample
    html = fragment(data, catalog)
    for label in ["✓ Success", "! Warning", "× Error", "i Information"]:
        assert html.count(label) >= 2
    assert "information is a new candidate" in html
    assert "<br>bg #" in html and "<br>border #" in html
