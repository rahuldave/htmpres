# Share a presentation offline {#renderer-packaging-and-offline-output}

Share `index.html` and its `assets/` folder with your audience. The generated
HTML opens in a browser without Quarto or Node. Keep `presenter.html` and the
source QMD private when your audience should not see your speaker notes.

The installable htmpres extension contains the renderer, browser controls,
themes and local math assets. Quarto supplies the build tools.

## Files produced by a render {#generated-files}

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

## Send the audience copy {#share-a-deck-offline}

For the audience, distribute `index.html` and its required `assets/` folder.
Keep the same relative paths. Open the HTML from disk or serve that folder
through an ordinary static web server.

Both `presenter.html` and the source QMD contain speaker cues. Share those
files only when the recipient should see the notes. QMD means Quarto Markdown,
the editable text format used for the deck.

## Install the renderer {#installed-extension}

Install from the public repository:

```sh
quarto add rahuldave/htmpres
```

The extension lives under `_extensions/htmpres/`. Keep it in the presentation
project's version control. See [Extension installation](quarto-extension.md).

## Quarto and runtime requirements

The website build pins Quarto 1.8.26. The extension declares
`quarto-required: ">=1.2.0"`. Use a current Quarto for the tested build path.
Quarto's bundled Deno interpreter runs the renderer, so a normal build needs no
Node installation. The finished HTML needs neither Quarto nor Node.

## Commands in a source checkout {#repository-commands-and-compatibility}

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

## Documentation builds

For the project's documentation preview and deployment commands, see
[Website maintenance](contributing.md).
