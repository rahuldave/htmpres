# Semantic slides

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

## 9. Slide-break lint

A new slide starts with `##`. A standalone body `---` outside code is an
**error**, including immediately before a heading. Initial YAML front-matter
delimiters are exempt, as are code examples in backtick/tilde fences or
indented code. Use `##` for a slide and remove the stray rule:

```markdown
## First slide

The opening.

## Second slide

The next point.
```

The linter accepts multiple paths, returns exit status 0 on success and 1 on
diagnostics. Rendering and `verify` enforce the same rule. Machine output is:

```json
{"version":1,"ok":false,"diagnostics":[{"file":"slides.qmd","line":12,"column":1,"code":"slide-break","severity":"error","message":"..."}]}
```

Pass the source path to `verify slides.qmd` as shown above. Without paths,
`verify` discovers only `decks/**/index.qmd`; explicit paths also support the
hand-edited `slides.qmd` name and fail if rendered HTML is missing.

The checker in another repository can call the CLI directly; no Node runtime
is required. In this repository, `just lint slides.qmd` runs that JSON check.

## Deliberately deferred

Item 6's credits/conclusion templates were information only. This change adds
neither those templates nor Deckset shorthand (`[.column]`, `^` notes). The
future visual language and Deckset translation layer remain separate work.
The downstream planning skill in nossaifd-talks is not modified here; its
authors can use the exact syntax above.
