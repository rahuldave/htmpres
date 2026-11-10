"""Language-neutral conformance reference, not a plotting adapter.

Only standard-library arithmetic/data operations are used. Future native adapters
must match these semantics; no backend registration or rendering happens here.
"""

import math

SHAPES = {
    "o": "circle",
    "s": "square",
    "^": "triangle-up",
    "D": "diamond",
    "v": "triangle-down",
}


def finite(value, label):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
    ):
        raise ValueError(f"{label} must be a finite number")
    return float(value)


def interval_fraction(value, low, high):
    """Stable affine ratio for finite ordered bounds, including wide ranges."""
    if value == low:
        return 0.0
    if value == high:
        return 1.0
    span = high - low
    if math.isfinite(span):
        return (value - low) / span
    # Only opposite-sign very large bounds can overflow the subtraction.
    return (value * 0.5 - low * 0.5) / (high * 0.5 - low * 0.5)


def normalize(value, vmin, vmax, center=None):
    """Explicit endpoint clipping; null/NaN remain missing, never zero/center."""
    low, high = finite(vmin, "vmin"), finite(vmax, "vmax")
    if not low < high:
        raise ValueError("vmin must be less than vmax")
    if center is not None:
        center = finite(center, "center")
        if not low < center < high:
            raise ValueError("vmin < center < vmax is required")
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    value = min(high, max(low, finite(value, "value")))
    if center is None:
        return interval_fraction(value, low, high)
    if value <= center:
        return 0.5 * interval_fraction(value, low, center)
    return 0.5 + 0.5 * interval_fraction(value, center, high)


def lookup_index(u, size):
    """Listed lookup bins differ from uniform sample positions i/(N-1)."""
    if isinstance(size, bool) or not isinstance(size, int) or size < 2:
        raise ValueError("LUT size must be an integer >= 2")
    if u is None or (isinstance(u, float) and math.isnan(u)):
        return None
    u = min(1.0, max(0.0, finite(u, "normalized value")))
    return min(size - 1, math.floor(u * size))


def points(css_px, figure_width_inches, placed_width_css_px):
    """Convert placed CSS length to native points; raster DPI is independent."""
    values = [
        finite(css_px, "css_px"),
        finite(figure_width_inches, "figure width"),
        finite(placed_width_css_px, "placed width"),
    ]
    if any(value <= 0 for value in values):
        raise ValueError("Placement dimensions must be positive")
    return values[0] * 72 * values[1] / values[2]


def millimeters(css_px, figure_width_inches, placed_width_css_px):
    return points(css_px, figure_width_inches, placed_width_css_px) * 25.4 / 72


def marker_area_points2(diameter_css_px, figure_width_inches, placed_width_css_px):
    """Area-style size convention reference; native symbol geometry stays explicit."""
    return points(diameter_css_px, figure_width_inches, placed_width_css_px) ** 2


def category_slots(domain, observed, variant):
    """Explicit ordered string domain, no inference/recycling/variant expansion."""
    if not isinstance(domain, list) or not all(
        isinstance(value, str) and value for value in domain
    ):
        raise ValueError(
            "Category domain must be an explicit list of nonempty string IDs"
        )
    if len(domain) != len(set(domain)):
        raise ValueError("Duplicate category IDs")
    if len(domain) > variant["capacity"]:
        raise ValueError("Category capacity exceeded")
    mapping = dict(zip(domain, variant["slots"]))
    if any(value not in mapping for value in observed):
        raise ValueError("Observed category outside explicit domain")
    return [mapping[value] for value in observed]


def portable_slots(definition, variant, dash_cues):
    result = []
    for slot, color, shape, token in zip(
        variant["stable_slots"],
        definition["colors"],
        variant["markers"],
        variant["dashes"],
    ):
        pattern = (
            token if isinstance(token, list) else dash_cues["namedPatterns"][token]
        )
        result.append(
            {
                "id": slot,
                "color": color,
                "shape": SHAPES[shape],
                "sourceMarker": shape,
                "sourceDash": token,
                "dash": {
                    "offset": 0,
                    "multipliers": pattern,
                    "unit": "foreground-linewidth-multiple",
                    "sharedBetweenLayers": True,
                    "cap": "butt" if pattern else "projecting",
                },
            }
        )
    return result
