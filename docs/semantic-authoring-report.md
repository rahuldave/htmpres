# Semantic authoring implementation report

Verified on 2026-11-06. This is the exact authoring contract for the downstream
presentation skill. The plan stays in `plan.md`; the hand-editable deck can be
named `slides.qmd`. htmpres does not read the planning worksheet.

## Current additions for look-talks (2026-11-09)

The following contracts are implemented in
[`b8fee29`](https://github.com/rahuldave/htmpres/commit/b8fee29).
They extend the original report below.

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

**Browser test:** the statement's measured size/weight dominates body copy,
the untitled single block centers, and fitted text stays within the body.
Checked in light/dark modes across 35 paired themes, three legacy seeds and
read-only snapshots of all nine pending foundations (91 mode cases total).
Foundation adoption itself remains a separate workstream.

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

**Browser test:** credit links survive relocation; multiple credits stack,
body and section label clear the lane, and the opaque theme backing remains
readable over the image. Checked all 91 catalog cases and a 520px viewport in
audience/presenter views, both modes. Quote emphasis and smaller source text
were checked in the same catalog. Theme contrast tests cover all 70 paired
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

**Verification:** `just check`, `just compat-check`, final 70 Node tests,
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
have defaults. The theme token scale has levels 0–4, each with
`--htmpres-importance-N-scale`, `-weight` and `-ink`. Normal text is level 2;
`.aside` uses 1 and `.key` uses 3. The current additions above expose level 4
through `.statement` and level 0 through attribution marks;
there are no numbered author classes or new visual utility language. Theme
authors may change tokens in CSS without changing slide source. Role sizing
also works inside fitted cards and callouts.

## 2. Math and named terms

**Browser test:** [slide 6](compare.qmd?slide=6) and the semantic demo: real
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
[equation slide 6](compare.qmd?slide=6): each of three Next presses reaches
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

## 6. Opening and closing slide kinds — no change requested

The request explicitly marked this item **FOR YOUR INFO ONLY: nothing to do**.
No `credits` or `conclusion` insert kinds/templates were added. An author can
write an ordinary semantic closing slide today:

```markdown
## The intervention improves the outcome {#main-result}

[The evidence supports adoption.]{.key}

Questions?
```

This is ordinary slide content, not a new kind. Browser verification is the
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

**Browser test:** [slide 1](compare.qmd?slide=1): “source” is an `em` element;
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
Rules inside code, comments and fenced divs—including notes—do not split slides.
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
build. The current view and slide hash stay in place; reveal steps restart.
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

The downstream nossaifd-talks skill was not edited: this report is its input.
No Deckset `[.column]` / `^` translation was added. No new visual utility
language or design system was introduced. Importance has default theme tokens;
content uses semantic classes and attributes. Browser auto-refresh and the
main-tour correction were delivered after the original semantic merge; their
current behavior is described above and in the authoring guide.
