# Build A Deck From Markdown

This tutorial shows how to write a new deck directly in QMD and render it with
the custom `htmpres` slide shell.

The companion deck lives at `decks/tutorial/index.qmd`.

For semantic importance, offline math, shared text/code/equation steps and
appendix links, see [Semantic slides](semantic-authoring.md) and its complete
audience/presenter example. New slides start with `##`; standalone body `---`
outside code is an error. Check with `htmpres.ts lint slides.qmd --json`.

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
  theme: mono-grid
  background-image: assets/background.svg
  background-filter: theme sharpen
  background-opacity: 0.08
  text-fit: true
  overflow: fit-scroll
---
```

`deck.css` tells the renderer which CSS file to inline into the generated HTML.
`deck.theme` is copied to `data-theme` on the generated `<html>` element.
Bundled Bootstrap, Bootswatch, Elegant, Reading, and Tufte themes can be selected
directly, with `deck.color-mode: light|dark|auto`; see [Presentation themes](themes.md).
`deck.background-*` options create a global background layer, and
`deck.text-fit` enables runtime typography fitting. `deck.overflow` controls
what happens when content is still too tall; `fit` and `fit-scroll`
automatically run the fitting pass, and `fit-scroll` turns on scrolling only
for slides that still overflow. Scrollable slides show a small bottom cue until
the reader scrolls near the end of the slide.

## 3. Choose A Theme

Themes are ordinary CSS variable sets selected from front matter. Keep layout
classes structural, and put palette, typography, code token colors, and default
media filters in theme selectors:

```css
:root,
html[data-theme="sage"] {
  --bg: #f5f7f4;
  --paper: #ffffff;
  --font-body: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-body);
  --htmpres-text-fit-min: 0.64;
  --ds-theme-filter: saturate(1.03) contrast(1.04) brightness(1.01);
  --ds-sharpen-filter: url("#htmpres-sharpen");
}

html[data-theme="mono-grid"] {
  --bg: #eef3f7;
  --paper: #fbfcfd;
  --font-body: "Helvetica Neue", Arial, ui-sans-serif, system-ui, sans-serif;
  --font-display: ui-monospace, "SFMono-Regular", Consolas, monospace;
  --ds-theme-filter: saturate(0.78) contrast(1.18) brightness(1.04) hue-rotate(-8deg);
  --ds-sharpen-filter: url("#htmpres-sharpen");
}
```

Use `.ds-theme-filter` on media that should receive the active theme's default
filter. Use `.ds-original` when a media item must bypass theme filtering.

## 4. Add A Global Background

Use front matter when the whole deck should carry the same low background
image. The renderer inserts a `.ds-global-background` layer into every slide:

```yaml
deck:
  background-image: assets/background.svg
  background-fit: fill
  background-filter: theme sharpen
  background-opacity: 0.08
```

`background-fit` accepts `fill` or `fit`. `background-filter` accepts filter
tokens such as `theme`, `bn`, `noir`, `chrome`, `fade`, `vivid`, `sharpen`, or
`original`. Use `.no-background` on a slide or
`data-background-image="none"` when a slide should opt out.

## 5. Enable Theme-Level Text Fitting

Use `deck.text-fit: true` to let the runtime scale down theme typography when
a slide would overflow:

```yaml
deck:
  text-fit: true
  text-fit-min: 0.64
  overflow: fit-scroll
```

The runtime sets `--htmpres-text-fit-scale` on active slides. Themes decide
which typography tokens respond, for example `--htmpres-h2-size`,
`--htmpres-hero-title-size`, `--htmpres-h3-size`, `--htmpres-body-size`, and
`--htmpres-small-size`. Code blocks can also respond through
`--htmpres-code-size`. Use `.autoscale` or `data-text-fit="true"` for a single
slide, and `.no-autoscale` or `data-text-fit="false"` for an exception.

Supported overflow modes are:

- `hidden`: keep the slide fixed and clip overflow.
- `scroll`: allow slide scrolling.
- `fit`: run text fitting but keep overflow clipped if the slide remains too
  tall.
- `fit-scroll`: run text fitting first, then allow scrolling only when the
  active slide still overflows. A small bottom cue appears while more content is
  below the visible slide area.

## 6. Write Slides With Level-2 Headings

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

## 7. Use Fenced Divs For Layout

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

Use `docs/quarto-class-map.md` as the class reference. A class is reusable
when it has renderer behavior or starter CSS there. Other classes are ordinary
deck-local hooks: define them in the deck's `source.css` or theme stylesheet.
For example, `::: lead` is part of the starter vocabulary, while a custom block
such as `::: why-line` only has meaning in decks whose CSS defines
`.why-line`.

```markdown
::: lead
A short framing sentence for the slide or section.
:::
```

## 8. Add Speaker Notes

Notes are normal QMD fenced divs:

```markdown
::: notes
These notes only appear in presenter.html.
:::
```

`quarto run scripts/htmpres.ts render` removes notes from `index.html` and
places them in the presenter panel in `presenter.html`.

## 9. Highlight Code By Line

Use Pandoc fenced-code attributes for highlighted code examples:

````markdown
```{.python .numberLines data-steps="none|2|3|4|all"}
def render_slide(slide):
    html = markdown_to_html(slide["body"])
    if slide.get("notes"):
        write_presenter_notes(slide["notes"])
    return f"<section>{html}</section>"
```
````

The language class, such as `.python`, enables Pandoc syntax highlighting.
Use `.numberLines` for line numbers. Use `data-highlight` for persistent line
highlights, and `data-steps` for code transitions that consume Next, Space,
PageDown, Previous, or PageUp before the deck changes slides.

Line specs accept comma-separated numbers and ranges:

- `data-highlight="2,4-5"`
- `data-steps="none|2|3-4|all"`

Use `data-highlight` only when a line should stay highlighted across every
step. Use a leading `none` step when the block should start with no active
line.

## 10. Add Bullet, Fragment, And Slide Transitions

Wrap a list in `.incremental` to reveal list items one-by-one:

```markdown
::: {.incremental data-fragment-effect="rise"}
- First point
- Second point
- Third point
:::
```

Use `.fragment` on any fenced div to reveal a whole block. Optional
`data-fragment-index` values let multiple blocks reveal together, and
`data-fragment-effect` maps to CSS effect classes such as `rise`, `left`,
`right`, `scale`, `blur`, `highlight`, `dim`, or `none`.

```markdown
::: {.card .fragment data-fragment-index="2" data-fragment-effect="highlight"}
**Reveal me later**
:::
```

Put transition classes on slide headings, or set `data-transition` and let the
runtime add the matching class:

```markdown
## Enter From The Side {.transition-slide data-transition="slide"}

## Fade In {data-transition="fade"}

## No Motion {.transition-none}
```

Supported slide transitions are `.transition-fade`, `.transition-slide`,
`.transition-zoom`, and `.transition-none`.

Mixed slides use one step graph. Shared `data-fragment-index` text numbers
and code/equation `data-step-indices` mappings advance together, even across
columns. Sparse numbers consume no empty keypresses. Without mappings, mixed
events run in source order. Ordinary revealed text remains visible; `dim`
keeps the latest text point current until another text point appears. Only
legacy unmapped code-only slides retain their first-snapshot baseline and
shared kth snapshots across code blocks.

Persistent `data-highlight` lines and slide transitions do not consume a
navigation step. The transition runs when entering the next slide after all
frames have completed. See [Semantic slides](semantic-authoring.md) for
copyable shared code/text/equation examples.

## 11. Add Images And Deckset-Inspired Layouts

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

::: {.ds-full .ds-media .ds-no-pad .ds-readable}
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

Inline image groups and grids use the same split: the enclosing div lays out
the group, while each media element keeps its own fit/fill/filter behavior.

```markdown
:::: {.ds-grid style="--ds-columns: 3; --ds-gap: 14px;"}
::: {.ds-media}
![](assets/photo-1.svg){.ds-fill .ds-bn}
:::

::: {.ds-media}
![](assets/photo-2.svg){.ds-fill .ds-theme-filter}
:::

::: {.ds-media .ds-vignette style="--ds-vignette: 0.42;"}
![](assets/photo-3.svg){.ds-fill .ds-filter .ds-sharpen style="--ds-saturation: 1.15; --ds-contrast: 1.1; --ds-exposure: 0.08;"}
:::
::::
```

Useful media classes:

- `.ds-fit`: contain the whole image/video inside its box.
- `.ds-fill`: cover the box and crop if needed.
- `.ds-bn` / `.ds-bw`, `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`: simple filter presets.
- `.ds-filter`: custom filter variables such as `--ds-grayscale`, `--ds-sepia`, `--ds-saturation`, `--ds-contrast`, `--ds-brightness`, `--ds-exposure`, `--ds-hue`, `--ds-blur`, and `--ds-opacity`.
- `.ds-theme-filter`: apply the active theme's `--ds-theme-filter` value.
- `.ds-sharpen`: apply the browser SVG sharpen filter and compose it with preset or custom CSS filters.
- `.ds-original`: remove filters from a media item.
- `.ds-alpha`: opacity via `--ds-opacity`.
- `.ds-rounded`: apply a media corner radius.
- `.ds-vignette` / `.ds-vignette-light`: edge vignette via `--ds-vignette`, `--ds-vignette-size`, and optionally `--ds-vignette-color`.
- `.ds-readable`: add a readability gradient overlay to a background media container.

Use `.ds-vignette` and `.ds-readable` on a media wrapper or full-slide media
container, because they are overlay effects. Keep text that should sit above a
full-slide overlay in a separate `.ds-layer` container.

`ds-noir`, `ds-chrome`, `ds-fade`, exposure, and sharpen are Core
Image-inspired browser approximations. Browser CSS/SVG filters do not expose
Apple's private photo-effect lookup tables, so these are stable htmpres
matches rather than pixel-exact Core Image output.

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

## 12. Add Small Interactions And Buttons

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

## 13. Render

Render the tutorial deck:

```sh
just tutorial
```

Render one deck:

```sh
just render decks/my-deck/index.qmd
```

Then verify:

```sh
just verify
```

Open:

- `decks/my-deck/index.html` for the audience view.
- `decks/my-deck/presenter.html` for the presenter view.

## 14. Import Existing HTML

When starting from an HTML deck copied into `source_presentations/`, run:

```sh
just convert
just render-all
just verify
```

The converter writes QMD, copies normal assets, extracts embedded `data:image`
assets into `assets/generated/`, and preserves supported interactive data
attributes.
