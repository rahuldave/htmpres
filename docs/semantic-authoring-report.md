# Semantic authoring implementation report

For current text-over-picture behavior, see [text over pictures and optional
panels](syntax-reference.md#text-over-picture). The dated [PR #28](https://github.com/rahuldave/htmpres/pull/28) record below
describes the earlier automatic-panel policy.

This report records dated releases and their verification, beginning on
2026-11-06. Use [Semantic slides](semantic-authoring.md) for the current authoring
contract. Historical fixture sizes and test counts below describe each release.
Talk-planning tools may create a separate worksheet in `plan.md`. Htmpres does
not read that worksheet when it renders the slide source.

## Picture descriptions and fitted space (2026-11-10)

The two follow-ups to PR #28 were independently reproduced on `4e6a967` and
corrected in [PR #30](https://github.com/rahuldave/htmpres/pull/30).
The description contract was introduced in `b1c78b0`.

**Descriptions.** Every meaningful picture needs `![A useful description](asset.svg)`.
An empty description is now an `image-description` **error** from `lint`,
`render` and both verifiers. The exact diagnostic message for the supplied e1
slide is:

```text
Slide 3 (A titled picture, empty description): describe this picture, or mark a purely decorative picture with {.decorative}.
```

The JSON report retains `version: 1`, sets `ok: false`, and includes
`severity: "error"`, `code: "image-description"`, the source file,
slide-start `line`/`column`, `slide` number and `slideId`. Exit status is 1.
The supplied e1, e2 and e3 slides all report this error. Each diagnostic names
the slide.
The check uses the same Pandoc reader as rendering, separately for titles,
audience content and presenter notes. References, linked pictures and raw HTML
are covered; code examples, comments and escaped syntax are not pictures.

For a purely decorative image, put `.decorative` on the image and leave its
description empty:

```markdown
## A decorative texture

![](assets/texture.svg){.decorative .ds-fit}
```

The decorative image produces `alt=""` and passes lint. `data-background-image` remains the
decorative background form. All actual output images have an `alt` attribute;
the verifiers also inspect serialized presenter notes and reject stale output
where an attribute is removed. Meaningful full pictures keep their description
and use `.ds-full` to suppress the visible caption, without erasing the alt.

**Fitted space.** The picture uses the remaining space below the title. The
runtime reserves the actual credit and section-label boxes, with the theme's
gaps, instead of adding a fixed empty band.

A missing caption allocates no
caption row. Captions are centered under centered pictures. `.ds-fit` keeps
shape and scales past natural size. `.ds-fill` still crops the image.
No author color, size or style attributes were added.

The supplied Atelier/light case was measured in a real 1280 × 720 browser.
The slide ran from y=14 to y=581 in both captures. The viewBox-only SVG had
browser intrinsic dimensions 267 × 150. The table gives **drawn** sizes, calculated
from intrinsic dimensions, the image content box and `object-fit: contain`:

| Supplied slide | Before | After |
| --- | --- | --- |
| t1: title, caption, credit and section label | 342.84 × 192.61 px | 468.33 × 263.11 px |
| t2: title and caption, no credit or section label | 517.28 × 290.61 px | 677.48 × 380.61 px |

The title-to-picture gap in these cases is 16 px; the image/caption gap is
8 px. On t2 the caption ends at y=557, with the theme's 24 px bottom inset below it.
On t1 the remaining space contains the section label, credit and their gaps.
The fixtures use the same aspect ratios as the supplied drawings; pixel
rounding follows the browser's viewBox intrinsic size.

**Browser verification.** The regression fixture now has 55 slides. The catalog
matrix passed all 146 theme/mode/view cases. It covers 35 paired themes in light and dark,
audience and presenter, plus three legacy seeds in their supported mode and
both views. The matrix totals **8,030 passing slide checks**. Compact Nocturne at
520 × 900 added **220 passing checks**, both modes and views.

Checks assert
`hasAttribute('alt')`, decoded descriptions/explicit decoration, real drawn
size against independently derived available space, captions and footer
clearance, and the earlier full-picture geometry/contrast contracts. Actual
Nocturne audience/presenter light/dark navigation checks confirm that leaving
and returning does not accumulate reserve or shrink the picture.

Focused callable tests cover both renderer/verifier paths, packaged workspace
imports, notes, raw HTML, references, quotes/citations, whitespace entities and
large embedded images, plus measured footer reservation. The report to
look-talks identifies the final merge commit and full verification gates.

Existing described-image syntax is unchanged. `.decorative` is the one new
optional semantic image class. Previously unmarked empty descriptions now
fail intentionally. Browser printing retains these HTML image alternatives;
no separate PDF exporter or tagged-PDF accessibility claim was added. The
website/tutorial audit requested afterward is a separate PR.

## Picture-slide corrections for look-talks (2026-11-10)

Implementation: [`7d544ac`](https://github.com/rahuldave/htmpres/commit/7d544ac).

The five reported faults were all reproduced against `f3930fb` in an actual
1280 × 720 browser, using the supplied Atelier/light examples. The slide ended
at y=581. The supplied QMD was valid; the faults were in rendering and layout.

| Report | Independent observation before the fix | Result |
| --- | --- | --- |
| 1. Readability breaks full size | Full wrapper was 880 × 495 at (310,78), instead of the 1008 × 567 slide at (246,14); layer began at y=573 and extended below the slide. | Readability/vignette preserve absolute full/half geometry; text stays inside. |
| 2. Dark text over a dark picture | Layer/key/title ink was rgb(37,62,66) on a near-black picture, with transparent text grounds. | Theme-owned opaque paper/ink panels protect layers, semantic emphasis, background titles and body text. |
| 3. Clipped automatic caption | Full-picture caption extended to y=596.75, beyond the slide; its image was shifted upward too. The image already had the correct alt text. | Full wrappers hide the automatic caption visually and from screen readers; exact image alt and accessible image name remain. Ordinary figures keep captions. |
| 4. Section label obscured | Label had no ground and automatic stacking; the picture obscured it or provided insufficient contrast. | Picture labels have opaque theme grounds, readable ink and foreground stacking, with space separate from caption/credit. |
| 5. Titled image/caption overflows | Wrapped image ended at y=616.20 and caption at y=647.70; the bare form also overflowed. | Single images use the remaining height below a title, including caption and credit; left/right image panes also start below the title. |

The content structure is unchanged. Authors write no colors, sizes or styles.
Normal picture captions remain visible; their space is now part of the layout.
The final syntax is shown below and in [Semantic slides](semantic-authoring.md#pictures-that-fit-with-accessible-descriptions).

### A titled picture with its description and credit

```markdown
## One queue before one database {data-section="The bottleneck"}

![Students wait for one database to answer their searches.](assets/photo.svg){.ds-fit}

[Picture: Creator, source and license.]{.credit}
```

### A full picture with a description and no visible caption

```markdown
## {data-title="A queue before one database" data-section="The bottleneck"}

::: {.ds-full .ds-media .ds-no-pad}
![Students wait for one database to answer their searches.](assets/photo.svg){.ds-fill}
:::

[Picture: Creator, source and license.]{.credit}
```

### Text over a full picture

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

### A background title and a readable section label

```markdown
## Every search repeats the work {data-background-image="assets/photo.svg" data-section="The bottleneck"}

[Read the data once, then reuse the result.]{.key}

[Picture: Creator, source and license.]{.credit}
```

`data-section` works in all four forms; no extra picture-label syntax is needed.
Background layers are decorative. Use the described full-picture form for an
image that needs its own screen-reader name. Standard Markdown descriptions
now suffice for full pictures. No Quarto-specific `fig-alt` workaround is
needed or newly introduced. `.ds-readable` without `.ds-full` also remains
supported.

No old form gains a lint rejection, and no author syntax is renamed.

Themes own `--htmpres-media-text-bg`, `--htmpres-media-text-ink`,
`--htmpres-media-label-bg` and `--htmpres-media-label-ink`. The default opaque
ground is the theme paper; ink targets 4.8:1 following the existing credit
policy. The opaque ground handles bright, dark and mixed photographs. A transparent
scrim cannot guarantee contrast. `.key` retains its emphasis size and
weight while inheriting the panel's readable ink. Explicit `.ds-fill` still
crops; `.ds-fit` and the ordinary one-picture default preserve shape.

### Verification and boundaries

The rerunnable fixture is `decks/pictures/index.qmd`. Its first six slides
reproduce the supplied report. Other cases cover wide/tall/16:9 pictures with
captions and credits, and linked pictures without fit classes. They also cover
deliberate fill/cropping, bright backgrounds, non-full readability, and
titled/untitled split images beside wrapped and plain lists.

The ordinary browser harness
`integration_tests/picture-matrix.html` uses actual renderer HTML, fonts, images
and controls. `scripts/build-picture-fixtures.mjs` generates its local bundle;
it does not publish test pages. Both the harness and CUA spot checks use
`integration_tests/picture-slides-browser.mjs` assertions.

The complete catalog matrix checks 146 cases. It covers all 35 paired themes in
both modes and both views, plus sage, mono-grid and blank in their one supported
mode and both views. Legacy seeds have no bundled dark pair. Deno/Node integration
checks use real Nocturne, Flatly and Sage renders in both output views. The full
catalog matrix substitutes theme CSS on unchanged canonical slide bodies.

The final matrix passed **3,796 slide checks with zero failures**. A compact
520 × 900 Nocturne matrix added 104 passing checks across both modes and views.
`just check` passes, including the 171-page site crawl; `just compat-check`
passes all 78 tests. Ten focused picture/classification/attribution tests pass,
including real Deno/Node renders. Existing statement/credit/quote and complete
semantic/math/step/appendix browser flows also pass in both views and modes.
The packaged authoring skill validates; independent review has no remaining
findings.

Paired themes checked: atelier, bootstrap, cerulean, cosmo, cyborg, darkly, darkly-reading, flatly, folio, journal, litera, litera-reading, lumen, lux, materia, minty, morph, nocturne, pulse, pulse-reading, quartz, sandstone, simplex, simplex-reading, sketchy, slate, solar, spacelab, superhero, tufte, united, vapor, yeti, zephyr, zephyr-reading.
Each was checked in light and dark, audience and presenter. Sage, mono-grid
and blank were checked in both views in their supported legacy mode.

Automatic remaining-height layout targets one picture, or a picture beside
one companion pane/list. Arbitrary multi-picture compositions retain their
authored layout. The renderer does not reclassify them as a one-picture grid.
No Deckset commands, color attributes, size attributes or inline style syntax
were added. Captions in notes and ordinary multi-content slides are unchanged.

## Current additions for look-talks (2026-11-09)

The following contracts are implemented in
[`b8fee29`](https://github.com/rahuldave/htmpres/commit/b8fee29).
They were merged as
[`3919357`](https://github.com/rahuldave/htmpres/commit/3919357)
in [PR #18](https://github.com/rahuldave/htmpres/pull/18), extending the original
report below.

### Dominant statements and level 0

Use `.statement` on a span or fenced block for importance level 4:

```markdown
## {#main-claim .autoscale data-title="The main claim"}

::: {.statement}
Structure makes the argument memorable.
:::
```

`[The main claim.]{.statement}` works within ordinary slide copy too. `.key`
remains level 3, body is 2 and `.aside` is 1. Level 0 is available through
purpose-specific `.credit` and `.source`; there is no generic small-text mark
or numbered author class. See [importance](semantic-authoring.md#importance)
for Schwabish's relevant pages and text-fit limits.

**Browser test:** detailed Nocturne light/dark checks measure statement
size/weight and confirm that a long statement shrinks to fit. Catalog
checks cover short-statement centering/containment and importance hierarchy
across 35 paired themes, three legacy seeds and read-only snapshots of all nine
pending foundations (91 mode cases total). Foundation adoption itself remains
a separate workstream.

### Picture credit and quotation source

Use a native `.credit` span or block; the renderer collects it into the
reserved lower-right picture-credit lane. Keep long records in the appendix:

```markdown
## A picture {#picture}

::: {.ds-full .ds-media .ds-fill .ds-no-pad}
![A source document branches into two views.](assets/two-views.svg)
:::

[Image: htmpres project, [source record](#image-source).]{.credit}

## Image source {#image-source data-kind="appendix"}

Project diagram supplied with this example.

[Back to the picture](#picture).
```

Use ordinary Markdown blockquotes, the slide class `.quote` and a `.source`
line. `.key` works inside the quotation:

```markdown
## One idea {.quote #quotation}

> An effective slide gives the audience [one idea to remember.]{.key}
>
> [Original example copy for this demonstration.]{.source}
```

**Browser test:** detailed Nocturne checks cover multiple stacked credits,
body/section-label/footer clearance and opaque backing. Unit tests confirm
that credit links survive relocation. All 91 catalog cases check credit
containment, body clearance, backing contrast and quote/source hierarchy;
a 520px viewport also checks credit geometry in audience/presenter views,
both modes. Theme contrast tests cover all 70 paired
modes; small attribution targets 4.8:1 and never falls below 4.5:1 in the stock
catalog. See [credits](semantic-authoring.md#picture-credits) and
[quotations](semantic-authoring.md#quotations-and-their-source) for Schwabish
page references and the contrast policy.

### Audience counter setting

Put `deck.counter` in initial deck front matter:

```markdown
---
pagetitle: A spoken talk
deck:
  theme: nocturne
  counter: presenter
---

## The result

[The intervention helped.]{.key}
```

`presenter` hides the audience footer counter and retains the presenter
counter. `false` hides both; omitted or `true` shows both. Invalid values
produce a machine-readable `deck-counter` lint error. Both verifiers reject
stale policy/visibility output.

**Browser test:** audience and presenter visibility, main-deck end count,
appendix count and return link in light/dark modes. Unit and actual render
tests exercise every policy through Deno and Node. The
[complete hook deck](_generated/source/authoring-hooks.qmd.txt) produces
[audience](_generated/authoring-hooks/index.html) and
[presenter](_generated/authoring-hooks/presenter.html) examples.

### Matching colors begin with the first reveal

Existing `data-step-summary="match"` syntax now colors each named source part
and explanation when that explanation first appears. Colors accumulate;
future explanations stay hidden. The extra final advance clears teaching
highlights/dimming to show every pair together. Back and restart restore the
appropriate reveal/color state. No additional opt-in attribute is required.
See the complete [code and equation examples](example.qmd?slide=6) and
[exact mapping/override syntax](semantic-authoring.md#finish-with-matched-colors).

**Browser test:** every code/equation teaching frame, source/explanation color
equality, hidden future text, final overview, backward navigation and reset in
audience/presenter views, light and dark. The interactive Markdown page's
keyboard controls, view/mode changes and appendix navigation were also tested.

### Equation example and minimum-fit correction

Implemented in
[`5cbf7ea`](https://github.com/rahuldave/htmpres/commit/5cbf7ea).
The equation example now teaches three distinct pairs, with
`data-equation-steps="mean|total|count"` and the same sparse
`data-step-indices="1|3|7"`. The denominator is `\htmlClass{count}{n}` and its
third explanation is:

```markdown
[Divide by the number of observations.]{.fragment data-fragment-index="7" data-match="count"}
```

On the third advance, the denominator is emphasized and the earlier two terms
are dimmed. The fourth advance restores all three colored terms to full
strength; it is an extra frame on the same slide. The former unpaired
"Connect the total to the mean" sentence is removed. See the complete
[copyable equation slide](semantic-authoring.md#equation-reuse-the-name-on-the-term)
and [interactive example](example.qmd?slide=6).

The same correction keeps an overlong solo `.statement` reachable when it
hits the theme's minimum fit size in a compact presenter preview. With
`overflow: fit-scroll`, short statements stay centered; excess copy starts
inside the scrollport and can be scrolled through to its end. No new author
syntax or smaller theme size is introduced.

**Browser test:** both failures were reproduced on the previous published
output. The corrected audience/presenter decks pass in light/dark modes. The checks cover
three term/explanation color pairs, two dimmed terms before the overview,
all three restored afterward, Back/reset, short-statement centering and real
scrolling from the first to last line at minimum fit. The interactive
Markdown page and exact displayed denominator mapping also pass.
`just check`, 35 focused runtime/navigation/hook tests and skill validation/lint
passed; independent review found no remaining issues.

The nine foundations subsequently shipped on main. Integration checks against
those actual shipped themes pass in all 18 light/dark cases for statement
hierarchy, picture credits and quotation sources. Code/equation matching and
statement reachability also pass in audience/presenter views and both modes.
The combined Pages build, 164-page crawl and 47 focused foundation/runtime/
navigation/hook tests pass. Browser flows use the visible presenter list or
audience overview and measure centering within the theme's content area,
respecting space reserved for controls.

Stepped display math also has a semantic size default of twice the surrounding
fitted body text, controlled by theme CSS `--htmpres-equation-scale`.
The QMD syntax stays unchanged. A browser regression reproduced a 15 px
equation in the compact presenter pane; the corrected default renders it at
about 31 px in that same pane. Light/dark checks confirm the enlarged equation
fits its column while inline math remains at normal text size. The main
example inherits this default instead of carrying a separate math-size rule.
These integration corrections are tracked in
[PR #19](https://github.com/rahuldave/htmpres/pull/19).

**Original hook release verification.** At `b8fee29`, `just check`, `just compat-check`, final 70 Node tests,
`just semantic-test`, `just docs-check` (164 HTML pages), actual Deno/Node hook
HTML parity, and packaged-skill validation/lint/scratch installation passed.
The downstream look-talks/nossaifd-talks repositories were not edited. No
Deckset shorthand, generic size utilities, foundation schema redesign or
credits/conclusion templates were added.

## Original semantic implementation

The semantic implementation was merged in
[`b374e3c`](https://github.com/rahuldave/htmpres/commit/b374e3cdaab0115fe9ccd8559b0a132888862f4f)
([PR #11](https://github.com/rahuldave/htmpres/pull/11)). The original feature
checkpoints below identify which part introduced each contract. They are all
included in that merged commit.

The [main feature tour](example.qmd) now puts the features in the deck used by
all 146 theme views. Direct comparison links below select that same deck.
Browser checks exercised full audience views in Nocturne light and Simplex
Reading dark, the Nocturne presenter view, and code/equation interactions inside
the comparison panes. Automated checks cover all 38 themes / 146 views; they
are not a claim of visual inspection of every theme.

Write the argument in QMD; let the theme choose fonts and colors. The complete
[example source](_generated/source/semantic.qmd.txt) contains no inline styles
or color values. Open the [audience deck](_generated/semantic/index.html) or
[presenter deck](_generated/semantic/presenter.html). Both use the custom HTML
renderer; Quarto supplies Pandoc for Markdown parsing.

Render and check it with:

```sh
quarto run _extensions/htmpres/htmpres.ts lint slides.qmd --json
quarto run _extensions/htmpres/htmpres.ts render slides.qmd
quarto run _extensions/htmpres/htmpres.ts verify slides.qmd
```

## 1. Importance

**Browser test:** [slide 3](compare.qmd?slide=3): measured key/aside spans and
blocks against ordinary text in both tested palettes. Key is larger, aside is
smaller, and the sizes survive fitting. No inline styling is needed.
**Commit:** [`36b0edc`](https://github.com/rahuldave/htmpres/commit/36b0edc),
included in `b374e3c`.

Use `.key` for the point of a slide and `.aside` for a minor qualification.
Both work on native spans and fenced blocks:

```markdown
## The result

[The intervention helped.]{.key}

::: {.aside}
The estimate is less certain for smaller groups.
:::
```

All 35 paired themes map these roles in both modes, and the three legacy seeds
have defaults. The theme token scale has levels 0 to 4, each with
`--htmpres-importance-N-scale`, `-weight` and `-ink`. Normal text is level 2;
`.aside` uses 1 and `.key` uses 3. The current additions above expose level 4
through `.statement` and level 0 through attribution marks;
there are no numbered author classes or new visual utility language. Theme
authors may change tokens in CSS without changing slide source. Role sizing
also works inside fitted cards and callouts.

## 2. Math and named terms

**Browser test:** [slide 6](compare.qmd?slide=6) and the semantic demo. Real
KaTeX HTML and MathML render without parse errors; named terms are present in
the DOM, and math in presenter cues renders. Generated script, stylesheet and
font URLs are local. Asset hashes and font completeness are checked separately;
network disconnection was not simulated in the browser.
**Commit:** [`357f56a`](https://github.com/rahuldave/htmpres/commit/357f56a),
included in `b374e3c`.

Use dollar delimiters. Give a term a semantic class with `\htmlClass`:

```markdown
## A sum

Inline $x^2$ also works.

$$
\htmlClass{term-a}{x} + \htmlClass{term-b}{y} = z
$$
```

KaTeX 0.19.1, its CSS and fonts are bundled locally. Keep the generated
`assets/htmpres-math/` folder beside the HTML when sharing a deck offline.
Math is typeset in presenter notes too. Accessible MathML accompanies the
visual equation. Only KaTeX's `\htmlClass` extension is trusted; URL, inline
style and HTML-ID extensions are disabled. Use descriptive class names, not
colors, and define any custom term styling in the theme.

## 3. Shared text, code and equation steps

**Browser test:** [code slide 5](compare.qmd?slide=5) and
[equation slide 6](compare.qmd?slide=6). Each of three Next presses reaches
frames 1, 3, 7 and changes the matching code line or equation term together
with the explanation. Earlier explanations retain opacity 1, future ones stay
hidden, and Previous restores both lanes. Both embedded comparison panes and
full audience/presenter views were exercised.
**Commits:** [`f0a4b33`](https://github.com/rahuldave/htmpres/commit/f0a4b33)
(runtime), [`357f56a`](https://github.com/rahuldave/htmpres/commit/357f56a)
(math integration); included in `b374e3c`.

`data-fragment-index` is a shared frame number. Map code snapshots to those
numbers with `data-step-indices`. This complete slide changes code and reveals
its explanation together:

````markdown
## Compute a mean

:::: {.two-col}
::: {}
```{.python .numberLines data-steps="1|2|3" data-step-indices="1|3|7"}
values = [2, 4, 6]
total = sum(values)
mean = total / len(values)
```
:::
::: {}
[Collect the observations.]{.fragment data-fragment-index="1"}

[Add them.]{.fragment data-fragment-index="3"}

[Divide by the count.]{.fragment data-fragment-index="7"}
:::
::::
````

There are three keypresses, despite the gaps in the numbers. Earlier ordinary
text remains fully visible. Code highlights its current selection and dims the
other lines; `data-highlight` can add persistent highlighted lines.

An equation uses the same mapping. Each `|` separates snapshots; a comma selects
several named terms in one snapshot:

```markdown
## Connect the terms

:::: {.two-col}
::: {.equation-steps data-equation-steps="term-a|term-b|term-a,term-b" data-step-indices="1|3|7"}
$$
\htmlClass{term-a}{x} + \htmlClass{term-b}{y} = z
$$
:::
::: {}
[Start with x.]{.fragment data-fragment-index="1"}

[Then y.]{.fragment data-fragment-index="3"}

[Combine both.]{.fragment data-fragment-index="7"}
:::
::::
```

Only named terms referenced by `data-equation-steps` participate in dimming.
Other operators remain unchanged. List every selected class in a snapshot
when several terms should be emphasized. Mapped lanes begin inactive and hold the latest
snapshot until their next mapped frame. Backwards navigation restores each
lane consistently.

Mapping entries must be decimal digits, positive safe integers, strictly
increasing within that code/equation block, with one entry per snapshot.
Invalid mappings warn in the browser, set
`data-step-error="invalid-step-indices"`, and fall back to implicit order.

Without mappings, mixed slides schedule text/code/equation events in source
order. Existing **code-only** slides retain their first-snapshot baseline and
multiple unmapped code blocks share their kth snapshots. Explicit fragment
index `0` remains a baseline reveal. Prefer explicit shared numbers whenever
two columns should advance together.

## 4. Layering without reading ahead

**Browser test:** [slide 4](compare.qmd?slide=4): all four future points are
initially hidden. Four Next presses reveal spans in the left column and list
items in the right column. Computed visibility and opacity confirm that only
past points dim, the current point is fully visible, and future points remain
hidden.
**Commit:** [`f0a4b33`](https://github.com/rahuldave/htmpres/commit/f0a4b33),
included in `b374e3c`.

The `dim` effect hides future points, shows the current point normally, and
dims past points. It is inherited by fragment spans and list items inside
columns:

```markdown
## Build the argument

:::: {.two-col}
::: {.incremental data-fragment-effect="dim"}
[The question.]{.fragment}

[The answer.]{.fragment}
:::
::: {.incremental data-fragment-effect="dim"}
- The evidence.
- The implication.
:::
::::
```

Explicit fragment effects override a container effect. Ordinary fragments do
not dim. A dimmed text lane keeps its latest text point current while only
code or equations advance. No mode previews future text in grey.

## 5. Appendix navigation

**Browser test:** [slide 10](compare.qmd?slide=10): End lands at `10 / 10`,
Next is disabled, the data link enters `Appendix 1 / 2`, the detail link enters
the unmarked following slide at `Appendix 2 / 2`, and the return link restores
`10 / 10`. Named links work without reloading the document. Browser Back is
also covered by the semantic-demo browser flow.
**Commits:** [`f0a4b33`](https://github.com/rahuldave/htmpres/commit/f0a4b33)
(navigation), [`357f56a`](https://github.com/rahuldave/htmpres/commit/357f56a)
(slide IDs); included in `b374e3c`.

Give slides explicit IDs for stable links. The first `data-kind="appendix"`
starts a trailing appendix, including every later slide:

```markdown
## Main result {#main-result}

[The data](#appendix-data)

## Supporting data {#appendix-data data-kind="appendix"}

The detailed evidence belongs here.

[Back to the result](#main-result)
```

The main counter, Next, End and media autoadvance stop at the main-talk
boundary. The last main slide's steps remain available before Next stops. Links and the slide
list can enter the appendix, which has a separate `Appendix N / M` counter.

Return links and browser Back return to the main slide. Same-slide footnote
links preserve the reveal frame. Numeric `#/N` URLs remain supported.
Slides without an explicit ID receive a collision-safe `slide-N` ID. Duplicate
explicit slide IDs are an error.

## 6. Opening and closing slide kinds {#6-opening-and-closing-slide-kinds-no-change-requested}

The request marked this item as information only, so it required no implementation.
No `credits` or `conclusion` insert kinds/templates were added. An author can
write an ordinary semantic closing slide today:

```markdown
## The intervention improves the outcome {#main-result}

[The evidence supports adoption.]{.key}

Questions?
```

The example uses ordinary slide content, without a new kind. Browser verification is the
ordinary main closing slide in the tour; there is no implementation commit for
new kinds because they were excluded.

## 7. Footnotes

**Browser test:** [slide 3](compare.qmd?slide=3) and appendix slide 11 reuse
`[^1]`. The rendered DOM has unique IDs; following a footnote and its backlink
stays on the owning slide. The semantic demo also reuses labels across slides
and presenter cues. Renderer tests cover title/body/cue namespaces in both
entry points.
**Commit:** [`357f56a`](https://github.com/rahuldave/htmpres/commit/357f56a),
included in `b374e3c`.

Use standard Pandoc footnotes, and reuse labels on different slides:

```markdown
## First estimate

The first result.[^1]

[^1]: First source.

## Second estimate

The second result.[^1]

[^1]: Second source.
```

Footnote IDs, references and backlinks are unique per slide and presenter cue.
Code IDs and body-heading IDs are also namespaced. Authored slide IDs and links
to other slides are preserved. Literal code samples are not rewritten.

## 8. Emphasis in titles

**Browser test:** [slide 1](compare.qmd?slide=1): "source" is an `em` element;
the outline and comparison selector show plain text without literal asterisks.
The semantic demo and renderer tests also cover strong text, links and title
footnotes.
**Commit:** [`357f56a`](https://github.com/rahuldave/htmpres/commit/357f56a),
included in `b374e3c`.

Titles accept inline Markdown; navigation uses their plain text:

```markdown
## Why *structure* and **order** matter {#structure}

[Story before styling.]{.key}
```

## 9. Slide boundaries (updated after PR #11)

The original PR #11 blanket rejection of body `---` has been superseded.
Standalone top-level `---` and `##` both start slides; a separator followed by
an empty or titled heading (with only blank lines between) makes one slide.
Untitled slides use `Slide N` or `data-title` in navigation and omit the heading.
Rules inside code, comments and fenced divs, including notes, do not split slides.
The lint JSON schema stays at version 1; `empty-slide` replaces the former
`slide-break` prohibition. Both renderers, both verifiers and slide editing
commands share this contract.

See [the current authoring contract](semantic-authoring.md#slide-boundaries-and-lint)
for exact syntax, empty-slide diagnostics and the three-slide example. The
implementation report for PR #11 above remains a historical record of its
other semantic features.

## Deliberately deferred

Item 6's credits/conclusion templates were information only. This change adds
neither those templates nor Deckset shorthand (`[.column]`, `^` notes). The
future visual language and Deckset translation layer remain separate work.
The downstream planning skill in nossaifd-talks is not modified here; its
authors can use the exact syntax above.

## Reloadable local viewer

```sh
quarto run _extensions/htmpres/htmpres.ts serve slides.qmd --watch --port 8767
```

Open `http://127.0.0.1:8767/` for the audience or
`http://127.0.0.1:8767/presenter.html` for cues. Save QMD, CSS or local assets;
the server rebuilds both outputs and the browser reloads after a successful
build.

The current view and slide hash stay in place. Reveal steps restart.
An invalid save keeps the last good deck visible. Fix and save to recover.
The preview client is injected by the local server; exported HTML has no
polling connection. The canonical tour is served the same way.

**Browser test:** opened audience and presenter pages at `#/2`, edited the
source and its speaker cue, then observed both pages update automatically while
remaining on slide 2 in their respective views. Restarting the server also
reconnected and updated both pages without manual refresh. The repeatable CUA
assertions are in `integration_tests/preview-browser.mjs`. The real-server integration
also checks CSS/media saves, invalid-source recovery, no generated-asset loop,
no-cache responses, and absence of the reload client from saved HTML.

## Verification and scope

- `just check`: tutorial/example/semantic renders, verifier, authoring smoke,
  real preview server checks, theme variants and complete local site crawl.
- Focused renderer/runtime tests cover sparse shared frames, reverse steps,
  invalid mappings, appendix navigation, math, footnotes, titles and lint.
- `integration_tests/showcase-browser.mjs` is the repeatable main-tour browser
  flow; `integration_tests/semantic-browser.mjs` covers the compact semantic
  fixture and presenter notes. These run through CUA against a served page.
- The comparison page now links directly to the feature slides. The main
  tour has ten talk slides, two appendix slides and twelve presenter cues.

The downstream nossaifd-talks skill was not edited. Its authors can use this report as input.
No Deckset `[.column]` / `^` translation was added. No new visual utility
language or design system was introduced. Importance has default theme tokens;
content uses semantic classes and attributes. Browser auto-refresh and the
main-tour correction were delivered after the original semantic merge; their
current behavior is described above and in the authoring guide.
