# Plotfoundry package boundaries

**Unreleased identity scaffold.** Plotfoundry is an independent Python/R/JavaScript
package family hosted in this monorepo. It currently exposes installed identity
records only. It cannot yet style plots, provide palettes or register fonts.
No PyPI, CRAN/r-universe, npm or CDN availability is advertised.

Use the [package development guide](../packages/README.md) for local artifact
builds, clean installs and native examples. The Python, R and browser/Node packages
require no htmpres installation, import, renderer or name dependency. Quarto and
SmallDocs integrations are not implemented; ordinary installed identity calls
also require neither of those tools.

The [next-phase plan](plans/plotting-ecosystem.md) separates future shared-contract,
native adapter, integration and release pieces. The agreed scientific choices are
not promoted into runtime resources by this scaffold. Each next piece needs its
own Sol implementation, distinct Sol review and user selection.

This developer guide is not yet added to the public website page allowlist; the
later public adapter guides and galleries will document actual supported APIs
rather than imply plotting functionality from these identity examples.
