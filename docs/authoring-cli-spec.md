# Spec: htmpres Authoring CLI And Presentation Workspaces

## Problem Statement

`htmpres` has a usable renderer, but the installable command shape is too
awkward for normal authors and too coarse for agents. Humans should not have to
type long `quarto run _extensions/...` commands, and agents should not rewrite
whole deck files when they only need to inspect, insert, or replace one slide.

The authoring workflow also needs a clear theme policy. The project currently
ships two tutorial themes, `sage` and `mono-grid`, but users need to start from
those themes and then own their deck-specific CSS without depending on hidden
global theme state.

## Proposed Solution

Add an htmpres authoring surface with three layers:

- The existing Quarto-run extension remains the canonical agent-safe CLI.
- Generated `Justfile` recipes become the human convenience layer inside a
  presentation workspace, never an implicit edit to a host project's root
  `Justfile`.
- Deck-local `source.css` files receive copied theme seeds. Packaged themes are
  starters, not runtime dependencies.

The default workspace shape is:

```text
presentations/
  Justfile
  _extensions/htmpres/
  my-talk/
    index.qmd
    source.css
    assets/
```

The standalone shape is:

```text
my-talk/
  Justfile
  index.qmd
  source.css
  assets/
  _extensions/htmpres/
```

## Installation Strategy

Install skills and extension separately:

- Skills: `npx skills add rahuldave/htmpres -a codex --skill
  htmpres-installer --skill htmpres-authoring`.
- Extension: `quarto add rahuldave/htmpres` or `quarto add /path/to/htmpres`
  from the presentation workspace.

The `htmpres-installer` skill is responsible for setup guidance: check
`quarto`, check optional `just`, install or verify `_extensions/htmpres`, run
`workspace init`, and create a starter deck when requested. The
`htmpres-authoring` skill is responsible for editing: inspect before modifying,
use source-slice commands, render, and verify.

Installing a skill must not silently install or mutate the renderer extension.
Installing the extension must not require Codex. This keeps human, CI, and agent
workflows independently usable.

Humans use the nearest generated `Justfile`:

```sh
cd presentations
just render my-talk
just serve my-talk
just slides my-talk
just show my-talk 7
```

Agents may use the canonical CLI directly:

```sh
quarto run _extensions/htmpres/htmpres.ts slide list presentations/my-talk/index.qmd --json
quarto run _extensions/htmpres/htmpres.ts slide show presentations/my-talk/index.qmd 7 --json
quarto run _extensions/htmpres/htmpres.ts slide insert presentations/my-talk/index.qmd --after 7 --kind two-card
quarto run _extensions/htmpres/htmpres.ts slide replace presentations/my-talk/index.qmd 8 --from /tmp/slide.qmd
```

## Scope

### In Scope

- `deck new <path>` creates a deck folder with `index.qmd`, `source.css`, and
  `assets/`. It does not write workspace-level files unless explicitly passed
  `--with-workspace` or `--standalone`.
- `workspace init <path>` creates or refreshes a presentation-workspace
  `Justfile` and installs/copies `_extensions/htmpres` when needed.
- `slide list <deck> --json` returns slide index, title, section, data-title,
  attributes, detected kind, line range, and short preview.
- `slide show <deck> <n> --json` returns the exact source slice for one slide.
- `slide insert <deck> --before|--after <n> --kind <kind>` inserts a source
  template above or below a target slide.
- `slide replace <deck> <n> --from <file>` replaces exactly one slide source
  slice and rejects replacement files with zero or multiple level-2 headings.
- `theme list`, `theme show <name>`, and `theme add <deck> <name> --from
  <seed>` expose the theme catalog.
- `theme set <deck> <name>` updates front matter to select an existing
  deck-local theme selector and rejects missing selectors.
- `serve <deck> --watch` may be implemented as a first minimal live-preview
  loop: render on changes and serve the deck folder. Browser auto-navigation to
  the changed slide can be a follow-up if it needs runtime hooks.
- Docs explain installation, workspace layout, Justfile collision policy, theme
  ownership, and agent usage.
- Installable skills exist for setup (`htmpres-installer`) and authoring
  (`htmpres-authoring`), with package metadata documenting the `npx skills`
  command.

### Out Of Scope

- A native `quarto render --to htmpres-html` format.
- Editing a host project's root `Justfile` by default.
- A global mutable theme registry outside the deck/workspace.
- Pixel-perfect slide layout inference from arbitrary HTML.
- Browser/editor integrations beyond the minimal watch/serve loop.

## Theme Policy

Themes are CSS selector blocks, selected through `deck.theme` and copied to
`<html data-theme="...">` at render time.

Packaged themes are seeds:

- `sage`
- `mono-grid`
- `blank`

`deck new --theme sage` writes a complete, editable `source.css` into the deck.
That file includes structural classes plus the selected theme tokens. A user can
rename or add a theme by adding a selector such as:

```css
html[data-theme="my-theme"] {
  --bg: #101418;
  --paper: #f7f4ee;
  --ink: #161616;
  --teal: #2f8f83;
  --amber: #c6922c;
  --rose: #b85a61;
  --indigo: #4c5d9e;
  --violet: #7656a6;
}
```

and setting:

```yaml
deck:
  theme: my-theme
```

Slide templates must use semantic classes and tokens such as `.card`,
`.metric-card`, `.ds-media`, `--teal`, `--amber`, `--surface`, `--paper`, and
`--ink`; they must not bake in presentation-specific colors.

## Slide Kind Taxonomy

The first taxonomy is deliberately compact. It is based on the local tutorial,
first, technical, and executive decks, plus the imported source snapshots.

| Kind | Detection hints | Template purpose |
| --- | --- | --- |
| `hero` | `.hero-title`, `hero-subtitle` | Opening, major claim, product/project title |
| `section` | `.section-divider` | Chapter or axis divider |
| `text` | paragraphs/callout, no dominant grid/media/code | Simple narrative slide |
| `two-card` | `.two-col` with cards | Two-column comparison or decisions |
| `three-card` | `.three-col` and `.metric-card`/`.card` | Three key points or metrics |
| `four-card` | `.four-col`, portfolio/status cards | Four-part operating model or summary |
| `profile-grid` | `.profile-card`, profile/filter data attrs | Use-case or persona portfolio |
| `steps` | `.stack`, `.step`, `.step-num`, roadmap/build plan | Ordered process or maturity path |
| `diagram` | `.diagram-slide`, `.diagram-frame`, image with `.zoomable` | Diagram-centered slide |
| `full-media` | `.ds-full` | Full-slide media with optional overlay copy |
| `left-media` | `.ds-left` media plus `.ds-right` pane | Media left, copy right |
| `right-media` | `.ds-right` media plus `.ds-left` pane | Media right, copy left |
| `split` | `.ds-split` or paired panes in flow | Balanced media/text or media/media split |
| `media-grid` | `.ds-grid`, multiple images/media | Image or filter comparison grid |
| `code` | fenced code, `.code-card`, `.numberLines` | Code/config/API example |
| `interactive` | raw `<button>`, `.pill-row`, `.control-chip`, `data-target` | Small in-slide controls and panels |
| `fragment` | `.fragment`, `.incremental`, fragment attrs | Reveal sequence slide |
| `appendix` | `data-kind="appendix"` | Backup/reference slide |

`slide list --json` should report one primary `kind` and may also report
secondary `features`, for example:

```json
{
  "index": 7,
  "title": "Architecture Planes",
  "kind": "interactive",
  "features": ["four-card", "buttons"],
  "section": "Architecture"
}
```

## Acceptance Criteria

- A clean worktree can create a new deck with a generated `Justfile` in the
  presentation workspace without editing any parent/root `Justfile`.
- `slide list/show/insert/replace` preserve unrelated source text and produce
  narrow diffs.
- `slide list --json` classifies existing tutorial and sample deck slides into
  the taxonomy above.
- A deck created from `sage`, `mono-grid`, or `blank` renders through the
  existing `render` command.
- A custom theme can be added and selected without changing renderer runtime
  code.
- Docs show both human `just` usage and agent CLI usage.
- Focused verification covers parser slicing, taxonomy detection, template
  insertion/replacement, theme seed generation, and generated Justfile behavior.

## Decisions

- `serve --watch` renders and serves the deck folder, then prints the local URL.
  It does not open a browser automatically, avoiding GUI permission prompts.
- `workspace init` copies `_extensions/htmpres` into the presentation workspace
  unless it is already running from that exact extension directory.
- Root `Justfile` integration is documentation-only for now. The CLI writes only
  inside the requested presentation workspace and falls back to `htmpres.just`
  when a non-htmpres `Justfile` exists there.

## References

- `README.md`: existing installable extension and command overview.
- `docs/packaging.md`: Quarto utility extension plus starter template plan.
- `docs/quarto-extension.md`: installed extension and starter template notes.
- `docs/quarto-class-map.md`: current QMD class vocabulary and theme model.
- `docs/deckset-feature-status.md`: supported layout/media/fragment feature map.
- Local sample decks inspected for taxonomy: `decks/tutorial`, `decks/first`,
  `decks/firstallincluded`, `decks/technical`, and `decks/executive`.

## Tag And Dependency Discovery

Selected existing tags: `htmpres`, `development`, `workflow`, `justfile`,
`docs`, `themes`, `css-architecture`, `renderer`, and `tutorial`.

New dynamic tags: `authoring-cli`, `slide-templates`, `slide-taxonomy`,
`theme-catalog`, and `live-preview`.

Near misses: `runtime` applies only if `serve --watch` needs browser runtime
hooks; `media` and `filters` are represented inside slide taxonomy but are not
the primary workstream.

Dependency impact for implementation: required. Search `parseSlides`,
`splitFrontMatter`, CLI dispatch/usage, `renderCommand`, deck CSS/theme
metadata handling, and generated Justfile/docs surfaces before completion.
