# Quarto Extension Packaging

`htmpres` can now be packaged as an installable Quarto utility extension. It is
not yet a native Quarto output format.

## Current Shape

The installable unit is:

```text
_extensions/
  htmpres/
    _extension.yml
    htmpres.ts
    runtime/
      htmpres-custom-deck.js
      htmpres-interactions.html
```

The root `scripts/htmpres.ts` file is only a convenience shim for this repo:

```sh
just render-all
```

An installed project should call the extension path:

```sh
quarto run _extensions/htmpres/htmpres.ts render decks/my-deck/index.qmd
quarto run _extensions/htmpres/htmpres.ts verify
```

## Installing In An Existing Project

For a published GitHub repo:

```sh
quarto add your-org/htmpres
```

For an internal archive or local checkout:

```sh
quarto add https://example.org/htmpres.zip
quarto add /path/to/htmpres
```

After installation, check `_extensions/htmpres/` into version control with the
deck project. Quarto treats installed extensions as local source code.

## Starter Template

For a new deck project, the friendliest distribution should be a template repo:

```text
template.qmd
source.css
assets/
_extensions/
  htmpres/
    ...
```

Users would create a new project with:

```sh
quarto use template your-org/htmpres
```

The template should include one small working deck, `source.css`, and the
installed `_extensions/htmpres` folder. If this full workspace is published as a
template, add a `.quartoignore` so imported decks and source snapshots are not
copied into every new project.

## Why This Is Not `--to htmpres-html` Yet

Quarto custom formats are invoked as formats, for example:

```sh
quarto render deck.qmd --to htmpres-html
```

That path requires the renderer to live inside Quarto's normal Pandoc format
pipeline. Our renderer intentionally owns the whole HTML shell: slide sections,
navigation, overview, zoom, presenter notes, and legacy interactions. It uses
`quarto pandoc` only for markdown fragments.

To become a native format later, we would need to:

1. Move the HTML shell into a Quarto/Pandoc template.
2. Replace the TypeScript slide parser with a Lua filter.
3. Extract `.notes` into presenter-only metadata during the Pandoc pass.
4. Bundle runtime CSS/JS as format resources.
5. Prove output parity against the current `htmpres.ts verify` checks.

## Official Docs Used

- Quarto project scripts: `quarto run` can run TypeScript on Quarto's embedded
  Deno, so TypeScript scripts can avoid a Node dependency.
  <https://quarto.org/docs/projects/scripts.html>
- Quarto extension distribution: install from GitHub, archives, local files, or
  local directories with `quarto add`.
  <https://quarto.org/docs/extensions/distributing.html>
- Quarto custom formats and templates: use `quarto add` for an existing project
  and `quarto use template` for a starter project.
  <https://quarto.org/docs/extensions/formats.html>
- Quarto project types: possible later if we want a fuller project scaffold,
  but still not necessary for the current utility runner.
  <https://quarto.org/docs/extensions/project-types>
