# PowerPoint Export

`htmpres` can render the same level-2-slide QMD source to branded, editable
PowerPoint without changing its existing HTML output. The exporter uses
Quarto's PPTX writer and one of three bundled reference documents:

- `executive-funding`: largest type and lowest density;
- `executive`: briefing, decision matrix, and appendix density;
- `technical`: compact code, table, and architecture treatment.

## Export A Deck

From this repository:

```sh
just powerpoint decks/example/index.qmd build/powerpoint
```

From an installed extension:

```sh
quarto run _extensions/htmpres/htmpres.ts powerpoint decks/example/index.qmd \
  --template executive \
  --output build/powerpoint/executive.pptx
```

The family is inferred from a parent directory named `executive-funding`,
`executive`, or `technical`; use `--template` for other directory names.
Useful options are:

```text
--slides 7,12,17       render selected source slides for review
--output deck.pptx     choose the output file for one input deck
--output-dir DIR       choose the output directory
--report report.json   choose the conversion-report path
--keep-intermediate    retain the normalized QMD and unpacked package
```

The adjacent JSON conversion report records every source slide's template,
actual PowerPoint layout, conversion level, semantic tokens, images, warnings,
and fallback reason.

## Conversion Contract

Titles, ordinary text, lists, tables, code, timelines, release ladders, notes,
source lines, and simple layouts remain native PowerPoint content. Title and
section slides use the reference masters. Appendix slides retain their label
and use the denser family scale.

Images are restricted to the allowlist encoded in
`_extensions/htmpres/powerpoint/powerpoint.ts`. Shared diagrams live once in
`powerpoint/assets/diagrams/`; deck reports reference those deduplicated files.
`powerpoint/asset-manifest.json` records the shared brand images, shared
diagrams, generated SVG fallbacks, and three family-specific cycle images.
The two tldraw SVG fallbacks and the three four-part-cycle images are generated
assets, not full-slide screenshots. Their titles, captions, source lines, and
speaker notes remain editable outside the image.

Semantic tokens use the manifest colors for Profile, Catalog, Runtime,
Evidence, PHI/privacy, prompt/runtime attack, fairness/policy, and
reuse/outcome. Temporary marker text is removed during PPTX packaging.

## Rebuild And Test

```sh
just powerpoint-diagrams
just powerpoint-templates
just powerpoint-previews
just powerpoint-smoke
```

`powerpoint-diagrams` requires `rsvg-convert`. `powerpoint-templates` rebuilds
the three reference documents from Pandoc's standard `reference.pptx`, embeds
the local logos and section background, and preserves the standard layout
names Quarto expects. `powerpoint-smoke` exports an 11-slide synthetic deck and
checks slide count, notes, alt text, master media, semantic-marker removal,
the hybrid allowlist, and conversion-report completeness.

`powerpoint-previews` renders all seven required standard layouts for each
template under `_extensions/htmpres/powerpoint/previews/`. These images are the
visual reference for the shared master, density differences, logos, and title
and section treatments. Preview rendering requires LibreOffice (`soffice`) and
Poppler (`pdftoppm`).

For release validation, render the representative set first, inspect the slide
images, then render all three decks. Validate package relationships, exact
source/output counts, title order, notes, native tables/code, image allowlist,
alt text, master logos, and conversion-report entries. The bundled templates
are 16:9 (`9144000 × 5143500` EMU).

## Known Limits

- CSS-positioned diagrams on the explicit allowlist are replaceable hybrid
  PNGs; their internal labels are not individually editable.
- Dense source slides remain editable but may use smaller family-specific type.
- PowerPoint font substitution can change wrapping when Bitter, Source Serif 4,
  or IBM Plex Mono are unavailable; the templates define Office-safe fallback
  families.
- The exporter is deterministic local tooling. ChatGPT Work or other slide
  services can assist visual QA, but are not a runtime dependency.
