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

Use fenced divs for layout and styling:

```markdown
:::: three-col
::: {.card .metric-card style="--accent: var(--teal)"}
**Reusable**

Shared patterns become visible.
:::
::::
```

Supported tutorial layout classes include:

- `.two-col`, `.three-col`, `.card`, `.metric-card`, `.callout`
- `.diagram-frame`, `.code-card`, `.checklist`, `.focus-panel`, `.theme-sample`
- `.pill-row`, `.pill`, `.control-chip`, `.action-button`

## Themes

Set `deck.theme` in front matter to select a CSS variable set:

```yaml
deck:
  css: source.css
  renderer: custom
  theme: mono-grid
```

The renderer copies that value to `<html data-theme="mono-grid">`. Deck CSS can
then split structural layout from theme concerns:

```css
:root,
html[data-theme="sage"] {
  --font-body: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-body);
  --ds-theme-filter: saturate(1.05) contrast(1.02);
}

html[data-theme="mono-grid"] {
  --font-body: "Helvetica Neue", Arial, ui-sans-serif, system-ui, sans-serif;
  --font-display: ui-monospace, "SFMono-Regular", Consolas, monospace;
  --ds-theme-filter: saturate(0.78) contrast(1.18) brightness(1.04) hue-rotate(-8deg);
}
```

Theme variables currently cover deck colors, typography, code token colors,
panel colors, media frame colors, filter preset values, and `.ds-theme-filter`.

## Deckset-Inspired Containers

Deckset uses image alt-text modifiers for full backgrounds, split images,
fit/fill, filters, video, and audio. In `htmpres`, the same ideas are expressed
with composable Quarto containers plus media attributes:

- Containers decide where the box is: `.ds-full`, `.ds-left`, `.ds-right`, `.ds-split`, `.ds-pane`, `.ds-media`, `.ds-grid`, `.ds-inline`.
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
:::: {.ds-split style="--ds-gap: 18px; --ds-height: 420px;"}
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
- `.ds-original`: remove filters from a media item.
- `.ds-alpha`: opacity via `--ds-opacity`.
- `.ds-zoom`: visual zoom via `--ds-scale`.
- `.ds-vignette` / `.ds-vignette-light`: edge vignette via `--ds-vignette`, `--ds-vignette-size`, and optionally `--ds-vignette-color`.
- `.ds-readable`: readability gradient via `--ds-readable-angle`, `--ds-readable-start`, and `--ds-readable-end`.

Three inline images laid out by an enclosing div:

```markdown
:::: {.ds-grid style="--ds-columns: 3; --ds-gap: 14px;"}
::: {.ds-media}
![](assets/photo-1.svg){.ds-fill .ds-bn}
:::

::: {.ds-media}
![](assets/photo-2.svg){.ds-fill .ds-theme-filter}
:::

::: {.ds-media .ds-vignette style="--ds-vignette: 0.42;"}
![](assets/photo-3.svg){.ds-fill .ds-filter style="--ds-saturation: 1.15; --ds-contrast: 1.1; --ds-exposure: 0.08;"}
:::
::::
```

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

Mixed-modality slides use fixed navigation precedence:

1. `.fragment` blocks and `.incremental` list items reveal first in source
   order. Fragments with the same `data-fragment-index` reveal together.
2. Code blocks with `data-steps` or `data-highlight-steps` step after all
   generic fragments are visible. Multiple stepped code blocks share one
   code-step counter.
3. Slide navigation runs when no fragment or code step remains. The incoming
   slide's transition animation then plays.

When code stepping begins, `.fragment-current` is cleared from visible
fragments. They remain visible and are treated as past fragments while code
line highlighting advances.

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
