# Renderer and website maintenance

This repository-only page keeps package implementation and publication notes
out of the public authoring guides. The public setup and sharing instructions
remain in quarto-extension.md and packaging.md.

## Rendering implementation

Its TypeScript entry point calls `quarto pandoc` for Markdown conversion and
writes the custom audience and presenter HTML itself. The normal path uses
Quarto's bundled Deno interpreter, so it needs no Node installation.
Scratch-project tests copy the extension and render with its bundled helpers.

## Extension contents

`_extensions/htmpres/htmpres.ts` owns the CLI. Its `lib/` folder holds source and
rendering helpers, `templates/` holds starter material, and `runtime/` supplies
the browser controls and styles. `themes/` and `vendor/katex/` contain the local
theme and math assets. The root `scripts/htmpres.ts` is a repository convenience
shim; installed projects call the extension path directly.


## Website publication

GitHub Pages receives only the checked `docs/_site/` artifact. SmallDocs uses an
explicit page and resource allowlist. It stages the public example, picture
patterns, comparison variants and reviewed plotting bundles. The repository
root, private imported decks and internal specs are not uploaded.

Run `just pages-build` to create the checked artifact. The Website workflow
builds pull requests and publishes successful `main` builds. See
[Website maintenance](contributing.md) for preview and deployment commands.


## Version boundaries


Use patch versions for rendering fixes that preserve Markdown syntax, minor
versions for added classes or attributes, and major versions for incompatible
syntax, output DOM or generated asset paths. Keep the supported vocabulary in
[Layout and class reference](quarto-class-map.md).

A native Quarto output format, a starter-template distribution and a public npm
package are future proposals. They are not required for the installed utility
extension or for viewing its generated HTML.

A native format would need a Quarto/Pandoc template and filters that preserve
the current HTML, notes and interactions. It remains a separate proposal.

## Visual syntax gallery

The public visual lab uses `decks/syntax/index.qmd`, its `source.css`, and seven
explicitly staged original assets. It has a separate manifest and four Nocturne
mode/view variants, preserving the historical comparison and picture slide IDs.
The complete deck, CSS and assets are downloadable. Normal builds do not require
media tools.

The four-second silent test video was generated with FFmpeg's
`testsrc2=size=320x180:rate=12:duration=4` source and H.264/yuv420p encoding. The
one-second mono WAV is a quiet 440 Hz sine at 16 kHz, with short fades. Both
files are original samples, not scientific evidence or external media.

Keep source, manifest, routes, download bytes, explicit assets and crawl/browser
assertions coupled. Run `just check`, `just docs-check`, and the CUA syntax flow
after changes. In addition, check actual full-deck playback, media-end advance,
scroll overflow, tap guards and the local iframe interaction. The preview pauses
autoplay for source inspection; full exports retain it.
