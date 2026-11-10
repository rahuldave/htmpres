# Plotfoundry package boundaries

**Unreleased Python/R references and scientific contract.** Plotfoundry is an independent Python/R/JavaScript
package family hosted in this monorepo. Python now implements the [Matplotlib reference](../packages/python/README.md);
R provides the native ggplot2/base reference; JavaScript still exposes an installed identity record only. The separate [scientific contract](../packages/spec/README.md) now
ships approved data, exact fonts/notices and conformance fixtures; the Python adapter bundles it for offline use, exact fonts and supported plotting
helpers. Other language adapters remain deferred.
No PyPI, CRAN/r-universe, npm or CDN availability is advertised.

Use the [package development guide](../packages/README.md) for local artifact
builds, clean installs and native examples. The Python, R and browser/Node packages
require no htmpres installation, import, renderer or name dependency. Quarto and
SmallDocs integrations are not implemented; ordinary installed identity calls
also require neither of those tools.

The [next-phase plan](plans/plotting-ecosystem.md) records the completed shared-contract piece and
separates future native adapter, integration and release pieces. The agreed scientific choices are
promoted into a standalone versioned data artifact, without native rendering APIs. Each next piece needs its
own Sol implementation, distinct Sol review and user selection.

This developer guide is not yet added to the public website page allowlist; the
later public adapter guides and galleries will document actual supported APIs
rather than imply plotting functionality from these identity examples.

The independently installable [R reference](../packages/r/README.md) now provides ggplot2/base helpers, exact scales and explicitly selected font/devices. It remains an unpublished development source package. Dedicated Python/R website guides and galleries are the next authorized documentation slice; no npm/CRAN/PyPI/CDN availability is implied.
