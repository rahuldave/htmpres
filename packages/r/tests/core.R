library(plotfoundry)
stopifnot(length(pf_spec()$cases) == 72L)
s <- pf_theme("folio", surface = "panel")
stopifnot(identical(pf_normalize(c(-2, 0, 1, NA_real_), -2, 1, center = 0), c(0, 0.5, 1, NA_real_)))
stopifnot(pf_normalize(0, -1e+308, 1e+308) == 0.5)
stopifnot(pf_lookup(s, 0.5, "BrBG")[1, 1] == pf_spec()$maps$BrBG$samples[[129]][[1]])
stopifnot(pf_points(s, 16) == 14.4)
slots <- pf_categories(s, c("A", "B", "C"), factor(c("C", "A"), levels = c("C", "B", "A")))
stopifnot(identical(slots$id, c("C", "A")))
expect_error <- function(code) {
    failed <- tryCatch({
        force(code)
        FALSE
    }, error = function(e) TRUE)
    stopifnot(failed)
}
expect_error(pf_categories(s, c("A", "A"), "A"))
expect_error(pf_categories(s, "A", "B"))
expect_error(pf_normalize(TRUE, 0, 1))
expect_error(pf_normalize(1, 0, 0))
expect_error(pf_normalize(Inf, 0, 1))
segments <- pf_dash_segments(c(0, 1), c(0, 0), c(0.2, 0.1))
stopifnot(nrow(segments) == 4L, abs(segments[2, "x0"] - 0.3) < 1e-14)
cat("R core contracts passed\n")
for (bad in list(1L, TRUE, factor("cividis"), c("cividis", "BrBG"), NA_character_)) expect_error(pf_lookup(s,
    0.5, bad))
for (bad in list(1L, TRUE, factor("colorblind-subset-3"), c("colorblind-subset-3", "colorblind-subset-5"),
    NA_character_)) expect_error(pf_categories(s, "A", "A", bad))
expect_error(pf_dash_segments(c(0, 1), c(0, 0), c(9.99999999999999e-301, 9.99999999999999e-301)))
expect_error(pf_dash_segments(c(-1e+308, 1e+308), c(0, 0)))
# Package import must not open or close caller devices or mutate font registration.
file <- tempfile(fileext = ".pdf")
grDevices::pdf(file)
before <- list(par = graphics::par(no.readonly = TRUE), options = options(), palette = grDevices::palette(),
    device = grDevices::dev.cur())
expect_error(pf_base_context(s, {
    options(plotfoundry_test_new = TRUE)
    grDevices::palette(c("red", "blue"))
    graphics::par(las = 2)
    stop("expected")
}))
stopifnot(identical(graphics::par(no.readonly = TRUE), before$par), identical(options(), before$options),
    identical(grDevices::palette(), before$palette), identical(grDevices::dev.cur(), before$device))
grDevices::dev.off()
unlink(file)
cat("R malformed IDs, bounded geometry and scoped state passed\n")
