# Install the Quarto extension

Install htmpres in your Quarto project to make browser slides with navigation,
reveals, zoom and presenter notes. The utility extension builds the audience and
presenter HTML from your Markdown.

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

If you have a local checkout, replace the first command with:

```sh
quarto add /path/to/htmpres
```

See [Start a deck](quickstart.qmd) for a complete first talk, or
[Authoring CLI](authoring-cli.md) for workspace and agent commands.

## Optional agent skills

Agent instructions are a separate installation. They do not replace the extension:

```sh
npx skills add rahuldave/htmpres -a codex --skill htmpres-installer --skill htmpres-authoring
```

Use `htmpres-installer` to set up a presentation project. Use `htmpres-authoring`
to inspect, edit, render and verify a deck after the extension exists.

## Render with the utility command {#output-format-boundary}

Use `quarto run ... render`, as shown above. A native `quarto render --to htmpres-html`
format and a `quarto use template` starter are not shipped.

## Quarto documentation {#tool-documentation}

The [Quarto scripts guide](https://quarto.org/docs/projects/scripts.html) explains
the bundled Deno runtime. The [extension distribution guide](https://quarto.org/docs/extensions/distributing.html)
describes installation from GitHub, local files and archives.
