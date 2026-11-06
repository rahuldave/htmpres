# Declarative presentation themes

## Problem

htmpres has three editable theme seeds, but the public SmallDocs/Elegant
collection cannot be selected directly by a deck. The custom HTML renderer
needs presentation-specific adapters rather than Bootstrap's page layout CSS.

## Contract

- Bundle the 25 Bootswatch themes present in SmallDocs, native Bootstrap,
  Folio/Atelier/Nocturne, all five current Reading refinements, and Tufte.
- Select with `deck.theme: folio` and `deck.color-mode: light|dark|auto`.
  Imported themes default to auto; existing local themes retain their behavior.
- Also accept `deck.theme.light` / `deck.theme.dark` for separate named themes.
- Preserve native palettes and font stacks. Use the designed Elegant pairs,
  Bootstrap's dark variables for light stock themes, and explicitly identified
  presentation adaptations where a source has no complementary palette.
- Apply palettes to existing slide/layout/media/runtime tokens. Do not load
  Bootstrap's resets or document layouts into the presentation shell.
- Keep deck-local CSS editable and authoritative over equivalent theme rules.
  A bundled theme works without creating or editing a stylesheet first.
- Include an accessible mode control; auto follows system preference and may
  remember a reader's choice per deck. Explicit light/dark declarations win on
  initial load. Audience and presenter use the same palettes and local assets.
- Copy fonts and licenses into `assets/htmpres-themes/` without repeated writes;
  standalone decks and workspace installations require no sibling repository.
- Keep CLI list/show/add/set/new and the optional Node renderer compatible.

## Verification

Focused module/runtime tests, CLI/render/install/asset regression checks,
normal project checks, Node compatibility checks, and HTML browser inspection
of light/dark Elegant and Reading decks. Review template defaults, local
overrides, generated-asset watcher loops, keyboard navigation, and font URLs.

## Sources and scope

Public sources: SmallDocs vendored Bootstrap/Bootswatch 5.3.8 and the current
Elegant theme repositories. Record source revisions, hashes, and licenses in
the generated catalog. Private themes and historical pre-refinement copies
are excluded. This changes HTML themes; PowerPoint's reference templates are
separate. Source repositories are read-only.
