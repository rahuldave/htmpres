# Explicit development setup; never runs while loading or using plotfoundry.
args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 1L) stop("Supply a task-local R library directory")
library <- normalizePath(args[1], mustWork = FALSE)
dir.create(library, recursive = TRUE, showWarnings = FALSE)
# First provision jsonlite so the version record can be read natively.
if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("https://cran.r-project.org/src/contrib/jsonlite_2.0.0.tar.gz",
    repos = NULL, type = "source", lib = library)
.libPaths(c(library, .libPaths()))
record <- jsonlite::fromJSON(file.path("packages", "r", "tools", "tested-dependencies.json"))
for (i in seq_len(nrow(record))) {
    package <- record$package[i]
    version <- record$version[i]
    if (requireNamespace(package, quietly = TRUE) && packageVersion(package) == package_version(version))
        next
    source <- sprintf("https://cran.r-project.org/src/contrib/%s_%s.tar.gz", package, version)
    archive <- sprintf("https://cran.r-project.org/src/contrib/Archive/%s/%s_%s.tar.gz", package, package,
        version)
    target <- tempfile(fileext = ".tar.gz")
    status <- try(utils::download.file(source, target, quiet = TRUE), silent = TRUE)
    if (inherits(status, "try-error"))
        utils::download.file(archive, target, quiet = TRUE)
    install.packages(target, repos = NULL, type = "source", lib = library)
    if (packageVersion(package, lib.loc = library) != package_version(version))
        stop("Version mismatch")
}
