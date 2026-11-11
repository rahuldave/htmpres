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

# Render statement, attribution and presenter-only counter examples.
authoring-hooks:
  quarto run scripts/htmpres.ts render decks/authoring-hooks/index.qmd

# Render picture geometry, contrast and accessible caption regression examples.
pictures:
  quarto run scripts/htmpres.ts render decks/pictures/index.qmd

# Render the three-slide mixed-boundary authoring example.
slide-breaks:
  quarto run scripts/htmpres.ts render decks/slide-breaks/index.qmd

# Check shared semantic contracts without requiring Node.
semantic-test: semantic authoring-hooks
  quarto run tests/semantic-importance.test.ts
  quarto run tests/semantic-deck.test.ts

# Check source boundaries, counter settings and picture descriptions.
lint *decks:
  quarto run scripts/htmpres.ts lint {{decks}} --json

# Render copyable normal-use picture and statement patterns.
patterns:
  quarto run scripts/htmpres.ts render decks/patterns/index.qmd

# Render the copyable visual syntax reference.
syntax-examples:
  quarto run scripts/htmpres.ts render decks/syntax/index.qmd

# Generate every catalog palette from the canonical example render.
theme-gallery: example semantic authoring-hooks patterns syntax-examples
  quarto run scripts/build-showcase.ts

# Build the SmallDocs site (requires uv; SmallDocs is pinned by the wrapper).
docs: theme-gallery plotting-docs-test plotting-docs-stage plotting-tutorials-test plotting-tutorials-stage javascript-docs-test javascript-docs-stage
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
check: tutorial example semantic authoring-hooks slide-breaks pictures patterns syntax-examples verify semantic-test authoring-smoke docs-check diff-check

# Prepare the private Sites preview app with both tutorial themes.
# Saving and deploying still happens through the Sites connector.
publish theme_dir="/private/tmp/htmpres-theme-preview" site_dir="/private/tmp/htmpres-sites-preview":
  scripts/prepare-sites-preview.sh "{{theme_dir}}" "{{site_dir}}"

# Run the optional Node fallback renderer and verifier.
node-check: node-render node-verify

# Run the core Deno checks plus optional Node fallback parity checks.
compat-check: tutorial example semantic authoring-hooks slide-breaks pictures patterns syntax-examples verify node-render node-verify diff-check
  node --test tests/semantic-renderer.test.mjs tests/runtime-steps.test.mjs tests/runtime-navigation.test.mjs

# Independent Plotfoundry scaffolds only; optional R/Node toolchains stay separate.
packages-build:
  python3 -B scripts/build-packages.py

packages-test:
  python3 -B -m unittest tests/test_package_boundaries.py

# Consumers are installed outside the checkout, using only local built artifacts.
packages-install-test: packages-build
  python3 -B integration_tests/package-boundaries.py

packages-check: packages-test packages-install-test diff-check

# Standalone approved scientific data; validation never regenerates evidence.
spec-import:
  uv run --project packages/spec --locked python -B packages/spec/tools/promote.py import

spec-validate:
  uv run --project packages/spec --locked python -B packages/spec/tools/validate_spec.py packages/spec --verify-font-conversions

spec-test:
  uv run --project packages/spec --locked python -B -m unittest tests/test_plotfoundry_spec.py

spec-build:
  uv run --project packages/spec --locked python -B packages/spec/tools/promote.py build

spec-check: spec-validate spec-test spec-build diff-check

# Optional Python plotting reference; no R/JS runtime is involved.
python-snapshot-check:
  uv run --project packages/spec --locked python -B scripts/promote-python-spec.py

python-test:
  uv run --project packages/python --python 3.12 --locked --group verification python -B -m unittest tests/test_python_plotting.py

python-build:
  uv build --project packages/python --out-dir .build/packages/python

python-gallery:
  uv run --project packages/python --python 3.12 --locked --group verification python -B packages/python/examples/gallery.py --output .build/packages/python-gallery

python-install-test: python-build
  uv run --project packages/python --python 3.12 --locked --group verification python -B integration_tests/python-plotting-installed.py

python-gallery-check: python-gallery
  uv run --project packages/python --python 3.12 --locked --group verification python -B -m unittest tests/test_python_gallery.py

python-check: python-snapshot-check python-test python-install-test diff-check

# Native R reference: local dependencies, never user-global package installation.
r-setup library=".build/packages/r-library":
  Rscript packages/r/tools/install-dependencies.R "{{library}}"

r-promotion-test:
  uv run --project packages/spec --locked python -B -m unittest tests/test_r_promotion.py

r-snapshot-check:
  uv run --project packages/spec --locked python -B scripts/promote-r-spec.py

r-test:
  LANG=C LC_ALL=C R_LIBS_USER="$PWD/.build/packages/r-library" R CMD INSTALL --library="$PWD/.build/packages/r-library" packages/r
  LANG=C LC_ALL=C R_LIBS_USER="$PWD/.build/packages/r-library" Rscript packages/r/tests/core.R
  LANG=C LC_ALL=C R_LIBS_USER="$PWD/.build/packages/r-library" Rscript packages/r/tests/resources.R
  LANG=C LC_ALL=C R_LIBS_USER="$PWD/.build/packages/r-library" Rscript packages/r/tests/graphics.R

r-install-test:
  python3 -B integration_tests/r-reference-installed.py

r-gallery:
  LANG=C LC_ALL=C R_LIBS_USER="$PWD/.build/packages/r-library" Rscript packages/r/inst/examples/gallery.R .build/packages/r-gallery

r-gallery-check:
  python3 -B integration_tests/check-r-gallery.py .build/packages/r-gallery

r-check: r-snapshot-check r-promotion-test r-test r-install-test diff-check

# Reviewed static plotting publication; no native plotting runtime on CI.
plotting-docs-test:
  python3 -B -m unittest tests/test_plotting_docs.py tests/test_plotting_doc_apis.py

plotting-gallery-test:
  node --test tests/plotting-gallery.test.mjs

plotting-docs-stage:
  python3 -B scripts/plotting_docs.py stage

plotting-docs-validate:
  python3 -B scripts/plotting_docs.py validate

# Optional local snippet execution; not a site/CI dependency.
plotting-guide-examples:
  python3 -B integration_tests/plotting-guide-examples.py

# Independent browser-ready JS reference; Node is developer tooling, not browser runtime.
javascript-snapshot-check:
  uv run --project packages/spec --locked python -B scripts/promote-javascript-spec.py

javascript-test:
  node --test packages/javascript/tests/*.test.mjs
  node packages/javascript/tools/check-package.mjs

javascript-install-test:
  python3 -B integration_tests/javascript-installed.py

javascript-browser-test:
  uv run --no-project --with playwright==1.65.0 --with pillow==13.0.0 python integration_tests/javascript-browser.py

javascript-docs-test:
  python3 -B -m unittest tests/test_javascript_docs.py

javascript-docs-stage:
  python3 -B scripts/stage-javascript-docs.py

javascript-check: javascript-snapshot-check javascript-test javascript-install-test diff-check

# Tutorial publication uses reviewed static exports, with no native plotting on CI.
plotting-tutorials-test:
  python3 -B -m unittest tests/test_plotting_tutorials.py

plotting-tutorials-stage:
  python3 -B scripts/plotting_tutorials.py stage

# Optional native maintainer gate; requires separately installed Python/R artifacts.
plotting-tutorials-examples:
  python3 -B integration_tests/plotting-tutorial-examples.py
