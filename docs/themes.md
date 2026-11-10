# Presentation themes

Select a bundled theme directly in a deck's front matter:

```yaml
deck:
  theme: folio
  color-mode: auto
  css: source.css
```

`color-mode` accepts `light`, `dark`, or `auto`. Imported themes default to
`auto`, which follows the browser's system preference. The footer's color-mode
button cycles Auto → Light → Dark → Auto. A reader's choice is saved per deck
when storage is available; an explicit `light` or `dark` declaration takes
precedence on initial load. Audience and presenter pages share the setting.

The themes are palette and typography adapters for the custom htmpres HTML renderer.
They retain its layouts, navigation, fragments, media, and presenter view.
Bootstrap's page resets, navbar rules, and JavaScript are not loaded. PowerPoint
reference templates are a separate output system.

## Available names

| Collection | Names |
| --- | --- |
| Bootstrap | `bootstrap` |
| Bootswatch (the 25 bundled with SmallDocs) | `cerulean`, `cosmo`, `cyborg`, `darkly`, `flatly`, `journal`, `litera`, `lumen`, `lux`, `materia`, `minty`, `morph`, `pulse`, `quartz`, `sandstone`, `simplex`, `sketchy`, `slate`, `solar`, `spacelab`, `superhero`, `united`, `vapor`, `yeti`, `zephyr` |
| Elegant | `folio`, `atelier`, `nocturne` |
| Reading refinements | `zephyr-reading`, `simplex-reading`, `pulse-reading`, `litera-reading`, `darkly-reading` |
| Tufte | `tufte` |
| Existing htmpres seeds | `sage`, `mono-grid`, `blank` |

Folio, Atelier, Nocturne, and Tufte retain their source-designed light/dark
pairs. Light Bootswatch themes retain their native light palettes and use their
Bootstrap 5.3 dark variables. Dark-native stock themes keep their native dark
palettes and receive an htmpres light adaptation. The five Reading refinements
keep their native palettes (Darkly Reading is dark; the other four are light)
and supply explicit paired foundation contracts. Both modes come from the
source project; htmpres uses the supplied companion palette.
The catalog records each theme's native mode and adaptation policy.

The three seeds use deck-local CSS and have no bundled dark pair.
The `color-mode` option requires a bundled theme or a custom paired seed.

For theme-colored code/equation summaries and semantic overrides such as
`--htmpres-match-mean`, see [matched final views](semantic-authoring.md#finish-with-matched-colors).
The guide covers per-term, per-slide and stylesheet choices, including dark
mode and the generated palette's contrast checks.

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

## Separate light and dark themes

Use a mapping to pair different named themes:

```yaml
deck:
  theme:
    light: litera-reading
    dark: darkly-reading
  color-mode: auto
```

Both names are required. The light palette of the light theme and the dark
palette of the dark theme are selected. `data-theme`, `data-color-mode`,
`data-bs-theme`, and the `quarto-light`/`quarto-dark` classes track the active
selection on `<html>`.

## Edit or clone a theme

A bundled theme works with no `source.css`. If a stylesheet is present,
htmpres supplies its starter layout and bundled palette first, then the
deck-local CSS. Equivalent local theme rules take precedence:

```css
html[data-theme="folio"] {
  --font-display: Georgia, serif;
  --teal: #315c43;
}

html[data-theme="folio"][data-color-mode="dark"] {
  --teal: #b3d6a8;
}
```

Do not set mode-independent background or ink overrides unless they work in
both modes. Local `:root` defaults have lower specificity than an active named
theme; use the named selector above to override palette tokens.

The authoring CLI supports the same names:

```sh
quarto run _extensions/htmpres/htmpres.ts theme list
quarto run _extensions/htmpres/htmpres.ts deck new demo --theme folio --color-mode dark
quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd zephyr-reading
quarto run _extensions/htmpres/htmpres.ts theme add demo/index.qmd my-folio --from folio
quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd my-folio
```

`theme add` writes editable paired CSS and copies its font assets. `theme show`
prints a seed for inspection; use `theme add` to install its assets as well.
Selecting an older unpaired seed with `theme set` removes an incompatible
`deck.color-mode` setting and reports that change.
Custom names use lowercase letters, digits, and hyphens, beginning with a letter.

## Fonts, installation, and provenance

The extension contains a generated catalog and deduplicated fonts/licenses.
Rendering copies the selected fonts and licenses into
`assets/htmpres-themes/`. Serve or distribute this folder with the HTML, as
with other deck assets. Repeated renders leave unchanged assets untouched, and
the watcher ignores these generated copies.

Elegant, Reading, and Tufte fonts are bundled locally. Stock font stacks are
preserved; matching bundled fonts are reused where available. Other stock
fonts use their declared system fallbacks unless the author provides the font.
There are no Google Fonts requests or rendering-time downloads.

`_extensions/htmpres/themes/catalog.json` records source repositories, commits,
input hashes, native modes, and complementary-mode policies. The source set is
SmallDocs' pinned Bootstrap/Bootswatch 5.3.8 and current public Elegant/Tufte
checkouts. Private themes and archived original designs are excluded.

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
