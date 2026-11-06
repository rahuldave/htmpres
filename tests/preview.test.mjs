import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { injectPreview, readPreviewHtml, queueRenders, shouldWatchPath } from '../_extensions/htmpres/lib/preview.mjs';

const tick = () => new Promise(resolve => setTimeout(resolve, 20));
test('render queue debounces, retains edits during a build, and publishes only success', async () => {
  let release, runs = 0, published = 0, errors = 0;
  const queue = queueRenders(async () => {
    runs++;
    if (runs === 1) await new Promise(resolve => { release = resolve; });
    if (runs === 3) throw new Error('invalid source');
  }, () => published++, () => errors++, 1);
  queue(); queue(); await tick(); assert.equal(runs, 1);
  queue(); queue(); release(); await tick();
  assert.equal(runs, 2); assert.equal(published, 2);
  queue(); await tick(); assert.equal(errors, 1); assert.equal(published, 2);
  queue(); await tick(); assert.equal(runs, 4); assert.equal(published, 3);
});
test('watch filter includes author inputs and excludes generated bundles', () => {
  for (const path of ['slides.qmd', 'source.css', 'assets/figure.svg']) assert.equal(shouldWatchPath(path), true, path);
  for (const path of ['index.html', 'presenter.html', 'assets/htmpres-math', 'assets/htmpres-themes', 'assets/htmpres-math/katex.min.css', 'assets/htmpres-themes/fonts/a.woff2']) assert.equal(shouldWatchPath(path), false, path);
});
test('preview client is response-only, retries failures and reloads current URL on a completed revision', async () => {
  const original = '<html><body><p>Deck</p></body></html>';
  const html = injectPreview(original, 'session:1');
  assert.equal(original.includes('htmpres-preview'), false);
  const script = /<script id="htmpres-preview">([\s\S]*?)<\/script>/.exec(html)[1];
  let interval, count = 0, fail = true, current = 'session:1';
  const context = { setInterval: fn => { interval = fn; }, location: { reload: () => count++ }, fetch: async (url, options) => {
    assert.equal(url, '/_htmpres/preview.json'); assert.equal(options.cache, 'no-store');
    if (fail) throw new Error('disconnected');
    return { ok: true, json: async () => ({ revision: current }) };
  }};
  vm.runInNewContext(script, context);
  await interval(); fail = false; await interval(); assert.equal(count, 0);
  current = 'session:2'; await interval(); assert.equal(count, 1);
  assert.doesNotMatch(script, /location\.(?:href|hash)\s*=/, 'reload preserves view and hash');
});

test('a build completing during an HTML read cannot stamp old bytes with a new token', async () => {
  let current = 'session:1', release;
  const reading = readPreviewHtml(() => new Promise(resolve => { release = resolve; }), () => current);
  current = 'session:2';
  release('<body>Old content</body>');
  const html = await reading;
  assert.match(html, /const revision = "session:1"/);
  assert.doesNotMatch(html, /const revision = "session:2"/);
});

test('an edit during the initial build is queued before the server opens', async () => {
  let release, runs = 0, published = 0;
  const queue = queueRenders(async () => {
    runs++;
    if (runs === 1) await new Promise(resolve => { release = resolve; });
  }, () => published++, error => { throw error; }, 1);
  const starting = queue.start();
  queue(); release();
  assert.equal(await starting, true);
  await tick(); assert.equal(runs, 2); assert.equal(published, 2);
});
