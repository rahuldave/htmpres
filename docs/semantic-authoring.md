# Semantic slides

See the [implementation and browser-test report](semantic-authoring-report.md)
for the downstream skill contract and feature commits.

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
`.aside` uses 1 and `.key` uses 3. Levels 0 and 4 are reserved token hooks;
there are no numbered author classes or new visual utility language. Theme
authors may change tokens in CSS without changing slide source. Role sizing
also works inside fitted cards and callouts.

## 2. Math and named terms

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

## 7. Footnotes

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

Titles accept inline Markdown; navigation uses their plain text:

```markdown
## Why *structure* and **order** matter {#structure}

[Story before styling.]{.key}
```

## 9. Slide boundaries and lint

Start a slide with a standalone `---` or a level-two heading (`## Title`).
Both are accepted at the top level, with zero to three leading spaces and
optional trailing spaces or tabs. Four-space/tab-indented code is exempt.
Only exactly three hyphens count: `----`, `***`, and `___` are not slide
boundaries. A `---` followed by `##` with only blank lines between makes
**one slide**. Content before the first boundary forms an untitled opening slide;
leading HTML comments do not create slides. Heading-only decks keep working.

An untitled slide has no displayed heading. Navigation, overview, and presenter
navigation use `Slide N`, where N is its one-based position in the whole file.
Use `data-title="Backup data"` to choose a navigation label without adding a
visible title. The CLI's JSON slide list keeps `title: ""` and exposes the
fallback or override in `dataTitle`; its text list shows that label. Counters
work as usual: main slides show `1 / N`, while a trailing appendix has its own
`Appendix 1 / N` counter.

Use an **empty heading** for settings on an untitled slide:

```markdown
---

## {#appendix-data data-kind="appendix" data-title="Backup data"}

The data, without a displayed title.
```

That is one slide. The empty heading can also start it without a preceding
`---`. IDs, classes and other slide attributes use the same heading syntax as
titled slides; do not put attributes on the separator itself.

The initial YAML front matter is unchanged: its opening `---` and closing
`---` (or `...`) are metadata delimiters. Put an opening slide separator **after**
the front matter. Without front matter, leave an initial blank line before an
opening separator so a later `---` cannot be mistaken for the YAML closer.
Backtick/tilde fences, indented code, raw code blocks, HTML comments, and fenced
`:::` divs protect their contents from slide splitting. Both `---` and `##`
inside a div stay on the current slide. Balance nested divs before the next
slide boundary.

Speaker notes (`::: notes` or `::: {.notes}`) belong to their current slide.
A `---` inside notes or another fenced div is a normal Markdown rule, not a
slide boundary or a lint error. Leave blank lines around an intended rule to
avoid Markdown's Setext-heading interpretation. Nested divs inside notes stay
with those notes. Quarto 1.8.26's Reveal output was checked for rule containment
and empty attributed headings. htmpres intentionally keeps `##` inside a div
local too, avoiding Quarto's nested slide sections inside notes/divs.

This complete file makes **three slides**: the first from `---` alone, the
second from `##` alone, and the third from `---` plus `##` together:

```markdown
---
pagetitle: Three slides
deck:
  theme: nocturne
---

---

Opening without a title.

::: notes
First slide cue.
:::

## Second slide

Second slide body.

---

## Third slide

Third slide body.
```

A runnable variation at `decks/slide-breaks/index.qmd` uses an empty attributed
heading for the third slide, demonstrating appendix settings and notes on all
three slides. Run `just slide-breaks` and open its `index.html` or
`presenter.html`.

The linter rejects **empty slides**: two consecutive separators, a trailing
separator, or an empty heading with no body. A heading with a title and no body
is a valid title-only slide. A leading separator adds no preceding empty slide.
An error points to the boundary that started the empty slide. Rendering and
`verify` use the same rule and fail on those diagnostics.

The CLI still accepts multiple paths and returns versioned JSON, exit 0 on
success, or exit 1 on errors:

```json
{"version":1,"ok":false,"diagnostics":[{"file":"slides.qmd","line":12,"column":1,"code":"empty-slide","severity":"error","message":"..."}]}
```

`slide-break` (the former blanket prohibition) is retired. Successful output is
`{"version":1,"ok":true,"diagnostics":[]}`. `source-read` and `usage` errors
retain their meanings. The checker in another repository can call
`quarto run _extensions/htmpres/htmpres.ts lint slides.qmd --json`; no Node
runtime is required. In this repository use `just lint slides.qmd`.

Pass source paths to `verify slides.qmd`; without paths, `verify` discovers
`decks/**/index.qmd`. Explicit paths support arbitrary names and fail if rendered
HTML is missing. `slide list/show/insert/replace`, both rendering engines,
verification and showcase labels all share the same slide boundaries.

The boundary convention follows [Quarto presentations](https://quarto.org/docs/presentations/index.html).
Quarto also recommends [empty headings for slide attributes](https://github.com/orgs/quarto-dev/discussions/603).
This is compatibility for the requested `---`/`##` subset, not a full Pandoc or
Deckset importer (for example, level-one section slides and Setext slide
headings are not implemented).

## Deliberately deferred

Item 6's credits/conclusion templates were information only. This change adds
neither those templates nor Deckset shorthand (`[.column]`, `^` notes). The
future visual language and Deckset translation layer remain separate work.
The downstream planning skill in nossaifd-talks is not modified here; its
authors can use the exact syntax above.
