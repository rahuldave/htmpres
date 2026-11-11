# htmpres authoring CLI

Use the command line to create a deck, insert slides, choose a theme and preview
your edits. Install the Quarto extension first. You can write and present a talk without the
optional agent skills described later on this page.

For what to type inside a slide, use the [syntax reference](syntax-reference.md).

## Install the extension

In an existing presentation project, install the Quarto extension:

```sh
quarto add rahuldave/htmpres
```

If you already have a local source checkout, you can install that copy instead:

```sh
quarto add /path/to/htmpres
```

Quarto installs extensions locally under `_extensions/`. Check that folder into
the deck project so agents and collaborators run the same renderer.

## Create a presentation workspace

Keep presentations in a subfolder so generated convenience files do not collide
with files in an application repo:

```text
presentations/
  Justfile
  _extensions/htmpres/
  demo/
    index.qmd
    source.css
    assets/
```

Initialize the workspace and create a deck:

```sh
mkdir -p presentations
cd presentations
quarto add rahuldave/htmpres
quarto run _extensions/htmpres/htmpres.ts workspace init .
quarto run _extensions/htmpres/htmpres.ts deck new demo --title "Demo Deck" --theme sage
```

`workspace init` writes a generated `Justfile` only inside the presentation
workspace. If a non-htmpres `Justfile` already exists there, it writes
`htmpres.just` instead.
In that case, use `just --justfile htmpres.just render demo` and the same
`--justfile htmpres.just` option with the other generated commands.

## Render, preview and inspect a deck {#human-commands}

From the presentation workspace:

```sh
just render demo
just serve demo
just slides demo
just show demo 2
just insert demo 2 two-card
just theme demo mono-grid
```

`just serve demo` rebuilds on QMD, CSS and asset edits, then automatically
reloads the audience and presenter pages. The current slide hash and view stay
in place. Reveal steps restart on the current slide. A failed render keeps the
last good deck visible, and the next valid save recovers. Reload polling is
local to `serve --watch`; exported HTML has no preview connection.

The generated `Justfile` gives you short commands for deck tasks. Run
`workspace init` to regenerate it.

`deck new` creates the deck only. Run `workspace init` first in the presentation
folder to install or refresh the human `Justfile`.

### Insert a slide

`just insert demo 2 two-card` inserts a new slide **after slide 2**. Edit the
placeholder text and replace sample media paths before presenting. List slide
positions with `just slides demo` first.

| Template kind | Starting structure | Example or syntax |
|---|---|---|
| `hero`, `section`, `text` | Title, section divider, ordinary content | [Opening](example.qmd?slide=1), [slide headings](syntax-reference.md#slide-attributes) |
| `two-card`, `three-card`, `four-card` | Cards arranged for comparison | [Layouts](quarto-class-map.md#layout-blocks) |
| `steps` | Numbered story steps | [Starter styles](syntax-reference.md#starter-styles) |
| `diagram` | Diagram image placeholder | [Picture example](patterns.qmd?slide=3) |
| `full-media`, `left-media`, `right-media` | Full-slide or half-slide image | [Full](patterns.qmd?slide=4), [left](patterns.qmd?slide=7), [right](patterns.qmd?slide=8) |
| `split`, `media-grid` | Flowing media/text panes or image grid | [Split syntax](syntax-reference.md#picture-layouts), [grid](patterns.qmd?slide=9) |
| `code` | Code with highlight steps | [Stepped code](example.qmd?slide=5) |
| `interactive` | Buttons that replace a text panel | [Panel controls](syntax-reference.md#interactions) |
| `fragment` | Incremental list | [Try reveals](example.qmd?slide=4) |
| `profile-grid` | Profile-card scaffold | Add your own card styles and use the [generic filter attributes](syntax-reference.md#interactions) for filtering. |
| `appendix` | Supporting slide after the main talk | [Appendix navigation](example.qmd?slide=10) |

## Lint semantic source

```sh
quarto run _extensions/htmpres/htmpres.ts lint slides.qmd other.qmd --json
```

Top-level `---` and `##` start slides; a separator before a heading (with only
blank lines between) makes one slide. Code, comments, initial YAML and fenced
divs protect boundaries. Empty headings carry settings on untitled slides. Output is
`{version:1,ok,diagnostics:[{file,line,column,code,severity,message}]}`; exit 0
means valid, exit 1 means diagnostics.

The `empty-slide` diagnostic flags empty slides, including consecutive or
trailing separators.
Rendering and `verify slides.qmd` enforce the same rule. Pass explicit
source paths to verify filenames such as `slides.qmd`; no-argument verification
discovers only `decks/**/index.qmd`. For exact importance, math,
shared-step, appendix and footnote syntax, see [Semantic slides](semantic-authoring.md).

## Install the skills

Use the Vercel `skills` CLI from the deck project or globally:

```sh
npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

For development against a local checkout:

```sh
npx skills add /path/to/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

Project installation is the default and writes into the project agent skill
folder so a team can share the same workflow. Add `-g` when a single user wants
the skills available across projects.

After installing skills, invoke `htmpres-installer` to set up a deck project.
Invoke `htmpres-authoring` when the project already contains
`_extensions/htmpres/htmpres.ts`.

## Agent commands

Agents should call the extension CLI directly for stable JSON output and
operations on exact slices of slide source:

```sh
quarto run _extensions/htmpres/htmpres.ts slide list demo/index.qmd --json
quarto run _extensions/htmpres/htmpres.ts slide show demo/index.qmd 2 --json
quarto run _extensions/htmpres/htmpres.ts slide insert demo/index.qmd --after 2 --kind two-card
quarto run _extensions/htmpres/htmpres.ts slide replace demo/index.qmd 3 --from /tmp/slide.qmd
quarto run _extensions/htmpres/htmpres.ts render demo/index.qmd
```

Always inspect with `slide list` and `slide show` before replacing a slide.

## Themes

Select a bundled theme with `deck.theme`. See
[the full catalog and color modes](themes.md). The original editable seeds are:

- `sage`
- `mono-grid`
- `blank`

The catalog also includes Bootstrap, the 25 SmallDocs Bootswatch themes,
Folio/Atelier/Nocturne, five Reading refinements, and Tufte. Use
`deck.color-mode: light`, `dark`, or `auto` with imported themes. For example:

```sh
quarto run _extensions/htmpres/htmpres.ts deck new demo --theme folio --color-mode auto
```

`deck new --theme sage` writes editable deck-local CSS. To create a custom
theme, copy a seed into the deck CSS and set the deck front matter:

```sh
quarto run _extensions/htmpres/htmpres.ts theme add demo/index.qmd my-theme --from sage
quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd my-theme
```

Edit `demo/source.css` after the seed is copied. Slide templates should use
semantic classes and CSS tokens so they remain portable across themes. The
built-in section template uses `.section-divider` and `.lead`, which both belong to
the starter CSS vocabulary in `docs/quarto-class-map.md`. Define custom classes
such as `.why-line` in the deck-local `source.css` or a theme stylesheet.
