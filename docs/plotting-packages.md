# Match scientific charts to your blog and slides

Plotfoundry gives scientific charts the same nine themes as htmpres slides and reading
documents. Match a chart's fonts, background, axes, labels and mark edges to the blog or
slide around it. Select the same theme family, then choose light or dark mode, a reading
or presentation profile, and a paper or panel surface.

Choose qualitative colors for named categories, sequential colors for one magnitude, or
diverging colors for values around a meaningful center. The Folio and Nocturne figures
below use the same data and scientific maps. Their type, ink and backgrounds change,
while categories keep their identities and numbers keep their color meanings.

```{=html}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:1.25rem">
<figure style="margin:0">
<a href="_generated/plotting/exports/python/folio-light-reading-paper.png"><img src="_generated/plotting/exports/python/folio-light-reading-paper.png" alt="Folio · light · reading · paper: categorical lines and markers above sequential cividis and diverging BrBG heatmaps; crossed cells are missing." width="640" loading="lazy" style="display:block;width:100%;height:auto"></a>
<figcaption>Folio · light · reading · paper. Open the image at full size to inspect labels and edges.</figcaption>
</figure>
<figure style="margin:0">
<a href="_generated/plotting/exports/python/nocturne-dark-reading-paper.png"><img src="_generated/plotting/exports/python/nocturne-dark-reading-paper.png" alt="Nocturne · dark · reading · paper: categorical lines and markers above sequential cividis and diverging BrBG heatmaps; crossed cells are missing." width="640" loading="lazy" style="display:block;width:100%;height:auto"></a>
<figcaption>Nocturne · dark · reading · paper. Open the image at full size to inspect labels and edges.</figcaption>
</figure>
</div>
```
Each specimen shows all three palette roles in one figure. Qualitative lines and
markers run across the top, sequential cividis appears at lower left, and diverging BrBG
appears at lower right. The second categorical panel uses the explicit five-slot option.
The recommended set has three slots.

Crossed heatmap cells are missing. An uncrossed pale cell in the diverging map
is a measured center value. Both figures are reviewed Python exports from the
[complete gallery](plotting-gallery.qmd).

## Match the setting, keep the scientific meaning

| Choice | Match to your blog or deck | What remains explicit |
| --- | --- | --- |
| Theme | Folio, Atelier, Nocturne, Tufte, Zephyr, Simplex, Pulse, Litera or Darkly | Use the same family in your document and plotting configuration |
| Mode | `light` or `dark` | The chosen image keeps that mode when embedded |
| Profile | `reading` for prose; `presentation` for slides | Place at 640 or 1152 CSS pixels respectively |
| Surface | `paper` for the main background; `panel` for an inset | Select the surface the chart will sit against |
| Data palette | Qualitative categories, sequential magnitude or diverging change | Keep the category domain, numeric limits and meaningful center consistent |

The family identifiers accepted by each native API are `folio`, `atelier`,
`nocturne`, `tufte`, `zephyr-reading`, `simplex-reading`, `pulse-reading`,
`litera-reading` and `darkly-reading`. Every family supports both modes,
both profiles and both surfaces. Together they give 72 configurations.

The exact sampled scientific maps stay fixed across themes and modes. Primary ink, muted
ink, surfaces, font faces and the ink around marks adapt to your selected setting. Brand
accents and semantic status colors have separate jobs. They do not replace the colors
that encode measurements.

## Make a chart in your language

- [Python](plotting-python.qmd): select a matching configuration in Matplotlib,
  Seaborn or pandas, then embed PNG or SVG in a blog or slide.
- [R](plotting-r.qmd): use the same choices with ggplot2 or base graphics,
  including exact scientific scales and treated helpers.
- [JavaScript](plotting-javascript.qmd): use Observable Plot in a browser or
  Quarto OJS, and export PNG or SVG for another document.

Each guide pairs complete programs using local data with their visible results
and downloads. Use its configuration examples to match another theme or setting.
If you have not chosen a theme, compare the same specimen across the nine
families in the [gallery](plotting-gallery.qmd).

## Choose your workflow

Plot furniture means axes, labels, grids and legends. A native theme supplies this
furniture. A profile selects reading or presentation sizes, and a surface selects a
paper or panel background.

| Workflow | What it provides | Boundary |
| --- | --- | --- |
| Matplotlib | Apply furniture within a context, use exact scales, draw treated lines/scatter/heatmaps, bind fonts and write export reports | Explicit supported helpers; not a universal artist wrapper |
| Seaborn / pandas | Keep ordinary native plots with matching furniture, or use supported helpers with dataframe columns | A native automatic color cycle is theme-only |
| ggplot2 | Use native themes/scales, supported layered geometries, facets and explicit export | Linear Cartesian coordinates; native scale transforms supported |
| Base R | Apply furniture within a context, use physical line/point geometry and draw heatmaps | Explicit device/export path; caller device is preserved |
| JavaScript / Observable Plot / Quarto OJS | Make browser charts, inspect them interactively and export local PNG/SVG | Supported marks and explicit adapters; see the [JavaScript guide](plotting-javascript.qmd) |

All routes follow the same versioned scientific contract. It defines the shared
rules for palettes, typography and mark treatment. The [gallery](plotting-gallery.qmd)
shows 72 Python, 72 ggplot2 and 72 base R views.

Use the supported helpers when you need the required mark treatment. For categorical
series, they add shapes, dashes, ink edges and direct labels. For heatmaps, they cross
missing cells. Applying a theme alone to an arbitrary native plot does not add those
cues.

## Scientific choices

Use primary ink for ordinary labels and scientific colors for data. Brand accents and
semantic states have separate jobs. The palette is not automatically generated from the
theme's brand color. Serif reading identities remain intact. Chart UI and headings use
their approved resolved faces.

- **Qualitative** colors distinguish named categories. The recommended three
  slots use blue, vermillion and pink. They have stable shapes/dashes, an opaque
  2.5 CSS-pixel foreground, a 5.5 ink under-stroke, edged 7-pixel nominal markers
  and direct labels. Both widths share one foreground-scaled dash geometry.

  Five slots are a conditional alternative with a different slot mapping.
  Choose that variant explicitly instead of expanding three into five.
  Its frozen simulated separation is lower, and denser marks increase the risk
  of occlusion and misidentification. Keep every required cue and review the
  actual chart. Three remains the recommendation.
- **Sequential** colors show one ordered magnitude. Use cividis by default, or
  the approved viridis, mako or rocket alternatives. Set explicit finite limits.
- **Diverging** colors show values around a meaningful center. BrBG is the default,
  with RdBu/coolwarm as alternatives. Set the center explicitly. The arms are
  normalized separately, so the limits need not be symmetric.
- **Missing** values remain missing. NA/NaN/null never become zero or the center.
  Line paths break, and heatmaps use muted fill with an explicit crossed cue.
  Under/over values clip to endpoints and remain distinct from missing.

The exact gamma-sRGB lookup table (LUT) values are shared. Sample locations `i/(N-1)` are not
lookup bins. Lookup uses `floor(u*N)`, capped at the last entry. BrBG has 257
entries and center index 128 (zero based). There is no automatic reversal or
interpolation substitute.

R converts exact lookup values to native hex, then a device may quantize further. Shared
lookup values do not imply pixel identity across languages.

## Size charts for their destination

Reading chart labels are 16 CSS pixels, headings 30 and metadata 14. Reading body
annotations are 20 for Folio, Nocturne, Tufte and Litera, 18 otherwise. Presentation
labels/metadata are 24, headings 36 and deliberate body annotations 30. A deck's
48-pixel display title is not a chart heading.

Native point size follows:

`points = CSS pixels × 72 × figure width inches / placed width CSS pixels`

Place reading charts at the declared 640 pixels and presentation charts at 1152 pixels.
DPI changes raster resolution, not placed typography. A website fit preview shrinks the
whole image, so it cannot show the original label size. Canvases are explicit, and
exports do not silently crop them.

Each independent package includes the exact bundled fonts, weights, notices and ET Book
conversion provenance. Installed runtimes do not look in this repository or research
directories. Font setup and export differ by device. Python SVG uses outlines, and PDF
requests verified TrueType subsets. R SVG/PDF use outlines.

Check your language guide for tested versions and limits. The packages do not guarantee
editable text, font embedding, plotmath or missing-glyph support across every export
path.

## Install a reviewed reference package

All three packages are unreleased references. Install and use them independently of
htmpres or a document engine with the guides' pinned source recipes. No PyPI, CRAN or
npm release is implied.

The Python and R installation recipes pin reviewed source revision
[`7b1bff1`](https://github.com/rahuldave/htmpres/tree/7b1bff11284ad2960f984f0f8ed772fa09c06d8c/packages).
The repository is a monorepo. Selecting `packages/python` or `packages/r` installs
that independent package, not the slide tool. Build tools are setup requirements,
not installed plotting runtime dependencies. No registry upload is implied.

The gallery publishes exact reviewed image bytes and sanitized reports. Each report
includes the case, canvas, placement, device versions, font hashes/weights and
checksums. Reports omit host paths and developer-library locations. Checksums bind
reviewed inputs. They are not signatures or a universal guarantee of accessibility or
projector performance.

[Static download index](_generated/plotting/index.html) and
[Font and code notices](_generated/plotting/index.html#notices)

The [JavaScript guide](plotting-javascript.qmd) covers the browser and Quarto OJS
reference. It has its own pinned installation recipe. No npm release is implied.
