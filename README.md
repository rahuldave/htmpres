# htmpres

`htmpres` is a small Quarto/Pandoc-based toolkit for writing Markdown decks
that render to a custom HTML presentation shell. The published repo includes
public example and customization reference decks, reusable renderer code, and a SmallDocs site.

Read the [documentation](https://rahuldave.com/htmpres/) and
[compare presentation themes](https://rahuldave.com/htmpres/compare.html).

## Independent plotting

Plotfoundry's unreleased [Python guide](docs/plotting-python.qmd),
[R guide](docs/plotting-r.qmd) and [scientific gallery](docs/plotting-gallery.qmd)
are published on the documentation website with this documentation checkpoint.
The native packages work without installing htmpres or a document engine; use
pinned reviewed source/local artifacts, not a claimed PyPI/CRAN release.
[Public overview](https://rahuldave.com/htmpres/plotting-packages.html).

Included:

- `_extensions/htmpres/`: installable Quarto utility extension and runtime.
- `decks/tutorial/`: advanced customization reference deck (legacy folder name).
- `decks/example/`: twelve-slide Nocturne feature tour with inline speaker notes.
- `decks/semantic/`: semantic importance, offline math, mixed steps and appendix links.
- `decks/scripts/`: project-local runtime copies used by this workspace.
- `docs/`: SmallDocs site with authoring guides and a 38-theme comparison.
- `scripts/`: local shim plus optional Node fallback scripts.

Not included:

- Private source presentation snapshots.
- Private imported decks.
- Rendered HTML outputs and Quarto support folders.

Primary commands:

```sh
just example
just semantic
just semantic-test
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
prepares the temporary private Sites preview app with both legacy reference themes; the
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

For `.key`/`.aside`, classed equations, synchronized text/code/math steps,
appendix navigation, title emphasis, footnotes and machine-readable slide-break
lint, see [Semantic slides](docs/semantic-authoring.md). Keep generated
`assets/htmpres-math/` and theme assets with the HTML when sharing it offline.

The advanced customization reference demonstrates:

- Level-2 headings as slides.
- Fenced divs for layout.
- Presenter notes.
- Syntax-highlighted code blocks with optional line numbers and line-step
  transitions.
- Incremental bullet reveals, generic fragment reveals, and per-slide
  transitions.
- Deckset-inspired full, left, right, split, fit, fill, filter, and media
  patterns using Quarto containers and media attributes.
- Theme selection through `deck.theme`, with customization examples for `sage` and
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

- [Start a deck](docs/quickstart.qmd) for a beginner authoring tutorial with bundled themes.
- [Learn from the Markdown](docs/example.qmd) for interactive slides paired with exact source.
- [Website maintenance](docs/contributing.md) for the documentation build and deployment.
- `docs/compare.qmd` for side-by-side theme and mode selection in both HTML views.
- [Customization reference](docs/build-a-deck-from-markdown.md) for optional theme/layout overrides.
- `docs/authoring-cli.md`
- `docs/quarto-class-map.md` for renderer, starter CSS, and deck-local class vocabulary.
- `docs/themes.md` for the complete theme catalog, color modes, and local overrides.
- `docs/deckset-feature-status.md`
- `docs/quarto-extension.md`
- `docs/packaging.md`


Slides can begin with top-level `---` or `##`. A separator followed by a heading
makes one slide; an empty heading carries settings for an untitled slide. See
[the boundary contract](docs/semantic-authoring.md)
and the three-slide [mixed example](decks/slide-breaks/index.qmd), rendered with
`just slide-breaks`.

The standalone [JavaScript/Observable Plot guide](docs/plotting-javascript.qmd) includes complete browser examples and local Quarto OJS use.
