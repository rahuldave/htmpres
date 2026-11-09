"""Measure catalog role contrasts; preserve an auditable per-mode evidence table."""

from pathlib import Path
import json

import numpy as np
import pandas as pd
from matplotlib.colors import to_rgb

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CATALOG = ROOT / "_extensions/htmpres/themes/catalog.json"
PRIORITY = ["folio", "atelier", "nocturne", "tufte", "zephyr-reading",
            "simplex-reading", "pulse-reading", "litera-reading", "darkly-reading"]


def luminance(rgb: np.ndarray) -> np.ndarray:
    """Return relative luminance for sRGB values with last dimension three."""
    rgb = np.asarray(rgb, dtype=float)
    linear = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    return linear @ np.array([.2126, .7152, .0722])


def contrast(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Return WCAG luminance ratios for broadcast-compatible sRGB arrays."""
    x, y = luminance(a), luminance(b)
    return (np.maximum(x, y) + .05) / (np.minimum(x, y) + .05)


def measure_catalog() -> pd.DataFrame:
    """Screen solid role tokens; these are not whole-page accessibility scores."""
    catalog = json.loads(CATALOG.read_text())
    rows = []
    for name, entry in catalog["themes"].items():
        for mode in ["light", "dark"]:
            p = entry["palettes"][mode]
            row = {"theme": name, "mode": mode, "family": entry["family"],
                   "native": entry["native"], "complementary": entry["complementary"],
                   "body_font": entry["body"], "heading_font": entry["heading"], **p}
            for foreground in ["ink", "muted", "accent", "secondary"]:
                for background in ["paper", "panel", "code"]:
                    row[f"{foreground}_on_{background}"] = float(contrast(
                        np.array(to_rgb(p[foreground])), np.array(to_rgb(p[background]))))
            row["panel_on_paper"] = float(contrast(np.array(to_rgb(p["panel"])),
                                                   np.array(to_rgb(p["paper"]))))
            row["line_on_paper"] = float(contrast(np.array(to_rgb(p["line"])),
                                                  np.array(to_rgb(p["paper"]))))
            row["accent_equals_secondary"] = p["accent"].lower() == p["secondary"].lower()
            rows.append(row)
    result = pd.DataFrame(rows)
    (HERE / "results").mkdir(exist_ok=True)
    result.to_csv(HERE / "results/theme-roles.csv", index=False, float_format="%.6f")
    return result


if __name__ == "__main__":
    data = measure_catalog()
    cols = ["theme", "mode", "ink_on_paper", "muted_on_panel", "accent_on_paper",
            "accent_on_panel", "secondary_on_panel"]
    print(data[cols].round(2).to_string(index=False))
