import assert from 'node:assert/strict';
import test from 'node:test';
import { runtimeHarness } from './runtime-harness.mjs';

test('main counter excludes trailing appendix and Next stops before it', () => {
  const { run } = runtimeHarness(['', '', 'appendix', '']);
  assert.equal(run('mainSlideCount'), 2);
  assert.equal(run('slidePosition(0).counter'), '1 / 2');
  assert.equal(run('slidePosition(1).counter'), '2 / 2');
  assert.equal(run('slidePosition(2).counter'), 'Appendix 1 / 2');
  assert.equal(run('slidePosition(3).counter'), 'Appendix 2 / 2');
  assert.equal(run('slidePosition(2).label'), 'A1');
  run('prepareStepGraphs(); goTo(1); nextStepOrSlide()');
  assert.equal(run('current'), 1);
  run('goTo(2); nextStepOrSlide()');
  assert.equal(run('current'), 3);
  run('nextStepOrSlide()');
  assert.equal(run('current'), 3);
  run('goTo(lastMainSlide)');
  assert.equal(run('current'), 1);
});

test('no-appendix and all-appendix decks have valid counters', () => {
  const { run } = runtimeHarness(['', '']);
  assert.equal(run('slidePosition(1).counter'), '2 / 2');
  assert.equal(run('lastMainSlide'), 1);
  const all = runtimeHarness(['appendix', '']);
  assert.equal(all.run('slidePosition(0).counter'), 'Appendix 1 / 2');
  assert.equal(all.run('lastMainSlide'), 0);
});

test('main final slide may finish its steps before the boundary stops navigation', () => {
  const { run } = runtimeHarness(['', 'appendix']);
  run(`
    const element = fakeElement();
    slideFragmentStates.set(slides[0], { fragments: [{ element, explicitIndex: 4 }], step: 0 });
    prepareStepGraphs(); goTo(0); nextStepOrSlide();
  `);
  assert.equal(run('current'), 0);
  assert.equal(run('element.classes.has("fragment-visible")'), true);
  run('nextStepOrSlide()');
  assert.equal(run('current'), 0);
});

test('numeric and named hashes resolve exact slide targets and same-slide anchors', () => {
  const { run } = runtimeHarness(['', '', 'appendix']);
  run(`
    slides[0].id = 'main-result'; document.nodes.set('main-result', slides[0]);
    slides[2].id = 'appendix-data'; document.nodes.set('appendix-data', slides[2]);
    const footnote = fakeElement(); footnote.parentElement = slides[0];
    document.nodes.set('slide-1-fn1', footnote);
  `);
  assert.equal(run('slideTargetFromHash("#/2").index'), 1);
  assert.equal(run('slideTargetFromHash("#appendix-data").index'), 2);
  assert.equal(run('slideTargetFromHash("#slide-1-fn1").index'), 0);
  for (const hash of ['#/0', '#/4', '#/2oops', '#missing', '#%ZZ', '']) {
    assert.equal(run(`slideTargetFromHash(${JSON.stringify(hash)})`), null, hash);
  }
  run('prepareStepGraphs(); navigateToHash("#appendix-data")');
  assert.equal(run('current'), 2);
  run('navigateToHash("#/1")');
  assert.equal(run('current'), 0);
  run('navigateToHash("#slide-1-fn1")');
  assert.equal(run('footnote.scrolled.block'), 'nearest');
});

test('in-deck links push history and browser hash changes navigate back', () => {
  const { run } = runtimeHarness(['', '', 'appendix']);
  run(`
    document.nodes.set('main-result', slides[0]);
    document.nodes.set('appendix-data', slides[2]);
    prepareStepGraphs(); goTo(0); wireHashNavigation();
    const anchor = fakeElement(); anchor.tagName = 'A';
    anchor.href = 'http://localhost/deck/index.html#appendix-data';
    const event = { target: anchor, button: 0, preventDefault() { this.prevented = true; } };
    documentEvents.get('click')(event);
  `);
  assert.equal(run('event.prevented'), true);
  assert.equal(run('current'), 2);
  assert.equal(run('location.hash'), '#appendix-data');
  assert.deepEqual([...run('historyCalls.at(-1)')], ['push', '#appendix-data']);
  run('location.hash = "#main-result"; windowEvents.get("hashchange")()');
  assert.equal(run('current'), 0);
  assert.equal(run('location.hash'), '#main-result');
});

test('footnote navigation on the active slide retains the reveal frame', () => {
  const { run } = runtimeHarness();
  run(`
    const element = fakeElement();
    const footnote = fakeElement(); footnote.parentElement = slides[0];
    document.nodes.set('slide-1-fn1', footnote);
    slideFragmentStates.set(slides[0], { fragments: [{ element, explicitIndex: 1 }], step: 0 });
    prepareStepGraphs(); goTo(0); nextStepOrSlide();
    navigateToHash('#slide-1-fn1', 'push');
  `);
  assert.equal(run('slideStepStates.get(slides[0]).cursor'), 1);
  assert.equal(run('element.classes.has("fragment-visible")'), true);
});

test('external, modified, new-tab and download links retain normal browser behavior', () => {
  const { run } = runtimeHarness(['', 'appendix']);
  run(`
    document.nodes.set('appendix-data', slides[1]); prepareStepGraphs(); goTo(0); wireHashNavigation();
    function clickLink(overrides = {}, eventOverrides = {}) {
      const anchor = fakeElement(); anchor.tagName = 'A'; anchor.href = 'http://localhost/deck/index.html#appendix-data';
      Object.assign(anchor, overrides);
      const event = { target: anchor, button: 0, preventDefault() { this.prevented = true; }, ...eventOverrides };
      documentEvents.get('click')(event); return event.prevented || false;
    }
  `);
  assert.equal(run('clickLink({ href: "https://example.com/#appendix-data" })'), false);
  assert.equal(run('clickLink({ href: "http://localhost/other.html#appendix-data" })'), false);
  assert.equal(run('clickLink({ target: "_blank" })'), false);
  assert.equal(run('clickLink({}, { ctrlKey: true })'), false);
  assert.equal(run('clickLink({}, { button: 1 })'), false);
  assert.equal(run('current'), 0);
});

test('packaged and project-local runtimes remain identical', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const name of ['htmpres-custom-deck.js', 'htmpres-steps.css']) {
    assert.equal(await readFile(new URL(`../_extensions/htmpres/runtime/${name}`, import.meta.url), 'utf8'),
      await readFile(new URL(`../decks/scripts/${name}`, import.meta.url), 'utf8'));
  }
});


test('optional math hook runs after both presenter note containers are populated', () => {
  const { run } = runtimeHarness([''], { notes: true });
  run(`
    const mathCalls = [];
    window.htmpresRenderMath = node => mathCalls.push(node.innerHTML);
    deckNotes.push('<p>Equation $x$</p>');
    updateNotes();
  `);
  assert.deepEqual([...run('mathCalls')], ['<p>Equation $x$</p>', '<p>Equation $x$</p>']);
});

test('Next stays available for final-slide frames, then disables at the main boundary', () => {
  const { run } = runtimeHarness(['', 'appendix'], { buttons: true });
  run(`
    slideFragmentStates.set(slides[0], { fragments: [{ element: fakeElement(), explicitIndex: 2 }], step: 0 });
    prepareStepGraphs(); goTo(0);
  `);
  assert.equal(run('prevBtn.disabled'), true);
  assert.equal(run('nextBtn.disabled'), false);
  run('nextStepOrSlide()');
  assert.equal(run('prevBtn.disabled'), false);
  assert.equal(run('nextBtn.disabled'), true);
  run('prevStepOrSlide()');
  assert.equal(run('nextBtn.disabled'), false);
});
