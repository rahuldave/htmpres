# htmpres syntax reference

Look up the settings, classes and attributes to use in your slide source. The
reference covers deck settings, slide attributes, semantic roles, layouts,
reveals, math, media and interactive controls. Each section has source you can
copy, with links to rendered examples where available.

On narrow screens, scroll tables sideways to read their other columns.

For a first talk, follow [Start a deck](quickstart.qmd). To advance through a
rendered example with its source below, open [Learn from the Markdown](example.qmd)
or [Pictures and slide patterns](patterns.qmd).

## Which syntax belongs to htmpres? {#ownership}

Quarto uses Pandoc to parse Markdown. Pandoc supports fenced divs for blocks,
bracketed spans for inline text, and attributes that give htmpres classes and
settings to apply.

| Layer | What you type | Who gives it meaning? |
|---|---|---|
| Markdown | `**strong**`, `*emphasis*`, lists, tables, quotes and links | Pandoc parses the content. |
| Attributes | `[words]{.key}`, `## Title {#result}`, `::: {.two-col}` | Pandoc supplies the braces, classes, IDs and containers. |
| htmpres behavior | `.fragment`, `data-step-indices`, `.equation-steps`, `data-kind="appendix"` | htmpres controls reveals, synchronization and navigation. |
| htmpres appearance | `.statement`, `.credit`, `.ds-left`, `.ds-fit` | htmpres layouts and the chosen theme give these roles their appearance. |
| Starter styles | `.two-col`, `.card`, `.pill` | The bundled starter stylesheet supplies these classes. |
| Your own class | `.my-diagram` | Your stylesheet must define it. A class name alone adds no behavior. |

The `htmpres render` command writes its own audience and presenter HTML. It
does not render a Reveal.js presentation. Quarto execution cells, Reveal plugins
and arbitrary Quarto format options are not part of this source contract.

## A complete first file {#first-file}

Save this as `slides.qmd`. The title in front matter labels the browser tab.
Each `##` starts a visible slide.

```markdown
---
pagetitle: My talk
deck:
  theme: nocturne
  color-mode: auto
  counter: presenter
  text-fit: true
  overflow: fit-scroll
---

## The finding {#finding}

[The intervention helped.]{.key}

[The smaller groups need more evidence.]{.aside}

::: notes
Explain the study before showing the estimate.
:::

## Show the evidence

::: {.incremental}
- The baseline was stable.
- The outcome improved.
- The improvement lasted.
:::
```

Render it with `quarto run _extensions/htmpres/htmpres.ts render slides.qmd`.
Open the resulting `index.html` for the audience or `presenter.html` for notes.
[See importance roles](example.qmd?slide=3), [try reveals](example.qmd?slide=4),
or [inspect notes](patterns.qmd?slide=10).

## Deck settings {#deck-settings}

Put deck settings under `deck` in the initial YAML block. Add new settings to
that block. Use the indentation and single values shown here. The metadata
reader does not interpret flow mappings, multiline values or inline comments
after setting values. Do not add a second front matter block.

| Setting | Values or example | Effect |
|---|---|---|
| `pagetitle` | `My talk` | Browser and navigation title; falls back to `title`, then the folder name. It does not create a slide. |
| `deck.theme` | `nocturne` | Select a bundled theme or a local CSS theme. [Names and previews](themes.md#available-names). |
| `deck.theme.light`, `deck.theme.dark` | `litera-reading`, `darkly-reading` | Pair two named themes. Both names are required. [Example](themes.md#separate-light-and-dark-themes). |
| `deck.color-mode` | `light`, `dark`, `auto` | Select a paired theme mode. Default is `auto`; unpaired legacy seeds have no mode switch. |
| `deck.css` | `source.css` | Optional stylesheet, relative to the deck. Defaults to `source.css` if present. |
| `deck.counter` | `true`, `false`, `presenter` | Show both counters, hide both, or show only the presenter counter. Default is `true`. [See both views](patterns.qmd?slide=10). |
| `deck.overflow` | `hidden`, `scroll`, `fit`, `fit-scroll` | Clip, scroll, fit, or fit then scroll remaining overflow. |
| `deck.text-fit` | `true` or `false` | Fit slide text to the available area. Default is off; `fit` overflow modes also trigger fitting. |
| `deck.text-fit-min` | `0.64` | Minimum fit scale; the theme supplies the default. |
| `deck.background-image` | `assets/texture.svg` | Decorative background on each slide. [See a background](patterns.qmd?slide=6). |
| `deck.background-fit` | `fit`, `fill` | Keep the whole background or fill its box. Default is `fill`. |
| `deck.background-filter` | `theme sharpen` | Space/comma-separated image filters: `theme`, `bn`, `bw`, `vivid`, `noir`, `chrome`, `fade`, `filter`, `sharpen`, `alpha` or `zoom`. Default is `theme`; `none` disables filters. |
| `deck.background-position` | `center`, `left top` | CSS object position of the background. Default is centered. |
| `deck.background-opacity` | `0.08` | Background opacity from 0 to 1. |
| `deck.background-class` | `ds-rounded` | Extra background image classes, separated by spaces. |

The reader also accepts `theme` for `deck.theme`, top-level `background-*` keys,
or nested `deck.background.image`, `.fit`, `.filter`, `.position`, `.opacity`,
and `.class`. The flat `deck.background-*` keys take precedence.

Text fitting also accepts `deck.autoscale`, top-level `text-fit` or `autoscale`,
and `deck.autoscale-min`, top-level `text-fit-min` or `autoscale-min`.
Overflow accepts `deck.slide-overflow` or top-level `overflow`.
`filtered` aliases the background filter `theme`; `none`, `false`, `off` and
`original` disable background filters. Prefixed forms such as `ds-sharpen` also
work. Wrapper overlays such as `.ds-readable` belong on an authored container,
not in `background-filter` or `background-class`.

Use the names in the table for new files. `deck.renderer: custom` appears in
older examples but does not select an alternative rendering engine.

## Slide boundaries and attributes {#slide-attributes}

Use a top-level `##` heading or a standalone `---` to start a slide. A separator
followed by a heading, with only blank lines between, makes one slide. Boundaries
inside code, comments, notes or fenced divs stay within the current slide.

```markdown
## Why *order* matters {#result data-section="Findings"}

The title accepts inline Markdown.

---

## {#backup data-title="Supporting data" data-kind="appendix"}

This slide has a navigation label but no visible heading.
```

| On the `##` heading | What it means | Rendered example |
|---|---|---|
| `#result` | Stable slide ID for `[Result](#result)` links. | [Appendix and return links](example.qmd?slide=10) |
| `data-title="Supporting data"` | Override the navigation label, including for an empty heading. | [Untitled statement](patterns.qmd?slide=1) |
| `data-section="Findings"` | Section label on the slide and in overview. | [Picture and label](patterns.qmd?slide=7) |
| `data-kind="appendix"` | Start the trailing appendix; every later slide belongs to it. | [Enter the appendix](example.qmd?slide=10) |
| `.title-hidden` | Hide the visible heading but keep its navigation title. | [Full-slide image pattern](patterns.qmd?slide=4) |
| `.hero-title`, `.section-divider` | Starter title and section styles. | [Title slide](example.qmd?slide=1) |
| `.quote` | Style a Markdown blockquote as a quotation slide. | [Quotation](patterns.qmd?slide=2) |
| `.autoscale`, `.no-autoscale` | Turn text fitting on or off for this slide. | [Fitted importance](example.qmd?slide=3) |
| `data-text-fit="true"`, `data-text-fit="false"` | Attribute forms of the fitting choice; `data-autoscale` is an alias. | [Fitting details](quarto-class-map.md#global-backgrounds-and-text-fit) |
| `data-text-fit-min="0.64"` | Minimum scale for this slide; `data-autoscale-min` is an alias. | [Fitting details](quarto-class-map.md#global-backgrounds-and-text-fit) |
| `data-overflow="fit-scroll"` | Per-slide overflow policy, with the same values as `deck.overflow`. | [Fitting details](quarto-class-map.md#global-backgrounds-and-text-fit) |
| `.no-background` | Omit a deck background on this slide. | [Background settings](#slide-backgrounds) |
| `data-transition="fade"` | Slide-entry transition. | [Transition values](#transitions) |
| `data-step-summary="match"` | Add a final color-matched overview after the teaching steps. | [Equation overview](example.qmd?slide=6) |
| `data-match-colors`, `data-match-colors-dark` | Optional per-slide named palette. | [Color overrides](#matched-colors) |

Slide fitting attributes also accept `1`, `yes`, `on` for true, and `0`, `no`,
`off` for false. Prefer `true` and `false` in new source.

Give each slide a unique ID. When you omit one, htmpres generates a `slide-N`
ID and avoids collisions with other slide IDs. Links can enter the appendix
during the talk, while **Next** and **End** stop at the last main slide.
Appendix slides have their own counter. Add explicit return links to bring
readers back to the talk. [Full boundary rules](semantic-authoring.md#slide-boundaries-and-lint).

## Spans, blocks and importance {#importance}

Use square brackets for an inline span and a fenced div for a block. Put the
class in braces, as shown below. Close each block with another colon fence.
Longer fences around nested blocks make their structure easier to read.

```markdown
## The result

[The intervention helped.]{.key}

::: {.aside}
The estimate is less certain for smaller groups.
:::
```

| Role | Job | Output |
|---|---|---|
| `.statement` | Dominant claim; span or block. A solo block on an untitled slide is centered. | [Statement](patterns.qmd?slide=1) |
| `.key` | Main point within an ordinary slide. | [Importance](example.qmd?slide=3) |
| Ordinary text | Body argument. | [Importance](example.qmd?slide=3) |
| `.aside` | Minor qualification. | [Importance](example.qmd?slide=3) |
| `.credit` | Picture attribution in a reserved lower-right lane; span or block. | [Picture credit](patterns.qmd?slide=3) |
| `.source` | Attribution kept with a quotation; span or block. | [Quote and source](patterns.qmd?slide=2) |

Themes set size, weight and ink (text color) for the named roles. There are no numbered
author classes. Jonathan Schwabish's *Better Presentations* (2017) motivates
dominant claims (pp. 70 to 72) and spare statement slides (pp. 139 to 140).
It also covers picture credits (pp. 128 to 129) and highlighted quotations
with sources (pp. 72 to 73).

```markdown
## One idea {.quote}

> An effective slide gives the audience [one idea to remember.]{.key}
>
> [Example quotation written for this demonstration.]{.source}
```

[See this quotation and its source](patterns.qmd?slide=2).

## Notes, titles and footnotes {#notes}

```markdown
## Why *structure* and **order** matter {#structure}

The estimate improved.[^1]

[^1]: Report title, author and date.

::: notes
Explain the limitation before taking questions. Math works here too: $x^2$.
:::
```

`::: {.notes}` is equivalent to `::: notes`. Audience output omits the notes,
and presenter output includes them. Exported IDs are unique, so footnote labels
can repeat on different slides and in notes. Titles render Markdown emphasis,
and the outline uses their plain text.

[See notes beside a slide](patterns.qmd?slide=10),
[follow a footnote](example.qmd?slide=3), or
[see title emphasis](_generated/semantic/index.html#story).

## Text reveals and slide transitions {#transitions}

A fragment is a span, block or list item revealed on an advance. Without an
effect, earlier text stays visible. The `dim` effect dims earlier points and
hides future ones so the audience cannot read ahead.

```markdown
## Build the argument

::: {.incremental data-fragment-effect="dim"}
- Establish the question.
- Show the evidence.
- State the implication.
:::

[Reveal this span with the next advance.]{.fragment}
```

| Syntax | Meaning |
|---|---|
| `.fragment` | Reveal a span or block as one unit. |
| `.incremental` | Reveal direct list items in order, including lists inside columns. |
| `data-fragment-index="2"` | Put fragments on shared frame 2. Repeated indices reveal together; 0 is visible at the baseline. |
| `data-fragment-effect="rise"` | Effect for a fragment or inherited from its incremental container. |
| Effect values | `rise` (also `slide`), `left`, `right`, `scale`, `blur`, `highlight`, `dim`, `none`. |
| `.transition-fade`, `.transition-slide`, `.transition-zoom`, `.transition-none` | Animate a slide's entrance, or omit animation. |
| `data-transition="fade"` | Heading attribute form; accepts `fade`, `slide`, `zoom`, `none`. |

Automatic fragment numbers advance past earlier explicit indices. Sparse numbers
do not add empty keypresses. Slide-entry transitions do not consume reveal steps.
[Try dimmed spans and lists](example.qmd?slide=4).

## Code and synchronized explanations {#code-steps}

Put language and behavior attributes on the code fence. A selection can be a
line number, comma-separated numbers, a range, `none`, or `all`. Each snapshot
is the selection highlighted at one step. Separate snapshots with a pipe.

| Code-fence syntax | Meaning |
|---|---|
| `.python`, `.js`, `.html`, `.yaml` | Pandoc syntax highlighting for the named language. |
| `.numberLines` | Display line numbers. |
| `data-highlight="2,4-5"` | Persistent line highlights; no navigation step. |
| `data-steps="none\|2\|3-4\|all"` | Ordered highlight snapshots. |
| `data-highlight-steps` | Alias for `data-steps`. |
| `data-step-indices="1\|3\|7"` | Map snapshots to the same frames as text/equation reveals. |
| `data-line-matches="1:observations\|2:total\|3:mean"` | Name line-number/explanation pairs for a matched overview. |

````markdown
## Compute a mean {data-step-summary="match"}

:::: {.two-col}
::: {}
```{.python .numberLines data-steps="1|2|3" data-step-indices="1|3|7" data-line-matches="1:observations|2:total|3:mean"}
observations = [2, 4, 6]
total = sum(observations)
mean = total / len(observations)
```
:::
::: {}
[Collect the observations.]{.fragment data-fragment-index="1" data-match="observations"}

[Add their values.]{.fragment data-fragment-index="3" data-match="total"}

[Divide by their count.]{.fragment data-fragment-index="7" data-match="mean"}
:::
::::
````

[Try the synchronized code pattern](example.qmd?slide=5). There are three teaching
advances and a fourth matched overview. The gaps in `1|3|7` create no extra steps.

Mappings need one positive safe integer per snapshot, strictly increasing in
each code/equation block. Invalid mappings warn and fall back to implicit order.
Without mappings, mixed text/code/equation events run in source order. Older
unmapped code-only slides keep their first snapshot at the baseline.
Multiple unmapped code blocks share their corresponding snapshots.

## Math and equation steps {#equation-steps}

Use `$x^2$` for inline math and `$$...$$` for display math. htmpres bundles
KaTeX, the math typesetter, for offline use. Name a term inside TeX with
`\htmlClass{mean}{\bar{x}}`. KaTeX's other HTML extensions are disabled.

```markdown
## Explain the mean {data-step-summary="match"}

:::: {.two-col}
::: {.equation-steps data-equation-steps="mean|total|count" data-step-indices="1|3|7"}
$$
\htmlClass{mean}{\bar{x}} = \frac{\htmlClass{total}{\sum_{i=1}^{n} x_i}}{\htmlClass{count}{n}}
$$
:::
::: {}
[The mean is the quantity we want.]{.fragment data-fragment-index="1" data-match="mean"}

[Add the observations.]{.fragment data-fragment-index="3" data-match="total"}

[Divide by the count.]{.fragment data-fragment-index="7" data-match="count"}
:::
::::
```

[Try the equation and its explanation](example.qmd?slide=6). A comma selects
several terms in one snapshot, as in `data-equation-steps="x|y|x,y"`.
Only listed terms dim. Other symbols retain their appearance. A mapped block
holds its latest snapshot until its next shared frame. Themes set the size of
stepped display math, while inline math keeps its normal text size.

## Matched colors and optional overrides {#matched-colors}

`data-step-summary="match"` on the slide adds one final overview. Named groups
gain their shared color from their first reveal. The final advance clears
teaching highlights and dimming; **Previous** restores the last teaching frame.

| Where | Syntax | Meaning |
|---|---|---|
| Explanation span/block | `data-match="mean"` | Name the relationship. |
| Code fence | `data-line-matches="1-2:total\|3:mean"` | Match non-overlapping, in-bounds source line selections to explanations. |
| TeX term | `\htmlClass{mean}{\bar{x}}` | Match a term to the explanation with the same name. |
| Explanation or inline-math span | `data-match-color="#245c88"` | Explicit color for the whole named pair. |
| Same span | `data-match-color-dark="#91c9f0"` | Optional dark-mode replacement. |
| Slide heading | `data-match-colors="mean=#245c88\|total=#765013"` | Set named colors for this slide. |
| Slide heading | `data-match-colors-dark="mean=#91c9f0\|total=#edc37d"` | Dark-mode slide palette. |
| Stylesheet | `--htmpres-match-mean: #245c88;` | Choose one semantic color across slides. |

Names start with a lowercase letter and then use lowercase letters, digits or
hyphens. `enclosing` is reserved. Every named source part needs a matching
explanation. Conflicting explicit colors for one name are an error.

```markdown
[$\bar{x}$]{data-match="mean" data-match-color="#245c88" data-match-color-dark="#91c9f0"}

[The mean of the observations.]{data-match="mean"}
```

The theme supplies colors when overrides are absent. Inline choices override
the slide palette, which overrides ordinary named stylesheet variables.
Colors accept CSS names, hex, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`,
`oklch(...)`, `oklab(...)`, `lab(...)`, `lch(...)` and `var(--token)`.

Use numeric components in color functions. Angle units and nested expressions
are not parsed. `var(--token)` names one variable without a fallback value.
Explicit overrides are not contrast-adjusted.
[See the matched overview](example.qmd?slide=6) and
[complete color/contrast rules](semantic-authoring.md#finish-with-matched-colors).

## Pictures, captions and credits {#pictures}

Describe an informative picture in its Markdown alt text. A standalone
Markdown picture becomes a captioned figure. Inline pictures and raw HTML
images retain alt text without generating a caption. A purely decorative image needs
an empty description and `.decorative` on the image.

```markdown
## One source makes two views

![One source produces separate audience and presenter views.](assets/two-views.svg){.ds-fit .zoomable}

[Diagram: htmpres authors.]{.credit}
```

[See a contained picture and its credit](patterns.qmd?slide=3). Clicking a
`.zoomable` image opens the zoom view. **Escape** closes it.

| Image/container class | Job | Output |
|---|---|---|
| `.ds-fit` | Keep the whole image without cropping. | [Contained image](patterns.qmd?slide=3) |
| `.ds-fill` | Cover the picture box; edges can crop. | [Full-slide image](patterns.qmd?slide=4) |
| `.zoomable` | Open the image on click. | [Zoom example](patterns.qmd?slide=3) |
| `.decorative` | Explicitly allow `alt=""`; adds no information. | [Decorative texture](quarto-class-map.md#pictures-that-fit-with-accessible-descriptions) |
| `.credit` | Short picture attribution, linked to a source record if needed. | [Credit and appendix](patterns.qmd?slide=3) |

## Picture layouts {#picture-layouts}

These classes belong to htmpres. Put layout classes on the surrounding div,
and fit/filter classes on the image or its media container.

| Class | Meaning | Output or source example |
|---|---|---|
| `.ds-full` | Full-slide media layer; hides the generated caption while retaining alt text. | [Full picture](patterns.qmd?slide=4) |
| `.ds-left`, `.ds-right` | Left and right half-slide containers. | [Picture left](patterns.qmd?slide=7), [picture right](patterns.qmd?slide=8) |
| `.ds-media` | Contain an image, video or embedded media. | [Contained image](patterns.qmd?slide=3) |
| `.ds-pane` | Text/content pane beside media. | [Picture and text](patterns.qmd?slide=7) |
| `.ds-layer` | Text panel above media, with theme-controlled backing. | [Text overlay](patterns.qmd?slide=5) |
| `.ds-split` | Flowing grid of panes, two columns by default. | [Split source](quarto-class-map.md#deckset-inspired-containers) |
| `.ds-grid` | Grid of media blocks, three columns by default. | [Picture grid](patterns.qmd?slide=9) |
| `.ds-inline` | Small media arranged in a wrapping row. | [Media example below](#media-appearance) |
| `.ds-frame`, `.ds-no-border` | Add a media frame, or remove border, radius and background. | [Framed media](example.qmd?slide=7) |
| `.ds-no-pad` | Remove container padding. | [Full picture](patterns.qmd?slide=4) |
| `.ds-center`, `.ds-top`, `.ds-bottom` | Center contents, or align them toward the top/bottom. | [Media example below](#media-appearance) |
| `.ds-rounded` | Round media corners using the theme radius. | [Media example below](#media-appearance) |
| `.ds-hide` | Hide an element visually and, for players, from screen readers. | [Playback source](#playback) |

```markdown
## Picture on the left

::: {.ds-left .ds-media .ds-no-pad}
![One source produces separate audience and presenter views.](assets/two-views.svg){.ds-fit}
:::

::: {.ds-right .ds-pane}
[Keep your explanation beside the evidence.]{.key}
:::
```

[Inspect the left-picture pattern](patterns.qmd?slide=7). Swap the left and
right roles to put the picture on the other side.

## Slide backgrounds {#slide-backgrounds}

Decorative backgrounds use heading attributes. Use a described `.ds-full`
image when the picture itself carries information.

```markdown
## Reuse the result {data-background-image="assets/texture.svg" data-background-fit="fill" data-background-filter="none"}

[Read the data once, then reuse it.]{.key}
```

[See a decorative background](patterns.qmd?slide=6). Per-slide settings are
`data-background-image`, `data-background-fit`, `data-background-filter`,
`data-background-position`, `data-background-opacity` and
`data-background-class`. They use the same values as their deck settings.
`data-background-image="none"` or `.no-background` omits the background.

## Media appearance and filters {#media-appearance}

```markdown
## A row of pictures

:::: {.ds-inline .ds-center}
![Original diagram](assets/two-views.svg){.ds-fit .ds-rounded}

![Diagram in black and white](assets/two-views.svg){.ds-fit .ds-bw}
::::
```

### Media filters {#media-filters}

| Class | Meaning |
|---|---|
| `.ds-bn`, `.ds-bw` | Black and white. |
| `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade` | Named browser filter presets. |
| `.ds-theme-filter` | Use the theme's filter preset. |
| `.ds-sharpen` | Add the bundled SVG sharpen filter. |
| `.ds-original` | Remove filters from this media item. |
| `.ds-filter` | Apply custom filter variables from CSS. |
| `.ds-alpha` | Use the stylesheet's opacity value. |
| `.ds-zoom` | Scale media visually using the stylesheet's zoom value. |
| `.ds-vignette` | Add a dark edge overlay on a container. Add `.ds-vignette-light` alongside it for a light overlay. |
| `.ds-readable` | Add a readability gradient on the media container; preserves layout. |

Put vignette/readability classes on the surrounding div because they draw an
overlay. Presets approximate browser effects; they do not reproduce Apple Core
Image exactly. [Readability overlay output](patterns.qmd?slide=5).

Theme CSS can set `--ds-grayscale`, `--ds-sepia`, `--ds-saturation`,
`--ds-contrast`, `--ds-brightness`, `--ds-exposure`, `--ds-hue`, `--ds-blur`,
`--ds-opacity`, `--ds-scale`, `--ds-vignette`, `--ds-vignette-size`,
`--ds-vignette-color`, `--ds-readable-angle`, `--ds-readable-start` and
`--ds-readable-end`. Container geometry uses `--ds-columns`, `--ds-gap`,
`--ds-height`, `--ds-margin-top`, `--ds-pad`, `--ds-bg`, `--ds-border`,
`--ds-radius` and `--ds-inline-size`. [Theme customization](build-a-deck-from-markdown.md).

## Video, audio and embedded pages {#playback}

Use HTML for players and embedded pages, as shown below. The public demo does
not include sample audio or video files.

```html
<video class="ds-fit ds-controls ds-muted" src="assets/demo.mp4"></video>
<audio class="ds-controls" src="assets/narration.mp3"></audio>
<iframe class="ds-fill" title="Video demonstration"
        src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

| Player class | Effect |
|---|---|
| `.ds-controls` | Show native playback controls. |
| `.ds-autoplay` | Request playback when its slide becomes active. Browser autoplay policy still applies. |
| `.ds-loop` | Repeat playback. |
| `.ds-muted` | Mute playback. |
| `.ds-hide` | Hide the player visually and from screen readers. |
| `.ds-autoadvance` | Advance the active slide when playback ends, respecting the main/appendix boundary. |
| `.ds-keep-time` | Retain position when leaving the slide; otherwise playback resets. |

## Panel buttons and filters {#interactions}

Raw HTML buttons can replace a panel's contents or filter items on the current
slide. These complete source patterns need no author-written JavaScript.

```markdown
## Compare the choices

::: {.pill-row}
<button class="pill active" data-target="#detail" data-title="First" data-text="Keep one source.">First</button>
<button class="pill" data-target="#detail" data-title="Second" data-text="Render two views.">Second</button>
:::

::: {#detail .focus-panel}
### First

Keep one source.
:::
```

| Attribute/class | Where | Meaning |
|---|---|---|
| `data-target="#detail"` | Control | Target panel; `data-update-target` is an alias. |
| `data-title`, `data-text` | Control | Replace panel heading and paragraph as text. |
| `data-html` | Control | Replace the panel with the authored HTML string instead. |
| `.pill-row`, `data-choice-group` | Control group | Keep one `.active` control in the group. |
| `data-filter="prototype"` | Control | Filter value; `data-item-filter` is an alias. |
| `data-filter-target=".candidate"` | Control | Selector for items on the current slide. |
| `data-tags="prototype stable"` | Item | Whitespace-separated values; `data-filter` is also accepted on items. |
| `data-filter="all"` | Control | Show every selected item. |

```markdown
## Filter the candidates

::: {data-choice-group="candidates"}
<button data-filter="all" data-filter-target=".candidate">All</button>
<button data-filter="prototype" data-filter-target=".candidate">Prototypes</button>
:::

::: {.candidate data-tags="prototype"}
An early model.
:::

::: {.candidate data-tags="stable"}
A tested model.
:::
```

Target lookup checks the current slide first, then the document. Prefer unique
panel IDs. Buttons retain keyboard activation with **Enter** or **Space**.
The older `data-profile-filter`/`data-risk` template vocabulary has no generic
runtime handler; use the `data-filter` form above for working filters.

## Starter style classes {#starter-styles}

A bundled theme includes the starter stylesheet. Its classes control layout
and appearance through CSS. They add no parsing syntax or navigation commands.
You can also copy the styles into a custom deck's stylesheet.

| Classes | Purpose | Example |
|---|---|---|
| `.two-col`, `.three-col` | Two or three flowing columns. | [Code beside text](example.qmd?slide=5) |
| `.card`, `.metric-card`, `.callout` | Group content or frame a short point. | [Importance in blocks](_generated/semantic/index.html#importance) |
| `.hero-title`, `.hero-subtitle`, `.lead` | Title treatment, subtitle and opening copy. | [Opening slide](example.qmd?slide=1) |
| `.section-divider` | Centered section opening. | [CLI section template](authoring-cli.md#human-commands) |
| `.source-line`, `.eyebrow`, `.sample-label`, `.media-caption` | Supporting labels and captions. | [Picture caption](example.qmd?slide=7) |
| `.diagram-frame`, `.code-card`, `.code-guide`, `.checklist`, `.focus-panel`, `.compact-panel` | Starter containers for diagrams, code, lists and panels. | [Container source](quarto-class-map.md#layout-blocks) |
| `.pill-row`, `.pill`, `.control-chip`, `.action-button` | Control grouping and appearance. Behavior needs the attributes above. | [Panel source](#interactions) |
| `.theme-sample`, `.mono-theme-sample` | Theme specimens. | [Theme slide](example.qmd?slide=9) |

The following starter selectors support only the bundled tutorial's specimens.

`.story-layout`, `.story-steps`, `.story-bridge`, `.story-stat-grid`,
`.kpi-grid`, `.url-pair`, `.mini-diagram`, `.button-samples`, `.feature-status`,
`.status-card`, `.fit-demo`, `.transition-demo`, `.transition-strip`,
`.fragment-demo`, `.code-split`, `.mixed-code`, `.mixed-copy`,
`.mixed-transition`, `.sample-media-grid`, `.sample-split`, and
`.profile-fragment-grid`. They are not required to author a talk.

Mobile compatibility rules also mention `.four-col`, `.five-col`, `.flow`,
`.matrix`, `.timeline`, `.release-ladder`, `.axis-map`, `.axis`, `.bar`,
`.six`, `.eight`, `.wide-left`, `.wide-right`, `.chip-row`, `.chip` and `.scheme-row`. These do not define a general
desktop layout API. Define those desktop layouts in CSS if you use them.
`.diagram-slide` is a legacy import marker, not a general diagram generator.

## Click, touch and keyboard navigation {#navigation}

Click the left part of a slide to go back, or the rest to advance. Horizontal
swipes also navigate. Links, buttons, code and players keep their own click and
touch actions.

Put `.no-tap-nav` or `.no-slide-nav` on a custom interactive
region to stop click and touch navigation there. You can also add
`data-no-tap-nav` or `data-no-slide-nav`. The attribute's presence is enough,
even if its value is `false`. The deck's keyboard shortcuts remain active.

```markdown
::: {.no-tap-nav}
Put an interactive diagram here without slide tap navigation.
:::
```

| Key in an exported deck | Action |
|---|---|
| **Right**, **Space**, **Page Down** | Next reveal, then next slide. |
| **Left**, **Page Up** | Previous reveal, then previous slide. |
| **Home**, **End** | First slide or final main-talk slide. |
| **O** | Toggle overview. |
| **N** | Toggle the presenter notes panel when available. |
| **F** | Toggle full screen when the browser supports it. |
| **Escape** | Close overview or zoom. |

Slide links accept an explicit `#result` ID or a one-based `#/3` position.
The website's example controls keep their chosen slide fixed. In those
examples, **Home** restarts that slide's steps instead of opening the first slide.

## Check the source and output before sharing {#checking}

Run `lint slides.qmd --json` and `verify slides.qmd` through the
[authoring CLI](authoring-cli.md#lint-semantic-source). Lint reports empty slides,
invalid counter values and missing image descriptions in versioned JSON.
Verification also checks the rendered files. Keep local theme/font/math/media
assets with the HTML. [Sharing instructions](quickstart.qmd#check-and-share).

Use the fenced containers and notes above. Deckset forms such as `[.column]`
and `^` notes are not parsed. Quarto/Reveal-specific classes gain behavior only
when this reference lists them. CSS tokens and generated state attributes
serve the theme and runtime implementation. They do not add author syntax.
