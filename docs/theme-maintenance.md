# Maintain the theme catalog

This repository-only record describes theme imports and verification. Authors
choose a bundled theme through the public Presentation themes guide.

## Owned foundation profiles

The nine Elegant, Reading and Tufte themes import versioned published foundation
manifests. Their audience profile uses 30px prose and code, 36px headings, 48px
titles and 24px audience labels in the 1280×720 design coordinates. Serif prose
remains serif; Folio's Caslon is reserved for large display titles. Emphasis uses
available body/code weights. Ordinary paragraphs, lists and callout bodies use
primary ink; semantic callout headers and explicitly named states have separate
color jobs. Matched code/equation colors remain independent from brand/state roles.

The profile uses a 64px audience inset, 48px group/column gaps and 16px within-group
gaps. Surfaces have no resting shadow and use their source radius. Tufte text groups
and code shells are unboxed. Narrow reading views retain the reader profile and
clearance for navigation controls. These CSS-coordinate checks do not certify a
physical projector or replace a whole-deck accessibility review.

Only exact, unchanged blocks from the bundled template and the checked-in tutorial
copy are migrated to foundation-backed defaults during rendering. The source file
is not rewritten. Arbitrary local CSS and later authored overrides remain intact;
for example `.card p { font-size: 42px; }` is an intentional override. An owned
`theme add --from folio` seed carries explicit provenance so its copied defaults
receive the same jobs. Unrelated custom themes keep their existing behavior.

For an owned-only refresh, prepare a reviewed ledger with exactly nine entries,
each containing `theme`, local `path`, merged `commit` and `manifest_sha256`:

```sh
python3 scripts/import-theme-catalog.py --owned-ledger /path/to/sources.json --refresh-docs
```

This reads published `_extensions/<theme>/foundations.json` files verbatim,
validates the frozen schema and role references, and checks every copied input
against committed bytes. It preserves all 26 stock entries and source records
exactly. `--refresh-docs` refreshes the separately vendored Nocturne site theme,
manifest, provenance and notices. Fonts remain locally staged by the gallery build.
A full catalog rebuild deliberately re-extracts the stock upstream sources:

```sh
python3 scripts/import-theme-catalog.py \
  --smalldocs /path/to/smalldocs \
  --elegant /path/to/Elegant \
  --tufte /path/to/smalldocs-tufte
```

Python is only needed for catalog maintenance. Rendering still uses the normal
Quarto/Deno path; the optional Node renderer uses the same theme adapter.

## Verification and gallery

`just check` includes representative theme CLI/render/asset checks through
the authoring smoke. Run the full catalog and focused module checks with:

```sh
tests/theme-catalog-smoke.sh --all
python3 -m unittest tests/test_import_theme_catalog.py
node --test tests/foundations.test.mjs tests/theme-catalog.test.mjs
node --test tests/theme-renderer-parity.test.mjs
```

The full smoke prints a scratch directory containing an HTML gallery and a
rendered specimen of every imported theme. Serve that directory to inspect
the palettes, mode control, code, and presenter notes in a browser.

The reproducible foundation acceptance fixture includes all nine themes in both
modes, a public-API clone, real code/matching frames, controls, widgets and an
explicit local override:

```sh
node scripts/build-foundation-fixtures.mjs /tmp/htmpres-foundation-qa
python3 -m http.server 8870 --bind 127.0.0.1 --directory /tmp/htmpres-foundation-qa
```

`integration_tests/foundations-browser.mjs` provides read-only computed-style
inspection and a rerunnable CUA interaction check. Narrow screenshots and
projection remain separate visual checks.
