# Approved foundation rollout

Approved 9 November 2026, after joint review of Doc 1 (design language) and Doc 2 (presentation color). Stock Bootswatch is reference-only. Parent task `yoowwpyv`; iteration `xurklyyy`. Upstream theme PR creation and merging are authorized after parent review and passing checks. All real-repository Git decisions remain parent-owned. htmpres PR merging still requires separate authorization.

| Phase | Task | Status | Gate |
| --- | --- | --- | --- |
| 1: freeze small shared contract and nine independent seeds | `ptoxmryr` | Complete | Contract/schema, reference coverage, exact approved candidates and contrast checks |
| 2: adopt in independent custom, Reading and Tufte repositories | `uykmynuu`, `utxuylpm`, `osmysomq` | Complete | Reproducible source builds, paired modes and scoped Quarto overlays |
| 3: upstream verification | `rroytwov` | Passed | Numerical, asset/font, build and browser checks before slide imports |
| 4: slide consumer adoption | `pvttvwwo` | Complete | Import authoritative manifests from merged upstream revisions; audience-scale and browser QA |
| 5: rerun scientific experiments | `xrtvkvpx` | Complete — review checkpoint | Reading/presentation comparisons and role separation |
| 6: standalone plotting ecosystem | `vxltssko` | Scientific contract and Python reference implemented; other adapters remain gated | Agreed Doc 3 baseline; distinct Sol reviews and user-selected small native-package/integration pieces |

Upstream adoption used nine independent physical worktrees managed by three owners/workstreams: custom three, Reading five, and Tufte. Shared build patterns do not create a central runtime dependency. Later phases wait for preceding gates.

The [upstream verification record](upstream-verification.md) pins all nine merged source revisions, published manifest hashes and rerunnable browser helpers. The upstream gate passed; slide consumer adoption passed at verified commit `04cef45c3374a018d3b32b9c53a2e4e43e7c88ec`. The scientific run and rewritten Doc3 form a verified review checkpoint. The agreed Doc 3 recommendations are the phase 6 baseline; piece 1 has selected Plotfoundry identities and implemented minimal independent scaffolds; piece 2 has promoted the standalone scientific contract; the Python reference now consumes it; other native adapters remain unimplemented and later pieces require user selection.

## Phase 6 planning checkpoint

The [standalone plotting ecosystem plan](../../docs/plans/plotting-ecosystem.md) proposes independent Python, R and JavaScript packages in this monorepo, with documentation on the htmpres website. Plain native use and ordinary Quarto/SmallDocs use require no htmpres installation, runtime, import or package-name dependency. Existing nine upstream theme repositories remain authoritative and independently distributed; plotting artifacts consume pinned published manifests and approved plotting decisions at build time.

The plan separates theme configuration, scales, operational categorical helpers, exact fonts, placement and exports. It defines small sequential pieces with a review gate after each, native/offline artifact tests and staged adapter coverage. Package names, registry publication and implementation are not established by this plan. Doc 3 and its frozen run remain unchanged. Delivery tasks are mapped in iteration `wkssvzoo` under `vxltssko`; the current planning leaf is `rlpsynzs`. Each piece has a distinct Sol 6.1 writer and reviewer; the parent integrates the review and presents the result, and the user selects the next piece. Publication is a separate explicit gate.

## Frozen v1 source and publication contract

Copy the matching `foundation-seeds/<theme>.json` verbatim into each repository's `src/foundations.json`. That file becomes authoritative there. Copy `foundations-contract.schema.json` for local validation if useful. Build an identical machine-readable `_extensions/<name>/foundations.json` and include it in the published extension. Consumer imports read this generated manifest; they do not infer colors from CSS or regenerate palette guesses. Never nest the contract inside legacy mode hex dictionaries. Schema changes require an explicit version change when incompatible.

`schemaVersion`, `theme`, `nativeMode`, `provenance`, `modes`, `typography`, `spacing`, `shape`, and `semantics` are the v1 top-level fields. Both `modes.light` and `modes.dark` contain `swatches`, swatch-reference `roles`, and direct-color `states`. Every original `anchor-*` and approved candidate role is preserved exactly. Additional explicit roles cover primary hover fill/ink, link hover, neutral secondary action, code ink, selected fill/ink and disabled fill/ink. `decorative-line` retains the original line; `control-boundary` is the independently tested meaningful boundary. Tufte alone also has optional highlight fill/ink.

`states.success`, `.warning`, `.danger`, and `.info` contain direct `fill`, `ink`, `boundary`, and provenance. Error semantics map to `danger`; information is a new candidate. Selected state uses the tested primary pair plus a non-color/programmatic cue; disabled uses opaque panel/muted tokens and native disabled behavior. These mappings require browser interaction verification. Do not make inaccessible controls by merely setting an opacity.

Reading titles default to 36; the separate editorial/wide display role is 48. Presentation titles remain 48. Typography stores font stacks, normal-face available weights, finite size/line-height scales and separate reading/presentation profiles. Bundled weights were checked against fresh upstream font declarations; platform faces remain platform-dependent. Folio Caslon is display-only and regular-only. Reading body remains serif for Folio, Nocturne, Litera and Tufte. Source Serif 4 has 400/600, Lato has 400/700, and IBM Plex Mono has 400/500. Use regular body and real available hierarchy weights without synthesis. Pixel values are references at a 16px root; reading CSS should emit rem and honor zoom.

No permanent resting card shadows. Tufte is unboxed; radii are Folio 2, Atelier 0, Nocturne 4, Tufte 0, Zephyr 8, Simplex 2, Pulse 4, Litera 2, Darkly 4. Ordinary headings use prose ink; accents remain sparse; brand is separate from state and data roles.

For Reading repositories, add explicit paired palettes and a scoped Quarto overlay. Full Bootstrap CSS must never enter Quarto. Tufte uses its existing separate shell build. Keep each repository independently buildable.

## Reproduction and limits

From this directory: `just contract` regenerates seeds and checks their preserved anchors, roles and opaque token pairs. `just contract-test` runs focused tests. The schema uses JSON Schema Draft 2020-12 and is checked by the pinned jsonschema dependency during generation and tests. `build_contract.py` is a research seed generator, not an upstream runtime dependency.

Targets are 5:1 ordinary text on paper/panel/code, 4.5:1 action ink/fill, and 3:1 focus and meaningful boundaries against those surfaces. State ink/fill and boundary/fill are also tested. A passing schema or static pair does not validate hover gestures, focus placement/adjacency, keyboard behavior, selected/error/disabled behavior, font loading, projection, transparency or whole-page accessibility. Upstream QA must cover those before the slide gate.

Install verification must use the newly generated working files in a clean temporary consumer or a temporary committed snapshot. `smalldocs add .` installs the last commit, so running it against a dirty source tree does not test the new changes. Apply this caution to custom, Reading and Tufte acceptance checks; production repository commits are handled at the parent review checkpoint.
