library(plotfoundry)
if (all(vapply(c("ggplot2", "showtext", "sysfonts", "systemfonts", "ragg", "svglite"), requireNamespace,
    logical(1), quietly = TRUE))) {
    library(ggplot2)
    expect_error <- function(code) {
        stopifnot(tryCatch({
            force(code)
            FALSE
        }, error = function(e) TRUE))
    }
    s <- pf_theme("tufte", mode = "dark")
    data <- data.frame(x = c(0, 1, 0, 1), y = c(1, 2, 3, 4), id = factor(c("A", "A", "B", "B"), levels = c("B",
        "A", "C")), cohort = c("one", "one", "two", "two"))
    original <- data
    p <- ggplot() + pf_line(data, "x", "y", "id", s, c("A", "B", "C")) + facet_wrap(~cohort) + pf_theme_gg(s)
    built <- ggplot_build(p)$data[[1]]
    stopifnot(identical(data, original), identical(built$slot[built$PANEL == 1L], 1:2), identical(built$slot[built$PANEL ==
        2L], 3:4))
    scale <- pf_scale_continuous(s, -2, 1, "diverging", 0)
    stopifnot(identical(scale$map(scale$transform(0)), grDevices::rgb(pf_lookup(s, 0.5, "BrBG")[1, 1],
        pf_lookup(s, 0.5, "BrBG")[1, 2], pf_lookup(s, 0.5, "BrBG")[1, 3])))
    tmp <- tempdir()
    caller_path <- file.path(tmp, "caller.pdf")
    grDevices::pdf(caller_path)
    graphics::plot(1)
    caller <- grDevices::dev.cur()
    expect_error(pf_base_lines(c(0, 1), 0.5, c("A", "A"), s, "A"))
    expect_error(pf_base_points(c(0, 1), c(0, 1), "A", s, "A"))
    before <- graphics::par(no.readonly = TRUE)
    opts <- showtext::showtext_opts()
    expect_error(pf_base_context(s, {
        grDevices::pdf(file.path(tmp, "other.pdf"))
        stop("expected")
    }))
    other <- setdiff(grDevices::dev.list(), caller)
    stopifnot(grDevices::dev.cur() == caller, identical(graphics::par(no.readonly = TRUE), before))
    for (device in other) grDevices::dev.off(device)
    expect_error(pf_base_context(s, {
        graphics::par(mfrow = c(2, 2), cex = 0.6, mar = c(1, 2, 3, 4))
        stop("expected layout failure")
    }))
    stopifnot(identical(graphics::par(no.readonly = TRUE), before))
    stem <- file.path(tmp, "pf-errors")
    expect_error(pf_export(s, stem, draw = function(style) stop("expected"), formats = "pdf"))
    stopifnot(grDevices::dev.cur() == caller, identical(graphics::par(no.readonly = TRUE), before), identical(showtext::showtext_opts(),
        opts), !file.exists(paste0(stem, ".report.json")))
    expect_error(pf_export(s, stem, plot = p + coord_polar(), formats = "pdf"))
    stopifnot(grDevices::dev.cur() == caller, !file.exists(paste0(stem, ".report.json")))
    grDevices::dev.off(caller)
    grDevices::pdf(file.path(tmp, "uninitialized.pdf"))
    graphics::par(bg = "gray", cex = 0.8, mar = c(4, 4, 3, 2))
    untouched <- graphics::par(no.readonly = TRUE)
    expect_error(pf_base_context(s, {
        graphics::par(mfrow = c(2, 1), cex = 0.5, mar = c(1, 2, 3, 4))
        stop("layout")
    }))
    stopifnot(identical(graphics::par(no.readonly = TRUE), untouched))
    grDevices::dev.off()
    # Bound font roles and preserve authored native sizes/colors, including guide text.
    pf_fonts(s)
    p <- ggplot() + pf_heatmap(matrix(c(-2, -1, 0, 1, NA, 0.5), 2), s, -2, 1, "diverging", 0) + pf_theme_gg(s) +
        labs(title = "Heading", subtitle = "Subtitle", caption = "Caption", fill = "Intensity") + annotate("text",
        x = 1, y = 1, label = "Body", size = pf_points(s, 20)/ggplot2::.pt)
    cells <- ggplot_build(p)$data
    stopifnot(identical(cells[[2]]$y, cells[[3]]$yend), identical(cells[[2]]$yend, cells[[3]]$y), !identical(cells[[2]]$y,
        cells[[3]]$y))
    # Real role aliases survive a conflicting ordinary family registration.
    other <- pf_theme("zephyr-reading")
    wrong <- other$spec$fonts[[other$case$fonts$ui]]
    sysfonts::font_add("ETBook", regular = system.file("spec/data", wrong$path, package = "plotfoundry"))
    pf_fonts(s)
    grDevices::pdf(file.path(tmp, "font-role-metrics.pdf"))
    grob <- getFromNamespace(".pf_bind_grob", "plotfoundry")(ggplotGrob(p), s)
    texts <- list()
    collect <- function(g) {
        if (inherits(g, "text"))
            texts[[length(texts) + 1L]] <<- g
        for (child in g$grobs) collect(child)
        for (child in g$children) collect(child)
    }
    collect(grob)
    for (label in c("Heading", "Intensity", "Subtitle", "Caption", "Body")) {
        found <- Filter(function(g) is.character(g$label) && length(g$label) == 1L && g$label == label,
            texts)
        stopifnot(length(found) == 1L)
        role <- if (label == "Heading")
            "heading" else "ui"
        stopifnot(identical(found[[1]]$gp$fontfamily, paste0("plotfoundry-", s$case$fonts[[role]])))
    }
    expect_error(pf_export(s, file.path(tmp, "math-rejected"), plot = p + labs(title = expression(alpha)),
        formats = "pdf"))
    expect_error(pf_export(s, file.path(tmp, "glyph-rejected"), plot = p + labs(title = intToUtf8(128640)),
        formats = "pdf"))
    stopifnot(!file.exists(file.path(tmp, "math-rejected.report.json")), !file.exists(file.path(tmp,
        "glyph-rejected.report.json")))
    report <- pf_export(s, file.path(tmp, "font-roles"), plot = p)
    stopifnot(report$devices$ragg == as.character(packageVersion("ragg")), report$devices$svglite ==
        as.character(packageVersion("svglite")), report$devices$ggplot2 == as.character(packageVersion("ggplot2")))
    stopifnot(file.exists(report$files$pdf$path), all(report$files$png$canvasPixels == c(1152, 576)))
    raw <- readBin(report$files$pdf$path, "raw", n = file.info(report$files$pdf$path)$size)
    token <- charToRaw("/Type /Page ")
    count <- sum(vapply(which(raw == token[1]), function(i) i + length(token) - 1L <= length(raw) &&
        identical(raw[i:(i + length(token) - 1L)], token), logical(1)))
    stopifnot(count == 1L)
    base_report <- pf_export(s, file.path(tmp, "single-base-page"), draw = function(style) {
        pf_base_plot(style, c(0, 2), c(0, 2), "X", "Y", "Base")
    }, formats = "pdf", title = "Global title", caption = "Footer")
    raw <- readBin(base_report$files$pdf$path, "raw", n = file.info(base_report$files$pdf$path)$size)
    count <- sum(vapply(which(raw == token[1]), function(i) i + length(token) - 1L <= length(raw) &&
        identical(raw[i:(i + length(token) - 1L)], token), logical(1)))
    stopifnot(count == 1L)
    # Positioned bounds catch a short but deliberately shifted title that a width-only test would
    # accept. This is a report, not a user-CSS override.
    shifted <- ggplot() + geom_point(aes(1, 1)) + pf_theme_gg(s) + labs(title = "Short") + theme(plot.title = element_text(hjust = -5))
    shifted_report <- pf_export(s, file.path(tmp, "shifted-heading"), plot = list(shifted, shifted),
        height_inches = 4, formats = "pdf")
    stopifnot(!shifted_report$geometry$pdf$panelTitlesFit)
    stopifnot(shifted_report$geometry$pdf$panelHeadingBounds[[1]]$boundsInches[1] < 0)
    cat("R ggplot facets/scales, devices/state and one-page exports passed\n")
}
