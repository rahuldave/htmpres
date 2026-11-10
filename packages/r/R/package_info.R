# Native R only: no Python, JavaScript, document engine or sibling lookup.
package_info <- function() {
  list(
    name = "plotfoundry",
    version = as.character(getNamespaceVersion("plotfoundry")),
    status = "scaffold"
  )
}
