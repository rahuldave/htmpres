"""Optional Matplotlib adapter: scoped furniture and deliberately supported marks.

Import this module explicitly; importing plotfoundry itself never imports NumPy
or Matplotlib, changes rcParams, registers fonts or chooses a backend.
"""

from contextlib import contextmanager
import hashlib
import json
import math
from pathlib import Path
from typing import Any, Iterator, Mapping, Sequence

import matplotlib as mpl
from matplotlib.axes import Axes
from matplotlib.collections import PathCollection
from matplotlib.colors import ListedColormap, Normalize
from matplotlib.figure import Figure
from matplotlib.font_manager import FontProperties
from matplotlib.ft2font import FT2Font
from matplotlib.lines import Line2D
from matplotlib import patheffects
from matplotlib.patches import Rectangle
from matplotlib.text import Text
import numpy as np

from .core import Theme
from ._resources._reference import category_slots, normalize


def _size(
    config: Theme,  # Selected placement/profile.
    role: str,  # Numeric chart typography role.
) -> float:  # Native point size.
    """Resolve chart roles from data rather than document typography guesses."""
    return config.points(config.case["typography"][role])


def rc(
    config: Theme,  # Selected case and placement.
) -> dict[str, Any]:  # Native theme-only configuration.
    """Return fresh rc furniture; a theme alone is not categorical compliance."""
    roles = config.case["roles"]
    label = _size(config, "label")
    return {
        "figure.figsize": (config.figure_width_inches, config.figure_width_inches / 2),
        "figure.facecolor": roles["background"],
        "axes.facecolor": roles["background"],
        "savefig.facecolor": roles["background"],
        "axes.edgecolor": roles["control-boundary"],
        "axes.labelcolor": roles["ink"],
        "text.color": roles["ink"],
        "xtick.color": roles["ink"],
        "ytick.color": roles["ink"],
        "font.size": label,
        "axes.labelsize": label,
        "xtick.labelsize": label,
        "ytick.labelsize": label,
        "legend.fontsize": label,
        "axes.titlesize": _size(config, "heading"),
        "axes.titleweight": config.spec["fonts"][config.case["fonts"]["heading"]][
            "weight"
        ],
        "axes.grid": False,
        "axes.unicode_minus": False,
        "text.usetex": False,
        "savefig.bbox": None,
        "savefig.transparent": False,
        "svg.fonttype": "path",
        "pdf.fonttype": 42,
        "pdf.use14corefonts": False,
    }


@contextmanager
def context(
    config: Theme,  # Explicit case/placement.
    *,
    overrides: (
        Mapping[str, Any] | None
    ) = None,  # Native rc overrides; may weaken scientific defaults.
) -> Iterator[None]:  # Exception-safe scoped rc context.
    """Restore caller state through nesting/exceptions; never register global fonts."""
    settings = rc(config)
    settings.update(overrides or {})
    with mpl.rc_context(settings):
        yield


def _font(
    text: Text,  # Existing plain-text artist.
    config: Theme,  # Exact bundled font mapping.
    role: str,  # heading, label, metadata or body_annotation.
    *,
    resize: bool = True,  # Preserve user-authored size during export re-binding.
) -> None:  # Mutates only the supplied text.
    """Bind a concrete file with its real weight; reject unsupported glyph fallback."""
    face = "heading" if role == "heading" else "ui"
    path = config.font_path(face)
    content = text.get_text()
    if text.get_usetex() or ("$" in content and text.get_parse_math()):
        raise ValueError(
            "Exact-font helper supports plain text; disable parse_math for literal dollar signs"
        )
    font = FT2Font(path)
    missing = {
        char
        for char in content
        if not char.isspace() and not font.get_char_index(ord(char))
    }
    if missing:
        raise ValueError(f"Bundled {face} face lacks glyphs: {sorted(missing)!r}")
    size = _size(config, role) if resize else text.get_fontsize()
    metadata = config.spec["fonts"][config.case["fonts"][face]]
    text.set_fontproperties(
        FontProperties(fname=path, size=size, weight=metadata["weight"])
    )
    text._plotfoundry_role = role


def style_axes(
    ax: Axes,  # Caller-owned axes, including a colorbar's axes.
    config: Theme,  # Selected style and exact font files.
) -> None:  # Styles current artists; rerun for late legends/colorbars.
    """Apply furniture and real font files to existing titles/labels/ticks/legend."""
    roles = config.case["roles"]
    ax.set_facecolor(roles["background"])
    for spine in ax.spines.values():
        spine.set_color(roles["control-boundary"])
    ax.tick_params(colors=roles["ink"])
    for text in [ax.title, ax._left_title, ax._right_title]:
        text.set_color(roles["ink"])
        _font(text, config, "heading")
    texts = [
        ax.xaxis.label,
        ax.yaxis.label,
        ax.xaxis.get_offset_text(),
        ax.yaxis.get_offset_text(),
        *ax.get_xticklabels(),
        *ax.get_yticklabels(),
    ]
    legend = ax.get_legend()
    if legend is not None:
        texts.extend([legend.get_title(), *legend.get_texts()])
        legend.get_frame().set_facecolor(roles["background"])
        legend.get_frame().set_edgecolor(roles["control-boundary"])
        legend.get_frame().set_alpha(1)
    for text in texts:
        text.set_color(roles["ink"])
        _font(text, config, "label")
    for text in ax.texts:
        text.set_color(roles["ink"])
        _font(text, config, getattr(text, "_plotfoundry_role", "label"))


def annotate(
    ax: Axes,  # Caller-owned axes.
    text: str,  # Plain text with supported glyphs.
    xy: tuple[float, float],  # Data-space position.
    config: Theme,  # Exact font and placement.
    *,
    role: str = "body_annotation",  # Explicit typography job.
) -> Text:  # File-bound annotation artist.
    """Distinguish prose annotation size from labels and metadata deliberately."""
    if role not in config.case["typography"]:
        raise ValueError("Unknown chart text role")
    probe = Text(text=text)
    _font(probe, config, role)
    artist = ax.text(*xy, text, color=config.case["roles"]["ink"])
    artist.set_fontproperties(probe.get_fontproperties())
    artist._plotfoundry_role = role
    return artist


def _vector(
    values: Sequence[float | None],  # Numeric sequence with null/NaN gaps.
) -> np.ndarray:  # Finite floats or NaNs, never infinities/bools.
    """Validate before mutating caller axes."""
    _numeric_array(values)
    try:
        result = np.asarray(np.ma.asarray(values, dtype=float).filled(np.nan))
    except (TypeError, ValueError) as error:
        raise ValueError("Coordinates must be numeric/null") from error
    if result.ndim != 1 or np.isinf(result).any():
        raise ValueError("Coordinates must be 1D finite numbers or missing")
    return result


def _coordinates(
    x: Sequence[float | None],  # Numeric x values.
    y: Sequence[float | None],  # Numeric y values.
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:  # Arrays and visible mask.
    """Keep missing coordinates as gaps, not zero or center."""
    xs, ys = _vector(x), _vector(y)
    if len(xs) != len(ys):
        raise ValueError("Coordinate lengths differ")
    valid = np.isfinite(xs) & np.isfinite(ys)
    if not valid.any():
        raise ValueError("At least one finite point is required for direct labeling")
    return xs, ys, valid


def _slot(
    config: Theme,  # Approved variant data.
    domain: list[str],  # Explicit stable ordered IDs.
    category: str,  # Actual observed category.
    variant: str | None,  # Explicit extended variant opt-in.
) -> dict[str, Any]:  # Stable color/cue slot.
    """Reject unsupported variants, inferred domains and capacity overflow."""
    name = variant or config.spec["categories"]["default"]
    if name not in config.spec["categories"]["variants"]:
        raise ValueError("Unknown categorical variant")
    return category_slots(
        domain, [category], config.spec["categories"]["variants"][name]
    )[0]


def _label(
    ax: Axes,  # Target axes.
    xy: tuple[float, float],  # Last finite endpoint.
    category: str,  # Explicit ID, not slot surrogate.
    config: Theme,  # Exact label face/placement.
) -> Text:  # Direct endpoint label.
    """Place an opaque ink label; caller resolves dense overlaps deliberately."""
    artist = ax.annotate(
        category,
        xy,
        xytext=(config.points(6), 0),
        textcoords="offset points",
        color=config.case["roles"]["ink"],
        va="center",
    )
    _font(artist, config, "label")
    return artist


def line(
    ax: Axes,  # Caller-owned axes.
    x: Sequence[float | None],  # Numeric x, missing allowed.
    y: Sequence[float | None],  # Numeric y, missing remains a gap.
    config: Theme,  # Case and placed geometry.
    *,
    domain: list[str],  # Explicit ordered category IDs.
    category: str,  # Current line's category ID.
    variant: str | None = None,  # Three-slot default or conditional five-slot ID.
) -> tuple[Line2D, Text]:  # Treated native line and direct label.
    """Draw opaque category foreground with shared-dash ink stroke and edged markers."""
    slot = _slot(config, domain, category, variant)
    xs, ys, valid = _coordinates(x, y)
    probe = Text(text=category)
    _font(probe, config, "label")
    treatment = config.spec["categories"]["treatment"]
    width = config.points(treatment["foreground_css_px"])
    pattern = [v * width for v in slot["dash"]["multipliers"]]
    marker = {
        "circle": "o",
        "square": "s",
        "triangle-up": "^",
        "diamond": "D",
        "triangle-down": "v",
    }[slot["shape"]]
    # Native rc scaling is disabled only while setting the already placed pattern.
    # Stroke copies this exact foreground geometry, changing only width/color.
    with mpl.rc_context({"lines.scale_dashes": False}):
        artist = Line2D(
            xs,
            ys,
            color=slot["color"],
            linewidth=width,
            linestyle=(0, pattern) if pattern else "-",
            marker=marker,
            markersize=config.points(treatment["marker_css_px"]),
            markeredgewidth=config.points(treatment["marker_edge_css_px"]),
            markeredgecolor=config.case["roles"]["ink"],
            markerfacecolor=slot["color"],
            alpha=1,
            label=category,
            dash_capstyle="butt",
            solid_capstyle="projecting",
        )
    artist.set_path_effects(
        [
            patheffects.Stroke(
                linewidth=config.points(treatment["understroke_css_px"]),
                foreground=config.case["roles"]["ink"],
            ),
            patheffects.Normal(),
        ]
    )
    ax.add_line(artist)
    ax.relim()
    ax.autoscale_view()
    last = np.flatnonzero(valid)[-1]
    return artist, _label(ax, (xs[last], ys[last]), category, config)


def scatter(
    ax: Axes,  # Caller-owned axes.
    x: Sequence[float | None],  # Numeric x positions.
    y: Sequence[float | None],  # Numeric y positions.
    config: Theme,  # Case and placed geometry.
    *,
    domain: list[str],  # Explicit complete category IDs.
    categories: Sequence[str],  # One category ID per observation.
    variant: str | None = None,  # Explicit capacity choice.
) -> list[PathCollection]:  # Native edged collections, grouped by stable domain.
    """Draw category shapes/edges and direct labels; omit missing coordinate points."""
    xs, ys, valid = _coordinates(x, y)
    observed = list(categories)
    if len(observed) != len(xs):
        raise ValueError("Category/coordinate lengths differ")
    slots = [_slot(config, domain, value, variant) for value in observed]
    for value in observed:
        _font(Text(text=value), config, "label")
    treatment = config.spec["categories"]["treatment"]
    result = []
    for category in domain:
        mask = np.array([v == category for v in observed]) & valid
        if not mask.any():
            continue
        slot = slots[observed.index(category)]
        marker = {
            "circle": "o",
            "square": "s",
            "triangle-up": "^",
            "diamond": "D",
            "triangle-down": "v",
        }[slot["shape"]]
        artist = ax.scatter(
            xs[mask],
            ys[mask],
            s=config.points(treatment["marker_css_px"]) ** 2,
            marker=marker,
            c=slot["color"],
            edgecolors=config.case["roles"]["ink"],
            linewidths=config.points(treatment["marker_edge_css_px"]),
            alpha=1,
            label=category,
        )
        result.append(artist)
        last = np.flatnonzero(mask)[-1]
        _label(ax, (xs[last], ys[last]), category, config)
    return result


def _numeric_array(
    values: Any,  # Numeric or masked values before coercion.
) -> None:  # Reject implicit boolean/string numeric conversions.
    """Preserve missing masks and validate real scalar types before casting."""
    for value in np.ma.asarray(values, dtype=object).compressed():
        if value is None:
            continue
        if isinstance(value, (bool, np.bool_)) or not isinstance(
            value, (int, float, np.integer, np.floating)
        ):
            raise ValueError("Only real numeric values/null/NaN are supported")


class ExplicitNorm(Normalize):
    """Finite explicit limits with asymmetric center and missing-safe arithmetic."""

    def __init__(
        self,
        vmin: float,  # Fixed lower endpoint.
        vmax: float,  # Fixed upper endpoint.
        center: float | None = None,  # Meaningful interior center for diverging maps.
    ) -> None:  # Native norm object.
        """Validate before any plotting mutation."""
        _numeric_array([vmin, vmax] + ([] if center is None else [center]))
        vmin, vmax = float(vmin), float(vmax)
        center = None if center is None else float(center)
        normalize(None, vmin, vmax, center)
        self.center = center
        super().__init__(vmin, vmax, clip=True)

    def __call__(
        self,
        value: Any,  # Scalar/array/masked array data.
        clip: bool | None = None,  # Endpoint clipping is a fixed contract policy.
    ) -> Any:  # Masked normalized scalar/array.
        """Use shared scalar reference, preserving missing masks and NaN."""
        _numeric_array(value)
        array = np.ma.asarray(value, dtype=float)
        data = np.asarray(array.filled(np.nan))
        output = np.array(
            [
                normalize(float(v), self.vmin, self.vmax, self.center)
                for v in data.ravel()
            ],
            dtype=float,
        ).reshape(data.shape)
        result = np.ma.array(output, mask=np.ma.getmaskarray(array) | np.isnan(output))
        return result[()] if result.ndim == 0 else result

    def inverse(
        self,
        value: Any,  # Native normalized scalar/array (e.g. colorbar ticks).
    ) -> Any:  # Data-space scalar/array.
        """Invert each explicit side without forcing symmetric limits."""
        u = np.asarray(value, dtype=float)
        if self.center is None:
            result = (1 - u) * self.vmin + u * self.vmax
        else:
            result = np.where(
                u <= 0.5,
                (1 - 2 * u) * self.vmin + 2 * u * self.center,
                (2 - 2 * u) * self.center + (2 * u - 1) * self.vmax,
            )
        return result.item() if result.ndim == 0 else result


def colorscale(
    config: Theme,  # Approved maps and contextual missing roles.
    *,
    vmin: float,  # Explicit finite lower limit.
    vmax: float,  # Explicit finite upper limit.
    kind: str = "sequential",  # sequential or diverging.
    center: float | None = None,  # Required meaningful center for diverging.
    name: str | None = None,  # Approved alternative, never automatic reversal.
) -> tuple[ListedColormap, ExplicitNorm]:  # Exact LUT and explicit native norm.
    """Preserve exact gamma-sRGB samples and ListedColormap bin semantics."""
    if kind not in ("sequential", "diverging"):
        raise ValueError("Unknown map kind")
    if (kind == "diverging") != (center is not None):
        raise ValueError("Only diverging scales require a center")
    selected = name or config.spec["mapSelection"][kind]["default"]
    if (
        selected not in config.spec["maps"]
        or config.spec["maps"][selected]["kind"] != kind
    ):
        raise ValueError("Unsupported map/kind")
    norm = ExplicitNorm(vmin, vmax, center)
    samples = config.spec["maps"][selected]["samples"]
    cmap = ListedColormap(samples, name="plotfoundry-" + selected).with_extremes(
        bad=config.case["roles"]["muted"], under=samples[0], over=samples[-1]
    )
    return cmap, norm


def heatmap(
    ax: Axes,  # Caller-owned axes.
    values: Any,  # 2D numeric cells, null/NaN remain explicit missing.
    config: Theme,  # Case/placement and exact data scales.
    *,
    vmin: float,  # Explicit finite lower endpoint.
    vmax: float,  # Explicit finite upper endpoint.
    kind: str = "sequential",  # Approved map kind.
    center: float | None = None,  # Required for divergence.
    name: str | None = None,  # Approved alternative map.
) -> Any:  # Native AxesImage, suitable for explicit colorbar creation.
    """Use opaque neutral missing cells with ink crosses, never center colors."""
    _numeric_array(values)
    array = np.asarray(np.ma.asarray(values, dtype=float).filled(np.nan))
    if array.ndim != 2 or not array.size or np.isinf(array).any():
        raise ValueError("Heatmap requires nonempty 2D finite/missing cells")
    cmap, norm = colorscale(
        config, vmin=vmin, vmax=vmax, kind=kind, center=center, name=name
    )
    norm(array)
    image = ax.imshow(
        np.ma.masked_invalid(array),
        cmap=cmap,
        norm=norm,
        interpolation="nearest",
        aspect="auto",
    )
    for row, column in np.argwhere(np.isnan(array)):
        ax.add_patch(
            Rectangle(
                (column - 0.5, row - 0.5),
                1,
                1,
                facecolor=config.case["roles"]["muted"],
                edgecolor=config.case["roles"]["background"],
                hatch="x",
                linewidth=config.points(0.5),
            )
        )
    return image


def export(
    fig: Figure,  # Explicit caller-owned canvas.
    config: Theme,  # Required placement matches actual figure width.
    stem: str | Path,  # File prefix; no implicit tight crop.
    *,
    formats: Sequence[str] = ("png", "svg", "pdf"),  # Explicit supported formats.
    dpi: float = 150,  # Raster resolution, never typography sizing.
) -> dict[str, Any]:  # Honest file/hash/font policy report.
    """Bind late text to exact files, preserve canvas, and report export evidence."""
    kinds = list(formats)
    if (
        not kinds
        or len(set(kinds)) != len(kinds)
        or any(k not in ("png", "svg", "pdf") for k in kinds)
    ):
        raise ValueError("Use unique png/svg/pdf formats")
    if not math.isfinite(dpi) or dpi <= 0:
        raise ValueError("DPI must be finite and positive")
    if not math.isclose(fig.get_figwidth(), config.figure_width_inches):
        raise ValueError("Figure width differs from declared placement")
    if fig._suptitle is not None:
        fig._suptitle._plotfoundry_role = "heading"
    # Create formatter ticks before binding all artists, including late legends/colorbars.
    for text in fig.findobj(Text):
        _font(text, config, getattr(text, "_plotfoundry_role", "label"), resize=False)
    fig.canvas.draw()
    for ax in fig.axes:
        for text in [ax.title, ax._left_title, ax._right_title]:
            text._plotfoundry_role = "heading"
    texts = fig.findobj(Text)
    for text in texts:
        _font(text, config, getattr(text, "_plotfoundry_role", "label"), resize=False)
    fig.canvas.draw()
    path = Path(stem)
    path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "specVersion": config.spec["specVersion"],
        "case": config.case["id"],
        "matplotlibVersion": mpl.__version__,
        "canvasInches": list(fig.get_size_inches()),
        "canvasPixels": None,
        "requestedRasterPixels": [fig.get_figwidth() * dpi, fig.get_figheight() * dpi],
        "placedWidthCssPx": config.placed_width_css_px,
        "tightCrop": False,
        "files": {},
        "fonts": {
            role: {"sha256": key, "file": config.spec["fonts"][key]["path"]}
            for role, key in config.case["fonts"].items()
        },
        "verification": "Artist font files/glyph coverage checked; file structure inspected; visual/export fidelity needs renderer acceptance.",
        "limits": [
            "Plain text only; no TeX/mathtext font guarantee.",
            "Direct labels do not resolve dense overlap.",
            "Theme-only or arbitrary native marks are not certified categorical treatments.",
        ],
    }
    with mpl.rc_context(
        {
            "svg.fonttype": "path",
            "pdf.fonttype": 42,
            "pdf.use14corefonts": False,
            "savefig.bbox": None,
            "savefig.transparent": False,
        }
    ):
        for kind in kinds:
            target = path.with_suffix("." + kind)
            fig.savefig(
                target,
                format=kind,
                dpi=dpi,
                bbox_inches=None,
                facecolor=config.case["roles"]["background"],
                transparent=False,
            )
            payload = target.read_bytes()
            if kind == "svg":
                if b"<text" in payload:
                    raise ValueError("Unexpected SVG text policy")
                policy = "glyph outlines; fonts not embedded as editable text"
            elif kind == "pdf":
                if b"/FontFile2" not in payload:
                    raise ValueError("Expected embedded TrueType font subset")
                policy = "TrueType subset requested; FontFile2 present, not full PDF conformance certification"
            else:
                from PIL import Image

                with Image.open(target) as raster:
                    report["canvasPixels"] = list(raster.size)
                policy = "rasterized glyphs; no font embedding"
            report["files"][kind] = {
                "path": str(target),
                "sha256": hashlib.sha256(payload).hexdigest(),
                "fontPolicy": policy,
            }
    path.with_suffix(".report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def scatter_values(
    ax: Axes,  # Caller-owned axes.
    x: Sequence[float | None],  # Numeric x positions.
    y: Sequence[float | None],  # Numeric y positions.
    values: Sequence[float | None],  # Continuous values; missing points omitted.
    config: Theme,  # Case and explicit placement.
    *,
    vmin: float,  # Explicit finite lower endpoint.
    vmax: float,  # Explicit finite upper endpoint.
    kind: str = "sequential",  # Approved map kind.
    center: float | None = None,  # Meaningful diverging center.
    name: str | None = None,  # Approved map alternative.
) -> PathCollection:  # Native continuous collection for explicit colorbars.
    """Plot finite continuous points; missing data never receive center colors."""
    xs, ys, valid = _coordinates(x, y)
    data = _vector(values)
    if len(data) != len(xs):
        raise ValueError("Value/coordinate lengths differ")
    cmap, norm = colorscale(
        config, vmin=vmin, vmax=vmax, kind=kind, center=center, name=name
    )
    valid = valid & np.isfinite(data)
    if not valid.any():
        raise ValueError("No finite continuous observations")
    norm(data)
    return ax.scatter(
        xs[valid],
        ys[valid],
        c=data[valid],
        cmap=cmap,
        norm=norm,
        s=config.points(config.spec["categories"]["treatment"]["marker_css_px"]) ** 2,
        edgecolors=config.case["roles"]["ink"],
        linewidths=config.points(
            config.spec["categories"]["treatment"]["marker_edge_css_px"]
        ),
        alpha=1,
    )
