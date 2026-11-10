# Make scientific charts

Use Plotfoundry with the plotting tools you already know. Start with a chart
question, run a complete local example, then change its data and appearance.
All three packages are unreleased references. No registry publication is implied.

- [Python tasks](plotting-python.qmd) compare electricity use, track a reservoir,
  adapt Seaborn and pandas, and map room temperatures.
- [R tasks](plotting-r.qmd) compare crop yield, adapt native ggplot2 facets,
  distinguish missing rooms, and draw with base graphics.
- [JavaScript tasks](plotting-javascript.qmd) compare delivery routes, explore
  energy use, and draw signed changes with Observable Plot and Quarto OJS.

Each guide includes its local data, complete code, visible results and downloads.
No htmpres or document engine is required at installed use. Use the
[theme gallery](plotting-gallery.qmd) after choosing a chart, to compare all nine
families across light, dark, reading and presentation settings.

The remaining sections explain the shared scientific choices and export limits.

## Choose your workflow

| Workflow | What it provides | Boundary |
| --- | --- | --- |
| Matplotlib | Scoped furniture, exact scales, treated lines/scatter/heatmaps, bound fonts and export reports | Explicit supported helpers; not a universal artist wrapper |
| Seaborn / pandas | Ordinary native plots with furniture, plus supported helpers using dataframe columns | A native automatic color cycle is theme-only |
| ggplot2 | Native theme/scales and supported layered geometries, facets and explicit export | Linear Cartesian coordinates; native scale transforms supported |
| Base R | Scoped graphics furniture, physical line/point geometry and heatmaps | Explicit device/export path; caller device is preserved |
| JavaScript / Observable Plot / Quarto OJS | Browser charts, interactive inspection and local PNG/SVG export | Supported marks and explicit adapters; see the [JavaScript guide](plotting-javascript.qmd) |

Plot furniture means axes, labels, grids and legends. A profile selects reading
or presentation sizes; a surface selects a paper or panel background.

All routes consume the same versioned scientific contract. It includes nine families,
light/dark, reading/presentation and paper/panel, giving **72 configurations**.
The [gallery](plotting-gallery.qmd) shows 72 Python, 72 ggplot2 and 72 base R views.
A plot theme changes furniture; a compliant helper also supplies the required
mark treatment. Styling the axes and drawing treated marks are different jobs.

## Scientific choices

Ordinary labels use primary ink. Brand accents, semantic states and scientific
data colors have separate jobs. The palette is not automatically generated from
the theme's brand color. Serif reading identities remain intact; chart UI and
headings use their approved resolved faces.

- **Qualitative:** the recommended three slots use blue, vermillion and pink,
  with stable shapes/dashes, opaque 2.5 CSS-pixel foreground, 5.5 ink under-stroke,
  edged 7-pixel nominal markers and direct labels. Conditional five slots are an
  explicit alternative with a different slot mapping; do not silently expand
  three into five. Five is conditional because its frozen simulated separation is lower and denser marks increase occlusion/identification risk; keep every required cue and review the actual chart. Three remains the recommendation. Both widths share one foreground-scaled dash geometry.
- **Sequential:** cividis by default; viridis, mako and rocket are approved
  alternatives. Values require explicit finite limits.
- **Diverging:** BrBG by default, with a meaningful explicit center and separately
  normalized arms. RdBu/coolwarm are alternatives. Limits need not be symmetric.
- **Missing:** NA/NaN/null remain missing, never zero or center. Line paths break;
  heatmaps use muted fill and an explicit crossed cue. Under/over values clip to
  endpoints and remain distinct from missing.

The exact gamma-sRGB lookup table (LUT) values are shared. Sample locations `i/(N-1)` are not
lookup bins. Lookup uses `floor(u*N)`, capped at the last entry. BrBG has 257
entries and center index 128 (zero based). There is no automatic reversal or
interpolation substitute. R converts exact lookup values to native hex, then a
device may quantize further; this is not a pixel-identity claim across languages.

## Placement, fonts and exports

Reading chart labels are 16 CSS pixels, headings 30 and metadata 14. Reading body
annotations are 20 for Folio, Nocturne, Tufte and Litera, 18 otherwise.
Presentation labels/metadata are 24, headings 36 and deliberate body annotations
30. A deck's 48-pixel display title is not a chart heading.

Native point size follows:

`points = CSS pixels × 72 × figure width inches / placed width CSS pixels`

Use the declared 640/1152-pixel reading/presentation placement. DPI changes
raster resolution, not placed typography. A website fit preview shrinks the whole
image; it is not evidence that the original labels were smaller. Canvases are
explicit and exports do not silently crop them.

Exact bundled fonts, weights, notices and ET Book conversion provenance travel
with each independent package. No installed runtime looks in this repository or
research directories. Font setup/export differs by device. Python SVG uses
outlines and PDF requests verified TrueType subsets; R SVG/PDF use outlines.
There is no universal editable-text, embedding, plotmath or missing-glyph promise.
See the language guides for actual tested versions and limits.

## Provenance and downloads

Current installation recipes pin reviewed source revision
[`7b1bff1`](https://github.com/rahuldave/htmpres/tree/7b1bff11284ad2960f984f0f8ed772fa09c06d8c/packages).
The repository is a monorepo; selecting `packages/python` or `packages/r` installs
that independent package, not the slide tool. Build tools are setup requirements,
not installed plotting runtime dependencies. No registry upload is implied.

The gallery publishes exact reviewed image bytes and sanitized reports with case,
canvas, placement, device versions, font hashes/weights and checksums. Reports
omit host paths and developer-library locations. Checksums bind reviewed inputs;
they are not signatures or a universal accessibility/projector guarantee.

[Static download index](_generated/plotting/index.html) and
[Font and code notices](_generated/plotting/index.html#notices)

The [JavaScript guide](plotting-javascript.qmd) covers the browser and Quarto OJS
reference. It has its own pinned installation recipe; no npm release is implied.
