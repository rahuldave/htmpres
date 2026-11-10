# Plotfoundry for Python — unreleased reference

Python `0.1.0.dev1` implements the approved standalone scientific contract with an
optional Matplotlib reference. It needs no htmpres, Quarto, SmallDocs, R,
JavaScript, sibling package, research checkout or network at installed use.
Nothing has been published to PyPI/CDN. Build a local wheel/sdist with `uv build`;
the sdist contains all resources and rebuilds without this monorepo.

The stdlib-only core requires Python 3.12+. `load_spec()`, `theme(...)` and
`package_info()` do not import NumPy/Matplotlib, choose a backend, register fonts,
modify rcParams or download files. Plotting is an explicit optional import:

```sh
# Use the locally built artifact; install dependencies during setup.
python -m pip install 'path/to/plotfoundry-0.1.0.dev1-py3-none-any.whl[matplotlib]'
```

The adapter declares compatible Matplotlib `>=3.11.2,<3.12` and NumPy
`>=2.5.4,<2.6`. Actual reference evidence uses Python 3.12.10, Matplotlib 3.11.2,
NumPy 2.5.4, pandas 3.1.1 and Seaborn 0.13.2 from the included development lock.
This is not proof for every Python/platform/backend or future patch release.
The lock's verification group is build/test tooling, not an installed runtime
requirement; pandas/Seaborn remain optional unless you use their examples.

## Quickstart

```python
import matplotlib.pyplot as plt
from plotfoundry import theme
from plotfoundry.matplotlib import context, line, style_axes, export

style = theme("folio", mode="dark", profile="presentation", surface="paper",
              figure_width_inches=8, placed_width_css_px=1152)
with context(style):
    fig, ax = plt.subplots(figsize=(8, 4))
    line(ax, [0, 1, 2], [1, None, 3], style,
         domain=["Observed"], category="Observed")
    ax.set(title="Results", xlabel="Time", ylabel="Value")
    style_axes(ax, style)
    report = export(fig, style, "results", formats=["png", "svg", "pdf"], dpi=144)
    plt.close(fig)
```

Choose any of the nine exact family IDs (`folio`, `atelier`, `nocturne`, `tufte`,
`zephyr-reading`, `simplex-reading`, `pulse-reading`, `litera-reading`,
`darkly-reading`), `light`/`dark`, `reading`/`presentation`, and `paper`/`panel`.
All 72 combinations are resolved in shipped resources. The imported upstream
manifests remain byte-exact and authoritative; the installed package never infers
colors from CSS or fetches upstream data. `load_spec()` returns a fresh dictionary
and checks exact approved snapshot pins/closure and scientific semantics. The trust
root is the installed package/code, not an attacker-authentication/signature scheme.
Pins are generated only after the full approved source validator/font gate;
coherently rehashing a modified data/inventory cannot redefine this contract. Maintainers run
`just python-snapshot-check` to reject stale copies; only explicit
`--write` promotes reviewed source bytes. Native builds never run that importer.

## API and supported treatments

- `theme(...)` selects explicit furniture/profile/placement. `style.points(px)`
  uses the shared contract's exact arithmetic. Reading chart labels are 16 CSS px,
  headings 30 and metadata 14; body annotations are 20 for Folio/Nocturne/Tufte/
  Litera, 18 otherwise. Presentation labels/metadata are 24, headings 36, body 30.
- `rc(style)` returns a fresh native theme-only mapping. `context(style,
  overrides={...})` scopes it and restores state through nesting and exceptions.
  Overrides win inside the context, but can weaken approved defaults. A theme-only
  plot, native `axes.prop_cycle`, Seaborn or pandas color cycle is **not** the
  compliant categorical treatment.
- `line(ax, x, y, style, domain=[...], category=...)` uses the recommended three
  slots by default. `scatter(..., domain=[...], categories=[...])` groups observations
  with the same explicit domain. Both supply opaque foreground, ink under-stroke
  (lines), real shapes, ink marker edges and endpoint labels. Unknown/duplicate/
  over-capacity domains fail before adding marks. Null/NaN line coordinates remain
  gaps; missing scatter points are omitted. Empty/no-finite series cannot provide
  endpoint labels and are rejected. This is not an explicit-missing-point glyph API.
- `variant="colorblind-subset-5"` explicitly opts into the conditional five slots.
  Slot identity includes the variant; switching from three to five can recolor C.
  No automatic expansion, recycling, inferred domain or common-prefix guarantee.
- Line dashes use foreground-width multiples, translated once to placed points.
  The 5.5 CSS px ink under-stroke shares the 2.5 px foreground's dash geometry.
  Markers are 7 px with 1.5 px edges. Later changing linewidth/dashes/alpha or
  native marks may invalidate this operational treatment. Direct labels do not
  solve dense overlap; caller positions/limits need visual review.
- `colorscale(style, vmin=..., vmax=..., kind="sequential")` returns an exact
  `ListedColormap` and `ExplicitNorm`. Diverging requires `kind="diverging"` and
  a meaningful `center=...`; limits may be asymmetric. cividis/BrBG are defaults;
  `name=` selects an approved same-kind alternative. No interpolation or dark-mode
  reversal: sample positions `i/(N-1)` differ from bins `floor(u*N)` capped at N-1.
  The 257-sample diverging center is index 128. Limits are finite and explicit;
  under/over clip to endpoints, null/NaN/masked data remain missing, infinities and
  boolean/string numeric coercions are rejected.
- `heatmap(...)` supports 2D cells with an opaque muted missing fill and contextual
  background-ink cross/hatch. `scatter_values(...)` supports continuous points and
  omits missing coordinates/values. Both return native mappables; create colorbars
  explicitly. Neither promises arbitrary filled areas, bars, maps or aggregation.
- `style_axes(ax, style)` applies furniture and exact-file text to existing axes,
  titles, ticks, offsets, native annotations and legends. It deliberately applies
  approved ink/sizes. Call it on colorbar axes too. Add explicit local overrides
  **after** styling. `annotate(..., role="body_annotation")` distinguishes prose
  annotations from labels/metadata. Export rebinds fonts for late artists while
  preserving their authored sizes/colors; it does not silently normalize layouts.

## Fonts, placement and export

All twelve approved resolved faces and notices are inside wheel and sdist.
Every supported text artist gets `FontProperties(fname=...)` referencing its exact
bundled face/real weight, even when the host registers another same-family font.
There is no global font registration. Pulse/Litera DejaVu is an explicit bundled
fallback; ET Book source WOFF, reproduced TTF and fsType/license records are kept.

**Strict plain-text scope:** supported glyphs must exist in the selected face.
TeX/mathtext (including default logarithmic math formatters) and absent glyphs
raise before a success report. For log ticks, explicitly choose plain numeric
`ScalarFormatter`/`FuncFormatter`; math/Unicode fallback is not silently certified.
Literal dollar text needs `Text.set_parse_math(False)`. Arbitrary renderer math
fonts and complex shaping are outside this reference.

Placement is `points = css_px * 72 * figure_width_inches / placed_width_css_px`.
The declared width must match the actual Figure. DPI affects raster pixels, not
physical type/marker size. `export` keeps the explicit canvas and never uses tight
cropping. It produces PNG rasterized glyphs, SVG glyph outlines (not editable
embedded-font text), and PDF TrueType subsets. Reports include actual file hashes,
canvas/placement, resolved font IDs and policy checks. `canvasPixels` comes from
the actual PNG header (null for vector-only exports); `requestedRasterPixels`
records the requested inch×DPI product, which can differ at fractional DPI. Font-file/glyph checks and
FontFile2 presence are evidence, not a universal PDF/accessibility certification.
After local edits, visually check clipping/overlap and intended physical placement.

## Ordinary pandas/Seaborn and offline examples

`examples/dataframes.py` uses plain pandas plus ordinary Seaborn and DataFrame.plot axes next to
supported treated lines from dataframe columns. Native lines/styles alone remain
theme-only. Call `style_axes` after Seaborn creates its legend; export binds late
legend/colorbar text to files but cannot retrofit arbitrary marks into compliant
strokes/shapes/direct labels. No monkeypatching or automatic global registration.

Wheel-only users can invoke the shipped examples directly, without uv or the lock:

```sh
# Optional dataframe-example dependencies, installed during setup:
python -m pip install pandas==3.1.1 seaborn==0.13.2
python -m plotfoundry.examples.dataframes
python -m plotfoundry.examples.gallery --case folio/light/reading/paper --output gallery
# Omit --case for all72. Pillow arrives with the Matplotlib extra.
```

`examples/gallery.py` generates PNG/SVG/PDF for all 72 cases, both categorical
variants, both continuous defaults, missing cells, late legends/colorbars and
placed typography. Examples ship in the wheel under `plotfoundry/examples/` and
in the source archive. They run without this checkout.

After dependencies are provisioned, use installed wheels offline. Maintainer
checks use cached dependencies with `uv --offline`; no OS-level network sandbox
is implied. Run `just python-test`, `just python-gallery`, `just python-install-test`
`just python-gallery-check` and `just python-check` from the monorepo. The last includes stale-snapshot,
focused, actual artifact installation and diff checks. The shared scientific spec
is immutable in this piece; native R/JS adapters and publication remain deferred.

New code/docs are MIT licensed; all imported font/manifest notices retain their
original licenses. Actual SVG outlines/PDF subsets are renderer outputs, not a
relicensing of those assets.
