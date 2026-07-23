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
   quarto run _extensions/htmpres/htmpres.ts render <deck>/index.qmd
   quarto run _extensions/htmpres/htmpres.ts verify
   ```

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

## Themes

Themes are deck-local CSS selector blocks selected by front matter. Packaged
theme seeds are `sage`, `mono-grid`, and `blank`.

Use:

```sh
quarto run _extensions/htmpres/htmpres.ts theme list
quarto run _extensions/htmpres/htmpres.ts theme add <deck>/index.qmd <name> --from sage
quarto run _extensions/htmpres/htmpres.ts theme set <deck>/index.qmd <name>
```

After adding a custom theme, edit `<deck>/source.css`; do not add a global theme
registry. Keep slide source semantic by using classes and CSS variables rather
than hard-coded visual styling.

## Safety

- Preserve unrelated source text and front matter.
- Treat `slide replace` as a splice of exactly one numbered slide.
- Do not modify a host project's root `Justfile`; generated htmpres Justfiles
  belong inside the presentation workspace.
- Report the exact commands run and any render or verification failures.
