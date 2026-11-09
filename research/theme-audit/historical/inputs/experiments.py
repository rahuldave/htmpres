"""Reproduce perceptual-color experiments and candidate figure treatments.

These are research outputs, not registered production palettes. All experiments
use synthetic data and the checked-in theme catalog; no private books or decks
are copied into outputs.
"""

from importlib.metadata import version
import hashlib
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import colormaps, font_manager
from matplotlib.colors import ListedColormap, TwoSlopeNorm, to_rgb
import numpy as np
import pandas as pd
import seaborn as sns
from colorspacious import cspace_convert

from measure import CATALOG, HERE, ROOT, PRIORITY, contrast, luminance

SEQUENTIAL = ["viridis", "cividis", "plasma", "inferno", "magma", "Blues",
              "Greens", "Purples", "YlOrBr", "YlGnBu", "Greys", "cubehelix",
              "mako", "rocket", "crest", "flare"]
CONTROLS = ["jet", "rainbow", "turbo"]
DIVERGING = ["BrBG", "PuOr", "RdBu", "coolwarm", "RdYlGn", "seismic"]
VISIONS = ["normal", "deuteranomaly", "protanomaly", "tritanomaly"]
OKABE_ITO = ["#E69F00", "#56B4E9", "#009E73", "#F0E442",
            "#0072B2", "#D55E00", "#CC79A7", "#000000"]
SEED = 20261109


def simulate(rgb: np.ndarray, vision: str) -> tuple[np.ndarray, float]:
    """Simulate Machado severity 100 and report the fraction of clipped colors."""
    if vision == "normal":
        return rgb.copy(), 0.0
    raw = cspace_convert(rgb, {"name": "sRGB1+CVD", "cvd_type": vision,
                              "severity": 100}, "sRGB1")
    outside = float(np.any((raw < 0) | (raw > 1), axis=-1).mean())
    return np.clip(raw, 0, 1), outside


def profile(rgb: np.ndarray) -> dict[str, float | int]:
    """Separate lightness ordering, linearity and CAM02-UCS step uniformity."""
    lightness = cspace_convert(rgb, "sRGB1", "CIELab")[:, 0]
    delta = np.diff(lightness)
    direction = 1 if lightness[-1] >= lightness[0] else -1
    signed = delta * direction
    ucs = cspace_convert(rgb, "sRGB1", "CAM02-UCS")
    steps = np.linalg.norm(np.diff(ucs, axis=0), axis=1)
    x = np.linspace(0, 1, len(rgb))
    fit = np.polyval(np.polyfit(x, lightness, 1), x)
    return {
        "L_start": float(lightness[0]), "L_end": float(lightness[-1]),
        "L_span": float(np.ptp(lightness)),
        "reversals": int((signed < -1e-6).sum()),
        "reversal_magnitude": float(-signed[signed < -1e-6].sum()),
        "L_linear_rmse": float(np.sqrt(np.mean((lightness - fit) ** 2))),
        "step_mean": float(steps.mean()), "step_min": float(steps.min()),
        "step_max": float(steps.max()),
        "step_cv": float(steps.std() / steps.mean()) if steps.mean() else 0.0,
        "flat_steps": int((steps < 1e-6).sum()),
    }


def minimum_distance(rgb: np.ndarray) -> float:
    """Return the smallest pairwise CAM02-UCS distance, including duplicates."""
    colors = cspace_convert(rgb, "sRGB1", "CAM02-UCS")
    distances = np.linalg.norm(colors[:, None] - colors[None, :], axis=2)
    return float(distances[np.triu_indices(len(colors), 1)].min())


def palette_samples(name: str, count: int = 256) -> np.ndarray:
    """Sample a Matplotlib or Seaborn map with an equal scalar grid."""
    cmap = (sns.color_palette(name, as_cmap=True)
            if name in ["mako", "rocket", "crest", "flare"] else colormaps[name])
    return np.asarray(cmap(np.linspace(0, 1, count)))[:, :3]


def category_palettes(count: int) -> dict[str, np.ndarray]:
    """Keep fixed identity order for common categorical cycles."""
    choices = {name: np.array(sns.color_palette(name, count))
               for name in ["colorblind", "tab10", "Set2", "Dark2"]}
    choices["Okabe-Ito"] = np.array([to_rgb(c) for c in OKABE_ITO[:count]])
    return choices


def map_experiments(themes: dict) -> tuple[dict[str, np.ndarray], pd.DataFrame]:
    """Measure common maps and theme-seeded ramps under four viewing models."""
    maps = {name: palette_samples(name) for name in SEQUENTIAL + CONTROLS + DIVERGING}
    for theme in PRIORITY:
        for mode in ["light", "dark"]:
            accent = themes[theme]["palettes"][mode]["accent"]
            maker = sns.light_palette if mode == "light" else sns.dark_palette
            maps[f"{theme}-{mode}-brand"] = np.array(maker(accent, n_colors=256))
    rows = []
    for name, rgb in maps.items():
        for vision in VISIONS:
            simulated, clipped = simulate(rgb, vision)
            parts = {"whole": simulated} if name not in DIVERGING else {
                "left": simulated[:128], "right": simulated[128:]}
            for arm, values in parts.items():
                rows.append({"map": name, "vision": vision, "arm": arm,
                             "clipped_fraction": clipped, **profile(values)})
    frame = pd.DataFrame(rows)
    frame.to_csv(HERE / "results/map-metrics.csv", index=False, float_format="%.8f")
    return maps, frame


def background_experiments(themes: dict, maps: dict[str, np.ndarray]) -> pd.DataFrame:
    """Screen map/background proximity; do not treat heatmap pixels as text."""
    rows = []
    common = SEQUENTIAL + CONTROLS + DIVERGING
    for theme in PRIORITY:
        for mode in ["light", "dark"]:
            p = themes[theme]["palettes"][mode]
            for name in common + [f"{theme}-{mode}-brand"]:
                rgb = maps[name]
                for surface in ["paper", "panel"]:
                    bg = np.array(to_rgb(p[surface]))
                    ratios = contrast(rgb, bg)
                    rows.append({"theme": theme, "mode": mode, "map": name,
                                 "surface": surface, "min_contrast": ratios.min(),
                                 "start_contrast": ratios[0], "end_contrast": ratios[-1],
                                 "fraction_below_3": (ratios < 3).mean()})
    frame = pd.DataFrame(rows)
    frame.to_csv(HERE / "results/map-backgrounds.csv", index=False, float_format="%.8f")
    return frame


def white_veil(values: np.ndarray, amount: float) -> np.ndarray:
    """Apply a simple additive white veil in linear light before CVD simulation."""
    linear = np.where(values <= .04045, values / 12.92,
                      ((values + .055) / 1.055) ** 2.4)
    linear = linear * (1 - amount) + amount
    return np.where(linear <= .0031308, 12.92 * linear,
                    1.055 * linear ** (1 / 2.4) - .055)


def rendered_contrast(rgb: np.ndarray, bg: np.ndarray, vision: str,
                      alpha: float = 1., veil: float = 0.) -> float:
    """Composite display colors, apply veiling, then simulate the viewing model."""
    blend = rgb * alpha + bg * (1 - alpha)
    shown, _ = simulate(white_veil(blend, veil), vision)
    shown_bg, _ = simulate(white_veil(bg[None, :], veil), vision)
    return float(contrast(shown, shown_bg[0]).min())


def categorical_experiments(themes: dict) -> pd.DataFrame:
    """Measure category discrimination, mark contrast, opacity and white veiling."""
    rows = []
    for theme in PRIORITY:
        for mode in ["light", "dark"]:
            p = themes[theme]["palettes"][mode]
            for surface in ["paper", "panel"]:
                bg = np.array(to_rgb(p[surface]))
                for count in [3, 5, 8]:
                    palettes = category_palettes(count)
                    if count == 5:
                        palettes["UI-aliases"] = np.array([to_rgb(p[k]) for k in
                            ["accent", "secondary", "secondary", "accent", "secondary"]])
                    for name, rgb in palettes.items():
                        for vision in VISIONS:
                            shown, clipped = simulate(rgb, vision)
                            shown_bg, _ = simulate(bg[None, :], vision)
                            ratios = contrast(shown, shown_bg[0])
                            row = {"theme": theme, "mode": mode, "surface": surface,
                                   "palette": name, "count": count, "vision": vision,
                                   "min_distance": minimum_distance(shown),
                                   "clipped_fraction": clipped,
                                   "min_mark_contrast": float(ratios.min()),
                                   "marks_below_3": int((ratios < 3).sum())}
                            for alpha in [1.0, .7, .4]:
                                row[f"contrast_alpha_{alpha}"] = rendered_contrast(
                                    rgb, bg, vision, alpha=alpha)
                            for veil in [.1, .2]:
                                row[f"contrast_veil_{veil}"] = rendered_contrast(
                                    rgb, bg, vision, veil=veil)
                            rows.append(row)
    frame = pd.DataFrame(rows)
    frame.to_csv(HERE / "results/category-metrics.csv", index=False, float_format="%.8f")
    return frame


def diagnostic_figures(maps: dict[str, np.ndarray]) -> None:
    """Plot visual ramps beside their measured lightness and perceptual steps."""
    chosen = ["viridis", "cividis", "jet", "rainbow", "turbo", "Blues", "YlOrBr", "mako"]
    fig, axes = plt.subplots(len(chosen), 3, figsize=(13, 13), layout="constrained",
                             gridspec_kw={"width_ratios": [1.8, 1, 1]})
    for i, name in enumerate(chosen):
        rgb = maps[name]
        lab = cspace_convert(rgb, "sRGB1", "CIELab")[:, 0]
        ucs = cspace_convert(rgb, "sRGB1", "CAM02-UCS")
        axes[i, 0].imshow(np.tile(rgb[None], (24, 1, 1)), aspect="auto")
        axes[i, 0].set_title(name, loc="left", fontsize=12)
        axes[i, 0].set_axis_off()
        axes[i, 1].plot(np.linspace(0, 1, 256), lab, color="#334155")
        axes[i, 1].set_ylim(0, 100)
        axes[i, 2].plot(np.linspace(0, 1, 255), np.linalg.norm(np.diff(ucs, axis=0), axis=1), color="#176a70")
        axes[i, 2].set_ylim(0, 2.5)
        for ax in axes[i, 1:]:
            ax.spines[["top", "right"]].set_visible(False)
            ax.grid(alpha=.2)
    axes[0, 1].set_title("CIELAB L* (ordering)")
    axes[0, 2].set_title("CAM02-UCS adjacent distance")
    fig.suptitle("Equal data increments do not always look equal", fontsize=19)
    fig.savefig(HERE / "figures/map-diagnostics.png", dpi=140)
    plt.close(fig)

    x = np.linspace(-3, 3, 180)
    xx, yy = np.meshgrid(x, x)
    z = xx + .18 * np.sin(12 * yy) * np.exp(-xx ** 2)
    fig, axes = plt.subplots(2, 3, figsize=(12, 6), layout="constrained")
    for ax, name in zip(axes.flat, ["jet", "rainbow", "viridis", "cividis", "Blues", "mako"]):
        im = ax.imshow(z, cmap=ListedColormap(maps[name]), vmin=-3.2, vmax=3.2,
                       extent=(-3, 3, -3, 3), origin="lower", aspect="auto")
        ax.set_title(name)
        ax.set_xlabel("Same continuous field")
        fig.colorbar(im, ax=ax, shrink=.8)
    fig.suptitle("Identical ramp plus faint structure; identical normalization", fontsize=17)
    fig.savefig(HERE / "figures/false-boundaries.png", dpi=140)
    plt.close(fig)

    palette = category_palettes(8)
    fig, axes = plt.subplots(5, 4, figsize=(13, 7), layout="constrained")
    for i, (name, rgb) in enumerate(palette.items()):
        for j, vision in enumerate(VISIONS):
            shown, _ = simulate(rgb, vision)
            axes[i, j].imshow(shown[None], aspect="auto")
            axes[i, j].set_yticks([])
            axes[i, j].set_xticks(range(8), list("ABCDEFGH"))
            if i == 0:
                axes[i, j].set_title(vision)
            if j == 0:
                axes[i, j].set_ylabel(name)
    fig.suptitle("Eight fixed category identities: normal and severity-100 simulations", fontsize=16)
    fig.savefig(HERE / "figures/category-cvd.png", dpi=140)
    plt.close(fig)


def candidate_rc(p: dict, theme: str) -> dict:
    """Propose plot chrome/font settings; keep data color decisions independent."""
    family = {"atelier": "DM Sans", "folio": "DM Sans", "nocturne": "DM Sans",
              "tufte": "DejaVu Serif", "zephyr-reading": "Inter",
              "simplex-reading": "Open Sans", "darkly-reading": "Lato"}.get(theme, "DejaVu Sans")
    return {"figure.facecolor": p["paper"], "axes.facecolor": p["paper"],
            "text.color": p["ink"], "axes.labelcolor": p["ink"],
            "xtick.color": p["ink"], "ytick.color": p["ink"],
            "axes.edgecolor": p["muted"], "grid.color": p["line"],
            "font.family": family, "font.size": 12, "axes.titlesize": 14,
            "axes.spines.top": False, "axes.spines.right": False,
            "axes.grid": False, "savefig.facecolor": p["paper"],
            "savefig.transparent": False, "lines.linewidth": 2.2}


def theme_figures(themes: dict, maps: dict[str, np.ndarray]) -> None:
    """Render identical Seaborn/Matplotlib examples for all eighteen modes."""
    # Exclude machine-installed copies of our four plot families before registering
    # the repository fonts. Otherwise an installed variable Inter can win lookup.
    families = {"DM Sans", "Inter", "Open Sans", "Lato"}
    font_manager.fontManager.ttflist = [
        entry for entry in font_manager.fontManager.ttflist if entry.name not in families]
    for font in (ROOT / "_extensions/htmpres/themes/fonts").glob("*.ttf"):
        font_manager.fontManager.addfont(font)
    resolved_fonts = {}
    for family in sorted(families | {"DejaVu Sans", "DejaVu Serif"}):
        path = font_manager.findfont(font_manager.FontProperties(family=family))
        from pathlib import Path
        file = Path(path)
        if family in families and not file.is_relative_to(ROOT):
            raise RuntimeError(f"Plot font did not resolve to the repository: {family}")
        resolved_fonts[family] = {"file": str(file.relative_to(ROOT)) if file.is_relative_to(ROOT)
                                 else "matplotlib/mpl-data/fonts/ttf/" + file.name,
                                 "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}
    (HERE / "results/plot-fonts.json").write_text(json.dumps(resolved_fonts, indent=2) + "\n")
    proposals = {}
    rng = np.random.default_rng(SEED)
    x = np.linspace(0, 10, 60)
    traces = np.array([np.sin(x / 2 + phase) * .15 + x * slope
                       for phase, slope in [(0, .1), (.5, .07), (1, .12)]])
    traces += rng.normal(0, .02, traces.shape)
    frame = pd.DataFrame({"time": np.tile(x, 3), "value": traces.ravel(),
                          "series": np.repeat(["Context A", "Focus", "Context B"], len(x))})
    field = np.outer(np.linspace(0, 1, 24), np.linspace(.2, 1, 32))
    residual = np.outer(np.sin(np.linspace(-np.pi, np.pi, 24)), np.linspace(.2, 1, 32))
    for theme in PRIORITY:
        for mode in ["light", "dark"]:
            p = themes[theme]["palettes"][mode]
            rc = candidate_rc(p, theme)
            style_dir = HERE / "styles"
            style_dir.mkdir(exist_ok=True)
            # mplstyle treats # as a comment; bare six-digit hex is accepted.
            style_text = "\n".join(f"{key}: {str(value).lstrip('#')}" for key, value in rc.items())
            (style_dir / f"{theme}-{mode}.mplstyle").write_text(
                "# Experimental plot chrome; choose data palette explicitly.\n" + style_text + "\n")
            proposals[f"{theme}-{mode}"] = {"rc": rc, "highlight": p["accent"],
                "context": p["muted"], "sequential": "cividis", "diverging": "BrBG",
                "status": "experimental; category cycle requires task-specific selection"}
            with plt.rc_context(rc):
                fig, axes = plt.subplots(1, 3, figsize=(13, 3.8), layout="constrained")
                sns.lineplot(frame, x="time", y="value", hue="series", style="series",
                             hue_order=["Context A", "Focus", "Context B"],
                             palette={"Context A": p["muted"], "Focus": p["accent"],
                                      "Context B": p["muted"]},
                             dashes={"Context A": (3, 2), "Focus": "", "Context B": (1, 2)},
                             ax=axes[0], legend=False)
                axes[0].set_title("Selective emphasis + line styles", loc="left")
                for i, label in enumerate(["A", "Focus", "B"]):
                    axes[0].annotate(label, (x[-1], traces[i, -1]), xytext=(4, 0),
                                     textcoords="offset points", fontsize=10)
                axes[0].set_xlim(0, 11.5)
                im = axes[1].imshow(field, cmap=ListedColormap(maps["cividis"]),
                                    vmin=0, vmax=1, aspect="auto")
                axes[1].set_title("Ordered quantity · cividis", loc="left")
                fig.colorbar(im, ax=axes[1], shrink=.7, label="Magnitude")
                im = axes[2].imshow(residual, cmap=ListedColormap(maps["BrBG"]),
                                    norm=TwoSlopeNorm(vmin=-1, vcenter=0, vmax=1), aspect="auto")
                axes[2].set_title("Signed residual · BrBG", loc="left")
                fig.colorbar(im, ax=axes[2], shrink=.7, label="Residual")
                fig.suptitle(f"{theme} / {mode} — experimental figure treatment", fontsize=16)
                fig.savefig(HERE / f"figures/{theme}-{mode}.png", dpi=135)
                plt.close(fig)
    (HERE / "results/candidate-styles.json").write_text(json.dumps(proposals, indent=2) + "\n")


def main() -> None:
    """Run the reproducible matrix and record package versions and row counts."""
    (HERE / "results").mkdir(exist_ok=True)
    (HERE / "figures").mkdir(exist_ok=True)
    themes = json.loads(CATALOG.read_text())["themes"]
    maps, metrics = map_experiments(themes)
    backgrounds = background_experiments(themes, maps)
    categories = categorical_experiments(themes)
    diagnostic_figures(maps)
    theme_figures(themes, maps)
    metadata = {"seed": SEED, "samples_per_map": 256, "themes": PRIORITY,
                "modes": ["light", "dark"], "visions": VISIONS,
                "cvd_severity": 100, "common_maps": len(SEQUENTIAL + CONTROLS + DIVERGING),
                "brand_maps": len(PRIORITY) * 2, "map_metric_rows": len(metrics),
                "background_rows": len(backgrounds), "category_rows": len(categories),
                "versions": {p: version(p) for p in ["numpy", "pandas", "matplotlib",
                                                     "seaborn", "colorspacious"]}}
    (HERE / "results/experiment-manifest.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
