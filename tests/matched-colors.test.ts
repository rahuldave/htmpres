import { compileMatchSummary } from "../_extensions/htmpres/lib/render.mjs";
import { legacyMatchPalettes, matchPalette, matchSurface, matchThemeStyles } from "../_extensions/htmpres/themes/matches.mjs";

const catalog = JSON.parse(Deno.readTextFileSync(new URL("../_extensions/htmpres/themes/catalog.json", import.meta.url)));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
const light = (hex: string) => hex.slice(1).match(/../g)!.map(part => parseInt(part, 16) / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
for (const [name, palettes] of [...Object.entries(catalog.themes).map(([name, entry]) => [name, entry.palettes]), ...Object.entries(legacyMatchPalettes).map(([name, p]) => [name, { light: p }])]) {
  for (const [mode, p] of Object.entries(palettes)) {
    const colors = matchPalette(p, 12), surface = matchSurface(p);
    assert(colors.length === 12 && new Set(colors).size === 12, `${name}/${mode}: dynamic distinct slots`);
    assert(JSON.stringify(colors.slice(0, 3)) === JSON.stringify(matchPalette(p, 3)), `${name}/${mode}: stable prefix`);
    for (const color of colors) for (const bg of surface ? [surface] : [p.paper, p.panel]) {
      const a = light(color), b = light(bg);
      assert((Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= 4.5, `${name}/${mode}: ${color} contrasts with ${bg}`);
    }
  }
}
const sample = '<pre data-line-matches="1:mean"><code>x\n</code></pre><span data-match="mean" data-match-color="#245c88">Explain</span>';
const compiled = compileMatchSummary(sample, 'match', { id: 'example' });
assert(compiled.groups[0] === 'mean' && compiled.html.includes('data-match-ranges="1-1:1"'), 'Named matches compile for the runtime');
assert(compiled.css.includes('--htmpres-match-mean: #245c88'), 'Direct override retains its semantic key');
const plan = { light: 'nocturne', dark: 'nocturne', mode: 'auto' };
assert(matchThemeStyles(plan, catalog, 12, 'nocturne').includes('--htmpres-match-12:'), 'Generate the required count, not a fixed three-color palette');
console.log('Matched-color checks passed: compiled syntax and 12 stable contrast-checked slots across 70 paired modes and 3 legacy seeds.');
