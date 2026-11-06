# htmpres

`htmpres` is a small Quarto/Pandoc-based toolkit for writing Markdown decks
that render to a custom HTML presentation shell. The published repo includes
public tutorial and example decks, reusable renderer code, and a SmallDocs site.

Read the [documentation](https://rahuldave.com/htmpres/) and
[compare presentation themes](https://rahuldave.com/htmpres/compare.html).

Included:

- `_extensions/htmpres/`: installable Quarto utility extension and runtime.
- `decks/tutorial/`: hand-authored tutorial deck and tutorial assets.
- `decks/example/`: nine-slide Nocturne example with inline speaker notes.
- `decks/scripts/`: project-local runtime copies used by this workspace.
- `docs/`: SmallDocs site with authoring guides and a 38-theme comparison.
- `scripts/`: local shim plus optional Node fallback scripts.

Not included:

- Private source presentation snapshots.
- Private imported decks.
- Rendered HTML outputs and Quarto support folders.

Primary commands:

```sh
just tutorial
just example
just docs
just docs-serve 8770
just pages-build
just pages-deploy
just verify
just authoring-smoke
just check
just publish
```

Run `just --list` to see focused targets for rendering one deck, rendering all
local decks, converting HTML snapshots, the optional Node fallback, and diff
hygiene. The docs targets require [uv](https://docs.astral.sh/uv/), which runs
pinned SmallDocs 0.5.5; the first build may need network access. Use
`just docs-serve` to serve the site, example and full comparison. The site uses
Nocturne in light and dark modes, with Nocturne and Simplex Reading as the
initial comparison pair. `just docs-check` crawls every local page, theme view,
font and image, and checks notes isolation.

GitHub Actions builds the checked site on pull requests and deploys it to
[GitHub Pages](https://rahuldave.com/htmpres/) after pushes to `main`. Only
`docs/_site/` is uploaded, including the explicit public docs allowlist and
example variants. `just pages-build` creates that verified artifact locally;
`just pages-deploy` manually reruns the main-branch publishing workflow. GitHub
Pages must be configured with GitHub Actions as its source.

`just check` uses Quarto/Deno and Python without Node; `just compat-check` also
exercises the optional Node fallback when Node is available. `just publish`
prepares the temporary private Sites preview app with both tutorial themes; the
final save/deploy step still runs through the Sites connector.

The local `scripts/htmpres.ts` file used by the Just targets is a shim to the
installable extension at `_extensions/htmpres/htmpres.ts`. In another project,
install the extension and run the extension path directly:

```sh
quarto add <repo-or-archive>
quarto run _extensions/htmpres/htmpres.ts workspace init presentations
quarto run _extensions/htmpres/htmpres.ts deck new presentations/my-deck --theme sage
quarto run _extensions/htmpres/htmpres.ts render presentations/my-deck/index.qmd
```

Agent skills are distributed separately from the Quarto extension:

```sh
npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

The renderer writes:

- `index.html`: audience deck, with speaker notes stripped from slide content.
- `presenter.html`: presenter deck, with notes shown in a presenter panel.

The tutorial demonstrates:

- Level-2 headings as slides.
- Fenced divs for layout.
- Presenter notes.
- Syntax-highlighted code blocks with optional line numbers and line-step
  transitions.
- Incremental bullet reveals, generic fragment reveals, and per-slide
  transitions.
- Deckset-inspired full, left, right, split, fit, fill, filter, and media
  patterns using Quarto containers and media attributes.
- Theme selection through `deck.theme`, with tutorial examples for `sage` and
  `mono-grid` color, typography, code-token, and media-filter tokens.
- Declarative Bootstrap, all 25 local Bootswatch, Elegant, Reading, and Tufte
  themes with light/dark/system modes; see [presentation themes](docs/themes.md).
- Global deck backgrounds through `deck.background-image`.
- Theme-level text fitting through `deck.text-fit`, `.autoscale`, and
  responsive typography tokens.
- Configurable vertical overflow policy through `deck.overflow`, including
  `fit-scroll` for text-fit first and scroll fallback when content is still too
  tall, with a bottom cue on slides that can scroll.
- Core Image-inspired browser filter approximations, including composable
  `ds-noir`, `ds-chrome`, `ds-fade`, and `ds-sharpen`.
- Zoomable images.
- Raw HTML buttons for small slide interactions.

Useful docs:

- `docs/quickstart.qmd` and `docs/example.qmd` for the runnable example and site build.
- `docs/compare.qmd` for side-by-side theme and mode selection in both HTML views.
- `docs/build-a-deck-from-markdown.md`
- `docs/authoring-cli.md`
- `docs/quarto-class-map.md` for renderer, starter CSS, and deck-local class vocabulary.
- `docs/themes.md` for the complete theme catalog, color modes, and local overrides.
- `docs/deckset-feature-status.md`
- `docs/quarto-extension.md`
- `docs/packaging.md`
