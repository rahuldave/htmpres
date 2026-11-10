# Plotfoundry for R — unreleased reference

Native R scientific plotting, independently installable without Python,
JavaScript, Quarto, SmallDocs, htmpres or this checkout. Version `0.0.0.9001`
is an unpublished development version, independent of the other packages.
No CRAN/r-universe availability is claimed.

Install the built source archive with `R CMD INSTALL plotfoundry_0.0.0.9001.tar.gz`.
Core loading needs `jsonlite` and `digest`; plotting additionally needs ggplot2,
scales, showtext, sysfonts and systemfonts. PNG uses ragg, SVG uses svglite and
PDF uses R's native PDF device. Install optional plotting dependencies explicitly:

```r
install.packages(c("jsonlite", "digest", "ggplot2", "scales", "showtext",
                   "sysfonts", "systemfonts", "ragg", "svglite"))
library(plotfoundry)
s <- pf_theme("folio", mode="dark", profile="reading", surface="paper")
d <- data.frame(x=rep(1:3, 3), y=c(1,2,1,3,4,3,5,6,5),
                category=rep(c("A","B","C"), each=3))
p <- ggplot2::ggplot() +
  pf_line(d, "x", "y", "category", s, domain=c("A","B","C")) +
  pf_theme_gg(s) + ggplot2::labs(title="Observations", x="Time", y="Value")
pf_export(s, "observations", plot=p, height_inches=4)
```

`pf_spec()` verifies the complete immutable resource inventory and hashes before
parsing. It returns fresh native data, including all 72 family/mode/profile/surface
cases, exact float LUTs, source revisions, font files and notices. The installed
code/pins are the trust root; hashes detect drift, not hostile package replacement.
No network or developer tooling is used at runtime. The 45-resource snapshot is
promoted only after full shared-contract validation; it is not inferred from CSS.

## Native API and scientific boundaries

`pf_theme()` selects one explicit case and actual placement. `pf_points()` and
`pf_mm()` convert CSS lengths using `CSS px * 72 * figure width inches / placed
width CSS px`; resolution does not change placed typography. Defaults are 8-inch
canvas width and 640/1152 CSS-pixel reading/presentation placement. Chart labels
are 16/24 CSS px; headings 30/36. Reading body annotations are 20 for serif
families and 18 otherwise. Supply explicit annotation sizes when drawing them.

`pf_categories()` requires an ordered, unique character domain. Observed factors
are matched by labels; unused levels do not change slots. The recommended
three-category and conditional five-category variants have independent identities;
switching variants can recolor slots. No expansion, recycling or inference occurs.
`pf_line()`/`pf_scatter()` retain original facet columns and row/path order. Their
opaque foreground, ink under-stroke, edged marker polygons, stable dashes and
direct labels implement the approved treatment. Physical dash segments are shared
by both widths; solid caps project, dashed caps are butt. Markers use a 7 CSS-pixel
bounding box, not a claim of pixel-identical Matplotlib polygon geometry.

Supported coordinates are linear Cartesian, including native scale transforms
such as log scales. Polar/nonlinear coordinate systems fail explicitly. Missing
line positions break paths and restart dash phase. Category rows need at least
one finite endpoint for direct labels. Dense overlap, occlusion and clipping
remain caller layout responsibilities; allow room for labels. Segmentation has
an explicit resolution/work budget instead of unbounded loops.

`pf_theme_gg()` and `pf_scales_manual()` are ordinary native furniture/scales;
a bare color cycle is **not** the complete categorical treatment. Native ggplot
addition order applies: later authored themes/scales/guides replace earlier ones.
`pf_scale_continuous()` requires finite explicit limits, and diverging scales also
require a meaningful center. `pf_normalize()` uses independently normalized arms,
clips under/over values to endpoints, and keeps NA/NaN missing. `pf_lookup()`
returns exact gamma-sRGB floats using `floor(u*N)` capped at `N-1`; LUT sample
positions `i/(N-1)` are not bin edges. BrBG's 257 entries place center at index128
(zero based). No interpolation, implicit reversal or automatic symmetric limits.
`pf_heatmap()`/`pf_base_heatmap()` use muted missing fill plus two background-ink
cross diagonals. Row one is at the top. Missing scatter observations are omitted;
no claim of a separate missing-point symbol is made.

Native R hex conversion follows exact float lookup (maximum channel rounding
about 0.5/255); selected devices can quantize further, including native PDF's
three-decimal stroke RGB. Float parity does not mean byte-identical rendered colors.

## Base R and graphics state

```r
pf_export(s, "base-observations", draw=function(style) {
  pf_base_plot(style, c(0,4), c(0,7), "Time", "Value", "Observations")
  pf_base_lines(d$x, d$y, d$category, style, c("A","B","C"))
})
```

`pf_base_context()` scopes `par`, options and palette on an already open device,
including nested/error paths. Establish `mfrow` before an inner context because R
layout changes reset text scale. Device switches restore the captured caller
state; unrelated devices are never closed. Closing the original device prevents
restoration and warns. Export owns and closes only its own device, and restores
showtext options. Namespace load/attach does not register fonts or open devices.

## Fonts, devices and export

`pf_fonts()` explicitly registers exact bundled real faces using reserved
`plotfoundry-<file SHA256>` aliases. Those reserved aliases persist and may be
rebound; other caller family names are untouched. There is no registry rollback
promise. Export rebinds native ggplot text (including guides, legend, ticks and
annotations) to exact UI/heading faces while preserving authored size/color.
Only the plot title uses the heading face; guide titles use UI. Base helpers
select the corresponding aliases explicitly. Host same-family font collisions
therefore cannot choose another file on the tested devices.

Plain text only: plotmath, TeX and missing glyphs fail before a successful report.
Arbitrary callbacks/third-party grobs are not universally certified. Fonts retain
all source notices, ET Book conversion provenance and its fsType4 metadata.
PNG uses showtext rasterized glyphs with matching device DPI; SVG/PDF use actual
glyph outlines, not editable or embedded font text. Cairo/XQuartz devices were
unavailable in the tested environment and are not advertised.

`pf_export()` takes an explicit width/height canvas, no implicit cropping, and
writes file hashes, actual PNG dimensions, device/font provenance and limitations
to `.report.json`. A ggplot list uses explicit columns and reserved title/footer
lanes; this is a small fixture composition facility, not a universal layout engine.
Inspect exported files: an evidence report is not proof of every future rendering.

## Installed examples and verification

```r
source(system.file("examples", "quickstart.R", package="plotfoundry"))
# Shell: Rscript /installed/library/plotfoundry/examples/gallery.R OUTPUT [CASE_ID]
```

`examples/quickstart.qmd` is a Quarto-ready source; executing the same R code needs
no document engine. `examples/gallery.R` renders both native routes for all 72
cases with PNG/SVG/PDF outputs. Website guides and reviewed static galleries accompany the separate documentation checkpoint.

Tested: R 4.1.1, ggplot2 4.0.3, scales 1.4.0, showtext 0.9.8, sysfonts 0.8.9,
systemfonts 1.3.2, ragg 1.5.2 and svglite 2.2.2 on macOS arm64. DESCRIPTION minima
are compatibility boundaries, not evidence for untested versions/platforms.
`tools/tested-dependencies.json` records the complete development dependency set;
`tools/install-dependencies.R` provisions an explicit local library from CRAN
source archives. Native compilation prerequisites may be needed. These tools and
Python-based maintainer promotion are not installed runtime dependencies.

The new implementation is MIT licensed. `LICENSE` contains R metadata,
`LICENSE.md` the full notice, and installed `spec/data/notices` preserves all
third-party notices. Package resources are self-contained and usable offline.

Website documentation: [native guide](https://rahuldave.com/htmpres/plotting-r.html) and [all-nine-family gallery](https://rahuldave.com/htmpres/plotting-gallery.html), deployed with the Python/R documentation checkpoint. This does not announce a registry release.
