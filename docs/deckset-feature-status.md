# Supported features and Deckset comparison

For current authoring syntax and visible examples, use the [syntax reference](syntax-reference.md).

This project maps Deckset ideas onto QMD, Quarto fenced divs, CSS classes, and
the custom htmpres runtime. The goal is not exact Deckset syntax parity when
Quarto containers are more general.

## Layout, media and reveals

| Feature | Status | Notes |
| --- | --- | --- |
| Full-slide media | Done | Use `.ds-full` on a container and `.ds-fill` or `.ds-fit` on the media. |
| Left/right half-slide media | Done | Use `.ds-left` and `.ds-right`; the other half can hold text, lists, code, cards, or buttons. |
| Split flow layouts | Done | Use `.ds-split` with child `.ds-pane` or `.ds-media` containers. |
| Fit and fill behavior | Done | `.ds-fit` contains the whole asset; `.ds-fill` covers and crops. |
| Filter presets and custom filters | Done | `.ds-bn`, `.ds-bw`, `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`, `.ds-filter`, `.ds-sharpen`, `.ds-alpha`, `.ds-original`, `.ds-vignette`, and `.ds-readable` are available. |
| Theme-selected colors, filters, and typography | Done | `deck.theme` selects local seeds or bundled Bootstrap/Bootswatch/Elegant/Reading/Tufte adapters. Imported themes support light/dark/auto color modes and paired names; see `themes.md`. |
| Global background image | Done | Use `deck.background-image` plus optional `deck.background-fit`, `deck.background-filter`, `deck.background-opacity`, and slide-level `data-background-*` overrides. |
| Theme-level text fitting and overflow policy | Done | Use `deck.text-fit: true`, `.autoscale`, `.no-autoscale`, theme typography tokens that respond to `--htmpres-text-fit-scale`, and `deck.overflow: hidden|scroll|fit|fit-scroll`; `fit` modes trigger runtime fitting, and scrollable slides show a bottom cue. |
| Zoomable images | Done | Add `.zoomable` to open the runtime zoom modal. |
| Video/audio directives | Done | `.ds-controls`, `.ds-autoplay`, `.ds-loop`, `.ds-muted`, `.ds-hide`, `.ds-autoadvance`, and `.ds-keep-time` are supported. |
| Inline image grids | Done | Use `.ds-grid` or `.ds-inline` on the enclosing div; individual media items keep their own fit/fill/filter classes. |
| Buttons for small interactions | Done | Raw HTML buttons use `data-target`, `data-title`, and `data-text`. |
| Syntax highlighting and line numbers | Done | Pandoc handles token colors and `.numberLines`; htmpres styles the result. |
| Persistent and stepped code line highlights | Done | `data-highlight`, `data-steps`, and `data-highlight-steps` are supported. |
| Bullet transitions | Done | Wrap lists in `.incremental`; each item consumes a navigation step. |
| Generic fragment transitions | Done | Add `.fragment`, optional `data-fragment-index`, and optional `data-fragment-effect`. |
| Slide transitions | Done | Use `.transition-fade`, `.transition-slide`, `.transition-zoom`, `.transition-none`, or `data-transition`. |

## Steps, import and export

| Feature | Status | Notes |
| --- | --- | --- |
| Deckset image syntax parity | Done by capability, not syntax | Full/left/right, fit/fill, inline grids, rounded corners, zoom, presets, composable CSS filters, vignettes, and media playback are covered through containers and media attributes. Deckset alt-text layout parsing is intentionally out of scope. |
| Imported HTML preservation for fragments | Done | The converter preserves known fragment classes and verification tracks fragment data attributes. |
| Imported HTML preservation for media containers | Done | The converter protects the documented `ds-*` container/filter wrapper classes when converting HTML snapshots to QMD. |
| Code step transitions | Done | Line-step navigation works; a leading `none` step starts with no highlighted line. |
| Mixed fragments, bullets, code and equation steps | Done | A shared step graph supports explicit synchronized frames and implicit source order. Ordinary explanations remain visible. |
| Matched final summaries | Done | `data-step-summary="match"` adds one final frame pairing source parts and explanations by semantic name. Theme colors can be overridden per span, per slide or in CSS; see [matched summaries](semantic-authoring.md#finish-with-matched-colors). |
| Source-order interleaving of code and text fragments | Done | Use `data-step-indices` to map snapshots to shared `data-fragment-index` values; unmapped mixed events follow source order. See [Semantic slides](semantic-authoring.md). |
| Core Image-style filter matching | Done by browser approximation | `noir`, `chrome`, `fade`, `vivid`, exposure, and `sharpen` use stable CSS/SVG mappings and compose in a single filter chain. |
| Pixel-exact Apple Core Image output | Open | Browser CSS/SVG filters do not expose Apple's private photo-effect lookup tables, so exact pixel parity would need a heavier preprocessing/export path. |
| Broader export/print parity | Open | Print shows all fragments, but deeper PDF/export transition parity is not implemented. |

## Semantic Authoring

Importance (`.statement`, `.key` and `.aside`), local classed KaTeX math, title emphasis,
unique footnote anchors, live named slide links and appendix boundaries are
implemented. Top-level `---` and `##` start slides; `lint ... --json` supplies
machine-readable diagnostics. Picture attributions use `.credit`. Ready-made
`credits`/`conclusion` slide templates and Deckset shorthand are not implemented. See [Semantic slides](semantic-authoring.md) for exact syntax.
