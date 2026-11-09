#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/htmpres-authoring.XXXXXX")"

cd "$SCRATCH"

quarto run "$ROOT/_extensions/htmpres/htmpres.ts" workspace init .
test -f Justfile
test -f _extensions/htmpres/htmpres.ts

quarto run _extensions/htmpres/htmpres.ts deck new demo --title "Demo Deck" --theme mono-grid
test -f demo/index.qmd
test -f demo/source.css
test -d demo/assets
grep -q 'theme: mono-grid' demo/index.qmd
grep -q 'html\[data-theme="mono-grid"\]' demo/source.css

quarto run _extensions/htmpres/htmpres.ts slide list demo/index.qmd --json > slides.json 2>&1
grep -q '"slideCount": 2' slides.json
grep -q '"kind": "hero"' slides.json

if quarto run _extensions/htmpres/htmpres.ts slide insert demo/index.qmd --after 1 --kind typo-kind > unknown-kind.txt 2>&1; then
  echo "unknown kind was accepted" >&2
  exit 1
fi
grep -q 'Unknown slide kind: typo-kind' unknown-kind.txt

quarto run _extensions/htmpres/htmpres.ts slide insert demo/index.qmd --after 1 --kind two-card --title "Two Paths" --section "Plan"
quarto run _extensions/htmpres/htmpres.ts slide show demo/index.qmd 2 --json > slide-2.json 2>&1
grep -q '"kind": "two-card"' slide-2.json
grep -q 'Two Paths' slide-2.json

cat > replacement.qmd <<'QMD'
## Replaced Slide {data-section="Plan" data-title="Replaced Slide"}

::: callout
This slide was replaced through the authoring CLI smoke test.
:::
QMD

cat > multi-slide.qmd <<'QMD'
## One

one

## Two

two
QMD

if quarto run _extensions/htmpres/htmpres.ts slide replace demo/index.qmd 2 --from multi-slide.qmd > multi-replace.txt 2>&1; then
  echo "multi-slide replacement was accepted" >&2
  exit 1
fi
grep -q 'exactly one level-2 slide heading' multi-replace.txt

quarto run _extensions/htmpres/htmpres.ts slide replace demo/index.qmd 2 --from replacement.qmd
quarto run _extensions/htmpres/htmpres.ts slide show demo/index.qmd 2 > replaced.qmd 2>&1
grep -q 'This slide was replaced' replaced.qmd

if quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd missing-theme > missing-theme.txt 2>&1; then
  echo "missing theme was accepted" >&2
  exit 1
fi
grep -q 'Theme missing-theme does not exist' missing-theme.txt

quarto run _extensions/htmpres/htmpres.ts theme add demo/index.qmd custom --from blank
quarto run _extensions/htmpres/htmpres.ts theme set demo/index.qmd custom
grep -q 'theme: custom' demo/index.qmd
grep -q 'html\[data-theme="custom"\]' demo/source.css

just --justfile Justfile slides demo > just-slides.txt 2>&1
grep -q 'Replaced Slide' just-slides.txt

mkdir collision
cd collision
cat > Justfile <<'JUST'
default:
  @echo host
JUST
cat > htmpres.just <<'JUST'
default:
  @echo custom
JUST
if quarto run ../_extensions/htmpres/htmpres.ts workspace init . > collision.txt 2>&1; then
  echo "non-htmpres htmpres.just was overwritten" >&2
  exit 1
fi
grep -q 'Refusing to overwrite non-htmpres' collision.txt
cd ..

mkdir fallback
cd fallback
cat > Justfile <<'JUST'
default:
  @echo host
JUST
quarto run ../_extensions/htmpres/htmpres.ts workspace init .
test -f htmpres.just
just --justfile htmpres.just > fallback-list.txt 2>&1
grep -q 'slides-json' fallback-list.txt
cd ..

quarto run _extensions/htmpres/htmpres.ts render demo/index.qmd
test -f demo/index.html
test -f demo/presenter.html
grep -q 'data-theme="custom"' demo/index.html

echo "authoring CLI smoke passed in $SCRATCH"

"$ROOT/tests/theme-catalog-smoke.sh"

python3 "$ROOT/integration_tests/preview-server.py"

python3 "$ROOT/integration_tests/check-quickstart.py"
