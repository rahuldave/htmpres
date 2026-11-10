# Run after installing the source archive: Rscript gallery.R OUTPUT [CASE_ID]
library(plotfoundry)
library(ggplot2)
args <- commandArgs(trailingOnly = TRUE)
output <- if (length(args)) args[1] else "plotfoundry-r-gallery"
selected <- if (length(args) > 1) args[2] else NULL
dir.create(output, recursive = TRUE, showWarnings = FALSE)
spec <- pf_spec()
cases <- Filter(function(case) is.null(selected) || identical(case$id, selected), spec$cases)
if (!length(cases)) stop("Unknown case ID")
records <- list()
for (case in cases) {
    parts <- strsplit(case$id, "/", fixed = TRUE)[[1]]
    style <- pf_theme(parts[1], parts[2], parts[3], parts[4])
    # Deliberate empty right gutter for endpoint labels; separated category bands.
    line <- data.frame(x = rep(c(0, 1, 2, 3), 3), y = c(1, 1.4, NA, 1.2, 3, 3.4, 3.2, 3.5, 5, 5.3, 5.1,
        5.4), id = rep(c("A", "B", "C"), each = 4))
    dots <- data.frame(x = rep(c(0, 1, 2), 5), y = rep(seq(1, 9, 2), each = 3) + rep(c(0, 0.2, 0.1),
        5), id = rep(LETTERS[1:5], each = 3))
    sequential <- matrix(c(0, 0.1, 0.3, 0.5, NA, 0.8, 0.9, 1), 2)
    diverging <- matrix(c(-2, -1, 0, 1, NA, -0.2, 0.2, 0.8), 2)
    furniture <- function() pf_theme_gg(style) + theme(plot.title.position = "plot", plot.title = element_text(hjust = 0.5,
        margin = margin(b = 8)))
    p1 <- ggplot() + pf_line(line, "x", "y", "id", style, c("A", "B", "C")) + furniture() + labs(title = "Categories",
        x = "Position", y = "Value") + coord_cartesian(xlim = c(-0.2, 4), ylim = c(0, 6))
    p2 <- ggplot() + pf_scatter(dots, "x", "y", "id", style, LETTERS[1:5], "colorblind-subset-5") + furniture() +
        labs(title = "Five (opt-in)", x = "Position", y = "Value") + coord_cartesian(xlim = c(-0.2, 3),
        ylim = c(0, 10))
    p3 <- ggplot() + pf_heatmap(sequential, style, 0, 1) + furniture() + labs(title = "Sequential", x = "Column",
        y = "Row", fill = "Value")
    p4 <- ggplot() + pf_heatmap(diverging, style, -2, 1, "diverging", 0) + furniture() + labs(title = "Centered",
        x = "Column", y = "Row", fill = "Value")
    family <- gsub("-", " ", parts[1], fixed = TRUE)
    caption <- paste(parts[2], parts[3], parts[4], "| explicit placement; missing crosses")
    id <- paste(parts, collapse = "-")
    gg <- pf_export(style, file.path(output, paste0(id, "-ggplot")), plot = list(p1, p2, p3, p4), height_inches = 9,
        title = family, caption = caption, dpi = style$placed/style$width)
    base_bounds <- list()
    base_heading <- function(title, s) {
        old_family <- graphics::par(family = paste0("plotfoundry-", s$case$fonts$heading))
        on.exit(graphics::par(old_family), add = TRUE)
        cex <- pf_points(s, s$case$typography$heading)/(graphics::par("ps") * graphics::par("cex"))
        width <- graphics::strwidth(title, units = "inches", cex = cex, font = 1)
        height <- graphics::strheight(title, units = "inches", cex = cex, font = 1)
        center <- c(graphics::grconvertX(0.5, "npc", "inches"), graphics::grconvertY(1, "npc", "inches") +
            0.3)
        bounds <- c(center[1] - width/2, center[2] - height/2, center[1] + width/2, center[2] + height/2)
        cell <- c(graphics::grconvertX(0, "nfc", "inches"), graphics::grconvertY(0, "nfc", "inches"),
            graphics::grconvertX(1, "nfc", "inches"), graphics::grconvertY(1, "nfc", "inches"))
        graphics::text(graphics::grconvertX(center[1], "inches", "user"), graphics::grconvertY(center[2],
            "inches", "user"), title, adj = c(0.5, 0.5), cex = cex, font = 1, xpd = NA, col = s$case$roles$ink)
        base_bounds[[length(base_bounds) + 1L]] <<- list(label = title, boundsInches = unname(bounds),
            cellInches = unname(cell), fits = isTRUE(all(bounds[1:2] >= cell[1:2]) && all(bounds[3:4] <=
                cell[3:4])))
    }
    base <- pf_export(style, file.path(output, paste0(id, "-base")), height_inches = 9, title = family,
        caption = caption, dpi = style$placed/style$width, draw = function(s) {
            graphics::par(mfrow = c(2, 2), oma = c(3, 0, 3, 0), mar = c(4, 4, 3, 1))
            pf_base_context(s, {
                pf_base_plot(s, c(-0.2, 4), c(0, 6), "Position", "Value", "")
                base_heading("Categories", s)
                pf_base_lines(line$x, line$y, line$id, s, c("A", "B", "C"))
                pf_base_plot(s, c(-0.2, 3), c(0, 10), "Position", "Value", "")
                base_heading("Five (opt-in)", s)
                pf_base_points(dots$x, dots$y, dots$id, s, LETTERS[1:5], "colorblind-subset-5")
                pf_base_heatmap(sequential, s, 0, 1, title = "")
                base_heading("Sequential", s)
                pf_base_heatmap(diverging, s, -2, 1, "diverging", 0, title = "")
                base_heading("Centered", s)
            })
        })
    # The base callback owns its headings, so attach its measured per-device positions explicitly
    # instead of treating a generic callback as inspected.
    for (j in seq_along(base$files)) {
        format <- names(base$files)[j]
        positioned <- base_bounds[((j - 1L) * 4L + 1L):(j * 4L)]
        base$geometry[[format]]$panelHeadingBounds <- positioned
        base$geometry[[format]]$panelTitlesFit <- all(vapply(positioned, function(g) g$fits, logical(1)))
    }
    jsonlite::write_json(base, sub("[.]png$", ".report.json", base$files$png$path), auto_unbox = TRUE,
        pretty = TRUE, digits = NA, null = "null")
    guards <- c(titleLane = all(vapply(c(gg$geometry, base$geometry), function(g) g$titleLaneClear, logical(1))),
        footerLane = all(vapply(c(gg$geometry, base$geometry), function(g) g$footerLaneClear, logical(1))),
        panelHeadings = all(vapply(gg$geometry, function(g) g$panelTitlesFit, logical(1))) && all(vapply(base_bounds,
            function(g) g$fits, logical(1))), labelDataSeparation = all(diff(sort(unique(dots$y[dots$x ==
            2]))) > 1) && max(line$x, na.rm = TRUE) < 4 && max(dots$x) < 3)
    if (!all(guards))
        stop("Fixture geometry failed: ", case$id, " ", paste(names(guards)[!guards], collapse = ", "))
    records[[length(records) + 1L]] <- list(case = case$id, guards = as.list(guards), ggplot = gg, base = base,
        baseHeadingBounds = base_bounds)
    cat(case$id, "\n")
}
reports <- list()
for (record in records) for (route in c("ggplot", "base")) {
    path <- sub("[.]png$", ".report.json", record[[route]]$files$png$path)
    reports[[basename(path)]] <- digest::digest(file = path, algo = "sha256", serialize = FALSE)
}
code_file <- system.file("R", "plotfoundry.rdb", package = "plotfoundry", mustWork = TRUE)
jsonlite::write_json(list(count = length(records), cases = records, reportHashes = reports, rendererCode = list(packageVersion = as.character(getNamespaceVersion("plotfoundry")),
    lazyDatabaseSHA256 = digest::digest(file = code_file, algo = "sha256", serialize = FALSE))), file.path(output,
    "gallery.json"), auto_unbox = TRUE, pretty = TRUE, digits = NA)
