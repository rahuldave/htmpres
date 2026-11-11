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
