# Build and publish this website

These commands are for maintaining the htmpres documentation site. To write
your own presentation, follow [Start a deck](quickstart.qmd).

## Build locally

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) as well as
Quarto and Just. The build runs pinned **SmallDocs 0.5.5** in an isolated tool
environment; the first build may need network access.

```sh
just docs
just docs-serve 8770
```

`just docs` renders the example, generates all comparison variants, checks the
SmallDocs sources and writes `docs/_site/`. `just docs-serve` serves the site and
reloads documentation edits. For changes to the example or comparison generator,
rerun `just docs` first. To use your own installed SmallDocs executable, set
`SMALLDOCS_BIN` to its path.

`just check` verifies the renderer, example, site and local links. `just
compat-check` also checks the optional Node renderer. Node is not needed for
the default build.

## Publish the project website

The project's [live documentation](https://rahuldave.com/htmpres/) is hosted
on GitHub Pages. The `Website` workflow checks the site on pull requests and
publishes successful builds of `main`. It uploads only `docs/_site/`, including
the public example and theme comparison. Private imported decks and internal
workflow/spec pages are excluded from the publication allowlist.

```sh
just pages-build
just pages-deploy
```

The first command builds and checks the exact Pages artifact locally. The second
requires GitHub CLI access to this repository and starts a deployment of `main`.
Follow its progress in the repository's **Actions → Website** page. No generated
HTML needs to be committed. Pages uses GitHub Actions as its publishing source.

## Check the interactive example

`just docs-check` checks the per-slide Markdown against the original source,
all 146 theme views, and local links/assets. `just showcase-test` includes
focused example-controller and source-extraction checks. The repeatable CUA
flow is `integration_tests/example-browser.mjs`; run it against
`http://127.0.0.1:8770/example.html?slide=5` to exercise page and iframe keys,
step boundaries, view changes, source scrolling and appendix links.

The [picture patterns](patterns.qmd) use `decks/patterns/index.qmd`. `just patterns`
renders them, and `just docs` stages only the reviewed source and two SVG assets.
`integration_tests/docs-layout-browser.mjs` checks workspace width, typography,
responsive stacking and slide/notes proportions. Run it on both example pages,
then use `integration_tests/example-browser.mjs` for the tour's step interactions.

These browser flows run in a CUA JavaScript session, rather than a standalone
Node process. Obtain a browser tab for the local page and store its handle as
`tab`. Then import and call the check, replacing the absolute checkout path:

```javascript
const flow = await import('file:///absolute/path/to/htmpres/integration_tests/example-browser.mjs');
await flow.checkExampleBrowser(tab);
```

For layout checks, import `docs-layout-browser.mjs` and call `checkDocsLayout(tab)`.
For picture patterns, open `patterns.html`, import `patterns-browser.mjs`, and
call `checkPatternsBrowser(tab, manifest.slideSources)`. Read the manifest from
`docs/_generated/patterns-manifest.json` in the checkout. Run one mode/view per
call with `{modes: ['light'], views: ['audience']}` when the session has a short
execution limit. Repeat with dark and presenter, then inspect screenshots at
desktop, tablet and phone widths. Restore the browser viewport afterward.
