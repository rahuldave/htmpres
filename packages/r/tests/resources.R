library(plotfoundry)
root <- system.file("spec", package = "plotfoundry", mustWork = TRUE)
original <- pf_spec()
stopifnot(length(original$cases) == 72L)
check <- function(change) {
    temporary <- tempfile("pf-resources-")
    dir.create(temporary)
    file.copy(list.files(root, full.names = TRUE, all.files = TRUE, no.. = TRUE), temporary, recursive = TRUE)
    change(temporary)
    loader <- pf_spec
    shim <- new.env(parent = environment(loader))
    shim$system.file <- function(...) temporary
    environment(loader) <- shim
    stopifnot(tryCatch({
        loader()
        FALSE
    }, error = function(e) TRUE))
    unlink(temporary, recursive = TRUE)
}
# Coherently rehashed metadata cannot change the immutable installed snapshot.
for (field in c("treatment", "normalization", "placement", "fonts", "notices")) {
    check(function(path) {
        file <- file.path(path, "data/spec.json")
        value <- jsonlite::fromJSON(file, simplifyVector = FALSE)
        if (field == "treatment")
            value$categories$treatment$foreground_css_px <- 0.01
        if (field == "normalization")
            value$normalization$clipping <- "different"
        if (field == "placement")
            value$cases[[1]]$placement$placedWidthCssPx <- 64
        if (field == "fonts")
            value$fonts[[1]]$sha256 <- paste(rep("0", 64), collapse = "")
        if (field == "notices")
            value$fonts[[1]]$noticePaths <- list("notices/DejaVu-LICENSE")
        jsonlite::write_json(value, file, auto_unbox = TRUE, digits = NA)
        inventory <- file.path(path, "data/manifest.json")
        manifest <- jsonlite::fromJSON(inventory, simplifyVector = FALSE)
        # Hash changes in the inventory are also forbidden by its independent pin.
        manifest$files[["spec.json"]]$sha256 <- digest::digest(file = file, algo = "sha256", serialize=FALSE)
        jsonlite::write_json(manifest, inventory, auto_unbox = TRUE, digits = NA)
    })
}
check(function(path) writeLines("extra", file.path(path, "extra")))
check(function(path) unlink(file.path(path, "conformance.json")))
if (.Platform$OS.type != "windows") check(function(path) {
    file <- file.path(path, "conformance.json")
    unlink(file)
    file.symlink(file.path(root, "conformance.json"), file)
})
cat("R immutable resource closure and coherent mutation rejection passed\n")
