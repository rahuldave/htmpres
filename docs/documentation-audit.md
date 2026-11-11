# Public documentation audit, 2026-11-10

The public site has 20 pages. The beginner route is Start a deck, followed by
an interactive feature tour and copyable picture patterns. Theme and renderer
customization remain reference material.

## Page review

| Page | Result |
| --- | --- |
| Home | Literal title, clear Quarto/Pandoc/htmpres roles, JavaScript navigation and picture-pattern link |
| Start a deck | Normal create/edit/watch/theme/share workflow, pattern links and lint coverage |
| Learn from the Markdown | Wider preview, compact source typography, source wrapping and explicit slide/notes canvas |
| Pictures and slide patterns | New 11-slide source with supplied assets, exact Markdown, steps and notes |
| Compare themes | Escapes the prose width cap; retains the original 12-slide, 146-view comparison |
| Authoring CLI | Extension and ordinary commands before optional agent skills; current lint contract |
| Customization reference | Browser title versus visible title clarified; retained advanced CSS/filter/settings material |
| Themes | Theme choice before optional color overrides; preserved catalog and foundation facts |
| Class reference | Current semantic exception for explicit match colors; readable paragraphs and sentence-case headings |
| Semantic slides | Lookup topics, picture roles, current syntax, unsupported syntax and shorter paragraphs |
| Implementation report | Dated history distinguished from the current author guide; preserved release measurements |
| Quarto extension | Working repository install path and current utility extension; future formats labeled |
| Packaging | Actual files/build path, offline assets and privacy of both QMD and presenter cues |
| Feature status | Reader-oriented groups and supported syntax rather than implementation effort |
| Website maintenance | Pattern source/staging and browser checks documented |
| Plotting overview | JavaScript workflow, defined furniture/profile/surface/LUT terms |
| Python guide | Reviewed task/code/result flow; defined profile and surface, preserved runnable examples |
| R guide | Reviewed task/code/result flow; defined profile and surface, preserved runnable examples |
| JavaScript guide | Defined chart furniture; preserved browser/OJS examples and pinned limits |
| Plotting gallery | Explicit Python/R static scope and link to the separate JavaScript example |

## Feature coverage

| Feature | Working example | Exact syntax reference |
| --- | --- | --- |
| Importance, title emphasis, footnotes | Feature tour slides 1 and 3 | Semantic slides |
| Hidden future points and dimmed earlier points | Feature tour slide 4 | Semantic slides |
| Code/equation steps and matched colors | Feature tour slides 5 and 6 | Semantic slides |
| Notes and appendix return links | Feature tour slides 8 and 10 to 12 | Semantic slides |
| Statement, quotation and source | Pattern slides 1 and 2 | Semantic slides |
| Contained/full/overlay/background pictures | Pattern slides 3 to 6 | Picture patterns and class reference |
| Picture on the left/right and image grid | Pattern slides 7 to 9 | Picture patterns and class reference |
| Credits and presenter-only counters | Pattern deck and source-record appendix | Semantic slides |
| Theme selection and light/dark modes | Both labs and theme comparison | Start a deck and themes |
| Cards, split layouts, filters and transitions | Advanced reference deck | Customization and class reference |
| Video/audio and small HTML interactions | Advanced reference deck | Class reference |
| Live reload and offline sharing | Local watch workflow | Start a deck and CLI |

The reference deck remains under `decks/tutorial/` for compatibility. It is not
the first-deck tutorial. The picture regression fixture remains outside the
website allowlist; the public patterns have their own reviewed source/assets.

## Writing review

All public sources were scanned with the local nossaifd and declauding skills.
The review includes hard and verbose Nossa checks, lexical and structural
Declauding checks, a manual sentence pass and an independent newcomer read.
Soft notes about technical terms, stated boundaries, real enumerations and
reference labels were reviewed in context. The revision preserves runnable
plotting code, pinned scientific evidence, citations and dated report metrics.

The preservation scan also reports intentional content edits. Removed numbered
request headings are navigation labels, not measurements. Packaging proposals
were replaced with current installation guidance. New pattern counts and links
come from the committed source and generator. These content changes are not
presented as a prose-only rewrite.

## Regression checks

`just docs-check` validates source downloads, notes isolation, local links,
fonts, SVGs and all generated views. `integration_tests/docs-layout-browser.mjs`
checks actual width, typography, stacking and preview proportions.
`integration_tests/example-browser.mjs` exercises keyboard steps and source
navigation. `integration_tests/patterns-browser.mjs` checks the pattern source,
canvas, mode/view changes, bounded reveals, copying and credit return links.

## User documentation review, 2026-11-11

This follow-up responds to reader failures that the preceding audit missed.
It covers the 20 existing public pages plus the new syntax reference.

| Surface | Reader problem | Correction |
| --- | --- | --- |
| Syntax | No complete author vocabulary in one place | Added syntax-reference.md, source-backed settings/attributes/classes/aliases and copyable examples; promoted it to navbar/sidebar/home |
| Semantic guide | Source without a visible result | Added per-topic links to exact interactive slides and a real equation-summary screenshot |
| Class map | Class lists without visual destinations | Added per-topic rendered-output links and a screenshot; separated runtime, starter and custom classes |
| Plotting overview and Python/R/JS/gallery | Independence displaced the reason for the packages | Lead with theme coordination; show reviewed same-data themed specimens and categorical/sequential/diverging roles; preserve exact code/download pairing |
| Home | No output illustrations | Added real audience and presenter screenshots, actionable captions and chart coordination |
| CLI | Template choices and insertion position missing | Listed all 18 template kinds and explained insertion after a slide |
| Themes | Visual comparison buried; maintenance internals in author flow | Linked comparison first, explained chart/document coordination, moved import/verification procedures into repository-only theme-maintenance.md |
| Customization | Missing background asset, two cards in a three-column sample, overbroad HTML import claim | Corrected runnable setup/layout and documented converter boundaries/output overwrite |
| Other public pages | Entry points and scope | Reviewed quickstart, example, patterns, comparison, install/packaging, feature status and contributing; link ordinary authoring to the syntax reference |

The previously published semantic-authoring-report.html URL remains available
because the user requested an online report for downstream skill authors. It is
historical material, not the main author guide. Its lead link was removed from
Semantic slides; no public permalink was removed.

The parser/runtime inventory was independently checked. That review corrected
filter aliases, wrapper-only effects, fitting booleans, caption scope, limited
metadata parsing, navigation opt-outs and starter-class ownership. All 16
Markdown examples in the reference were parsed into 18 source slides, linted,
converted with the renderer's Pandoc reader and compiled for matched summaries.
Scientific export bundles, source programs and publication evidence remain
unchanged.

The final writing pass used nossaifd and declaude after content and illustrations
were complete. Three independent revision passes covered all 21 public pages.
Every page passes both hard and verbose Nossa checks. Lexical and structural
Declaude findings were reviewed in context, with preservation checks for code,
links, pins, measurements and citations. A separate newcomer read checked the
accepted references, homepage, installation/sharing route and plotting guides.
It caught an overbroad download claim, which now applies only to complete
tutorial examples.

Verification passed `just check` and `just docs-check`. The crawl covers 177 HTML
pages and 146 theme views, including source parity, notes isolation, local links,
fonts and assets. Browser checks covered the homepage screenshots, the new
navbar route, syntax-to-example navigation, all four equation steps and the
matched summary. The preview and source remain stacked with matching widths.
Desktop and 390-pixel checks confirmed bounded tables, loaded chart specimens
and no horizontal page overflow.

Screenshots are real public deck output, with
file extensions that match their JPEG encoding. Scientific runtimes were not
rerun because source programs and reviewed export bytes did not change.

## Visual syntax and slide prose correction, 2026-11-11

The preceding audit did not provide enough rendered examples. Some reference
links reached more prose, and the writing review omitted the slide sources.

The syntax gallery now has a separate 35-slide deck. It shows intrinsic image
transparency, default and custom opacity, edge-to-edge half backgrounds,
background position, crops, filters, overlays, alignment, layouts, transitions,
panel controls, item filters, local media, fitting, scrolling and matching-color
overrides. Each selected slide has its exact Markdown below the preview. The
complete QMD, supplemental stylesheet and seven original assets are available
to download. Ordinary deck exports retain authored media autoplay; the source
preview pauses automatic playback until the reader selects Play.

The canonical syntax and class references link to these outputs. The class
reference's three-column example now contains three children, and its media
section links to the supplied video/audio files. Installation prerequisites and
the difference between bundled and custom classes are explicit. Theme-variable
and automated-check details are expandable on the semantic guide.

Independent nossaifd and declaude revisions covered all eight tracked demo
sources. The decks are example, patterns, syntax, tutorial, semantic, authoring-hooks,
pictures and slide-breaks. They contain 155 source slides in total. The review
included body text, headings, notes, captions, navigation labels and authored
controls. Code, math, IDs, behavior attributes, slide order and cited specimens
were preserved.

Pictures is an internal regression fixture; its deliberate
permutation labels remain, with a presenter note explaining its purpose and
linking to ordinary author examples. Slide-breaks needed no prose changes.

Independent newcomer reads found unstated prerequisites, unexplained stylesheet
references and an obsolete claim that interleaved code/text steps were unfinished.
Those passages were corrected. Hard checks pass; soft findings were judged in
context. Repeated syntax labels, intentional dense/overflow specimens and
technical terms remain where they teach or test the behavior.

The new examples also exposed a keyboard defect. Space on an authored button
activated it and advanced the full deck. The runtime now preserves native
control keys, including media controls, while keeping deck navigation shortcuts
on its own chrome. Escape closes overlays from focused controls. Focused
regressions cover both cases and the distinction between keyboard and tap guards.

Final verification covers all normal Quarto/Deno check components, the Node
renderer and all-deck verifier, and 91 compatibility tests. The site crawl
passes 185 HTML pages and 146 theme views with exact source/asset pairing and
notes isolation. Actual browser checks pass all 140 syntax mode/view cases,
including image coverage rather than container geometry alone. The existing
feature tour, semantic reveals, matched colors and authoring hooks also pass.

At 390 pixels, audience and presenter previews remain stacked above equally
wide source boxes with no horizontal page overflow. Native controls, actual
scrolling, video playback/reset, media-end advance and the embedded page were
exercised in exported decks. Homepage screenshots were recaptured from the
revised example, retaining JPEG encoding and matching extensions.
