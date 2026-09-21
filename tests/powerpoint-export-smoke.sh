#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/htmpres-powerpoint.XXXXXX")"
QUARTO_BIN="$(command -v quarto)"
DENO_BIN="$(dirname "$QUARTO_BIN")/tools/deno"

if [[ ! -x "$DENO_BIN" ]]; then
  echo "Could not locate Quarto's bundled Deno at $DENO_BIN" >&2
  exit 1
fi

OUTPUT="$SCRATCH/powerpoint-smoke.pptx"
REPORT="$SCRATCH/powerpoint-smoke.conversion.json"

if DENO_DIR="$SCRATCH/deno-cache" "$DENO_BIN" run --allow-all \
  "$ROOT/_extensions/htmpres/htmpres.ts" powerpoint \
  "$ROOT/tests/fixtures/powerpoint-smoke/index.qmd" \
  "$ROOT/tests/fixtures/powerpoint-smoke/index.qmd" \
  --template executive-funding \
  --report "$REPORT" >"$SCRATCH/multi-report.txt" 2>&1; then
  echo "one report path was accepted for multiple decks" >&2
  exit 1
fi
rg -q -- '--report can be used only when converting one deck' "$SCRATCH/multi-report.txt"

DENO_DIR="$SCRATCH/deno-cache" "$DENO_BIN" run --allow-all \
  "$ROOT/_extensions/htmpres/htmpres.ts" powerpoint \
  "$ROOT/tests/fixtures/powerpoint-smoke/index.qmd" \
  --template executive-funding \
  --output "$OUTPUT" \
  --report "$REPORT"

unzip -tqq "$OUTPUT"

slide_count="$(unzip -Z1 "$OUTPUT" | rg -c '^ppt/slides/slide[0-9]+\.xml$')"
test "$slide_count" -eq 11

media_count="$(unzip -Z1 "$OUTPUT" | rg -c '^ppt/media/[^/]+$')"
test "$media_count" -eq 4

unzip -Z1 "$OUTPUT" | rg -q '^ppt/media/univ-ai-logo\.png$'
unzip -Z1 "$OUTPUT" | rg -q '^ppt/media/point32health-logo\.png$'
unzip -Z1 "$OUTPUT" | rg -q '^ppt/media/univ-ai-section-background\.png$'
unzip -Z1 "$OUTPUT" | rg -q '^ppt/notesSlides/notesSlide[0-9]+\.xml$'
unzip -p "$OUTPUT" 'ppt/notesSlides/notesSlide*.xml' | rg -q 'speaker note must survive'
unzip -p "$OUTPUT" ppt/slides/slide11.xml | rg -q 'descr="Profile, catalog, runtime, and evidence cycle'

if unzip -p "$OUTPUT" 'ppt/slides/slide*.xml' | rg -q '\[\[HTMPRES:'; then
  echo "semantic marker leaked into generated PowerPoint" >&2
  exit 1
fi

DENO_DIR="$SCRATCH/deno-cache" "$DENO_BIN" eval \
  'const report=JSON.parse(Deno.readTextFileSync(Deno.args[0])); if(report.outputSlideCount!==11) throw new Error("wrong report slide count"); const hybrid=report.slides.filter((slide)=>slide.conversionLevel==="hybrid"); if(hybrid.length!==1 || hybrid[0].sourceSlideNumber!==11) throw new Error("wrong hybrid allowlist"); if(!report.slides.every((slide)=>slide.template && slide.layout && Array.isArray(slide.semanticTokens) && Array.isArray(slide.images) && Array.isArray(slide.warnings) && Object.hasOwn(slide,"fallbackReason"))) throw new Error("incomplete conversion report");' \
  "$REPORT"

echo "PowerPoint export smoke passed in $SCRATCH"
