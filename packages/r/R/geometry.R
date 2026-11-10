.pf_need <- function(package) {
    if (!requireNamespace(package, quietly = TRUE))
        stop("Install optional R package '", package, "' for this operation")
}

.pf_font_names <- function(style) {
    stats::setNames(vapply(c("ui", "heading"), function(role) paste0("plotfoundry-", style$case$fonts[[role]]),
        ""), c("ui", "heading"))
}

#' Explicitly register exact file-bound unique font aliases
#' @param style Theme and exact resolved font files.
#' @return Alias/file/hash evidence. Registration is explicit, not a load hook.
#' @export
pf_fonts <- function(style) {
    .pf_need("sysfonts")
    .pf_need("systemfonts")
    aliases <- .pf_font_names(style)
    lapply(c("ui", "heading"), function(role) {
        key <- style$case$fonts[[role]]
        record <- style$spec$fonts[[key]]
        path <- system.file("spec/data", record$path, package = "plotfoundry", mustWork = TRUE)
        if (digest::digest(file = path, algo = "sha256", serialize = FALSE) != key)
            stop("Resolved font bytes changed")
        sysfonts::font_add(aliases[[role]], regular = path, bold = path, italic = path, bolditalic = path)
        list(role = role, alias = aliases[[role]], file = record$path, sha256 = key, weight = record$weight)
    })
}

.pf_glyphs <- function(labels, style, role = "ui") {
    .pf_need("systemfonts")
    if (is.expression(labels) || any(vapply(as.list(labels), is.language, logical(1))))
        stop("Strict plain text only; plotmath/expressions unsupported")
    if (!is.character(labels))
        labels <- as.character(labels)
    chars <- unique(unlist(strsplit(enc2utf8(labels), "", fixed = TRUE)))
    chars <- chars[!grepl("^[[:space:]]$", chars)]
    if (!length(chars))
        return(invisible(TRUE))
    record <- style$spec$fonts[[style$case$fonts[[role]]]]
    path <- system.file("spec/data", record$path, package = "plotfoundry", mustWork = TRUE)
    info <- systemfonts::glyph_info(chars, path = path)
    if (any(info$index == 0))
        stop("Bundled font lacks glyphs: ", paste(chars[info$index == 0], collapse = " "))
    invisible(TRUE)
}

.pf_shape <- function(shape) {
    switch(shape, circle = cbind(cos(seq(0, 2 * pi, length.out = 65)), sin(seq(0, 2 * pi, length.out = 65)))/2,
        square = rbind(c(-0.5, -0.5), c(0.5, -0.5), c(0.5, 0.5), c(-0.5, 0.5)), `triangle-up` = rbind(c(0,
            0.5), c(-0.5, -0.5), c(0.5, -0.5)), diamond = rbind(c(0, 0.5), c(-0.5, 0), c(0, -0.5), c(0.5,
            0)), `triangle-down` = rbind(c(0, -0.5), c(-0.5, 0.5), c(0.5, 0.5)), stop("Unknown shape"))
}

.pf_marks_grob <- function(x, y, slots, style, type = "line", labels = TRUE) {
    grid::gTree(x = x, y = y, slots = slots, style = style, type = type, labels = labels, cl = "pf_marks")
}

# Physical geometry is resolved inside the final panel viewport, after scales.
makeContent.pf_marks <- function(x) {
    width <- grid::convertWidth(grid::unit(1, "npc"), "inches", valueOnly = TRUE)
    height <- grid::convertHeight(grid::unit(1, "npc"), "inches", valueOnly = TRUE)
    style <- x$style
    roles <- style$case$roles
    treatment <- style$spec$categories$treatment
    p <- function(css) pf_points(style, css)/72
    gp <- function(color, lwd, cap) grid::gpar(col = color, lwd = lwd * 96, lineend = cap, linejoin = "mitre")
    children <- list()
    add <- function(g) {
        children[[length(children) + 1L]] <<- g
    }
    for (id in unique(x$slots$id)) {
        rows <- which(x$slots$id == id)
        slot <- x$slots[rows[1], , drop = FALSE]
        xs <- x$x[rows] * width
        ys <- x$y[rows] * height
        valid <- is.finite(xs) & is.finite(ys)
        if (x$type == "line") {
            seg <- pf_dash_segments(xs, ys, unlist(slot$dash[[1]]) * p(treatment$foreground_css_px))
            if (nrow(seg)) {
                for (layer in list(list(color = roles$ink, width = treatment$understroke_css_px), list(color = slot$color,
                  width = treatment$foreground_css_px))) {
                  add(grid::segmentsGrob(grid::unit(seg[, 1], "inches"), grid::unit(seg[, 2], "inches"),
                    grid::unit(seg[, 3], "inches"), grid::unit(seg[, 4], "inches"), gp = gp(layer$color,
                      p(layer$width), if (length(unlist(slot$dash[[1]])))
                        "butt" else "square")))
                }
            }
        }
        shape <- .pf_shape(slot$shape)
        for (i in which(valid)) {
            add(grid::polygonGrob(grid::unit(xs[i] + shape[, 1] * p(treatment$marker_css_px), "inches"),
                grid::unit(ys[i] + shape[, 2] * p(treatment$marker_css_px), "inches"), gp = grid::gpar(fill = slot$color,
                  col = roles$ink, lwd = p(treatment$marker_edge_css_px) * 96, linejoin = "mitre")))
        }
        if (x$labels && any(valid)) {
            last <- utils::tail(which(valid), 1)
            add(grid::textGrob(id, x = grid::unit(xs[last] + p(6), "inches"), y = grid::unit(ys[last],
                "inches"), just = "left", gp = grid::gpar(col = roles$ink, fontfamily = .pf_font_names(style)[["ui"]],
                fontface = "plain", fontsize = pf_points(style, style$case$typography$label))))
        }
    }
    grid::setChildren(x, do.call(grid::gList, children))
}

.pf_data <- function(data, x, y, category, style, domain, variant) {
    for (value in list(x, y, category)) .pf_id(value)
    if (!is.data.frame(data) || !all(c(x, y, category) %in% names(data)))
        stop("Data frame and explicit column names required")
    xs <- data[[x]]
    ys <- data[[y]]
    if (!is.numeric(xs) || !is.numeric(ys) || is.complex(xs) || is.complex(ys) || any(is.infinite(c(xs,
        ys))))
        stop("Coordinates must be numeric/NA; no infinities")
    slots <- pf_categories(style, domain, data[[category]], variant)
    for (id in unique(slots$id)) {
        rows <- slots$id == id
        if (!any(is.finite(xs[rows]) & is.finite(ys[rows])))
            stop("Each observed category requires a finite endpoint for direct labels")
    }
    .pf_glyphs(slots$id, style)
    list(x = xs, y = ys, slots = slots)
}
