# Plotfoundry for R — unreleased scaffold

This independent R package exposes only `plotfoundry::package_info()`, returning a
new named list with name, installed version and `status="scaffold"`. Plotting
themes, palettes, fonts and adapters are not implemented yet. No htmpres, Quarto,
Python, JavaScript or repository checkout is required after installation.

Build from any working directory with `R CMD build /path/to/packages/r`, then
install the resulting source archive with `R CMD INSTALL /path/to/archive.tar.gz`.
No CRAN or r-universe publication is claimed. R 4.1+ and its base namespace suffice; no extra packages are required. The version in `DESCRIPTION` is
independent of the Python and JavaScript versions.

```r
plotfoundry::package_info()
```

`inst/examples/hello.R` ships as installed `examples/hello.R` and runs in plain R. The new scaffold is MIT licensed; `LICENSE`
contains the R license metadata and `LICENSE.md` contains the complete notice.
