# Documentation and example showcase

## Purpose

Provide a real example people can read, present, edit, and compare across
themes, with SmallDocs documentation explaining the same workflow.

## Deliverables

- An authored `decks/example/index.qmd`, structural CSS, and a local SVG.
  Every slide keeps its speaker notes in the QMD source. Render audience
  `index.html` and a separate `presenter.html` through the custom renderer.
- A SmallDocs site under `docs/`, using the current public Nocturne theme and
  its light/dark pair. Pin SmallDocs 0.5.5 through an on-demand `uvx` wrapper.
- Public guides, a quick start, the example, and a comparison page. Explicitly
  allowlist public documentation pages; exclude workflow/spec/private material.
- Side-by-side previews of the same slide and view, independently selectable
  by theme/mode. Start with Nocturne and Simplex Reading. Include all 38 names;
  label the three original unpaired seeds as light-only.
- Open audience or presenter output separately, download the public QMD/CSS,
  and copy the selected declaration. Retain truthful adaptation/font notices.
- Generate theme variants from one Markdown render, replacing only the
  renderer-owned head/theme controls with the existing shared theme adapter.
  Preserve slide bodies and presenter notes exactly. Use one asset directory
  per theme for both mode variants.
- Add reproducible Just targets, focused adapter/model tests, and a local
  site-wide link/font/asset crawl. Verify real browser interactions and layout.

## Boundaries

Keep the current tutorial and renderer behavior. Do not publish private source
decks, specs, or workflow notes. Do not require sibling source checkouts at
build time. Vendored Nocturne CSS retains source provenance and licenses;
reuse the already bundled font files during the docs build.

This request creates repository-local documentation and HTML artifacts.
External hosting and PowerPoint are separate workflows.
