import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { foundationTokens, foundationStyles, upgradeOwnedCss } from '../_extensions/htmpres/themes/foundations.mjs';
import { themeStyles } from '../_extensions/htmpres/themes/themes.mjs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const catalog = JSON.parse(read('_extensions/htmpres/themes/catalog.json'));
const plan = name => ({light:name,dark:name,mode:'auto'});

test('all 26 stock entries and source records stay exactly frozen', () => {
  const snapshots = JSON.parse(read('tests/fixtures/stock-theme-snapshots.json'));
  assert.equal(Object.keys(snapshots).length, 26);
  for (const [name, groups] of Object.entries(snapshots)) for (const [group, digest] of Object.entries(groups)) {
    assert.equal(createHash('sha256').update(JSON.stringify(catalog[group][name], null, 2)).digest('hex'), digest, name);
  }
});

test('nine imports preserve exact authoritative manifests and complete font roles', () => {
  const owned = Object.entries(catalog.themes).filter(([, entry]) => entry.foundation);
  assert.equal(owned.length, 9);
  for (const [name, entry] of owned) {
    const raw = read('_extensions/htmpres/themes/foundations/' + name + '.json');
    assert.deepEqual(JSON.parse(raw), entry.foundation);
    assert.equal(createHash('sha256').update(raw).digest('hex'), catalog.sources[name].sha256);
    assert.match(catalog.sources[name].commit, /^[a-f0-9]{40}$/);
    for (const mode of ['light','dark']) {
      const values = foundationTokens(entry, mode);
      assert.equal(values['foundation-default-htmpres-body-size'], '30px');
      assert.equal(values['foundation-default-htmpres-code-size'], '30px');
      assert.equal(values['foundation-default-htmpres-slide-padding'], '64px');
      assert.equal(values['font-heading'], entry.foundation.typography.fonts.heading);
      assert.equal(values['font-editorial-display'], entry.foundation.typography.fonts.display);
      for (let level = 0; level < 5; level++) assert.ok(entry.foundation.typography.availableWeights.body.includes(values[`htmpres-importance-${level}-weight`]));
      assert.equal(values.shadow, 'none');
    }
  }
});

test('profile mutation changes generated jobs rather than a second set of constants', () => {
  const entry = structuredClone(catalog.themes.folio);
  entry.foundation.typography.profiles.presentation.body = 36;
  entry.foundation.spacing.profiles.presentation.outer = 96;
  const values = foundationTokens(entry, 'light');
  assert.equal(values['foundation-default-htmpres-body-size'], '36px');
  assert.equal(values['foundation-default-htmpres-slide-padding'], '96px');
  assert.match(foundationStyles('html[data-theme="folio"]', entry), /--htmpres-body-size:36px/);
});

test('migration changes only exact unchanged defaults and preserves authored overrides', () => {
  const original = '.card p {\n  margin: 0;\n  font-size: 0.9rem;\n}';
  const authored = '\n.card p { font-size:42px; color:rebeccapurple; }\n:root { --htmpres-body-size:42px; }';
  const changed = upgradeOwnedCss(original + authored, plan('folio'), catalog);
  assert.match(changed, /font-size: var\(--htmpres-body-size, 0.9rem\)/);
  assert.ok(changed.endsWith(authored));
  assert.equal(upgradeOwnedCss(original + authored, plan('zephyr'), catalog), original + authored);
  assert.equal(upgradeOwnedCss(authored, null, catalog), authored);
  assert.doesNotMatch(themeStyles(plan('folio'), catalog), /:is\(h2, h3\) \{ font-style: italic/);
  assert.match(themeStyles(plan('folio'), catalog), /font-editorial-display/);
});

test('copied tutorial version migrates code root, inset and unboxed jobs exactly', () => {
  const source = read('decks/tutorial/source.css');
  const changed = upgradeOwnedCss(source, plan('tufte'), catalog);
  assert.match(changed, /padding: var\(--htmpres-slide-padding, 48px 58px 82px\)/);
  assert.match(changed, /--htmpres-code-size: var\(--foundation-default-htmpres-code-size, 0.84rem\)/);
  assert.match(changed, /background: var\(--htmpres-card-bg, var\(--surface\)\)/);
  assert.match(changed, /border-left: var\(--htmpres-callout-border/);
  const values = foundationTokens(catalog.themes.tufte,'dark');
  assert.equal(values['htmpres-card-bg'],'transparent');
  assert.equal(values['htmpres-code-bg'],'transparent');
  assert.equal(values['foundation-default-htmpres-code-shell-border'],'0');
  const folio = foundationTokens(catalog.themes.folio,'light');
  assert.equal(folio['foundation-emphasis-weight'],600);
  assert.equal(folio['htmpres-code-emphasis-weight'],500);
});

test('owned clone provenance opts unchanged copied defaults in without changing arbitrary local themes', () => {
  const clonePlan = plan('my-folio');
  const seed = themeStyles(plan('folio'),catalog,'my-folio');
  assert.match(seed,/htmpres-foundation-seed: my-folio <- folio/);
  const source = read('decks/tutorial/source.css');
  assert.notEqual(upgradeOwnedCss(source,clonePlan,catalog,seed),source);
  assert.equal(upgradeOwnedCss(source,clonePlan,catalog),source);
  assert.match(foundationStyles('html[data-theme="folio"]',catalog.themes.folio),/\.hero-title h2 \{ font-family:var\(--font-editorial-display\)/);
});

test('the entire known copied card block consumes spacing and unboxed roles together', () => {
  const css = upgradeOwnedCss(read('decks/tutorial/source.css'),plan('tufte'),catalog);
  const card = css.match(/\n\.card \{([^}]+)\}/)[1];
  assert.match(card,/padding: var\(--htmpres-card-padding, 18px\)/);
  assert.match(card,/background: var\(--htmpres-card-bg, var\(--surface\)\)/);
  assert.match(card,/border: var\(--htmpres-card-border/);
  assert.match(css,/h2,\n  \.hero-title h2 \{\n    font-size: var\(--htmpres-h2-size, 2rem\)/);
  const activeAction = css.match(/\.action-button\.active \{([^}]+)\}/)[1];
  assert.match(activeAction,/color: var\(--foundation-selected-ink, var\(--paper\)\)/);
  assert.match(css,/outline: var\(--htmpres-focus-outline, none\)/);
});
