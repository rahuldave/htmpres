# Plotfoundry independent packages — unreleased packages and scientific contract

Plotfoundry is the selected neutral umbrella; all three native identities are
`plotfoundry`. The Python import is also `plotfoundry`. The dated
[name check](name-availability.json) records official PyPI/npm 404 responses and
case-insensitive absence from the current CRAN package index. This is observed
absence, not a reservation, trademark clearance or ownership claim. No package,
CDN artifact, registry account or r-universe repository is published by this work.

| Boundary | Version source | Current API | Build |
| --- | --- | --- | --- |
| [Specification](spec/README.md) | `specVersion`: `0.1.0`; schema major 1 | Approved data/conformance reference; no plotting adapter | `just spec-build` |
| [Python](python/README.md) | `pyproject.toml`: `0.1.0.dev0` | `package_info()` | `uv build` |
| [R](r/README.md) | `DESCRIPTION`: `0.0.0.9000` | `package_info()` | `R CMD build` |
| [JavaScript](javascript/README.md) | `package.json`: `0.1.0-dev.0` | `packageInfo()` | `npm pack` |

Each version is independent. A native artifact contains all the code needed for
its identity API, with no runtime package dependencies beyond its native standard
library. The packages do not import or install htmpres, research files, sibling
packages, document engines or a different language runtime. The root private npm
project remains separate. Installed identity calls perform no downloads or
subprocess calls.

The new code/documentation is MIT licensed per package; imported font assets retain
their original notices. The [scientific specification](spec/README.md) now bundles
nine exact pinned upstream manifests, approved sampled maps, categorical treatments,
72 resolved cases and twelve resolved font faces. The nine upstream repositories
remain authoritative. Promotion is reproducible and build-time only; installed
consumers do not read research files or fetch a central manifest. Native packages
still expose identity APIs only and do not yet bundle or consume this contract.

## Development commands

From the monorepo:

```sh
just packages-test
just packages-build
just packages-install-test
just packages-check
just spec-check
```

`packages-test` checks boundaries. `packages-build` invokes the independent native
build tools and writes ignored `.build/packages/` artifacts. `packages-install-test`
rebuilds and installs wheel, wheel rebuilt from sdist, R archive and npm tarball in
clean temporary consumers **outside** the checkout. It checks artifact notices,
metadata/API versions, fresh identity records and standalone examples. Native
Python/Node identity execution uses an empty PATH; runtime installation uses local
artifacts and disables package-index access. Build-only Hatchling is downloaded
or cached by uv. The test does not claim operating-system network isolation.

The build/test coordinator needs developer Python 3.11+, uv, R/Rscript and npm/Node.
These are not requirements of each installed package: Python users need Python,
R users need R, and browser users need neither Python nor Node. Building directly
from one package directory likewise does not invoke a sibling language toolchain.

`packages-install-test` prints a `browser_root` and `browser_path` and records them
in `.build/packages/installed-consumers.json`. Serve that clean consumer root with
a local HTTP server, open the reported browser path, and run
`integration_tests/package-boundaries-browser.mjs` from CUA. It checks actual
browser ESM loading from the installed npm artifact, with no Node globals or
remote script dependencies. This is separate from the Node install test.
Temporary consumers are retained for this check; delete their reported temporary
directory when finished. R package validation can additionally run
`LANG=C LC_ALL=C R CMD check --no-manual <built-source-archive>` in a scratch directory. The coordinator sets this portable locale for R to avoid
host-specific unsupported locale settings; it does not change the system locale.

The native package API docs and examples are deliberately minimal. Native theme/
palette/font APIs, adapter bundling and public releases belong to later
user-selected pieces of the [ecosystem plan](../docs/plans/plotting-ecosystem.md).
