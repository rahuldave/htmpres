# QMD class map

The editable deck source is Quarto-flavored Markdown. The renderer uses
Quarto/Pandoc for Markdown fragments, then writes a custom HTML slide shell
with navigation, overview, zoom, presenter notes, and small interactions.

## Slide syntax

Slides start with top-level `---` or a level-2 heading; a separator immediately
before a heading makes one slide. Empty headings carry untitled-slide settings.
Heading classes and data attributes
are copied to the generated `<section class="slide">`.

```markdown
## Platform Story {.hero-title data-section="Opening" data-title="Platform Story"}
```

Common slide classes:

- `.hero-title`: title-slide treatment.
- `.section-divider`: centered chapter slide.
- `.diagram-slide`: full-slide diagram treatment for legacy imports.
- `.title-hidden`: keeps a navigation title while visually hiding the slide heading.
- `.autoscale`: enables text fitting for one slide.
- `.no-autoscale`: opts one slide out of deck-level text fitting.
- `.no-background`: opts one slide out of a global deck background.

## Semantic importance, math and titles

Use `[The claim.]{.statement}`, `[The point.]{.key}` and `[A qualification.]{.aside}`, or fenced
`::: {.key}` / `::: {.aside}` blocks. The theme maps importance to weight,
size and ink. Use semantic roles without inline styles or font choices. Optional
matched-color overrides are the explicit exception; see the examples below.
.key and the other semantic roles work in all paired themes, in both modes.

 `.key` uses importance token level 3,
`.aside` level 1, `.statement` level 4, `.credit`/`.source` level 0 and ordinary body level 2; themes expose levels 0 to 4 as
`--htmpres-importance-N-scale`, `-weight` and `-ink` for future remapping.
There are no numbered author classes.

Titles accept inline Markdown, for example `## Why *structure* matters {#structure}`.
Math uses `$x^2$` / `$$...$$` and local KaTeX assets. Name a term with
`\htmlClass{term-a}{x}`; only this KaTeX HTML extension is trusted. Keep the
rendered `assets/htmpres-math/` folder with the HTML for offline viewing.
Standard footnotes are unique across slides, title notes and presenter cues;
write `[^1]` and `[^1]: Source.` normally.

See [Semantic slides](semantic-authoring.md) for complete, copyable examples
and the [audience demo](_generated/semantic/index.html).

## Statement, picture credit, quote source and counter

Jonathan Schwabish's *Better Presentations* (2017) motivates these hooks.
They cover dominant claims (pp. 70 to 72), spare statement/header slides (pp. 139 to 140), picture
credits and endnotes (pp. 128 to 129). His examples also cover quotations with highlighted passages and
sources (pp. 72 to 73), and omitting audience slide numbers (pp. 69 to 70).

| Hook | Meaning |
|---|---|
| `.statement` span or block | Dominant claim; importance level 4. A solo block on an untitled slide is centered and supports text fit. |
| `.credit` span or block | Picture attribution; level-0 type in a reserved lower-right lane with opaque theme backing. Multiple credits stack. |
| `.quote` on a slide heading | Quotation treatment for an ordinary Markdown blockquote. |
| `.source` span or block | Level-0 source line kept with the quotation. `.key` works inside the quote. |
| `deck.counter: presenter` in initial YAML | Hide the counter in audience output and retain it in presenter output, including the appendix. |

Level 0 has purpose-specific attribution marks, not a generic small-text class.
There are no numbered author classes. This complete deck demonstrates all hooks
(replace `assets/photo.jpg` with your own picture):

```markdown
---
pagetitle: Semantic hooks
deck:
  theme: nocturne
  text-fit: true
  counter: presenter
---

## {#claim data-title="The claim"}

::: {.statement}
Structure makes the argument memorable.
:::

## A picture {#picture}

::: {.ds-full .ds-media .ds-fill .ds-no-pad}
![A description of the picture](assets/photo.jpg)
:::

[Photo: Creator, [source record](#sources).]{.credit}

## One idea {.quote}

> An effective slide gives the audience [one idea to remember.]{.key}
>
> [Example quotation written for this demonstration.]{.source}

## Source record {#sources data-kind="appendix"}

The complete picture attribution belongs here.

[Back to the picture](#picture).
```

`counter: true` (the default) shows both counters; `false` hides both;
`presenter` hides only the audience counter. Empty/unknown values are
`deck-counter` lint errors; verification catches stale generated visibility.
A block credit/source uses `::: {.credit}` / `::: {.source}`, text, then `:::`.
Picture credits move to their lane; source lines stay with the quote. Keep
lengthy attribution in endnotes so the picture credit remains short and readable.
See the [complete guide](semantic-authoring.md#picture-credits) and
[runnable example](_generated/authoring-hooks/index.html).

## Matched final view

`## A result {data-step-summary="match"}` adds one automatic final step after
all text/code/equation reveals. Named source parts and explaining text share their colors from each group's
first reveal, retaining earlier colors as the slide builds. On the final step,
the last teaching highlight and dimming clear. Previous
restores the final teaching highlight. Omit the attribute to retain normal
behavior.

| Author syntax | Meaning |
|---|---|
| `[The mean.]{data-match="mean"}` | Name an explaining span; also works on a fenced block. |
| `data-line-matches="1:observations\|2:total\|3:mean"` on a code fence | Match code line numbers to the explanations. Ranges and comma selections are supported. |
| `\htmlClass{mean}{\bar{x}}` inside an `.equation-steps` block | Match that equation term to `data-match="mean"`. |
| `data-match-color="#245c88" data-match-color-dark="#91c9f0"` beside `data-match` | Override a pair's colors directly on one span. |
| `data-match-colors="mean=#245c88\|total=#765013"` on the slide heading | Define a slide palette without editing CSS. Add `data-match-colors-dark` for dark-mode values. |
| `--htmpres-match-mean: #245c88;` in CSS | Set a semantic color across slides. |

Names begin with a lowercase letter and contain lowercase letters, digits or
hyphens (`enclosing` is reserved for KaTeX). They are independent of step indices; the renderer computes the extra
frame and required color slots. The [complete syntax and color guide](semantic-authoring.md#finish-with-matched-colors)
includes copyable code/equation slides, direct inline-math attributes, defaults,
override precedence and contrast limits. Semantic-only QMD remains the default;
the optional color attributes are explicit author overrides.

## Presenter notes

Speaker notes are authored as a fenced div:

```markdown
::: notes
Use this as the presenter cue.
:::
```

During rendering, notes are removed from audience slide content and written to
the presenter notes panel in `presenter.html`.

## Layout blocks

Use fenced divs for structure. These examples use theme defaults; customize
appearance in the theme stylesheet, keeping QMD semantic:

```markdown
:::: three-col
::: {.card .metric-card}
**Reusable**

Shared patterns become visible.
:::
::::
```

Class ownership is intentionally split:

- Renderer/runtime classes have behavior in `_extensions/htmpres/htmpres.ts`
  or the runtime assets.
- Starter CSS classes are styled by the packaged `source.css` seed and can be
  copied into a deck.
- Deck-local classes are just normal Quarto classes until that deck or theme
  defines them in CSS.

Common starter CSS layout classes include:

- `.lead`: short framing copy, used by the built-in section slide template.
- `.two-col`, `.three-col`, `.card`, `.metric-card`, `.callout`
- `.diagram-frame`, `.code-card`, `.checklist`, `.focus-panel`, `.theme-sample`
- `.pill-row`, `.pill`, `.control-chip`, `.action-button`

If a class such as `.why-line` appears in a deck but is not listed here, look
in that deck's `source.css` or theme stylesheet. It is a deck-local hook unless
the reusable class map documents it.

## Themes

For Bootstrap, Bootswatch, Elegant, Reading, and Tufte adapters and their
light/dark/auto selection, see [Presentation themes](themes.md). Existing
deck-local theme blocks continue to work as described below.

Set `deck.theme` in front matter to select a CSS variable set:

```yaml
deck:
  css: source.css
  renderer: custom
  theme: mono-grid
  overflow: fit-scroll
```

The renderer copies the theme to `<html data-theme="mono-grid">` and overflow
to `<html data-overflow="fit-scroll">`. Deck CSS can then split structural
layout from theme concerns:

```css
:root,
html[data-theme="sage"] {
  --font-body: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-body);
  --htmpres-text-fit-min: 0.64;
  --ds-theme-filter: saturate(1.03) contrast(1.04) brightness(1.01);
  --ds-sharpen-filter: url("#htmpres-sharpen");
}

html[data-theme="mono-grid"] {
  --font-body: "Helvetica Neue", Arial, ui-sans-serif, system-ui, sans-serif;
  --font-display: ui-monospace, "SFMono-Regular", Consolas, monospace;
  --ds-theme-filter: saturate(0.78) contrast(1.18) brightness(1.04) hue-rotate(-8deg);
  --ds-sharpen-filter: url("#htmpres-sharpen");
}
```

Theme variables currently cover deck colors, typography, code token colors,
panel colors, media frame colors, filter preset values, `.ds-theme-filter`,
and text-fit typography tokens.

## Global backgrounds and text fit

Set global background and text-fit behavior in front matter:

```yaml
deck:
  background-image: assets/background.svg
  background-fit: fill
  background-filter: theme sharpen
  background-opacity: 0.08
  text-fit: true
  text-fit-min: 0.64
  overflow: fit-scroll
```

The renderer inserts `.ds-global-background` inside each slide. Per-slide
overrides use `data-background-image`, `data-background-fit`,
`data-background-filter`, `data-background-position`,
`data-background-opacity`, and `data-background-class`. Use
`data-background-image="none"` or `.no-background` to opt out.

Text fitting uses `deck.text-fit`, `.autoscale`, `.no-autoscale`,
`data-text-fit`, and `data-text-fit-min`. The runtime measures the active
slide, sets `--htmpres-text-fit-scale`, and themes decide which typography
tokens scale. `deck.overflow` can be `hidden`, `scroll`, `fit`, or
`fit-scroll`; the `fit` modes trigger that same fitting pass, and
`fit-scroll` only scrolls slides that still overflow. Scrollable slides show a
small bottom cue while more content is below the visible slide area.

## Deckset-inspired containers

Deckset uses image alt-text modifiers for full backgrounds, split images,
fit/fill, filters, video, and audio. In `htmpres`, the same ideas are expressed
with composable Quarto containers plus media attributes:

- Place the container with `.ds-full`, `.ds-left`, `.ds-right`, `.ds-split`, `.ds-pane`, `.ds-media`, `.ds-grid`, `.ds-inline`, `.ds-global-background`.
- Set media behavior with `.ds-fit`, `.ds-fill`, `.ds-rounded`, `.zoomable`, and filter classes.
- `.ds-layer` raises text or controls above full-slide media on a theme-controlled readable panel.
- `.ds-no-pad`, `.ds-no-border`, `.ds-frame`, `.ds-center`, `.ds-top`, and `.ds-bottom` tune the container box.

### Pictures that fit, with accessible descriptions

Jonathan Schwabish, *Better Presentations* (2017), pp. 118 to 124, recommends
letting a strong picture fill the slide. Adam Wathan and Steve Schoger,
*Refactoring UI*, "Text needs consistent contrast," pp. 202 to 204, explain why
picture overlays need a dependable ground. The patterns use semantic roles. The theme supplies ink, backgrounds and typography.

Every meaningful picture needs a description between `![` and `]`. The
`lint`, `render` and `verify` commands reject an empty or missing description
with an `image-description` **error**, including pictures in presenter notes,
reference images and raw HTML. Diagnostics identify the slide and point to its
starting line. For example, slide 3 titled "A titled picture, empty description"
produces this exact message:

```text
Slide 3 (A titled picture, empty description): describe this picture, or mark a purely decorative picture with {.decorative}.
```

`lint --json` retains schema version 1 and includes `severity: "error"`,
`code: "image-description"`, `slide`, `slideId`, `line` and `column`; it exits
with status 1. Both verifiers also reject exported images with no `alt`
attribute, including serialized presenter notes. All rendered images have an
`alt` attribute. Code examples and comments are not pictures.

For a purely decorative picture that adds no information, explicitly write an
empty description with `.decorative` on the **image**:

```markdown
## A decorative texture

![](assets/texture.svg){.decorative .ds-fit}
```

The decorative image renders `alt=""` and lint accepts it. Raw HTML may use
`<img src="assets/texture.svg" class="decorative" alt="">`. Do not mark an
informative picture decorative to remove a caption; the described `.ds-full`
form below already hides its visible caption. `data-background-image` remains
the decorative full-slide background form. These HTML attributes are retained
when printing; htmpres does not provide a separate tagged-PDF export.

For a titled slide containing one picture and an optional credit, write:

```markdown
## One queue before one database {data-section="The bottleneck"}

![Students wait for one database to answer their searches.](assets/photo.svg){.ds-fit}

[Picture: Creator, source and license.]{.credit}
```

The description becomes both the image's screen-reader `alt` and its visible
caption. The picture, caption and credit fit below the title, without cropping
the picture. It grows to a limiting edge of the space below the title,
reserving the actual caption, credit and section-label boxes plus the theme's
gaps. It can scale beyond its intrinsic size, including viewBox-only SVGs.

Captions are centered under centered pictures. Wide, tall and 16:9 images use the same syntax. `.ds-fit` is
optional for this one-picture layout. Wrapping the image in `::: {.ds-media}`
also works; a linked image keeps its native Markdown caption behavior.
`.ds-fill` deliberately crops to fill the available picture box.

For a full-slide picture, keep its description and omit the visible heading:

```markdown
## {data-title="A queue before one database" data-section="The bottleneck"}

::: {.ds-full .ds-media .ds-no-pad}
![Students wait for one database to answer their searches.](assets/photo.svg){.ds-fill}
:::

[Picture: Creator, source and license.]{.credit}
```

Inside `.ds-full`, the description stays in `alt` and the automatically
generated caption is hidden, including from screen readers. The image itself
retains its accessible name. `data-title` supplies the navigation label without
a visible title. Use `.ds-fit` instead of `.ds-fill` when showing the complete
picture matters more than filling the slide.

For text over the picture, add a semantic layer:

```markdown
## {data-title="Every search repeats the work" data-section="The bottleneck"}

::: {.ds-full .ds-media .ds-no-pad .ds-readable}
![Students wait for one database to answer their searches.](assets/photo.svg){.ds-fill}
:::

::: {.ds-layer}
[Every search reads the same rows.]{.key}
:::

[Picture: Creator, source and license.]{.credit}
```

`.ds-readable` adds a gradient without changing the full-slide geometry; it
also works on a contained `.ds-media` picture. `.ds-layer` has an opaque,
theme-controlled text panel. Its nested `.key` uses that panel's ink while
retaining semantic emphasis. The panel keeps text readable on dark, bright and
mixed pictures; a transparent gradient alone cannot guarantee that contrast.

A decorative background can carry a visible title and body text directly:

```markdown
## Every search repeats the work {data-background-image="assets/photo.svg" data-section="The bottleneck"}

[Read the data once, then reuse the result.]{.key}

[Picture: Creator, source and license.]{.credit}
```

The title and body receive the same theme-controlled panels. Background layers
are decorative (`aria-hidden`); use the described `.ds-full` image pattern
above when the picture itself needs an accessible description.

In all four examples, `data-section` keeps a readable section label on its own
opaque theme ground. The credit lane remains separate. A left/right picture
beside a list also starts below the title and leaves space for its caption and
credit. Automatic fitting targets the one-picture or two-pane structures;
complex multi-picture compositions retain their authored container layout.

Themes can override `--htmpres-media-text-bg`, `--htmpres-media-text-ink`,
`--htmpres-media-label-bg` and `--htmpres-media-label-ink`. Defaults use theme
paper and an ink targeting 4.8:1 contrast, following the attribution policy.
Authors can use these layouts without CSS, colors or sizes. Every informative
image needs a description; decorative images need an explicit `.decorative` mark.

Half-slide media:

```markdown
::: {.ds-left .ds-media .ds-no-pad}
![Describe the photograph](assets/photo.svg){.ds-fill .zoomable}
:::

::: {.ds-right .ds-pane}
### Text, buttons, or lists go here
:::
```

Split flow layout:

```markdown
:::: {.ds-split}
::: {.ds-pane .ds-frame}
### Text pane
:::

::: {.ds-pane .ds-media .ds-frame}
![Describe the detail](assets/detail.svg){.ds-fit .zoomable}
:::
::::
```

## Media classes

Use layout classes on containers and fit/filter classes on the media. Wrapper
effects such as vignette and readability overlays belong on the nearest
container, because they use pseudo-elements around the media.

- `.ds-fit`: contain the whole asset.
- `.ds-fill`: cover the box and crop if needed.
- `.ds-bn` / `.ds-bw`: black and white.
- Filter presets include `.ds-vivid`, `.ds-noir`, `.ds-chrome` and `.ds-fade`.
- `.ds-filter`: custom filter variables such as `--ds-grayscale`, `--ds-sepia`, `--ds-saturation`, `--ds-contrast`, `--ds-brightness`, `--ds-exposure`, `--ds-hue`, `--ds-blur`, and `--ds-opacity`.
- `.ds-theme-filter`: apply the active theme's `--ds-theme-filter` value.
- `.ds-sharpen`: apply the browser SVG sharpen filter and compose it with preset or custom CSS filters.
- `.ds-original`: remove filters from a media item.
- `.ds-alpha`: opacity via `--ds-opacity`.
- `.ds-zoom`: visual zoom via `--ds-scale`.
- `.ds-vignette` / `.ds-vignette-light`: edge vignette via `--ds-vignette`, `--ds-vignette-size`, and optionally `--ds-vignette-color`.
- `.ds-readable`: readability gradient via `--ds-readable-angle`, `--ds-readable-start`, and `--ds-readable-end`.

Three inline images laid out by an enclosing div:

```markdown
:::: {.ds-grid}
::: {.ds-media}
![Describe picture 1](assets/photo-1.svg){.ds-fill .ds-bn}
:::

::: {.ds-media}
![Describe picture 2](assets/photo-2.svg){.ds-fill .ds-theme-filter}
:::

::: {.ds-media .ds-vignette}
![Describe picture 3](assets/photo-3.svg){.ds-fill .ds-filter .ds-sharpen}
:::
::::
```

`ds-noir`, `ds-chrome`, `ds-fade`, exposure, and sharpen are Core
Image-inspired browser approximations. They are stable CSS/SVG mappings, not
pixel-exact Apple Core Image output.

Set custom media filter, gap, height and grid variables in the theme
stylesheet. The QMD examples use the theme defaults.

Media playback directive classes:

- `.ds-controls`: show native playback controls.
- `.ds-autoplay`: request playback when the slide becomes active; browser autoplay policy still applies.
- `.ds-loop`: repeat playback.
- `.ds-muted`: mute playback.
- `.ds-hide`: hide the player visually and from screen readers.
- `.ds-autoadvance`: advance the deck when this active slide's media ends.
- `.ds-keep-time`: retain the playback position when leaving the slide; other media reset.

For video, audio, and embeds, raw HTML is the most predictable authoring form:

```html
<video class="ds-fill ds-controls ds-autoplay ds-muted ds-loop" src="assets/demo.mp4"></video>
<audio class="ds-controls" src="assets/narration.mp3"></audio>
<iframe class="ds-fill" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

## Images and zoom

Normal images use Pandoc image attributes:

```markdown
![System flow](assets/system-flow.svg){.ds-fit .zoomable}
```

Clicking a `.zoomable` image opens the custom deck zoom modal. Press `Esc` or
click outside the image to close it.

## Code blocks

Use fenced-code attributes for syntax highlighting, line numbers, static line
highlights, and step-through code transitions:

````markdown
```{.python .numberLines data-steps="none|2|3|4|all"}
def render_slide(slide):
    html = markdown_to_html(slide["body"])
    if slide.get("notes"):
        write_presenter_notes(slide["notes"])
    return f"<section>{html}</section>"
```
````

Supported code attributes:

- Language class, such as `.python`, `.js`, `.html`, or `.yaml`, enables Pandoc syntax highlighting.
- `.numberLines` enables Pandoc line-number anchors.
- `data-highlight="2,4-5"` applies persistent line highlights.
- `data-steps="none|2|3-4|all"` adds per-slide code steps before moving to the next slide.
- `data-highlight-steps` is accepted as a more explicit alias for `data-steps`.
- `data-step-indices="1|3|7"` maps code snapshots to shared text/equation frames.

## Transitions and fragments

Use `.incremental` around a list to reveal each list item one step at a time:

```markdown
::: {.incremental data-fragment-effect="rise"}
- First point
- Second point
- Third point
:::
```

Use `.fragment` on any fenced div or raw HTML block that should reveal as a
unit:

```markdown
::: {.card .fragment data-fragment-index="2" data-fragment-effect="highlight"}
**Reveal me later**
:::
```

Supported fragment classes and data values:

- `.fragment`: a revealable block.
- `.incremental`: reveal direct list items in source order.
- `data-fragment-index="2"`: reveal multiple fragments on the same step.
- `data-fragment-effect="rise|left|right|scale|blur|highlight|dim|none"`: add the matching effect class at runtime.

Auto-numbered fragments advance past explicit indexes. Repeat an explicit
`data-fragment-index` only when multiple fragments should reveal together.

Supported slide transition classes:

- `.transition-fade`
- `.transition-slide`
- `.transition-zoom`
- `.transition-none`

The equivalent `data-transition="fade|slide|zoom"` attribute can be used on a
slide heading when the author prefers data attributes.

Mixed slides use one ordered step graph. Match text
`data-fragment-index="1"` with code `data-step-indices="1|3|7"` to change both
columns together. A mapped code/equation lane starts inactive and holds its
latest snapshot until its next mapped frame. Sparse indices consume no empty
keypresses. Earlier ordinary fragments stay visible; `dim` is opt-in.

For equations, wrap classed math in
`::: {.equation-steps data-equation-steps="term-a|term-b|term-a,term-b" data-step-indices="1|3|7"}`.
Use `\htmlClass{term-a}{x}` and `\htmlClass{term-b}{y}` in the equation.
Only referenced named terms dim; unrelated operators keep their appearance.

Stepped display math defaults to twice the fitted body size; theme CSS can
set `--htmpres-equation-scale`. Inline math and notes retain their normal size.
Mappings require one decimal positive safe integer per snapshot, strictly
increasing within a block. Invalid mappings warn and fall back to source order.

Unmapped mixed events run in source order. Existing unmapped code-only slides
retain their first snapshot as a baseline, with multiple blocks sharing kth
snapshots. `data-fragment-index="0"` remains a baseline reveal. Spans with
`.fragment` and list items inherit `data-fragment-effect="dim"` from their
incremental container, including inside columns. Future text stays hidden;
earlier text dims and the latest text point stays current while another lane
advances. No mode shows future text in grey.

The following do not consume navigation steps:

- Persistent `data-highlight` line highlights.
- Slide transitions.
- Media playback directives such as `.ds-autoplay`.

## Interactivity

The packaged interaction helper supports a generic data-driven button pattern:

```markdown
::: {.pill-row}
<button class="pill active" data-target="#examplePanel" data-title="Surface" data-text="Surfaces call the same runtime contract.">Surface</button>
<button class="pill" data-target="#examplePanel" data-title="Runtime" data-text="Runtime records evidence.">Runtime</button>
:::

::: {#examplePanel .focus-panel}
### Surface

Surfaces call the same runtime contract.
:::
```

The interaction helper scopes updates to the current custom `.slide`, falling
back to the document only when necessary.

## Slide iDs, appendix and breaks

`## Extra {#appendix-data data-kind="appendix"}` starts a trailing appendix.
All later slides belong to it. Normal counters, Next, End and media
advancement stop at the final main slide; appendix counters are separate.
Use `[The data](#appendix-data)` and `[Back](#main-result)` to navigate to
explicit slide IDs with live hash/history support. Same-slide footnote links
retain the reveal frame. Fallback IDs are collision-safe `slide-N`; duplicate
explicit slide IDs are rejected.

A slide starts at top-level `---` or `##`. A separator followed by a heading
(with only blank lines between) makes one slide. Empty headings carry attributes
without a visible title. Code, comments, initial YAML and fenced divs protect
boundaries; rules inside notes stay in the notes. Run
`quarto run _extensions/htmpres/htmpres.ts lint slides.qmd --json` for versioned
JSON diagnostics and a nonzero exit on errors. Rendering and verification
apply the same scanner.

## Workflow

```sh
just tutorial
just verify
```

In a project where the extension was installed with `quarto add`, use:

```sh
quarto run _extensions/htmpres/htmpres.ts render decks/my-deck/index.qmd
quarto run _extensions/htmpres/htmpres.ts verify
```
