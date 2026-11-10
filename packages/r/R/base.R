#' Scope base graphics furniture and restore caller state on errors/nesting
#' @param style Explicit style and placement.
#' @param code Expression evaluated on the already-open caller device.
#' @return The expression's value; no caller device is closed.
#' @export
pf_base_context <- function(style, code) {
    if (grDevices::dev.cur() == 1L)
        stop("Open a graphics device explicitly first")
    original_device <- grDevices::dev.cur()
    old <- graphics::par(no.readonly = TRUE)
    old_options <- options()
    old_palette <- grDevices::palette()
    on.exit({
        if (original_device %in% grDevices::dev.list()) {
            grDevices::dev.set(original_device)
            current <- graphics::par(no.readonly = TRUE)
            if (!identical(current$mfrow, old$mfrow)) {
                graphics::par(mfrow = old$mfrow)
                current <- graphics::par(no.readonly = TRUE)
            }
            changed <- names(old)[!vapply(names(old), function(n) identical(old[[n]], current[[n]]),
                logical(1))]
            # Layout changes reset cex and margin geometry as a side effect. Restore those
            # dependent values after the complete parameter snapshot.
            if (length(changed)) {
                graphics::par(old[changed])
                graphics::par(cex = old$cex, mex = old$mex, mai = old$mai)
            }
            if (!identical(graphics::par("new"), old$new)) graphics::par(new = old$new)
        } else warning("Caller device was closed; its graphics state cannot be restored")
        extra <- setdiff(names(options()), names(old_options))
        if (length(extra)) options(stats::setNames(rep(list(NULL), length(extra)), extra))
        options(old_options)
        grDevices::palette(old_palette)
    }, add = TRUE)
    roles <- style$case$roles
    label <- pf_points(style, style$case$typography$label)
    graphics::par(bg = roles$background, fg = roles$ink, col = roles$ink, col.axis = roles$ink, col.lab = roles$ink,
        col.main = roles$ink, family = .pf_font_names(style)[["ui"]], font = 1, font.axis = 1, font.lab = 1,
        font.main = 1, ps = 12, cex = label/12, cex.axis = 1, cex.lab = 1, cex.main = pf_points(style,
            style$case$typography$heading)/label, xpd = FALSE)
    force(code)
}

#' Explicit base plotting frame with plain-text ticks and bound font roles
#' @param style Theme and placement; use inside pf_base_context after layout setup.
#' @param xlim,ylim Finite ordered data limits.
#' @param xlab,ylab,title Plain text furniture.
#' @param log Empty, x, y or xy log axes; limits must be positive.
#' @return Invisibly NULL, after initializing caller's current plot region.
#' @export
pf_base_plot <- function(style, xlim, ylim, xlab = "", ylab = "", title = "", log = "") {
    for (limits in list(xlim, ylim)) if (!is.numeric(limits) || length(limits) != 2L || any(!is.finite(limits)) ||
        limits[1] >= limits[2])
        stop("Explicit finite ordered axis limits required")
    if (!is.character(log) || length(log) != 1L || !log %in% c("", "x", "y", "xy"))
        stop("Unsupported log axes")
    if ((grepl("x", log) && any(xlim <= 0)) || (grepl("y", log) && any(ylim <= 0)))
        stop("Log limits must be positive")
    .pf_glyphs(c(xlab, ylab), style)
    .pf_glyphs(title, style, "heading")
    graphics::plot.new()
    graphics::plot.window(xlim = xlim, ylim = ylim, log = log)
    for (side in 1:2) {
        at <- graphics::axTicks(side)
        labels <- format(at, trim = TRUE, scientific = FALSE)
        .pf_glyphs(labels, style)
        graphics::axis(side, at = at, labels = labels, col = style$case$roles[["control-boundary"]],
            col.axis = style$case$roles$ink)
    }
    graphics::box(col = style$case$roles[["control-boundary"]])
    graphics::title(xlab = xlab, ylab = ylab)
    graphics::title(main = title, family = .pf_font_names(style)[["heading"]], font.main = 1)
    invisible(NULL)
}

#' Physically layered base categorical lines or points
#' @param x,y Numeric observations, with NA gaps.
#' @param category Explicit category IDs, one per observation.
#' @param style Theme and placement.
#' @param domain Ordered complete category domain.
#' @param variant Default three or conditional five variant.
#' @return Segment geometry evidence, invisibly. Points use explicit physical polygons.
#' @export
pf_base_lines <- function(x, y, category, style, domain, variant = NULL) .pf_base_marks(x, y, category,
    style, domain, variant, "line")

#' @rdname pf_base_lines
#' @export
pf_base_points <- function(x, y, category, style, domain, variant = NULL) .pf_base_marks(x, y, category,
    style, domain, variant, "scatter")

.pf_base_marks <- function(x, y, category, style, domain, variant, type) {
    if (length(x) != length(y) || length(x) != length(category))
        stop("x/y/category need equal lengths; no recycling")
    prepared <- .pf_data(data.frame(x = x, y = y, category = category), "x", "y", "category", style,
        domain, variant)
    if (grDevices::dev.cur() == 1L)
        stop("Open a device/frame first")
    treatment <- style$spec$categories$treatment
    ink <- style$case$roles$ink
    inch <- function(css) pf_points(style, css)/72
    xs <- graphics::grconvertX(prepared$x, "user", "inches")
    ys <- graphics::grconvertY(prepared$y, "user", "inches")
    evidence <- list()
    for (id in unique(prepared$slots$id)) {
        rows <- which(prepared$slots$id == id)
        slot <- prepared$slots[rows[1], , drop = FALSE]
        px <- xs[rows]
        py <- ys[rows]
        valid <- is.finite(px) & is.finite(py)
        seg <- pf_dash_segments(px, py, unlist(slot$dash[[1]]) * inch(treatment$foreground_css_px))
        evidence[[id]] <- seg
        if (type == "line" && nrow(seg)) {
            for (layer in list(list(color = ink, width = treatment$understroke_css_px), list(color = slot$color,
                width = treatment$foreground_css_px))) graphics::segments(graphics::grconvertX(seg[,
                1], "inches", "user"), graphics::grconvertY(seg[, 2], "inches", "user"), graphics::grconvertX(seg[,
                3], "inches", "user"), graphics::grconvertY(seg[, 4], "inches", "user"), col = layer$color,
                lwd = inch(layer$width) * 96, lty = 1, lend = if (length(unlist(slot$dash[[1]])))
                  "butt" else "square")
        }
        shape <- .pf_shape(slot$shape)
        for (i in which(valid)) graphics::polygon(graphics::grconvertX(px[i] + shape[, 1] * inch(treatment$marker_css_px),
            "inches", "user"), graphics::grconvertY(py[i] + shape[, 2] * inch(treatment$marker_css_px),
            "inches", "user"), col = slot$color, border = ink, lwd = inch(treatment$marker_edge_css_px) *
            96, lty = 1, ljoin = "mitre")
        if (any(valid)) {
            last <- utils::tail(which(valid), 1)
            graphics::text(graphics::grconvertX(px[last] + inch(6), "inches", "user"), graphics::grconvertY(py[last],
                "inches", "user"), labels = id, adj = c(0, 0.5), col = ink, family = .pf_font_names(style)[["ui"]],
                font = 1, cex = pf_points(style, style$case$typography$label)/(graphics::par("ps") *
                  graphics::par("cex")))
        }
    }
    invisible(evidence)
}

#' Base heatmap with exact bins, row-one-at-top and explicit missing crosses
#' @param values Numeric matrix; NA/NaN cells stay missing.
#' @param style Theme and placement.
#' @param vmin,vmax Explicit finite endpoints.
#' @param kind Sequential or diverging.
#' @param center Meaningful diverging center.
#' @param name Approved same-kind map alternative.
#' @param title Plain heading.
#' @return Invisibly the exact pre-quantization RGB matrix.
#' @export
pf_base_heatmap <- function(values, style, vmin, vmax, kind = "sequential", center = NULL, name = NULL,
    title = "") {
    if (!is.matrix(values) || !is.numeric(values) || is.complex(values) || !length(values))
        stop("Nonempty numeric matrix required")
    .pf_id(kind)
    if (!kind %in% c("sequential", "diverging") || xor(kind == "diverging", !is.null(center)))
        stop("Map kind/center mismatch")
    if (is.null(name))
        name <- style$spec$mapSelection[[kind]]$default
    .pf_id(name)
    if (is.null(style$spec$maps[[name]]) || style$spec$maps[[name]]$kind != kind)
        stop("Unsupported map/kind")
    u <- pf_normalize(as.vector(values), vmin, vmax, center)
    rgb <- pf_lookup(style, u, name)
    colors <- .pf_hex(rgb, style$case$roles$muted)
    .pf_glyphs(title, style, "heading")
    graphics::plot.new()
    graphics::plot.window(c(0.5, ncol(values) + 0.5), c(0.5, nrow(values) + 0.5), xaxs = "i", yaxs = "i")
    cells <- expand.grid(row = seq_len(nrow(values)), column = seq_len(ncol(values)))
    for (i in seq_len(nrow(cells))) {
        x <- cells$column[i]
        y <- nrow(values) + 1 - cells$row[i]
        graphics::rect(x - 0.5, y - 0.5, x + 0.5, y + 0.5, col = colors[i], border = NA)
        if (is.na(u[i])) {
            graphics::segments(c(x - 0.5, x - 0.5), c(y - 0.5, y + 0.5), c(x + 0.5, x + 0.5), c(y + 0.5,
                y - 0.5), col = style$case$roles$background, lwd = pf_points(style, 0.5)/72 * 96)
        }
    }
    graphics::axis(1, at = seq_len(ncol(values)), labels = seq_len(ncol(values)))
    graphics::axis(2, at = seq_len(nrow(values)), labels = rev(seq_len(nrow(values))))
    graphics::title(main = title, family = .pf_font_names(style)[["heading"]], font.main = 1)
    invisible(rgb)
}
