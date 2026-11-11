# Install the Quarto extension

htmpres is an installable Quarto utility extension. Quarto runs its TypeScript
build script, and Pandoc converts Markdown fragments. htmpres writes the HTML
slide shell and supplies navigation, reveals, zoom and presenter notes.

## Install in a project

Run these commands from your presentation project:

```sh
quarto add rahuldave/htmpres
quarto run _extensions/htmpres/htmpres.ts workspace init presentations
quarto run _extensions/htmpres/htmpres.ts deck new presentations/demo --theme nocturne
quarto run _extensions/htmpres/htmpres.ts render presentations/demo/index.qmd
quarto run _extensions/htmpres/htmpres.ts verify presentations/demo/index.qmd
```

Quarto installs the extension under `_extensions/htmpres/`. Keep that folder in
version control so collaborators use the same renderer. `workspace init` copies
the extension into the presentation workspace and gives it a human-facing
Justfile. If a different Justfile already exists, it writes `htmpres.just`.

For a local checkout or archive, replace the first command with one of these:

```sh
quarto add /path/to/htmpres
quarto add https://example.org/htmpres.zip
```

See [Start a deck](quickstart.qmd) for a complete first talk, or
[Authoring CLI](authoring-cli.md) for workspace and agent commands.

## Files in the extension

`_extensions/htmpres/htmpres.ts` owns the CLI. Its `lib/` folder holds source and
rendering helpers, `templates/` holds starter material, and `runtime/` supplies
the browser controls and styles. `themes/` and `vendor/katex/` contain the local
theme and math assets. The root `scripts/htmpres.ts` is a repository convenience
shim; installed projects call the extension path directly.

## Optional agent skills

Agent instructions are a separate installation. They do not replace the extension:

```sh
npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

Use `htmpres-installer` to set up a presentation project. Use `htmpres-authoring`
to inspect, edit, render and verify a deck after the extension exists.

## Output format boundary

Use `quarto run ... render`, as shown above. A native `quarto render --to htmpres-html`
format and a `quarto use template` starter are not shipped. A native format
would need a Quarto/Pandoc template and filters that preserve the current HTML,
notes and interactions. It remains a separate proposal.

## Tool documentation

The [Quarto scripts guide](https://quarto.org/docs/projects/scripts.html) explains
the bundled Deno runtime. The [extension distribution guide](https://quarto.org/docs/extensions/distributing.html)
describes installation from GitHub, local files and archives.
