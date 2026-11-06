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

These are palette and typography adapters for the custom htmpres HTML renderer.
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
and receive complementary htmpres palettes. Those complementary modes are
presentation adaptations, not additional releases from the source projects.
The catalog records each theme's native mode and adaptation policy.

The existing three seeds retain their previous behavior and deck-local CSS.
The new `color-mode` option requires an imported theme or a custom paired seed.

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

To regenerate the checked-in catalog from local source checkouts:

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
node --test tests/theme-catalog.test.mjs
node --test tests/theme-renderer-parity.test.mjs
```

The full smoke prints a scratch directory containing an HTML gallery and a
rendered specimen of every imported theme. Serve that directory to inspect
the palettes, mode control, code, and presenter notes in a browser.
