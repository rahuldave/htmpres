# htmpres

`htmpres` is a small Quarto/Pandoc-based toolkit for writing Markdown decks
that render to a custom HTML presentation shell. The published repo is scoped
to the tutorial deck and reusable renderer code.

Included:

- `_extensions/htmpres/`: installable Quarto utility extension and runtime.
- `decks/tutorial/`: hand-authored tutorial deck and tutorial assets.
- `decks/scripts/`: project-local runtime copies used by this workspace.
- `docs/`: authoring, packaging, and class-map notes.
- `scripts/`: local shim plus optional Node fallback scripts.

Not included:

- Private source presentation snapshots.
- Private imported decks.
- Rendered HTML outputs and Quarto support folders.

Primary commands:

```sh
just tutorial
just verify
just check
```

Run `just --list` to see focused targets for rendering one deck, rendering all
local decks, converting HTML snapshots, the optional Node fallback, and diff
hygiene. `just check` uses the Quarto/Deno path only; `just compat-check` also
exercises the optional Node fallback when Node is available.

The local `scripts/htmpres.ts` file used by the Just targets is a shim to the
installable extension at `_extensions/htmpres/htmpres.ts`. In another project,
install the extension and run the extension path directly:

```sh
quarto add <repo-or-archive>
quarto run _extensions/htmpres/htmpres.ts render decks/my-deck/index.qmd
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
- Global deck backgrounds through `deck.background-image`.
- Theme-level text fitting through `deck.text-fit`, `.autoscale`, and
  responsive typography tokens.
- Core Image-inspired browser filter approximations, including composable
  `ds-noir`, `ds-chrome`, `ds-fade`, and `ds-sharpen`.
- Zoomable images.
- Raw HTML buttons for small slide interactions.

Useful docs:

- `docs/build-a-deck-from-markdown.md`
- `docs/quarto-class-map.md`
- `docs/deckset-feature-status.md`
- `docs/quarto-extension.md`
- `docs/packaging.md`
