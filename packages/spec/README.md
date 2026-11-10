# Plotfoundry scientific contract 0.1.0 — unreleased

This is a standalone, language-neutral data artifact, not a plotting adapter.
It promotes the approved frozen scientific decisions into schema version 1.
The Python, R and JavaScript packages remain identity-only scaffolds; they do
not yet consume this artifact. Nothing is published to a package registry or CDN.

## Contents and boundaries

`data/spec.json` contains nine theme families, two modes and two profiles, resolved
onto paper and panel surfaces: 36 configurations and 72 cases. `data/foundations/`
retains the nine upstream manifests byte for byte. Each upstream repository remains
authoritative; `source-lock.json` records its exact commit and published-manifest
hash. No installed consumer needs htmpres, a research checkout, another language,
a document engine or a network connection to read these JSON/resources.

`schema.json` checks the public shape. `source-lock.json` independently pins the
approved source bytes and scientific values; promotion does not rewrite that lock.
`data/manifest.json` inventories every payload resource and its origin/hash.
`conformance.json` and the standard-library-only `tools/reference.py` define
arithmetic/assignment examples for future native adapters, without rendering.
`foundations.schema.json` is the exact upstream contract schema. Fonts, source
WOFF inputs, notices and upstream licenses are included under `data/`.

The frozen run is `foundations-2026-11-09` at the research commit recorded in the
lock. Its **final evidence manifest**, not the earlier historical run manifest,
is the source authority. The earlier manifest predates the finalized experiment
method; the final evidence binds the finalized methods, reports and resources.
Promotion allowlists exact approved files and never reruns experiments or copies
private books, decks, diagnostic pools or an entire research directory.

## Scientific protocol

- Furniture roles and numeric profiles derive from the pinned foundations.
  Reading labels are 16 CSS px, headings 30 and metadata 14. Body annotations are
  20 for Folio, Nocturne, Tufte and Litera, and 18 otherwise. Presentation labels
  and metadata are 24, headings 36 and body annotations 30. These are chart roles,
  not a promise to use document display/prose fonts for chart furniture.
- `mapSelection` publishes cividis as the sequential default and BrBG as the
  diverging default, with the approved alternatives. The seven exact sampled
  arrays are gamma-encoded sRGB floats in [0,1]. Preserve their float values;
  do not round-trip through hex, interpolate, resample or reverse by theme mode.
- Uniform LUT **sample positions** are `i/(N-1)`. Lookup **bins** are
  `[i/N,(i+1)/N)`, with the last including 1: `min(N-1,floor(u*N))` after explicit
  endpoint clipping. BrBG has 257 samples; `u=0.5` selects index 128 exactly.
- Sequential normalization requires explicit finite `vmin < vmax`. Diverging
  normalization requires explicit `vmin < center < vmax` and independently maps
  each side to [0,0.5] and [0.5,1]; limits need not be symmetric. Under/over values
  clip to endpoint colors. Null/NaN remain missing, never zero/center. Lines have
  gaps; explicit missing cells need the prescribed fill/ink/hatch cue. Infinite
  data/limits are rejected by this reference, rather than silently becoming missing.
- The default categorical variant has three slots; the conditional five-slot
  variant is explicit opt-in. Callers supply a unique ordered string-ID domain
  within the selected variant's capacity. Unknown categories and recycling are
  rejected. An explicitly empty domain with no observations returns no slots; it
  invents no categories. Identity is **variant plus domain slot**: slot C differs between
  the three- and five-slot variants. Changing variant can recolor slots and needs
  caller-reviewed mappings; automatic expansion is unsupported.
- A bare color cycle is unsupported. Both categorical variants require 2.5 CSS px
  foreground over 5.5 px theme-ink under-stroke, 7 px markers with 1.5 px ink
  edges, stable shapes/dashes and direct labels. Dash arrays are multiples of the
  **foreground** linewidth, offset zero; foreground and under-stroke share the
  same scaled dash geometry. Never scale the under-stroke pattern independently.
  Dash caps are butt; solid caps are projecting. Native translation and supported
  mark geometry still require adapter-specific acceptance.
- Placed typography uses `points = css_px * 72 * figure_width_inches /
  placed_width_css_px`; millimeters are points × 25.4/72. Raster DPI controls
  resolution, not placed type. A native square-point marker area is diameter in
  points squared only where that backend's marker convention applies. Preserve
  explicit placement and do not silently use tight cropping.

`capabilities` distinguishes contract mark families, planned adapter tiers and
unsupported universal claims. Theme-only configuration is weaker than a helper
that actually supplies the required operational treatments. No universal CVD,
projector, accessibility, label-placement or arbitrary-mark guarantee is made.

## Fonts and exports

Only the twelve approved resolved UI/heading faces are shipped, with their
original notices. SHA-256 IDs bind exact files, internal families, real weights,
role mappings and conversion metadata. Pulse/Litera's DejaVu fallback is an
explicit bundled choice, not an ambient system lookup. No host font path is
needed at consumption.

ET Book's original WOFF inputs and converted TTF outputs are both retained.
The reproducible recipe uses fontTools 4.68.0, `recalcTimestamp=False`, preloads
`name` and `OS/2`, sets `flavor=None`, and saves with `reorderTables=False`.
The verifier reproduces the exact output hashes and preserves embedding flags
(fsType 4) and attribution. Every imported face retains its license/notice;
this directory's MIT license covers new code/docs, not a relicensing of fonts.

Asset presence does not prove the renderer selected that file or embedded it.
Future adapters must verify actual font-file selection, glyph coverage and each
SVG/PDF/raster export policy (text, outlines or embedding) separately.

## Standalone verification and local builds

Data readers need only a JSON reader. Verification tools require Python 3.11+
and the pinned jsonschema/fontTools environment; these are build/verification
dependencies, not native plotting runtime dependencies. The archive includes
`pyproject.toml` and `uv.lock` so it can validate outside this checkout:

```sh
# Inside an extracted plotfoundry-spec-0.1.0 archive:
uv sync --locked
uv run --locked python -B tools/validate_spec.py . --verify-font-conversions
```

Initial tool setup may download locked packages. For an offline verification
machine, provision those dependencies/cache before disconnecting, then use
`uv sync --locked --offline` and `uv run --locked --offline ...`. Installed data
consumption itself never downloads anything. This is not a claim of OS-level
network isolation.

In the monorepo, the stable commands are:

```sh
just spec-validate  # validate existing bytes; never regenerate to hide drift
just spec-test     # schema, mutation, arithmetic, staging and archive tests
just spec-build    # deterministic tar.gz plus SHA-256 file
just spec-check    # validate, test, build, diff hygiene
just spec-import   # deliberate re-promotion from the locked frozen run
```

`spec-import` is build-time only and rejects changed source hashes, symlinks,
traversal and unmanaged output contents. The standalone archive deliberately
omits the research importer. Archive builds are sorted with fixed metadata and
gzip timestamp; build twice to compare bytes. Root artifact output is ignored
under `.build/packages/spec/`. `spec-check` does not automatically import.

A minimal reader can load `data/spec.json`, choose an explicit case ID such as
`folio/light/reading/paper`, inspect `mapSelection`, and pass its values to a
future native adapter. This artifact supplies no plotting API or global theme
registration. Native adapters, rendered acceptance, integrations and publication
remain separately selected and independently reviewed pieces.
