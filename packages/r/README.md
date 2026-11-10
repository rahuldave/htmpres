# Plotfoundry for R

Compare crop yield, inspect stream samples with native ggplot2 facets, and draw
with base graphics. The [R tutorial](https://rahuldave.com/htmpres/plotting-r.html)
pairs complete scripts with visible results, downloads and all three export
formats. All tutorial measurements are illustrative.

## Install and draw your first chart

Version `0.0.0.9001` is an unreleased reference. There is no CRAN or r-universe
release. Install the local source archive with
`R CMD INSTALL plotfoundry_0.0.0.9001.tar.gz`.
The website tutorial gives a pinned source-install recipe if you have no archive.

Install dependencies into your chosen R library during setup:

```r
install.packages(c("jsonlite", "digest", "ggplot2", "scales", "showtext",
                   "sysfonts", "systemfonts", "ragg", "svglite"))
```

Some dependencies need native compilation and system libraries. Installed use
needs no Python, Node, htmpres, document engine or network access.
This complete script compares crop yield and preserves a missing year as a gap:

```r
# Illustrative trial yields, not observations from a real farming experiment.
library(plotfoundry)
library(ggplot2)
trial <- data.frame(
  year = rep(2021:2025, 3),
  yield_t_ha = c(3.2, 3.4, 3.3, 3.6, 3.7,
                 4.0, 4.1, NA, 4.3, 4.5,
                 4.4, 4.6, 4.5, 4.8, 4.9),
  irrigation = rep(c("Rainfed", "Drip", "Sprinkler"), each = 5)
)
s <- pf_theme("folio", mode = "light", profile = "reading")
p <- ggplot() +
  pf_line(trial, "year", "yield_t_ha", "irrigation", s,
          domain = c("Rainfed", "Drip", "Sprinkler")) +
  pf_theme_gg(s) +
  scale_x_continuous(breaks = 2021:2025, limits = c(2020.8, 2026.2)) +
  scale_y_continuous(limits = c(2.5, 5.5)) +
  labs(title = "Irrigation and crop yield",
       x = "Year", y = "Yield (tonnes/ha)")
pf_export(s, "r-yield", plot = p, height_inches = 4.8, dpi = 80)
```

Run `Rscript r-yield.R`, or source the script in R. It writes PNG, SVG, PDF and
an export report into the working directory. Replace the yield values, keep
rows in time order, and keep an explicit domain after filtering categories.
The invented data cannot support a causal claim about irrigation.

## Choose a native workflow

The tutorial also shows native ggplot2 facets with a sequential nitrate scale,
a diverging room-temperature heatmap, and the yield comparison drawn with base R.
`pf_theme_gg` changes fonts, backgrounds and axes. Native layers retain ordinary
ggplot2 addition order and do not automatically gain category cues.

`pf_scale_continuous` supplies explicit finite limits and exact sampled colors.
Diverging scales also need a meaningful center. `pf_heatmap` returns layers that
you add to a ggplot before export. Missing cells receive a cross; missing native
point rows need an explicit omission policy.

`pf_line` and `pf_base_lines` share category shapes, dashes, edges and direct labels.
The default has three slots. Five is an explicit conditional variant with its
own mapping. Keep all cues and inspect the result when using five categories.

For base graphics, draw inside `pf_export` using `pf_base_plot` and
`pf_base_lines`. The tutorial gives the complete callback and data.
`pf_base_context` scopes state on an existing device. Establish layouts before
entering an inner context, and do not close the caller's device inside it.

## Placement, fonts and export

Reading declares 640 CSS-pixel placement with 16-pixel labels. Presentation
declares 1152 with 24-pixel labels. Keep the declared eight-inch width aligned
with the actual canvas. DPI changes raster resolution, not placed typography.
The tutorial includes full-size profile comparisons.

Export binds supported UI and heading text to real bundled font files and weights.
Native annotation sizes remain authored sizes. Hash-named aliases are registered
explicitly by the font/export path and persist; caller family names are untouched.
Namespace loading does not register fonts or open devices.

Use plain text. Plotmath and absent glyphs fail rather than silently substitute.
Complex shaping, arbitrary grobs and Cairo devices are outside the verified path.

PNG uses ragg with showtext. SVG uses svglite and PDF uses R's native device;
both vector formats contain outlined glyphs, not editable or embedded-font text.
Inspect actual output for clipping and crowding. Export keeps the full canvas.

Exact lookup precedes eight-bit hex conversion. Devices can quantize further,
so matching numeric scales do not imply pixel-identical Python and R output.
The supported helper coordinates are linear Cartesian, including axis transforms.

## Offline use and maintainer reference

`pf_spec` verifies the complete bundled resource closure before parsing.
The installed code and pins detect drift; hashes are not authenticity signatures.
For an offline machine, provision Plotfoundry and all selected dependency packages
on a compatible system. No development lock or Python runtime is needed.

Tested versions are R 4.1.1, ggplot2 4.0.3, scales 1.4.0, showtext 0.9.8,
sysfonts 0.8.9, systemfonts 1.3.2, ragg 1.5.2 and svglite 2.2.2 on macOS arm64.
Other platforms and versions need their own checks.

Maintainers use the R tests, installed-package and gallery targets in `Justfile`.
Explicit resource promotion remains separate from ordinary builds.
The shipped gallery is an appearance and regression reference, not the tutorial.

The code is MIT licensed. Imported fonts and foundations keep their own notices.
See `LICENSE.md` and the installed `spec/data/notices` directory.
