default:
  @just --list

# Render the advanced customization reference deck (legacy target name).
tutorial:
  quarto run scripts/htmpres.ts render decks/tutorial/index.qmd

# Render the public example with inline speaker notes.
example:
  quarto run scripts/htmpres.ts render decks/example/index.qmd

# Render semantic importance, math, mixed steps and appendix examples.
semantic:
  quarto run scripts/htmpres.ts render decks/semantic/index.qmd

# Check shared semantic contracts without requiring Node.
semantic-test: semantic
  quarto run tests/semantic-importance.test.ts
  quarto run tests/semantic-deck.test.ts

# Check the same source-break rule used by render and verify.
lint *decks:
  quarto run scripts/htmpres.ts lint {{decks}} --json

# Generate every catalog palette from the canonical example render.
theme-gallery: example semantic
  quarto run scripts/build-showcase.ts

# Build the SmallDocs site (requires uv; SmallDocs is pinned by the wrapper).
docs: theme-gallery
  scripts/smalldocs.sh check docs
  scripts/smalldocs.sh render docs --strict

# Focused showcase tests, usable with Quarto's bundled Deno.
showcase-test: example
  quarto run tests/showcase.test.ts

# Crawl the whole site, including every selector-generated deck view.
docs-check: docs showcase-test
  python3 integration_tests/check-docs.py docs/_site

# Build the checked Pages artifact with an explicit static-site marker.
pages-build: docs-check semantic-test
  touch docs/_site/.nojekyll

# Redeploy main through the repository's GitHub Pages workflow.
pages-deploy:
  gh workflow run pages.yml --ref main

# Preview the documentation. Rerun just docs after changing the example deck.
docs-serve port="8770": docs
  scripts/smalldocs.sh preview docs --port {{port}} --host 127.0.0.1 --no-browser

# Render one deck. Defaults to the tutorial.
render deck="decks/tutorial/index.qmd":
  quarto run scripts/htmpres.ts render {{deck}}

# Render every local deck. This may include ignored private decks in this workspace.
render-all:
  quarto run scripts/htmpres.ts render

# Convert source HTML snapshots into deck QMD.
convert *sources:
  quarto run scripts/htmpres.ts convert {{sources}}

# Run the renderer's round-trip and output checks.
verify *decks:
  quarto run scripts/htmpres.ts verify {{decks}}

# Smoke-test the authoring CLI against a scratch presentation workspace.
authoring-smoke:
  tests/authoring-cli-smoke.sh

# Render one deck through the optional Node fallback. Defaults to the tutorial.
node-render deck="decks/tutorial/index.qmd":
  node scripts/qmd-to-html.mjs {{deck}}

# Verify through the optional Node fallback.
node-verify *decks:
  node scripts/verify-roundtrip.mjs {{decks}}

# Check for whitespace errors before committing.
diff-check:
  git diff --check

# Run the normal local verification path for renderer/tutorial changes.
# This path uses Quarto's bundled Deno runtime and does not require Node.
check: tutorial example semantic verify semantic-test authoring-smoke docs-check diff-check

# Prepare the private Sites preview app with both tutorial themes.
# Saving and deploying still happens through the Sites connector.
publish theme_dir="/private/tmp/htmpres-theme-preview" site_dir="/private/tmp/htmpres-sites-preview":
  scripts/prepare-sites-preview.sh "{{theme_dir}}" "{{site_dir}}"

# Run the optional Node fallback renderer and verifier.
node-check: node-render node-verify

# Run the core Deno checks plus optional Node fallback parity checks.
compat-check: tutorial example semantic verify node-render node-verify diff-check
  node --test tests/semantic-renderer.test.mjs tests/runtime-steps.test.mjs tests/runtime-navigation.test.mjs
