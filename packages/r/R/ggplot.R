#' Native ggplot furniture only, without a compliant automatic data cycle
#' @param style Explicit scientific case and placement.
#' @return A ggplot2 theme; subsequent authored theme/scales take precedence.
#' @export
pf_theme_gg <- function(style) {
    .pf_need("ggplot2")
    alias <- .pf_font_names(style)
    r <- style$case$roles
    size <- function(role) pf_points(style, style$case$typography[[role]])
    ggplot2::theme_minimal(base_size = size("label"), base_family = alias[["ui"]]) + ggplot2::theme(text = ggplot2::element_text(colour = r$ink,
        face = "plain"), plot.title = ggplot2::element_text(family = alias[["heading"]], face = "plain",
        size = size("heading")), plot.subtitle = ggplot2::element_text(size = size("label")), plot.caption = ggplot2::element_text(size = size("metadata")),
        axis.title = ggplot2::element_text(size = size("label")), axis.text = ggplot2::element_text(colour = r$ink,
            size = size("label")), legend.text = ggplot2::element_text(size = size("label")), legend.title = ggplot2::element_text(size = size("label")),
        plot.background = ggplot2::element_rect(fill = r$background, colour = NA), panel.background = ggplot2::element_rect(fill = r$background,
            colour = NA), legend.background = ggplot2::element_rect(fill = r$background, colour = NA),
        panel.grid = ggplot2::element_blank(), axis.line = ggplot2::element_line(colour = r[["control-boundary"]]),
        plot.margin = grid::unit(rep(pf_mm(style, 16), 4), "mm"))
}

.pf_geom <- function(type) {
    ggplot2::ggproto(NULL, ggplot2::Geom, required_aes = c("x", "y", "slot"), default_aes = ggplot2::aes(),
        handle_na = function(data, params) data, draw_key = ggplot2::draw_key_blank, draw_panel = function(data,
            panel_params, coord, style, slots) {
            if (!inherits(coord, "CoordCartesian") || !isTRUE(coord$is_linear()))
                stop("Supported helpers require linear Cartesian coordinates (axis scale transforms supported)")
            transformed <- coord$transform(data, panel_params)
            actual <- slots[data$slot, , drop = FALSE]
            .pf_marks_grob(transformed$x, transformed$y, actual, style, type)
        })
}

.pf_layer <- function(data, x, y, category, style, domain, variant, type) {
    .pf_need("ggplot2")
    prepared <- .pf_data(data, x, y, category, style, domain, variant)
    values <- as.data.frame(data)
    values$.pf_x <- prepared$x
    values$.pf_y <- prepared$y
    values$.pf_category <- prepared$slots$id
    values$.pf_slot <- seq_along(prepared$x)
    ggplot2::layer(geom = .pf_geom(type), stat = "identity", position = "identity", data = values, mapping = ggplot2::aes(x = !!as.name(".pf_x"),
        y = !!as.name(".pf_y"), group = !!as.name(".pf_category"), slot = !!as.name(".pf_slot")), inherit.aes = FALSE,
        show.legend = FALSE, params = list(style = style, slots = prepared$slots))
}

#' Supported physically layered categorical lines or scatter
#' @param data Data frame; rows define line path order, NA resets dash phase.
#' @param x,y,category Explicit column names.
#' @param style Theme and placement.
#' @param domain Explicit stable ordered category IDs, including absent categories.
#' @param variant Default three or conditional five variant.
#' @return A native ggplot layer with direct labels and no duplicate guide.
#' @export
pf_line <- function(data, x, y, category, style, domain, variant = NULL) .pf_layer(data, x, y, category,
    style, domain, variant, "line")

#' @rdname pf_line
#' @export
pf_scatter <- function(data, x, y, category, style, domain, variant = NULL) .pf_layer(data, x, y, category,
    style, domain, variant, "scatter")

#' Named manual native color/fill scales (theme-only, not complete mark treatment)
#' @param style Theme with approved slots.
#' @param domain Explicit unique ordered category IDs.
#' @param variant Selected categorical variant.
#' @return Color and fill scales retaining unused domain identities.
#' @export
pf_scales_manual <- function(style, domain, variant = NULL) {
    .pf_need("ggplot2")
    slots <- pf_categories(style, domain, domain, variant)
    colors <- stats::setNames(slots$color, domain)
    list(ggplot2::scale_colour_manual(values = colors, limits = domain, drop = FALSE, na.translate = FALSE),
        ggplot2::scale_fill_manual(values = colors, limits = domain, drop = FALSE, na.translate = FALSE))
}

.pf_inverse <- function(u, low, high, center = NULL) {
    if (is.null(center))
        return((1 - u) * low + u * high)
    ifelse(u <= 0.5, (1 - 2 * u) * low + 2 * u * center, (2 - 2 * u) * center + (2 * u - 1) * high)
}

#' Exact sampled continuous native ggplot scales
#' @param style Theme and approved LUTs.
#' @param vmin,vmax Explicit finite limits.
#' @param kind Sequential or diverging.
#' @param center Required meaningful center for diverging maps.
#' @param name Approved same-kind map alternative.
#' @param aesthetics Native colour or fill aesthetic.
#' @return A native continuous scale with exact bin palette and explicit limits.
#' @export
pf_scale_continuous <- function(style, vmin, vmax, kind = "sequential", center = NULL, name = NULL, aesthetics = "colour") {
    .pf_need("ggplot2")
    .pf_need("scales")
    .pf_id(kind)
    .pf_id(aesthetics)
    pf_normalize(numeric(), vmin, vmax, center)
    if (!kind %in% c("sequential", "diverging") || xor(kind == "diverging", !is.null(center)))
        stop("Diverging scales require a center; sequential scales do not")
    if (is.null(name))
        name <- style$spec$mapSelection[[kind]]$default
    .pf_id(name)
    map <- style$spec$maps[[name]]
    if (is.null(map) || map$kind != kind)
        stop("Unsupported map/kind")
    if (!aesthetics %in% c("colour", "fill"))
        stop("Choose colour or fill aesthetic")
    transformation <- scales::new_transform(name = "plotfoundry-explicit", transform = function(x) pf_normalize(x,
        vmin, vmax, center), inverse = function(u) .pf_inverse(u, vmin, vmax, center), domain = c(vmin,
        vmax))
    ggplot2::continuous_scale(aesthetics = aesthetics, palette = function(u) .pf_hex(pf_lookup(style,
        u, name), style$case$roles$muted), limits = c(vmin, vmax), transform = transformation, oob = scales::squish,
        na.value = style$case$roles$muted, guide = ggplot2::guide_colourbar(nbin = length(map$samples),
            display = "rectangles"))
}

#' Explicit unit-cell heatmap with opaque missing fill and crossed cue
#' @param values Numeric matrix, with NA/NaN cells preserved.
#' @param style Theme and placement.
#' @param vmin,vmax Explicit finite limits.
#' @param kind Sequential or diverging.
#' @param center Meaningful diverging center.
#' @param name Approved map alternative.
#' @return Tile and missing-cross ggplot layers plus the exact fill scale.
#' @export
pf_heatmap <- function(values, style, vmin, vmax, kind = "sequential", center = NULL, name = NULL) {
    .pf_need("ggplot2")
    if (!is.matrix(values) || !is.numeric(values) || is.complex(values) || !length(values) || any(is.infinite(values)))
        stop("Nonempty numeric matrix with NA/NaN required")
    pf_normalize(as.vector(values), vmin, vmax, center)
    data <- expand.grid(y = seq_len(nrow(values)), x = seq_len(ncol(values)))
    data$value <- as.vector(values)
    missing <- data[is.na(data$value), , drop = FALSE]
    layers <- list(ggplot2::geom_tile(data = data, ggplot2::aes(x = !!as.name("x"), y = !!as.name("y"),
        fill = !!as.name("value")), width = 1, height = 1, inherit.aes = FALSE), pf_scale_continuous(style,
        vmin, vmax, kind, center, name, aesthetics = "fill"), ggplot2::scale_y_reverse())
    if (nrow(missing)) {
        for (direction in c(-1, 1)) {
            cross <- missing
            cross$.pf_y0 <- cross$y - 0.5 * direction
            cross$.pf_y1 <- cross$y + 0.5 * direction
            layers <- c(layers, list(ggplot2::geom_segment(data = cross, mapping = ggplot2::aes(x = !!as.name("x") -
                0.5, xend = !!as.name("x") + 0.5, y = !!as.name(".pf_y0"), yend = !!as.name(".pf_y1")),
                inherit.aes = FALSE, colour = style$case$roles$background, linewidth = pf_points(style,
                  0.5)/72 * 96/ggplot2::.pt)))
        }
    }
    layers
}
