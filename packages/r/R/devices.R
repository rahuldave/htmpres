.pf_bind_grob <- function(grob, style, heading = FALSE, root = TRUE) {
    if (inherits(grob, "text")) {
        role <- if (heading || identical(grob$gp$fontfamily, .pf_font_names(style)[["heading"]]))
            "heading" else "ui"
        .pf_glyphs(grob$label, style, role)
        grob$gp$fontfamily <- .pf_font_names(style)[[role]]
        grob$gp$font <- 1L
    }
    if (!is.null(grob$grobs))
        for (i in seq_along(grob$grobs)) grob$grobs[[i]] <- .pf_bind_grob(grob$grobs[[i]], style, root &&
            !is.null(grob$layout) && grob$layout$name[i] == "title", FALSE)
    if (!is.null(grob$children))
        for (i in seq_along(grob$children)) grob$children[[i]] <- .pf_bind_grob(grob$children[[i]], style,
            heading, FALSE)
    grob
}

.pf_heading_bounds <- function(grob) {
    index <- which(grob$layout$name == "title")
    if (!length(index))
        return(NULL)
    heading <- grob$grobs[[index]]
    if (!length(heading$children))
        return(NULL)
    text <- heading$children[[1]]
    if (!inherits(text, "text") || !length(text$label))
        return(NULL)
    origin <- grid::deviceLoc(grid::unit(0, "npc"), grid::unit(0, "npc"), valueOnly = TRUE)
    corner <- grid::deviceLoc(grid::unit(1, "npc"), grid::unit(1, "npc"), valueOnly = TRUE)
    cell <- c(origin$x, origin$y, corner$x, corner$y)
    layout <- grob$layout[index, ]
    grid::pushViewport(grid::viewport(layout = grid::grid.layout(length(grob$heights), length(grob$widths),
        widths = grob$widths, heights = grob$heights, respect = grob$respect)))
    grid::pushViewport(grid::viewport(layout.pos.row = layout$t:layout$b, layout.pos.col = layout$l:layout$r))
    on.exit(grid::popViewport(2), add = TRUE)
    anchor <- grid::deviceLoc(text$x, text$y, valueOnly = TRUE)
    width <- grid::convertWidth(grid::grobWidth(text), "inches", valueOnly = TRUE)
    height <- grid::convertHeight(grid::grobHeight(text), "inches", valueOnly = TRUE)
    bounds <- c(anchor$x - text$hjust * width, anchor$y - text$vjust * height, anchor$x + (1 - text$hjust) *
        width, anchor$y + (1 - text$vjust) * height)
    list(label = as.character(text$label), boundsInches = unname(bounds), cellInches = unname(cell),
        fits = isTRUE(all(bounds[1:2] >= cell[1:2] - 1e-08) && all(bounds[3:4] <= cell[3:4] + 1e-08)))
}

#' Export an explicit canvas with exact-file outlined text
#' @param style Theme and actual placement.
#' @param stem Output filename prefix.
#' @param plot Native ggplot object, or NULL for base drawing.
#' @param draw Function(style) using supported base helpers; mutually exclusive with plot.
#' @param height_inches Explicit native canvas height.
#' @param formats Unique png, svg or pdf formats.
#' @param dpi Raster resolution, independent of placed type.
#' @return File/hash/font/device report; vectors contain outlines, not embedded fonts.
#' @export
pf_export <- function(style, stem, plot = NULL, draw = NULL, height_inches = 4, formats = c("png", "svg",
    "pdf"), dpi = 144, columns = 2, title = "", caption = "") {
    .pf_id(stem)
    for (text in list(title, caption)) if (!is.character(text) || length(text) != 1L || is.na(text))
        stop("title/caption must be scalar plain text")
    if (xor(is.null(plot), is.null(draw)) == FALSE)
        stop("Supply exactly one ggplot or base draw callback")
    if (!is.null(draw) && !is.function(draw))
        stop("draw must be a function")
    if (!is.character(formats) || !length(formats) || anyNA(formats) || anyDuplicated(formats) || any(!formats %in%
        c("png", "svg", "pdf")))
        stop("Unique png/svg/pdf formats required")
    .pf_scalar(height_inches, "height")
    .pf_scalar(dpi, "dpi")
    if (height_inches <= 0 || dpi <= 0)
        stop("Positive dimensions/resolution required")
    if ("png" %in% formats)
        .pf_need("ragg")
    if ("svg" %in% formats)
        .pf_need("svglite")
    .pf_need("showtext")
    .pf_need("sysfonts")
    .pf_need("systemfonts")
    if (!is.null(plot)) {
        .pf_need("ggplot2")
        plots <- if (inherits(plot, "ggplot"))
            list(plot) else plot
        if (!is.list(plots) || !length(plots) || !all(vapply(plots, function(p) inherits(p, "ggplot"),
            logical(1))))
            stop("plot must be a ggplot or nonempty list of ggplots")
    }
    if (!is.null(plot) && length(plots) > 1L && height_inches <= 1.4)
        stop("Composite canvas needs reserved title/footer lanes")
    .pf_scalar(columns, "columns")
    if (columns < 1 || columns != floor(columns))
        stop("columns must be a positive integer")
    .pf_glyphs(title, style, "heading")
    .pf_glyphs(caption, style)

    fonts <- pf_fonts(style)
    old_options <- showtext::showtext_opts()
    on.exit(do.call(showtext::showtext_opts, old_options), add = TRUE)
    dir.create(dirname(stem), recursive = TRUE, showWarnings = FALSE)
    report <- list(case = style$case$id, specVersion = style$spec$specVersion, canvasInches = c(style$width,
        height_inches), placedWidthCssPx = style$placed, tightCrop = FALSE, fonts = fonts, files = list(),
        devices = list(R = as.character(getRversion()), showtext = as.character(utils::packageVersion("showtext"))),
        limitations = c("Strict plain text; no plotmath or missing-glyph fallback guarantee", "Native callbacks outside supported helpers are not independently certified",
            "Vector text is outlined, not editable or embedded font text", "Reserved plotfoundry-<hash> aliases persist and are rebound; other family names untouched",
            "No dense-label collision resolution"))
    if ("png" %in% formats)
        report$devices$ragg <- as.character(utils::packageVersion("ragg"))
    if ("svg" %in% formats)
        report$devices$svglite <- as.character(utils::packageVersion("svglite"))
    if ("pdf" %in% formats)
        report$devices$pdf <- paste("grDevices::pdf", getRversion())
    if (!is.null(plot))
        report$devices$ggplot2 <- as.character(utils::packageVersion("ggplot2"))
    caller <- grDevices::dev.cur()
    for (format in formats) {
        path <- paste0(stem, ".", format)
        if (format == "png")
            ragg::agg_png(path, width = style$width, height = height_inches, units = "in", res = dpi,
                background = style$case$roles$background) else if (format == "svg")
            svglite::svglite(path, width = style$width, height = height_inches, bg = style$case$roles$background) else grDevices::pdf(path, width = style$width, height = height_inches, bg = style$case$roles$background,
            useDingbats = FALSE)
        device <- grDevices::dev.cur()
        if (device == caller)
            stop("Graphics device failed to open")
        showtext::showtext_opts(dpi = if (format == "png")
            dpi else 72)
        expected_devices <- grDevices::dev.list()
        active <- FALSE
        tryCatch({
            showtext::showtext_begin()
            active <- TRUE
            if (!is.null(plot))
                grid::grid.newpage()
            measure <- function(text, role) {
                font <- grid::gpar(fontfamily = .pf_font_names(style)[[if (role == "heading")
                  "heading" else "ui"]], fontsize = pf_points(style, style$case$typography[[role]]), fontface = "plain")
                text_grob <- grid::textGrob(text, gp = font)
                c(width = grid::convertWidth(grid::grobWidth(text_grob), "inches", valueOnly = TRUE),
                  height = grid::convertHeight(grid::grobHeight(text_grob), "inches", valueOnly = TRUE))
            }
            panel_titles_fit <- TRUE
            panel_heading_bounds <- list()
            if (!is.null(plot)) {
                if (length(plots) == 1L) {
                  grob <- .pf_bind_grob(ggplot2::ggplotGrob(plots[[1]]), style)
                  positioned <- .pf_heading_bounds(grob)
                  if (length(positioned)) {
                    panel_heading_bounds[[1]] <- positioned
                    panel_titles_fit <- positioned$fits
                  }
                  grid::grid.draw(grob)
                } else {
                  cols <- min(columns, length(plots))
                  rows <- ceiling(length(plots)/cols)
                  grid::pushViewport(grid::viewport(y = 0.5, height = grid::unit(height_inches - 1.4,
                    "inches"), layout = grid::grid.layout(rows, cols)))
                  for (i in seq_along(plots)) {
                    grid::pushViewport(grid::viewport(layout.pos.row = ceiling(i/cols), layout.pos.col = (i -
                      1)%%cols + 1L))
                    grob <- .pf_bind_grob(ggplot2::ggplotGrob(plots[[i]]), style)
                    positioned <- .pf_heading_bounds(grob)
                    if (length(positioned)) {
                      panel_heading_bounds[[length(panel_heading_bounds) + 1L]] <- positioned
                      panel_titles_fit <- panel_titles_fit && positioned$fits
                    }
                    grid::grid.draw(grob)
                    grid::popViewport()
                  }
                  grid::popViewport()
                }
            } else pf_base_context(style, {
                draw(style)
                # Base and grid have separate viewport state. Overlay furniture through base's
                # explicit full-canvas frame instead of mixing those systems.
                if (nzchar(title) || nzchar(caption)) {
                  graphics::par(fig = c(0, 1, 0, 1), mar = rep(0, 4), oma = rep(0, 4), new = TRUE, xpd = NA)
                  graphics::plot.new()
                  graphics::plot.window(c(0, 1), c(0, 1), xaxs = "i", yaxs = "i")
                  if (nzchar(title))
                    graphics::text(0.5, 1 - 0.12/height_inches, title, adj = c(0.5, 1), family = .pf_font_names(style)[["heading"]],
                      cex = pf_points(style, style$case$typography$heading)/(graphics::par("ps") * graphics::par("cex")))
                  if (nzchar(caption))
                    graphics::text(0.5, 0.12/height_inches, caption, adj = c(0.5, 0), family = .pf_font_names(style)[["ui"]],
                      cex = pf_points(style, style$case$typography$metadata)/(graphics::par("ps") * graphics::par("cex")))
                }
            })
            if (!is.null(plot) && nzchar(title))
                grid::grid.text(title, y = grid::unit(height_inches - 0.12, "inches"), just = "top",
                  gp = grid::gpar(col = style$case$roles$ink, fontfamily = .pf_font_names(style)[["heading"]],
                    fontface = "plain", fontsize = pf_points(style, style$case$typography$heading)))
            if (!is.null(plot) && nzchar(caption))
                grid::grid.text(caption, y = grid::unit(0.12, "inches"), just = "bottom", gp = grid::gpar(col = style$case$roles$ink,
                  fontfamily = .pf_font_names(style)[["ui"]], fontface = "plain", fontsize = pf_points(style,
                    style$case$typography$metadata)))
            title_size <- measure(title, "heading")
            caption_size <- measure(caption, "metadata")
            bounds <- list(title = unname(c((style$width - title_size[1])/2, height_inches - 0.12 - title_size[2],
                (style$width + title_size[1])/2, height_inches - 0.12)), caption = unname(c((style$width -
                caption_size[1])/2, 0.12, (style$width + caption_size[1])/2, 0.12 + caption_size[2])))
            report$geometry[[format]] <- list(boundsInches = bounds, titleLaneClear = isTRUE(title_size[1] <
                style$width - 0.2 && title_size[2] < 0.58), footerLaneClear = isTRUE(caption_size[1] <
                style$width - 0.2 && caption_size[2] < 0.58), panelTitlesFit = panel_titles_fit, panelHeadingBounds = panel_heading_bounds)
            if (!identical(grDevices::dev.list(), expected_devices))
                stop("Drawing callback changed the device set")
            if (grDevices::dev.cur() != device)
                stop("Drawing callback changed graphics device")
        }, finally = {
            if (device %in% grDevices::dev.list()) {
                grDevices::dev.set(device)
                if (active)
                  showtext::showtext_end()
                grDevices::dev.off(device)
            }
            if (caller %in% grDevices::dev.list())
                grDevices::dev.set(caller)
        })
        payload <- readBin(path, "raw", n = file.info(path)$size)
        pixels <- NULL
        if (format == "png") {
            bytes <- as.integer(payload[17:24])
            pixels <- c(sum(bytes[1:4] * 256^(3:0)), sum(bytes[5:8] * 256^(3:0)))
        }
        if (format == "svg" && grepl("<text", paste(readLines(path, warn = FALSE), collapse = ""), fixed = TRUE))
            stop("Unexpected editable SVG text")
        report$files[[format]] <- list(path = path, sha256 = digest::digest(payload, algo = "sha256",
            serialize = FALSE), canvasPixels = pixels, fontPolicy = if (format == "png") "showtext rasterized glyphs" else "showtext glyph outlines; no font embedding claim")
    }
    jsonlite::write_json(report, paste0(stem, ".report.json"), auto_unbox = TRUE, pretty = TRUE, null = "null",
        digits = NA)
    invisible(report)
}
