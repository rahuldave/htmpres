---
name: htmpres-authoring
description: Author, inspect, and edit htmpres Quarto presentation decks through the installed _extensions/htmpres/htmpres.ts CLI. Use when Codex needs to list or classify slides, show exact slide source, insert a templated slide, replace one numbered slide, manage deck-local themes, render a deck, or verify htmpres deck output.
---

# Htmpres Authoring

## Workflow

1. Verify the extension exists:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts help
   ```

   If it is missing, stop and use `htmpres-installer` or ask the user to install
   the htmpres extension. Do not recreate renderer files by hand.

2. Identify the deck path. Prefer `presentations/<deck>/index.qmd` or
   `<deck>/index.qmd`. Use the path the user supplied when present.

3. Inspect before editing:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts slide list <deck>/index.qmd --json
   quarto run _extensions/htmpres/htmpres.ts slide show <deck>/index.qmd <n> --json
   ```

4. Make the narrowest source edit:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts slide insert <deck>/index.qmd --after <n> --kind <kind> --title "Title" --section "Section"
   quarto run _extensions/htmpres/htmpres.ts slide replace <deck>/index.qmd <n> --from /tmp/slide.qmd
   ```

   Use `replace` after preparing a complete level-2 slide source. Avoid
   whole-file rewrites unless the user explicitly asks for broad cleanup.

5. Render and verify:

   ```sh
   quarto run _extensions/htmpres/htmpres.ts lint <deck>/index.qmd --json
   quarto run _extensions/htmpres/htmpres.ts render <deck>/index.qmd
   quarto run _extensions/htmpres/htmpres.ts verify <deck>/index.qmd
   ```

   Pass the actual source path (including `slides.qmd` when that is its name)
   to `verify`; no-argument discovery covers only `decks/**/index.qmd`.

   If the project has a generated presentation `Justfile`, humans may use
   `just render <deck>`, but agents should prefer the explicit extension CLI.

## Slide Kinds

Use the kind reported by `slide list --json` as the primary classification.
Supported template kinds include:

`hero`, `section`, `text`, `two-card`, `three-card`, `four-card`,
`profile-grid`, `steps`, `diagram`, `full-media`, `left-media`,
`right-media`, `split`, `media-grid`, `code`, `interactive`, `fragment`, and
`appendix`.

When adding a slide, choose the closest structural kind. For example, use
`interactive` for button/pill control slides, `left-media` or `right-media` for
half-media layouts, and `two-card` or `three-card` for comparison slides.

## Semantic Source

Write structure, importance and reveal order in QMD. Do not put `style=`, CSS
color values, color names or font choices in ordinary authored slides. Select a theme
in front matter; put custom appearance in the theme stylesheet.

Slides start at top-level `---` (exactly three hyphens) or `## Title`. A
separator followed by a heading, with only blank lines between, makes one
slide. Untitled slides have no visible heading; navigation uses `Slide N` or
`data-title`. Put settings on an empty heading:
`## {#appendix-data data-kind="appendix" data-title="Backup data"}`.
It can stand alone or follow `---`. Initial body content also forms an untitled
slide. The main/appendix counters and notes work for either boundary form.

Initial YAML delimiters are metadata, not slides. Put the first separator after
YAML; without YAML, begin with a blank line before an opening separator.
Code fences, indented/raw code, HTML comments and fenced `:::` divs protect
both separators and headings. `---` inside `::: notes` stays in that slide's
notes as a Markdown rule (leave blank lines around it). Balance nested divs.
Leading comments do not create a slide. Do not split slides using `---` inside
a div, or assume all Pandoc horizontal-rule variants are slide boundaries.

`lint <path> [more paths] --json` returns
`{version:1,ok,diagnostics:[{file,line,column,code,severity,message}]}` with exit
0 for success and 1 for errors. `empty-slide` flags an empty slide created by
consecutive/trailing separators or an empty heading with no body. The old
`slide-break` prohibition is retired. Rendering, verification and slide editing
commands use the same boundaries. See `docs/semantic-authoring.md` section 9
and `decks/slide-breaks/index.qmd` for the three-slide mixed-boundary example.

Importance works on spans and blocks:

```markdown
## Why *structure* matters {#result}

[The main point.]{.key}

::: {.aside}
A minor qualification.
:::
```

`.key` maps to importance level 3 and `.aside` to level 1; normal body text is
level 2. Theme tokens `--htmpres-importance-{0..4}-{scale,weight,ink}` support
future remapping; there are no numbered author classes. Titles render inline
Markdown; navigation labels are plain text.

Math uses `$x^2$` or `$$...$$`, with local KaTeX assets. Use
`\htmlClass{term-a}{x}` inside math to name a term. Keep the generated
`assets/htmpres-math/` with the HTML for offline viewing. Do not use KaTeX's
style, URL or HTML-ID extensions; only `\htmlClass` is trusted.

## Shared Steps

Map code snapshots and text to the same positive frame numbers:

````markdown
## Explain a calculation

:::: {.two-col}
::: {}
```{.python data-steps="1|2" data-step-indices="1|3"}
x = 1
x += 2
```
:::
::: {}
[Introduce x.]{.fragment data-fragment-index="1"}

[Add two.]{.fragment data-fragment-index="3"}
:::
::::
````

Replace the code container with this equation container to use term snapshots:

```markdown
::: {.equation-steps data-equation-steps="term-a|term-b|term-a,term-b" data-step-indices="1|3|7"}
$$
\htmlClass{term-a}{x} + \htmlClass{term-b}{y} = z
$$
:::
```

`|` separates snapshots; commas combine term classes. Only referenced named
terms dim. Use matching text fragment indices 1, 3, 7 to explain each snapshot.
Gaps consume no extra keypresses. Mapped lanes start inactive and hold their
latest snapshot. Earlier ordinary text stays visible without dimming. Each
mapping must have one decimal, positive safe integer per snapshot, strictly
increasing; invalid mappings warn and fall back to implicit order. Unmapped
mixed events run in source order. Legacy unmapped code-only slides retain
their first snapshot baseline and shared kth snapshots across code blocks.

For deliberate layering, wrap spans or a list in
`::: {.incremental data-fragment-effect="dim"}`. Spans also need `.fragment`:

```markdown
::: {.incremental data-fragment-effect="dim"}
[First point.]{.fragment}

[Second point.]{.fragment}
:::
```

Future points remain hidden; only earlier visible points dim. The effect works
for spans and list items inside columns. Never preview future text in grey.

## Optional Matched Summary

Use `## Result {data-step-summary="match"}` to add one final advance after the
shared teaching frames. The summary removes highlights/dimming and matches
source parts to explaining text. Previous restores the last teaching frame.
Do not hand-number the summary; it follows all real events automatically.

- Text: `[Explain the mean.]{.fragment data-fragment-index="3" data-match="mean"}`.
- Code fence: add `data-line-matches="1:observations|2:total|3:mean"`; line ranges
  such as `2-4:total` and comma selections such as `1,3:observations` work.
  Ranges must be in bounds, disjoint, and refer to a `data-match` explanation.
- Equation: use `\htmlClass{mean}{\bar{x}}` inside an `.equation-steps` block.
  Use `mean` in that block's `data-equation-steps` and on its explanation.
- Keys start with a lowercase letter; remaining characters are lowercase
  letters, digits or hyphens. `enclosing` is reserved for KaTeX. Repeated keys retain one color per slide.

Let the theme choose colors by default. When the human asks for direct colors,
these are supported exceptions to semantic-only source:

```markdown
[The mean.]{data-match="mean" data-match-color="#245c88" data-match-color-dark="#91c9f0"}

## Result {data-step-summary="match" data-match-colors="mean=#245c88|total=#765013" data-match-colors-dark="mean=#91c9f0|total=#edc37d"}
```

One occurrence's color sets the whole named pair. Inline colors override a
slide palette; `data-match-color` is the default for both modes, with the
`-dark` attribute replacing it in dark mode. An inline math term can use
`[$\bar{x}$]{data-match="mean" data-match-color="#245c88"}`. Inside a larger
equation keep `\htmlClass` and set the shared color on its explanation or slide.
Do not put Pandoc attributes inside TeX or enable KaTeX HTML styles.

Deck-wide CSS uses `--htmpres-match-mean: #245c88` (or a CSS color name or
`var(--teal)`) on `.slide`, with a dark-mode selector for a different value.
Generated palettes target 4.8:1 text/background contrast; custom colors are
preserved exactly, so inspect both modes. The online semantic authoring guide
has complete code/equation slides and contrast policy.

## Appendix And Footnotes

Use `## Data {#appendix-data data-kind="appendix"}` to begin a trailing
appendix. Every later slide belongs to it. The normal counter, Next and End
stop at the last main slide; appendix counters are separate. Link with
`[The data](#appendix-data)` and return with `[Back](#result)` to an explicitly
identified main slide. Live links and browser history work; duplicate explicit
slide IDs fail rendering. Automatic fallback IDs are `slide-N`, with a suffix
on collision; explicit IDs are best for durable links.

Standard footnotes (`[^1]` and `[^1]: Source.`) may reuse labels on different
slides and in presenter cues; generated IDs and backlinks are namespaced.
Notes remain fenced `::: notes` blocks, never Deckset `^` syntax. Do not add
Deckset shorthand such as `[.column]`.

## Themes

Select bundled Bootstrap, Bootswatch, Elegant, Reading or Tufte themes by
name, for example `deck.theme: nocturne` or `deck.theme: simplex-reading`, with
`deck.color-mode: light|dark|auto`. All 35 paired themes map importance in both
modes. Deck-local CSS selector blocks also work; legacy seeds are `sage`,
`mono-grid`, and `blank`.

Use:

```sh
quarto run _extensions/htmpres/htmpres.ts theme list
quarto run _extensions/htmpres/htmpres.ts theme add <deck>/index.qmd <name> --from sage
quarto run _extensions/htmpres/htmpres.ts theme set <deck>/index.qmd <name>
```

After adding a custom theme, edit `<deck>/source.css`. Keep slide source
semantic; appearance and CSS variables belong in the stylesheet.

## Safety

- Preserve unrelated source text and front matter.
- Treat `slide replace` as a splice of exactly one numbered slide.
- Do not modify a host project's root `Justfile`; generated htmpres Justfiles
  belong inside the presentation workspace.
- Report the exact commands run and any render or verification failures.
