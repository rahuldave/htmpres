# Renderer packaging and offline output

The installable htmpres extension contains the renderer, browser controls,
themes and local math assets. Quarto supplies the build tools; the generated
HTML opens without Quarto or Node.

## Installed extension

Install from the public repository:

```sh
quarto add rahuldave/htmpres
```

The extension lives under `_extensions/htmpres/`. Keep it in the presentation
project's version control. Its TypeScript entry point calls `quarto pandoc` for
Markdown conversion and writes the custom audience and presenter HTML itself.
The normal path uses Quarto's bundled Deno interpreter, so it needs no Node
installation. See [Extension installation](quarto-extension.md).

## Generated files

Rendering a deck writes these outputs next to its source:

| Output | Contents |
| --- | --- |
| `index.html` | Audience slides with presenter notes removed |
| `presenter.html` | Slides and speaker cues in the presenter panel |
| `assets/htmpres-themes/` | Selected local fonts and their license notices |
| `assets/htmpres-math/` | Bundled KaTeX JavaScript, CSS, fonts and license |

The deck's original image, audio and video files also remain in `assets/`.
No font or math service is fetched while viewing the bundled deck. KaTeX's
provenance and file hashes are recorded in `vendor/katex/provenance.json`.

## Share a deck offline

For the audience, distribute `index.html` and its required `assets/` folder.
Keep the same relative paths. Open the HTML from disk or serve that folder
through an ordinary static web server.

Both `presenter.html` and the source QMD contain speaker cues. Share those
files only when the recipient should see the notes. QMD means Quarto Markdown,
the editable text format used for the deck.

## Repository commands and compatibility

The repository wraps extension commands with Just:

```sh
just example
just patterns
just render decks/example/index.qmd
just verify
just check
```

`just check` verifies the normal Quarto/Deno path, examples and public website.
The optional `just node-check` checks the Node wrapper; `just compat-check`
checks both paths when Node is installed. The npm scripts are convenience
wrappers, rather than the required runtime.

The website build pins Quarto 1.8.26. The extension declares
`quarto-required: ">=1.2.0"`; use a current Quarto for the tested build path.
Scratch-project tests copy the extension and render with its bundled helpers.

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
