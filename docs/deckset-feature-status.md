# Deckset-Inspired Feature Status

This project maps Deckset ideas onto QMD, Quarto fenced divs, CSS classes, and
the custom htmpres runtime. The goal is not exact Deckset syntax parity when
Quarto containers are more general.

## Easy Features

| Feature | Status | Notes |
| --- | --- | --- |
| Full-slide media | Done | Use `.ds-full` on a container and `.ds-fill` or `.ds-fit` on the media. |
| Left/right half-slide media | Done | Use `.ds-left` and `.ds-right`; the other half can hold text, lists, code, cards, or buttons. |
| Split flow layouts | Done | Use `.ds-split` with child `.ds-pane` or `.ds-media` containers. |
| Fit and fill behavior | Done | `.ds-fit` contains the whole asset; `.ds-fill` covers and crops. |
| Filter presets | Done | `.ds-bn`, `.ds-bw`, `.ds-vivid`, `.ds-noir`, `.ds-chrome`, `.ds-fade`, and `.ds-filter` are available. |
| Zoomable images | Done | Add `.zoomable` to open the runtime zoom modal. |
| Video/audio directives | Done | `.ds-controls`, `.ds-autoplay`, `.ds-loop`, `.ds-muted`, `.ds-hide`, `.ds-autoadvance`, and `.ds-keep-time` are supported. |
| Buttons for small interactions | Done | Raw HTML buttons use `data-target`, `data-title`, and `data-text`. |
| Syntax highlighting and line numbers | Done | Pandoc handles token colors and `.numberLines`; htmpres styles the result. |
| Persistent and stepped code line highlights | Done | `data-highlight`, `data-steps`, and `data-highlight-steps` are supported. |
| Bullet transitions | Done | Wrap lists in `.incremental`; each item consumes a navigation step. |
| Generic fragment transitions | Done | Add `.fragment`, optional `data-fragment-index`, and optional `data-fragment-effect`. |
| Slide transitions | Done | Use `.transition-fade`, `.transition-slide`, `.transition-zoom`, `.transition-none`, or `data-transition`. |

## Medium Features

| Feature | Status | Notes |
| --- | --- | --- |
| Deckset image syntax parity | Partly done | The layout model intentionally uses Quarto containers plus media attributes instead of parsing Deckset alt-text syntax exactly. |
| Imported HTML preservation for fragments | Done | The converter preserves known fragment classes and verification tracks fragment data attributes. |
| Code step transitions | Done | Line-step navigation works; a leading `none` step starts with no highlighted line. |
| Mixed fragments, bullets, and code steps | Done | The current precedence is documented and tested: generic fragments and incremental list items first, then code steps, then slide navigation. |
| Source-order interleaving of code and text fragments | Open | A unified step graph could let code steps sit between earlier and later fragments on the same slide. |
| Theme-level text fitting | Open | Existing CSS controls overflow by layout, but automatic Deckset-style text fitting is not implemented. |
| Broader export/print parity | Open | Print shows all fragments, but deeper PDF/export transition parity is not implemented. |
