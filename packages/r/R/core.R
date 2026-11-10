#' Load the immutable, independently bundled scientific specification
#' @return A fresh list of the approved specification, with exact pins checked.
#' @export
pf_spec <- function() {
    root <- system.file("spec", package = "plotfoundry", mustWork = TRUE)
    actual <- .pf_files(root)
    if (!identical(sort(actual), sort(names(.pf_pins))))
        stop("Approved resource closure mismatch")
    for (relative in names(.pf_pins)) {
        actual_hash <- digest::digest(file = file.path(root, relative), algo = "sha256", serialize = FALSE)
        if (!identical(actual_hash, unname(.pf_pins[[relative]])))
            stop("Approved resource drift: ", relative)
    }
    jsonlite::fromJSON(file.path(root, "data/spec.json"), simplifyVector = FALSE)
}

.pf_files <- function(root, prefix = "") {
    if (nzchar(Sys.readlink(root)))
        stop("Symlink resource directory")
    paths <- list.files(root, all.files = TRUE, no.. = TRUE, full.names = TRUE)
    result <- character()
    for (path in paths) {
        if (nzchar(Sys.readlink(path)))
            stop("Symlink resource")
        relative <- paste0(prefix, basename(path))
        if (isTRUE(file.info(path)$isdir))
            result <- c(result, .pf_files(path, paste0(relative, "/"))) else result <- c(result, relative)
    }
    result
}

#' Select one of the 72 explicit scientific cases
#' @param name Approved family identifier.
#' @param mode Explicit light or dark mode.
#' @param profile Reading or presentation profile.
#' @param surface Paper or panel surface.
#' @param figure_width_inches Actual native figure width.
#' @param placed_width_css_px Intended placed width, or profile default.
#' @return A native configuration list, without global changes.
#' @export
pf_theme <- function(name, mode = "light", profile = "reading", surface = "paper", figure_width_inches = 8,
    placed_width_css_px = NULL) {
    for (value in list(name, mode, profile, surface)) .pf_id(value)
    spec <- pf_spec()
    id <- paste(name, mode, profile, surface, sep = "/")
    matches <- Filter(function(x) identical(x$id, id), spec$cases)
    if (length(matches) != 1L)
        stop("Unknown theme/mode/profile/surface")
    case <- matches[[1]]
    if (is.null(placed_width_css_px))
        placed_width_css_px <- case$placement$placedWidthCssPx
    .pf_scalar(figure_width_inches, "figure width")
    .pf_scalar(placed_width_css_px, "placed width")
    if (figure_width_inches <= 0 || placed_width_css_px <= 0)
        stop("Placement dimensions must be positive")
    structure(list(case = case, spec = spec, width = figure_width_inches, placed = placed_width_css_px),
        class = "pf_theme")
}

.pf_scalar <- function(value, name) {
    if (!is.numeric(value) || is.complex(value) || length(value) != 1L || !is.finite(value))
        stop(name, " must be a finite real scalar")
    invisible(value)
}

#' Convert placed CSS lengths to native 72/inch points or millimeters
#' @param style Explicit theme and placement.
#' @param css_px Positive CSS length.
#' @return Physical point or millimeter value.
#' @export
pf_points <- function(style, css_px) {
    .pf_scalar(css_px, "CSS length")
    if (css_px <= 0)
        stop("CSS length must be positive")
    css_px * 72 * style$width/style$placed
}

#' @rdname pf_points
#' @export
pf_mm <- function(style, css_px) pf_points(style, css_px) * 25.4/72

.pf_fraction <- function(x, low, high) {
    if (is.finite(high - low))
        (x - low)/(high - low) else (x/2 - low/2)/(high/2 - low/2)
}

#' Explicit linear or asymmetric centered normalization
#' @param values Real numeric values; NA/NaN remain missing.
#' @param vmin,vmax Finite explicit ordered endpoints.
#' @param center Meaningful interior diverging center, or NULL.
#' @return Values in [0,1], with missing values preserved as NA.
#' @export
pf_normalize <- function(values, vmin, vmax, center = NULL) {
    .pf_scalar(vmin, "vmin")
    .pf_scalar(vmax, "vmax")
    if (vmin >= vmax)
        stop("vmin must be below vmax")
    if (!is.null(center)) {
        .pf_scalar(center, "center")
        if (center <= vmin || center >= vmax)
            stop("center must be inside limits")
    }
    if (!is.numeric(values) || is.complex(values) || any(is.infinite(values)))
        stop("Data must be real numeric, NA/NaN; no infinities or coercion")
    x <- pmin(vmax, pmax(vmin, values))
    if (is.null(center))
        return(.pf_fraction(x, vmin, vmax))
    out <- rep(NA_real_, length(x))
    left <- !is.na(x) & x <= center
    right <- !is.na(x) & !left
    out[left] <- 0.5 * .pf_fraction(x[left], vmin, center)
    out[right] <- 0.5 + 0.5 * .pf_fraction(x[right], center, vmax)
    out
}

#' Exact LUT bin lookup without interpolation or mode reversal
#' @param style Explicit theme and bundled data.
#' @param u Normalized numeric values; endpoints clip, missing stays missing.
#' @param name Approved map identifier.
#' @return RGB float matrix, one row per input, with NA rows for missing values.
#' @export
pf_lookup <- function(style, u, name = "cividis") {
    .pf_id(name)
    map <- style$spec$maps[[name]]
    if (is.null(map))
        stop("Unsupported map")
    if (!is.numeric(u) || is.complex(u) || any(is.infinite(u)))
        stop("Normalized values must be real numeric/NA")
    samples <- do.call(rbind, lapply(map$samples, unlist))
    index <- pmin(nrow(samples) - 1L, floor(pmin(1, pmax(0, u)) * nrow(samples))) + 1L
    samples[index, , drop = FALSE]
}

.pf_hex <- function(rgb, missing = NA_character_) {
    valid <- rowSums(is.na(rgb)) == 0L
    out <- rep(missing, nrow(rgb))
    out[valid] <- grDevices::rgb(rgb[valid, 1], rgb[valid, 2], rgb[valid, 3])
    out
}

#' Resolve stable categorical identities from an explicit domain
#' @param style Theme with approved categorical variants.
#' @param domain Ordered unique string IDs; unused IDs retain their slots.
#' @param observed Actual labels, including factors interpreted by labels.
#' @param variant Default three-slot or explicit conditional five-slot variant.
#' @return A data frame with stable id/slot/color/shape and dash list columns.
#' @export
pf_categories <- function(style, domain, observed = domain, variant = NULL) {
    if (is.null(variant))
        variant <- style$spec$categories$default
    .pf_id(variant)
    definition <- style$spec$categories$variants[[variant]]
    if (is.null(definition))
        stop("Unsupported categorical variant")
    if (!is.character(domain) || anyNA(domain) || any(!nzchar(domain)) || anyDuplicated(domain) || length(domain) >
        definition$capacity)
        stop("Explicit unique string domain exceeds capacity or is malformed")
    if (is.factor(observed))
        observed <- as.character(observed)
    if (!is.character(observed) || anyNA(observed) || any(!observed %in% domain))
        stop("Observed category outside domain")
    slots <- lapply(match(observed, domain), function(i) definition$slots[[i]])
    out <- data.frame(id = observed, slot = vapply(slots, function(x) x$id, ""), color = vapply(slots,
        function(x) x$color, ""), shape = vapply(slots, function(x) x$shape, ""), stringsAsFactors = FALSE)
    out$dash <- I(lapply(slots, function(x) unlist(x$dash$multipliers)))
    out
}

#' Split an already placed physical path into exact shared dash segments
#' @param x,y Physical coordinates in a consistent native unit; NA resets phase.
#' @param pattern Positive dash/gap lengths in the same physical unit; empty=solid.
#' @return Segment endpoint matrix. Both strokes must use this identical result.
#' @export
pf_dash_segments <- function(x, y, pattern = numeric()) {
    if (!is.numeric(x) || !is.numeric(y) || length(x) != length(y) || any(is.infinite(c(x, y))))
        stop("Invalid path coordinates")
    if (!is.numeric(pattern) || any(!is.finite(pattern)) || any(pattern <= 0) || length(pattern)%%2L)
        stop("Dash/gap pattern must be positive pairs")
    out <- matrix(numeric(), ncol = 4, dimnames = list(NULL, c("x0", "y0", "x1", "y1")))
    steps <- 0L
    phase <- 1L
    remaining <- if (length(pattern))
        pattern[1] else Inf
    if (length(x) < 2L)
        return(out)
    for (i in seq_len(length(x) - 1L)) {
        if (anyNA(c(x[i], y[i], x[i + 1], y[i + 1]))) {
            phase <- 1L
            remaining <- if (length(pattern))
                pattern[1] else Inf
            next
        }
        dx <- x[i + 1] - x[i]
        dy <- y[i + 1] - y[i]
        scale <- max(abs(dx), abs(dy))
        distance <- if (scale == 0)
            0 else scale * sqrt((dx/scale)^2 + (dy/scale)^2)
        if (!is.finite(distance))
            stop("Physical path length is not representable")
        if (distance == 0)
            next
        if (length(pattern) && distance/min(pattern) > 1e+05)
            stop("Dash geometry exceeds supported segment budget")
        start <- 0
        while (start < distance) {
            steps <- steps + 1L
            if (steps > 100000L)
                stop("Dash geometry exceeds supported segment budget")
            step <- min(distance - start, remaining)
            if (start + step <= start)
                stop("Dash geometry below representable resolution")
            if (!length(pattern) || phase%%2L == 1L)
                out <- rbind(out, c(x[i] + dx * start/distance, y[i] + dy * start/distance, x[i] + dx *
                  (start + step)/distance, y[i] + dy * (start + step)/distance))
            start <- start + step
            remaining <- remaining - step
            if (length(pattern) && remaining <= .Machine$double.eps * max(1, distance)) {
                phase <- phase%%length(pattern) + 1L
                remaining <- pattern[phase]
            }
        }
    }
    out
}

.pf_id <- function(value) {
    if (!is.character(value) || length(value) != 1L || is.na(value) || !nzchar(value))
        stop("Expected one explicit string identifier")
    invisible(value)
}
