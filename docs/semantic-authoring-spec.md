# Spec: Semantic Markdown presentation contracts

## Problem statement

Talk planning must retain emphasis, layering and story order in hand-editable QMD.
Fonts and colors belong to themes. Add reliable math, mixed steps and navigation
without requiring inline styling or Deckset syntax.

## Baseline audit at 1b48599

- Native Pandoc spans/divs already work. `.key`/`.aside` lack theme mappings.
- Simple dollar math already becomes basic HTML; complex math and `\htmlClass`
  need an engine. Bundle KaTeX, its fonts and license for offline folder use.
- Separate fragment/code clocks force text first. Dim hides future fragments;
  lists in columns work, but explicit spans do not inherit an incremental
  container's effect. Preserve hiding and fix that inheritance.
- Explicit heading IDs already render. Automatic IDs, live named navigation,
  appendix counters and the main-talk boundary are missing.
- Pandoc footnote IDs repeat. Titles escape inline Markdown. No break linter.
- Local runtime copies override the extension, and Node duplicates renderer and
  verifier logic. Treat those surfaces as coupled implementation requirements.

## Authoring contract

1. `.key` marks a main point and `.aside` a minor one, on spans or fenced divs.
   Theme tokens map their importance to size, weight and ink. Keep numbered
   token levels extensible; do not introduce a visual utility language.
2. `$...$` and `$$...$$` use local KaTeX assets. Allow only KaTeX's class
   extension through its trust callback: `\htmlClass{term-a}{x}`. No CDN/runtime
   package install is required to view a rendered deck. Typeset notes too.
3. One ordered graph drives each slide. Text keeps `.fragment` and
   `data-fragment-index="1"`. Code keeps `data-steps="1|2|3-4"` and can map
   snapshots to shared frames with `data-step-indices="1|2|3"`.
   `.equation-steps data-equation-steps="term-a|term-b|term-a,term-b"` uses
   the same `data-step-indices`. Explicitly mapped snapshots start inactive;
   each holds until its next change. Earlier text stays revealed unless dim
   was explicitly requested. Implicit events use source order. Preserve the
   first-snapshot baseline of existing unmapped code-only decks and persistent
   code highlights. Sparse shared indices do not introduce empty keypresses.
4. `.incremental data-fragment-effect="dim"` hides future points, emphasizes
   the current point and dims previous points, including spans/lists in columns.
5. `## Extra {#appendix-data data-kind="appendix"}` starts a trailing appendix;
   all later slides belong to it. Main counter/Next/End stop before it. In the
   appendix show a separate appendix counter. `[The data](#appendix-data)` and
   `[Back](#main-result)` navigate with browser history; retain `#/N`, footnotes
   and same-slide anchors. Generate unique `slide-N` fallback IDs, preserving
   explicit IDs and rejecting duplicates. Auto-ID collisions get a suffix.
7. Namespace actual generated `fn*`, `fnref*`, `footnotes` and code IDs by slide
   or note fragment, including references. Do not alter literal code examples.
8. Render inline Markdown in `##` titles; keep navigation text plain.
9. `lint <file.qmd> [more.qmd...] --json` rejects standalone body `---` outside
   code. Initial YAML delimiters are exempt. JSON schema: version, ok,
   diagnostics with file,line,column,code,severity,message; exit 0 valid, 1 errors.
   Share the scanner with verify; support CRLF and backtick/tilde fences.

## Scope and ownership

Renderer slice: both renderers, source scanning/lint, identifiers, titles,
math vendor/bootstrap, both verifiers; load shared semantic/step CSS files.
Runtime slice: both deck JS copies, shared graph helper if useful, step CSS,
appendix/hash/media/notes navigation and focused tests. Call optional
`window.htmpresRenderMath(root)` after inserting presenter note HTML.
Theme slice: semantic CSS and theme importance tokens, with tests.
Integration slice: public example, authoring skill, class map/status/packaging,
Just contract, end-to-end and browser checks, exact syntax/commit report.

## Out of scope

Item 6 (credits/conclusion kinds) is information only: do not implement it.
Do not change the other repository's planning skill, add Deckset shorthand,
show future points in grey, or design the later visual language.

## Acceptance and verification

Characterize existing code-only steps and layering before changes. Test shared
and sparse frames, backwards/reset, invalid mappings, appendix links/history,
unique footnote references, title markup, offline classed math, source-break
JSON and Deno/Node parity. Verify packaged/local runtime parity, tutorial and
site builds. Use actual browser examples for every requested implemented item;
check offline assets and all theme-mode token mappings. Publishable docs must
provide copyable semantic QMD and record known limits. A new PR is reviewed at
integration; previous merge approval covered PR #10 only.

## References

- User requirements and read-only renderer/runtime audit at 1b48599.
- KaTeX options/security/browser docs: https://katex.org/docs/options.html,
  https://katex.org/docs/security, https://katex.org/docs/browser.html.
- `docs/quarto-class-map.md`, `docs/deckset-feature-status.md`,
  `skills/htmpres-authoring/SKILL.md`.
