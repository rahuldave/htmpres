# Build A Deck From Markdown

This tutorial shows how to write a new deck directly in QMD and render it with
the custom `htmpres` slide shell.

The companion deck lives at `decks/tutorial/index.qmd`.

This workspace uses the local shim `scripts/htmpres.ts`. In a separate project
where the extension has been installed with `quarto add`, use
`_extensions/htmpres/htmpres.ts` in the commands instead.

## 1. Create A Deck Folder

```sh
mkdir -p decks/my-deck/assets
```

Each deck folder should contain:

- `index.qmd`: the editable markdown source.
- `source.css`: the deck-specific style sheet.
- `assets/`: images and other deck assets.

## 2. Add Front Matter

Use `pagetitle`, not `title`, so Quarto does not try to create its own title
slide when fragments are converted.

```yaml
---
pagetitle: "My Deck"
execute:
  enabled: false
resources:
  - assets/**

deck:
  css: source.css
  renderer: custom
---
```

`deck.css` tells the renderer which CSS file to inline into the generated HTML.

## 3. Write Slides With Level-2 Headings

Every slide starts with `##`.

```markdown
## Platform Story {.hero-title data-section="Opening" data-title="Platform Story"}

[Architecture]{.eyebrow}

::: hero-subtitle
The short version of the story goes here.
:::
```

Heading classes become slide classes. `data-title` is used by the table of
contents and overview. `data-section` appears as the slide footer label.

## 4. Use Fenced Divs For Layout

Use Quarto/Pandoc fenced divs for visual blocks:

```markdown
:::: three-col
::: {.card .metric-card style="--accent: var(--teal)"}
**Reusable**

Shared patterns become visible.
:::

::: {.card .metric-card style="--accent: var(--amber)"}
**Governed**

Approvals and evidence travel with the work.
:::
::::
```

Use more colons for an outer div when nesting divs. This keeps the source easy
to scan.

## 5. Add Speaker Notes

Notes are normal QMD fenced divs:

```markdown
::: notes
These notes only appear in presenter.html.
:::
```

`quarto run scripts/htmpres.ts render` removes notes from `index.html` and
places them in the presenter panel in `presenter.html`.

## 6. Add Images And Deckset-Inspired Layouts

Use normal Markdown image syntax, with Quarto/Pandoc attributes on the media
itself:

```markdown
::: diagram-frame
![System flow](assets/system-flow.svg){.ds-fit .zoomable}
:::
```

Images with `.zoomable` open the deck zoom modal when clicked.

Deckset-style layout ideas are represented with fenced div containers instead
of overloading image alt text. Containers decide where content lives; image,
video, audio, and iframe classes decide how media behaves inside the container.

Full-slide media:

```markdown
## Full-Slide Media {.title-hidden data-section="Media" data-title="Full-Slide Media"}

::: {.ds-full .ds-media .ds-no-pad}
![](assets/photo.svg){.ds-fill .zoomable}
:::

::: {.ds-layer}
### Text can sit above the filled media
:::
```

Half-slide media:

```markdown
::: {.ds-left .ds-media .ds-no-pad}
![](assets/photo.svg){.ds-fill .zoomable}
:::

::: {.ds-right .ds-pane}
### Text, lists, buttons, or cards can go here
:::
```

Split content in normal slide flow:

```markdown
:::: {.ds-split style="--ds-gap: 18px; --ds-height: 420px;"}
::: {.ds-pane .ds-frame}
### Text pane
:::

::: {.ds-pane .ds-media .ds-frame}
![](assets/detail.svg){.ds-fit .zoomable}
:::
::::
```

Useful media classes:

- `.ds-fit`: contain the whole image/video inside its box.
- `.ds-fill`: cover the box and crop if needed.
- `.ds-bn` / `.ds-bw`, `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`: simple filter presets.
- `.ds-filter`: custom filter variables such as `--ds-saturation`, `--ds-contrast`, `--ds-brightness`, `--ds-sepia`, `--ds-blur`, and `--ds-opacity`.
- `.ds-rounded`: apply a media corner radius.

For video and audio, raw HTML gives the most predictable attributes:

```markdown
<video class="ds-fill ds-controls ds-autoplay ds-muted ds-loop" src="assets/demo.mp4"></video>
<audio class="ds-controls" src="assets/narration.mp3"></audio>
<iframe class="ds-fill" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

Playback directive classes supported by the runtime:

- `.ds-controls`
- `.ds-autoplay`
- `.ds-loop`
- `.ds-muted`
- `.ds-hide`
- `.ds-autoadvance`
- `.ds-keep-time`

## 7. Add Small Interactions And Buttons

For a click-to-update panel, use raw HTML buttons with data attributes:

```markdown
::: pill-row
<button class="pill active" data-target="#examplePanel" data-title="Profile" data-text="Profiles define the allowed contract.">Profile</button>
<button class="pill" data-target="#examplePanel" data-title="Runtime" data-text="Runtime executes a governed run.">Runtime</button>
:::

::: {#examplePanel .focus-panel}
### Profile

Profiles define the allowed contract.
:::
```

The interaction helper scopes updates to the current slide, so repeated IDs in
different slides are acceptable when they are slide-local.

Any button style can use the same data attributes:

```html
<button class="pill active" data-target="#panel" data-title="Pill" data-text="...">Pill</button>
<button class="control-chip" data-target="#panel" data-title="Chip" data-text="...">Chip</button>
<button class="action-button" data-target="#panel" data-title="Action" data-text="...">Action</button>
```

## 8. Render

Render all decks:

```sh
quarto run scripts/htmpres.ts render
```

Render one deck:

```sh
quarto run scripts/htmpres.ts render decks/my-deck/index.qmd
```

Then verify:

```sh
quarto run scripts/htmpres.ts verify
```

Open:

- `decks/my-deck/index.html` for the audience view.
- `decks/my-deck/presenter.html` for the presenter view.

## 9. Import Existing HTML

When starting from an HTML deck copied into `source_presentations/`, run:

```sh
quarto run scripts/htmpres.ts convert
quarto run scripts/htmpres.ts render
quarto run scripts/htmpres.ts verify
```

The converter writes QMD, copies normal assets, extracts embedded `data:image`
assets into `assets/generated/`, and preserves supported interactive data
attributes.
