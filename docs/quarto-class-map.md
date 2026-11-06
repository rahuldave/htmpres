# QMD Class Map

The editable deck source is Quarto-flavored Markdown. The renderer uses
Quarto/Pandoc for Markdown fragments, then writes a custom HTML slide shell
with navigation, overview, zoom, presenter notes, and small interactions.

## Slide Syntax

Each slide starts with a level-2 heading. Heading classes and data attributes
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

## Semantic Importance, Math And Titles

Use `[The point.]{.key}` and `[A qualification.]{.aside}`, or fenced
`::: {.key}` / `::: {.aside}` blocks. The theme maps importance to weight,
size and ink; keep authored QMD free of inline styles, colors and font choices.
All paired themes support both modes. `.key` uses importance token level 3,
`.aside` level 1, ordinary body level 2; themes expose levels 0–4 as
`--htmpres-importance-N-scale`, `-weight` and `-ink` for future remapping.
There are no numbered author classes.

Titles accept inline Markdown: `## Why *structure* matters {#structure}`.
Math uses `$x^2$` / `$$...$$` and local KaTeX assets. Name a term with
`\htmlClass{term-a}{x}`; only this KaTeX HTML extension is trusted. Keep the
rendered `assets/htmpres-math/` folder with the HTML for offline viewing.
Standard footnotes are unique across slides, title notes and presenter cues;
write `[^1]` and `[^1]: Source.` normally.

See [Semantic slides](semantic-authoring.md) for complete, copyable examples
and the [audience demo](_generated/semantic/index.html).

## Presenter Notes

Speaker notes are authored as a fenced div:

```markdown
::: notes
Use this as the presenter cue.
:::
```

During rendering, notes are removed from audience slide content and written to
the presenter notes panel in `presenter.html`.

## Layout Blocks

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

## Global Backgrounds And Text Fit

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

## Deckset-Inspired Containers

Deckset uses image alt-text modifiers for full backgrounds, split images,
fit/fill, filters, video, and audio. In `htmpres`, the same ideas are expressed
with composable Quarto containers plus media attributes:

- Containers decide where the box is: `.ds-full`, `.ds-left`, `.ds-right`, `.ds-split`, `.ds-pane`, `.ds-media`, `.ds-grid`, `.ds-inline`, `.ds-global-background`.
- Media attributes decide how the asset behaves: `.ds-fit`, `.ds-fill`, `.ds-rounded`, `.zoomable`, and filter classes.
- `.ds-layer` raises normal text or controls above full-slide media.
- `.ds-no-pad`, `.ds-no-border`, `.ds-frame`, `.ds-center`, `.ds-top`, and `.ds-bottom` tune the container box.

Full-slide media:

```markdown
::: {.ds-full .ds-media .ds-no-pad .ds-readable}
![](assets/photo.svg){.ds-fill .zoomable}
:::

::: {.ds-layer}
### Text can sit above the image
:::
```

Half-slide media:

```markdown
::: {.ds-left .ds-media .ds-no-pad}
![](assets/photo.svg){.ds-fill .zoomable}
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
![](assets/detail.svg){.ds-fit .zoomable}
:::
::::
```

## Media Classes

Use layout classes on containers and fit/filter classes on the media. Wrapper
effects such as vignette and readability overlays belong on the nearest
container, because they use pseudo-elements around the media.

- `.ds-fit`: contain the whole asset.
- `.ds-fill`: cover the box and crop if needed.
- `.ds-bn` / `.ds-bw`: black and white.
- `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`: filter presets.
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
![](assets/photo-1.svg){.ds-fill .ds-bn}
:::

::: {.ds-media}
![](assets/photo-2.svg){.ds-fill .ds-theme-filter}
:::

::: {.ds-media .ds-vignette}
![](assets/photo-3.svg){.ds-fill .ds-filter .ds-sharpen}
:::
::::
```

`ds-noir`, `ds-chrome`, `ds-fade`, exposure, and sharpen are Core
Image-inspired browser approximations. They are stable CSS/SVG mappings, not
pixel-exact Apple Core Image output.

Set custom media filter, gap, height and grid variables in the theme
stylesheet. The QMD examples use the theme defaults.

Media playback directive classes:

- `.ds-controls`
- `.ds-autoplay`
- `.ds-loop`
- `.ds-muted`
- `.ds-hide`
- `.ds-autoadvance`
- `.ds-keep-time`

For video, audio, and embeds, raw HTML is the most predictable authoring form:

```html
<video class="ds-fill ds-controls ds-autoplay ds-muted ds-loop" src="assets/demo.mp4"></video>
<audio class="ds-controls" src="assets/narration.mp3"></audio>
<iframe class="ds-fill" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

## Images And Zoom

Normal images use Pandoc image attributes:

```markdown
![System flow](assets/system-flow.svg){.ds-fit .zoomable}
```

Clicking a `.zoomable` image opens the custom deck zoom modal. Press `Esc` or
click outside the image to close it.

## Code Blocks

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

## Transitions And Fragments

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

## Slide IDs, Appendix And Breaks

`## Extra {#appendix-data data-kind="appendix"}` starts a trailing appendix.
All later slides belong to it. Normal counters, Next, End and media
advancement stop at the final main slide; appendix counters are separate.
Use `[The data](#appendix-data)` and `[Back](#main-result)` to navigate to
explicit slide IDs with live hash/history support. Same-slide footnote links
retain the reveal frame. Fallback IDs are collision-safe `slide-N`; duplicate
explicit slide IDs are rejected.

A slide starts only at `##`. Standalone body `---` outside code is an error,
even directly before a heading; initial YAML delimiters are exempt. Run
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
