# Packaging Plan

This project should be packaged as a Quarto extension plus a starter template,
with npm and Node kept only as optional compatibility wrappers.

## Recommendation

Package `htmpres` as an installable Quarto utility extension plus a starter
template:

- Quarto-run CLI: owns `html -> qmd`, `qmd -> html`, and verification.
- Runtime assets: custom deck JavaScript, interaction helper, and base CSS.
- Offline math: bundled KaTeX JS/CSS/fonts/license, staged to each rendered
  deck's `assets/htmpres-math/`. Viewing requires no network package install.
- Extension folder: `_extensions/htmpres` contains the runner, packaged runtime
  assets, and authoring templates, so `quarto add` can install it into another
  project.
- Template: gives users a ready-to-edit `decks/<name>/index.qmd` and
  `source.css`.
- Optional npm wrappers: useful for people who already use npm scripts, but not
  required for the core renderer.

Quarto remains part of the toolchain because the renderer calls
`quarto pandoc` for fragment conversion. The slide shell is intentionally ours.

## Quarto Runtime Note

Quarto does not provide a general Node/npm runtime for projects. It can run
TypeScript project scripts through the Deno interpreter bundled with Quarto,
and Pandoc provides embedded Lua for filters. The current renderer now uses that
bundled Deno path through `quarto run scripts/htmpres.ts`, so the normal
workflow does not require an external Node install. The source of truth now
lives at `_extensions/htmpres/htmpres.ts`; `scripts/htmpres.ts` is only a local
shim.

## Why Not Pure Quarto

Quarto's official extension model is excellent for custom formats, filters,
shortcodes, templates, metadata, and revealjs plugins. It is less natural for
this current renderer because:

- Quarto's native HTML slide target is revealjs.
- Our deck navigation, overview, zoom, presenter panel, and legacy interaction
  support are custom HTML/JS.
- The current renderer is a Quarto-run TypeScript script that shells out to
  `quarto pandoc` for markdown fragments.

The installable extension is real now, but it is a utility extension rather than
a native format. A pure `quarto render deck.qmd --to htmpres-html` version is
possible later, but it would mean rewriting the shell as a Quarto HTML template
plus Lua filters. That is a good future phase once the markdown vocabulary
settles.

## Proposed Package Shape

```text
htmpres/
  package.json              # optional wrappers
  README.md
  _extensions/
    htmpres/
      _extension.yml
      htmpres.ts            # installable Quarto/Deno CLI
      lib/                  # shared source scanner and HTML fragment helpers
      vendor/katex/         # pinned math engine, fonts, license and provenance
      runtime/
        htmpres-custom-deck.js
        htmpres-interactions.html
        htmpres-math.js
        htmpres-semantic.css
        htmpres-steps.css
  scripts/
    htmpres.ts              # local shim to _extensions/htmpres/htmpres.ts
    html-to-qmd.mjs         # optional Node fallback
    qmd-to-html.mjs         # optional Node fallback
    verify-roundtrip.mjs    # optional Node fallback
  templates/
    deck/
      index.qmd
      source.css
      assets/
        tutorial-flow.svg
  docs/
    build-a-deck-from-markdown.md
    quarto-class-map.md
```

## CLI Surface

```sh
just convert source.html
just render decks/example/index.qmd
just render-all
just verify
just lint decks/semantic/index.qmd
just semantic-test
just check
just node-check
just compat-check
```

`just check` is the normal Quarto/Deno verification path and does not require
Node. `just node-check` exercises only the optional Node fallback scripts, and
`just compat-check` runs both paths when Node is available.

Installed extension usage in another project:

```sh
quarto add <repo-or-archive>
quarto run _extensions/htmpres/htmpres.ts workspace init presentations
quarto run _extensions/htmpres/htmpres.ts deck new presentations/example --theme sage
quarto run _extensions/htmpres/htmpres.ts render presentations/example/index.qmd
quarto run _extensions/htmpres/htmpres.ts verify
```

Installable Codex skills are a separate distribution layer:

```sh
npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

The skills should not copy renderer code themselves. They should verify or
install the Quarto extension, then use the extension CLI.

The repo also exposes npm convenience wrappers for users who already have npm:

```sh
npm run convert
npm run render
npm run verify
```

## Distribution

Use two distribution paths:

- Extension install for existing projects: publish this repo, or a trimmed
  package repo, and install with `quarto add <repo-or-archive>`.
- Starter template for new projects: publish a template repo containing
  `_extensions/htmpres`, `template.qmd`, `source.css`, and any starter assets.
  Users start with `quarto use template <org>/<repo>`.
- npm package: optional convenience distribution once the scripts are refactored
  into package-friendly paths. It should wrap the Quarto/Deno CLI rather than
  becoming the required runtime.

The website build pins Quarto 1.8.26; use a modern Quarto with `quarto add`.
The `_extension.yml` declares `quarto-required: ">=1.2.0"`. Focused tests copy
the extension into a scratch project and render with its bundled helpers and
math assets. A workspace init copies the complete extension recursively.

The renderer writes HTML plus local math/theme assets. Copy the entire deck
folder to share it offline. Presenter notes remain in `presenter.html` only.
The public website stages one shared math bundle and rewrites its URLs for
every comparison variant and the semantic demo. KaTeX provenance and hashes
are recorded under `vendor/katex/provenance.json`.

See `docs/quarto-extension.md` for the install commands and official Quarto
documentation links that informed this packaging decision.

## Versioning

Use semantic versions for the toolkit:

- Patch: rendering fixes that do not change markdown vocabulary.
- Minor: new supported classes, data attributes, or presenter behavior.
- Major: breaking changes to QMD syntax, output DOM, or generated asset layout.

Keep the class vocabulary documented in `docs/quarto-class-map.md`. Every new
class should have either a CSS rule, a runtime behavior, or a documented
reason to exist.

## Later Pure-Quarto Path

If we want `quarto render deck.qmd --to htmpres-html`, the likely path is:

1. Create a Quarto custom HTML format.
2. Move the shell into a Pandoc/Quarto HTML template.
3. Add a Lua filter that converts level-2 headings into our slide sections and
   extracts `.notes` into presenter-only metadata.
4. Bundle runtime CSS/JS as format resources.
5. Keep the current Quarto-run renderer as the compatibility harness until
   parity is proven.
