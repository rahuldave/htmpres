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
