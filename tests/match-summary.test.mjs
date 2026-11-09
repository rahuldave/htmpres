import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { compileMatchSummary, matchSummaryGroups, maximumMatchGroups, parseLineMatches } from '../_extensions/htmpres/lib/render.mjs';
import { matchPalette, matchSurface, matchThemeStyles, legacyMatchPalettes } from '../_extensions/htmpres/themes/matches.mjs';

test('summary groups come from actual explanation attributes, remain ordered and validate mappings', () => {
  const html = `<code>data-match="literal"</code><script>const s='<b data-match="fake">';</script>
    <div data-line-matches="1:input|2-3:mean"></div>
    <span data-match="input">Input</span><span data-match='mean'>Mean</span><b data-match="input">Again</b>`;
  assert.deepEqual(matchSummaryGroups(html, 'match'), ['input', 'mean']);
  assert.deepEqual(matchSummaryGroups(html, undefined), []);
  assert.equal(maximumMatchGroups('<section data-match-groups="a|b"></section><section data-match-groups="c"></section>'), 2);
  assert.deepEqual(parseLineMatches('1,3-4:input|2:mean'), [
    { start: 1, end: 1, group: 'input' }, { start: 3, end: 4, group: 'input' }, { start: 2, end: 2, group: 'mean' },
  ]);
  for (const key of ['', 'bad key', 'Red', 'a&quot; onclick=&quot;bad', '1a', 'enclosing']) assert.throws(() => matchSummaryGroups(`<b data-match="${key}">x</b>`, 'match'), /match/);
  assert.throws(() => matchSummaryGroups(html, 'colors'), /data-step-summary/);
  assert.throws(() => matchSummaryGroups('<div data-match="a"><b data-match="b">x</b></div>', 'match'), /overlap/);
  assert.throws(() => matchSummaryGroups('<code data-line-matches="1:missing"></code><b data-match="mean">x</b>', 'match'), /missing/);
  for (const value of ['0:mean', '3-1:mean', '1:mean|1:input', '1-3:mean|2:input', '1:', '1.5:mean', '9007199254740992:mean']) {
    assert.throws(() => parseLineMatches(value), /line.match/i, value);
  }
});

test('compiled line ranges and color overrides are safe, slide scoped and validated at build time', () => {
  const source = '<div class="sourceCode" data-line-matches="1:mean"><pre><code>x = 1\n</code></pre></div><span data-match="mean" data-match-color="#245c88" data-match-color-dark="var(--teal)">Mean</span>';
  const compiled = compileMatchSummary(source, 'match', { id: 'result', colors: 'mean=red' });
  assert.match(compiled.html, /data-match-ranges="1-1:1"/);
  assert.match(compiled.css, /\.slide\[id="result"\]/);
  assert.match(compiled.css, /--htmpres-match-mean: #245c88;/, 'inline choice overrides slide palette for same semantic pair');
  assert.match(compiled.css, /html\[data-color-mode="dark"\]/);
  assert.match(compiled.css, /--htmpres-match-mean: var\(--teal\);/);
  assert.throws(() => compileMatchSummary(source.replace('1:mean', '2:mean'), 'match'), /exceeds/);
  assert.throws(() => compileMatchSummary(source, 'match', { colors: 'unknown=red' }), /Unknown/);
  assert.throws(() => compileMatchSummary(source.replace('#245c88', 'red;display:none'), 'match'), /Invalid match color/);
  assert.throws(() => compileMatchSummary(source + '<b data-match="mean" data-match-color="red">again</b>', 'match'), /Conflicting/);
  assert.throws(() => compileMatchSummary(source + '<b data-match-color="red">orphan</b>', 'match'), /needs data-match/);
  assert.throws(() => compileMatchSummary(source.replace('class="sourceCode"', 'class="two-col"'), 'match'), /surrounding div/);
  const inlineDefault = compileMatchSummary('<span data-match="mean" data-match-color="blue">Mean</span>', 'match', { id: 'x', darkColors: 'mean=red' });
  assert.doesNotMatch(inlineDefault.css, /red/);
  assert.equal((inlineDefault.css.match(/--htmpres-match-mean: blue/g) || []).length, 2, 'Inline default overrides slide dark map in both modes');
  const escaped = compileMatchSummary('<b data-match="mean">x</b>', 'match', { id: 'x"]{}', colors: 'mean=rgb(20 40 60)' });
  assert.doesNotMatch(escaped.css, /id="x"\]/);
  for (const color of ['rebeccapurple', '#abc', 'hsl(210 60% 30%)', 'oklch(50% .1 250)', 'var(--plot-mean)']) {
    assert.ok(compileMatchSummary('<b data-match="mean">x</b>', 'match', { colors: `mean=${color}` }).css.includes(color));
  }
});

// Independent WCAG computation: do not use the production contrast helper.
const luminance = hex => hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
  .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
test('theme matching palettes are dynamic, prefix stable and readable in every bundled mode', () => {
  const catalog = JSON.parse(readFileSync(new URL('../_extensions/htmpres/themes/catalog.json', import.meta.url)));
  for (const [name, palettes] of [...Object.entries(catalog.themes).map(([name, entry]) => [name, entry.palettes]), ...Object.entries(legacyMatchPalettes).map(([name, p]) => [name, { light: p }])]) {
    for (const [mode, p] of Object.entries(palettes)) {
      const colors = matchPalette(p, 12);
      assert.equal(colors.length, 12);
      assert.equal(new Set(colors).size, 12, `${name}/${mode}: distinct slots`);
      assert.deepEqual(colors.slice(0, 3), matchPalette(p, 3), `${name}/${mode}: adding groups keeps earlier colors`);
      for (const color of colors) {
        assert.match(color, /^#[0-9a-f]{6}$/);
        for (const bg of matchSurface(p) ? [matchSurface(p)] : [p.paper, p.panel]) assert.ok(contrast(color, bg) >= 4.5, `${name}/${mode} ${color}/${bg}`);
      }
    }
  }
  const plan = { light: 'nocturne', dark: 'nocturne', mode: 'auto' };
  assert.match(matchThemeStyles(plan, catalog, 9, 'nocturne'), /--htmpres-match-9:/);
  assert.doesNotMatch(matchThemeStyles(plan, catalog, 2, 'nocturne'), /--htmpres-match-3:/);
  assert.equal(matchThemeStyles(plan, catalog, 0, 'nocturne'), '');
});
