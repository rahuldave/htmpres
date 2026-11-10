\name{scientific_reference}
\alias{pf_base_context}
\alias{pf_base_heatmap}
\alias{pf_base_lines}
\alias{pf_base_plot}
\alias{pf_base_points}
\alias{pf_categories}
\alias{pf_dash_segments}
\alias{pf_export}
\alias{pf_fonts}
\alias{pf_heatmap}
\alias{pf_line}
\alias{pf_lookup}
\alias{pf_mm}
\alias{pf_normalize}
\alias{pf_points}
\alias{pf_scale_continuous}
\alias{pf_scales_manual}
\alias{pf_scatter}
\alias{pf_spec}
\alias{pf_theme}
\alias{pf_theme_gg}
\title{Explicit Standalone Scientific Plotting}
\description{Load pinned scientific data and draw supported native ggplot2 or base graphics with explicit domains, limits, placement, fonts and export devices. Theme-only scales do not apply complete categorical treatment.}
\usage{
pf_base_context(style, code)

pf_base_heatmap(values, style, vmin, vmax, kind = "sequential", center = NULL, name = NULL, title = "")

pf_base_lines(x, y, category, style, domain, variant = NULL)

pf_base_plot(style, xlim, ylim, xlab = "", ylab = "", title = "", log = "")

pf_base_points(x, y, category, style, domain, variant = NULL)

pf_categories(style, domain, observed = domain, variant = NULL)

pf_dash_segments(x, y, pattern = numeric())

pf_export(style, stem, plot = NULL, draw = NULL, height_inches = 4, formats = c("png", "svg", "pdf"),
    dpi = 144, columns = 2, title = "", caption = "")

pf_fonts(style)

pf_heatmap(values, style, vmin, vmax, kind = "sequential", center = NULL, name = NULL)

pf_line(data, x, y, category, style, domain, variant = NULL)

pf_lookup(style, u, name = "cividis")

pf_mm(style, css_px)

pf_normalize(values, vmin, vmax, center = NULL)

pf_points(style, css_px)

pf_scale_continuous(style, vmin, vmax, kind = "sequential", center = NULL, name = NULL, aesthetics = "colour")

pf_scales_manual(style, domain, variant = NULL)

pf_scatter(data, x, y, category, style, domain, variant = NULL)

pf_spec()

pf_theme(name, mode = "light", profile = "reading", surface = "paper", figure_width_inches = 8, placed_width_css_px = NULL)

pf_theme_gg(style)

}
\arguments{
\item{style}{An explicit configuration from pf_theme.}
\item{code}{Expression evaluated with scoped base graphics state on an open device.}
\item{values}{Explicit native input; see the installed README for types, units and supported limits.}
\item{vmin}{Finite explicit lower endpoint.}
\item{vmax}{Finite explicit upper endpoint.}
\item{kind}{Explicit native input; see the installed README for types, units and supported limits.}
\item{center}{Meaningful finite diverging center, or NULL for sequential normalization.}
\item{name}{Explicit native input; see the installed README for types, units and supported limits.}
\item{title}{Explicit native input; see the installed README for types, units and supported limits.}
\item{x}{Explicit native input; see the installed README for types, units and supported limits.}
\item{y}{Explicit native input; see the installed README for types, units and supported limits.}
\item{category}{Explicit native input; see the installed README for types, units and supported limits.}
\item{domain}{Unique ordered character category IDs, including absent categories.}
\item{variant}{Explicit recommended three or conditional five category variant.}
\item{xlim}{Explicit native input; see the installed README for types, units and supported limits.}
\item{ylim}{Explicit native input; see the installed README for types, units and supported limits.}
\item{xlab}{Explicit native input; see the installed README for types, units and supported limits.}
\item{ylab}{Explicit native input; see the installed README for types, units and supported limits.}
\item{log}{Explicit native input; see the installed README for types, units and supported limits.}
\item{observed}{Explicit native input; see the installed README for types, units and supported limits.}
\item{pattern}{Explicit native input; see the installed README for types, units and supported limits.}
\item{stem}{Explicit native input; see the installed README for types, units and supported limits.}
\item{plot}{A ggplot object or nonempty list of ggplot objects, exclusive with draw.}
\item{draw}{Function accepting style and drawing with base helpers, exclusive with plot.}
\item{height_inches}{Explicit native input; see the installed README for types, units and supported limits.}
\item{formats}{Explicit native input; see the installed README for types, units and supported limits.}
\item{dpi}{Explicit native input; see the installed README for types, units and supported limits.}
\item{columns}{Explicit native input; see the installed README for types, units and supported limits.}
\item{caption}{Explicit native input; see the installed README for types, units and supported limits.}
\item{data}{Explicit native input; see the installed README for types, units and supported limits.}
\item{u}{Explicit native input; see the installed README for types, units and supported limits.}
\item{css_px}{Explicit native input; see the installed README for types, units and supported limits.}
\item{aesthetics}{Explicit native input; see the installed README for types, units and supported limits.}
\item{mode}{Explicit native input; see the installed README for types, units and supported limits.}
\item{profile}{Explicit native input; see the installed README for types, units and supported limits.}
\item{surface}{Explicit native input; see the installed README for types, units and supported limits.}
\item{figure_width_inches}{Explicit native input; see the installed README for types, units and supported limits.}
\item{placed_width_css_px}{Explicit native input; see the installed README for types, units and supported limits.}
}
\value{Native data/configuration, physical units, ggplot objects/layers/scales, or an invisible drawing/export report as appropriate.}
\details{Resources are checked against complete installed-code pins before parsing. No network or other language runtime is used. Exact LUT lookup precedes native device quantization. Export accepts plain text only and outlines vector glyphs; it does not promise editable or embedded fonts. Reserved hash font aliases persist after explicit registration. Base contexts restore caller graphics state, including errors, without closing unrelated devices. Nonlinear coordinate systems are unsupported. See the installed README and examples for full limitations.}
\examples{
s <- pf_theme("folio")
pf_normalize(c(-2, 0, 1, NA_real_), -2, 1, center=0)
pf_categories(s, c("A", "B", "C"))
}
