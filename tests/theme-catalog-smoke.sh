#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/htmpres-themes.XXXXXX")"
CLI="$ROOT/_extensions/htmpres/htmpres.ts"
run() { quarto run "$CLI" "$@" >> "$SCRATCH/commands.log" 2>&1 || { cat "$SCRATCH/commands.log"; return 1; }; }

cd "$SCRATCH"
run workspace init .
CLI="$SCRATCH/_extensions/htmpres/htmpres.ts"
run theme list
quarto run "$CLI" theme list > catalog.txt
test "$(wc -l < catalog.txt | tr -d ' ')" = 38
run deck new seed --theme folio --color-mode dark
grep -q 'color-mode: dark' seed/index.qmd
run theme set seed/index.qmd litera-reading
grep -q 'color-mode: dark' seed/index.qmd
run theme add seed/index.qmd my-folio --from folio
run theme set seed/index.qmd my-folio
run render seed/index.qmd
grep -q 'data-theme="my-folio"' seed/index.html
test -f seed/assets/htmpres-themes/fonts/source-serif-4-400-normal.ttf
run theme set seed/index.qmd mono-grid
if grep -q 'color-mode:' seed/index.qmd; then echo "Unpaired theme retained incompatible color mode" >&2; exit 1; fi
run render seed/index.qmd
grep -q 'data-theme="mono-grid"' seed/index.html

if quarto run "$CLI" theme add seed/index.qmd broken --from missing > invalid-seed.txt 2>&1; then
  echo "Unknown seed was accepted" >&2; exit 1
fi
if quarto run "$CLI" deck new bad --theme folio --color-mode invalid > invalid-mode.txt 2>&1; then
  echo "Invalid mode was accepted" >&2; exit 1
fi
test ! -d bad

themes=(folio atelier nocturne litera-reading darkly-reading tufte bootstrap)
if [[ "${1:-}" = "--all" ]]; then
  themes=()
  while IFS= read -r theme; do
    case "$theme" in sage|mono-grid|blank) ;; *) themes+=("$theme");; esac
  done < catalog.txt
fi

cat > specimen.qmd <<'QMD'
## A clear line of thought {.hero-title data-section="Theme specimen"}

::: hero-subtitle
Presentation typography, color, and space.
:::

:::: two-col
::: card
### A meaningful heading
Readable body text with **emphasis** and a [link](https://example.com).
:::
::: card
### Another perspective
Lists, diagrams, code, and media share the palette.
:::
::::

::: notes
Presenter notes should use the same palette as the slide.
:::

## Code and progressive disclosure {data-section="Runtime"}

```{.python .numberLines data-highlight="2"}
def greet(name):
    return f"Hello, {name}!"
```

::: incremental
- First point
- Second point
:::
QMD

printf '%s\n' '<!doctype html><html lang="en"><meta charset="utf-8"><title>htmpres theme gallery</title><style>body{font:18px system-ui;max-width:960px;margin:3rem auto;padding:1rem;background:#f5f7fa;color:#172127}ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}a{color:#174a8b}</style><h1>htmpres theme gallery</h1><p>Each deck has a color-mode button. Cycle Auto → Light → Dark. All assets are local.</p><ul>' > index.html
for theme in "${themes[@]}"; do
  mkdir "$theme"
  printf '%s\n' '---' "pagetitle: $theme" 'deck:' "  theme: $theme" '  color-mode: auto' '  text-fit: true' '---' > "$theme/index.qmd"
  cat specimen.qmd >> "$theme/index.qmd"
  run render "$theme/index.qmd"
  grep -q 'data-color-mode-choice="auto"' "$theme/index.html"
  grep -q 'id="colorModeBtn"' "$theme/presenter.html"
  grep -q 'Presenter notes should use' "$theme/presenter.html"
  if grep -q 'Presenter notes should use' "$theme/index.html"; then echo "Notes leaked" >&2; exit 1; fi
  printf '<li><a href="%s/index.html">%s</a> · <a href="%s/presenter.html">notes</a></li>\n' "$theme" "$theme" "$theme" >> index.html
done
printf '%s\n' '</ul></html>' >> index.html

mkdir paired override
printf '%s\n' '---' 'deck:' '  theme:' '    light: litera-reading' '    dark: darkly-reading' '  color-mode: auto' '---' > paired/index.qmd
cat specimen.qmd >> paired/index.qmd
run render paired/index.qmd
grep -q 'data-theme-dark="darkly-reading"' paired/index.html
run theme set paired/index.qmd folio
if grep -q '    light:' paired/index.qmd; then echo "Old theme mapping survived theme set" >&2; exit 1; fi
grep -q 'color-mode: auto' paired/index.qmd

printf '%s\n' '---' 'deck:' '  theme: folio' '  css: custom.css' '  color-mode: light' '---' > override/index.qmd
cat specimen.qmd >> override/index.qmd
printf '%s\n' 'html[data-theme="folio"] { --paper: #fdf0df; --font-body: Georgia, serif; }' '.slide h2 { letter-spacing: .02em; }' > override/custom.css
cp override/custom.css original.css
run render override/index.qmd
cmp override/custom.css original.css
grep -q -- '--paper: #fdf0df' override/index.html

find folio/assets -type f -exec touch -t 200001010000 {} +
touch render-marker
run render folio/index.qmd
test -z "$(find folio/assets -type f -newer render-marker -print)"

printf 'Theme catalog smoke passed (%s themes): %s\n' "${#themes[@]}" "$SCRATCH"
