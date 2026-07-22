default:
  @just --list

# Render the tutorial deck, the public repo's primary runnable example.
tutorial:
  quarto run scripts/htmpres.ts render decks/tutorial/index.qmd

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
verify:
  quarto run scripts/htmpres.ts verify

# Render one deck through the optional Node fallback. Defaults to the tutorial.
node-render deck="decks/tutorial/index.qmd":
  node scripts/qmd-to-html.mjs {{deck}}

# Verify through the optional Node fallback.
node-verify:
  node scripts/verify-roundtrip.mjs

# Check for whitespace errors before committing.
diff-check:
  git diff --check

# Run the normal local verification path for renderer/tutorial changes.
# This path uses Quarto's bundled Deno runtime and does not require Node.
check: tutorial verify diff-check

# Prepare the private Sites preview app with both tutorial themes.
# Saving and deploying still happens through the Sites connector.
publish theme_dir="/private/tmp/htmpres-theme-preview" site_dir="/private/tmp/htmpres-sites-preview":
  scripts/prepare-sites-preview.sh "{{theme_dir}}" "{{site_dir}}"

# Run the optional Node fallback renderer and verifier.
node-check: node-render node-verify

# Run the core Deno checks plus optional Node fallback parity checks.
compat-check: tutorial verify node-render node-verify diff-check
