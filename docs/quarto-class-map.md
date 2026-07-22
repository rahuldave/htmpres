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
- `.diagram-frame`, `.code-card`, `.checklist`, `.focus-panel`
- `.pill-row`, `.pill`, `.control-chip`, `.action-button`

## Deckset-Inspired Containers

Deckset uses image alt-text modifiers for full backgrounds, split images,
fit/fill, filters, video, and audio. In `htmpres`, the same ideas are expressed
with composable Quarto containers plus media attributes:

- Containers decide where the box is: `.ds-full`, `.ds-left`, `.ds-right`, `.ds-split`, `.ds-pane`, `.ds-media`, `.ds-grid`, `.ds-inline`.
- Media attributes decide how the asset fits: `.ds-fit`, `.ds-fill`, `.ds-rounded`, `.zoomable`, and filter classes.
- `.ds-layer` raises normal text or controls above full-slide media.
- `.ds-no-pad`, `.ds-no-border`, `.ds-frame`, `.ds-center`, `.ds-top`, and `.ds-bottom` tune the container box.

Full-slide media:

```markdown
::: {.ds-full .ds-media .ds-no-pad}
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

Use these on images, videos, iframes, or media containers:

- `.ds-fit`: contain the whole asset.
- `.ds-fill`: cover the box and crop if needed.
- `.ds-bn` / `.ds-bw`: black and white.
- `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`: filter presets.
- `.ds-filter`: custom filter variables such as `--ds-saturation`, `--ds-contrast`, `--ds-brightness`, `--ds-sepia`, `--ds-blur`, and `--ds-opacity`.
- `.ds-alpha`: opacity via `--ds-opacity`.
- `.ds-zoom`: visual zoom via `--ds-scale`.
- `.ds-vignette`: edge vignette via `--ds-vignette` and `--ds-vignette-size`.

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
quarto run scripts/htmpres.ts render decks/tutorial/index.qmd
quarto run scripts/htmpres.ts verify
```

In a project where the extension was installed with `quarto add`, use:

```sh
quarto run _extensions/htmpres/htmpres.ts render decks/my-deck/index.qmd
quarto run _extensions/htmpres/htmpres.ts verify
```
