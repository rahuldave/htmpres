/** Run from cua_repl against the rendered decks/semantic/index.html tab:
 * const { checkSemanticBrowser } = await import('/absolute/path/integration_tests/semantic-browser.mjs');
 * await checkSemanticBrowser(tab);
 * All evaluation is read-only; navigation uses documented CUA controls.
 */
export async function checkSemanticBrowser(tab) {
  const passed = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({ emit: false });
  const choose = async name => {
    await tab.playwright.getByRole('button', { name, exact: true }).click();
    await observe();
  };
  const next = async () => { await tab.playwright.locator('#nextBtn').click(); await observe(); };
  const state = () => tab.playwright.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    return {
      id: slide.id, frame: Number(slide.dataset.activeFrame),
      counter: document.querySelector('#counter').textContent,
      nextDisabled: document.querySelector('#nextBtn').disabled,
      fragments: [...slide.querySelectorAll('.fragment')].map(el => ({
        hidden: el.getAttribute('aria-hidden') === 'true',
        opacity: Number(getComputedStyle(el).opacity),
        visibility: getComputedStyle(el).visibility,
      })),
      highlighted: [...slide.querySelectorAll('.code-line-highlight')].map(el => Number(el.dataset.line)),
      terms: [...slide.querySelectorAll('.equation-term')].map(el => ({
        a: el.classList.contains('term-a'), b: el.classList.contains('term-b'),
        highlight: el.classList.contains('equation-term-highlight'),
        dim: el.classList.contains('equation-term-dim'),
      })),
    };
  });
  await observe();
  await choose('1. A semantic story');
  const initial = await tab.playwright.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    return {
      unique: ids.length === new Set(ids).size,
      title: document.querySelector('.slide.active h2').innerHTML,
      math: document.querySelectorAll('.katex').length,
      mathml: document.querySelectorAll('.katex math').length,
      errors: document.querySelectorAll('.katex-error').length,
      remote: [...document.querySelectorAll('script[src],link[rel="stylesheet"]')]
        .some(el => /^https?:/.test(el.getAttribute('src') || el.getAttribute('href'))),
    };
  });
  assert(initial.unique && initial.title === 'A <em>semantic</em> story', 'Unique DOM IDs and inline title');
  assert(initial.math >= 4 && initial.mathml >= 4 && !initial.errors && !initial.remote, 'Local accessible math');
  await tab.playwright.locator('#slide-1-fnref1').click(); await observe();
  assert((await state()).id === 'story', 'Footnote link stays on first slide');
  await tab.playwright.locator('#story a[href="#slide-1-fnref1"]').click(); await observe();
  passed.push('offline asset URLs, real KaTeX/MathML, inline title, unique IDs and footnote backlink');

  await choose('2. Importance survives a theme change');
  for (const mode of ['light', 'dark']) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await tab.playwright.evaluate(() => document.documentElement.dataset.colorModeChoice);
      if (current === mode) break;
      await tab.playwright.locator('#colorModeBtn').click(); await observe();
    }
    const roles = await tab.playwright.evaluate(() => {
      const slide = document.querySelector('.slide.active');
      const size = selector => Number(getComputedStyle(slide.querySelector(selector)).fontSize.replace('px', ''));
      return { body: size('p'), key: size('div.key'), aside: size('div.aside'), spanKey: size('span.key'), spanAside: size('span.aside'), fitted: slide.classList.contains('htmpres-text-fit-active') };
    });
    assert(roles.fitted && roles.key > roles.body && roles.aside < roles.body, `${mode}: fitted card/callout importance sizes`);
    assert(roles.spanKey > roles.body && roles.spanAside < roles.body, `${mode}: inline importance sizes`);
  }
  passed.push('key/aside spans and fitted blocks in light/dark');

  await choose('3. Code and explanation share one clock');
  assert((await state()).fragments.every(fragment => fragment.hidden), 'Mapped baseline hides explanations');
  for (const [offset, frame] of [1, 3, 7].entries()) {
    await next();
    const current = await state();
    assert(current.frame === frame && current.highlighted.includes(offset + 1) && current.highlighted.includes(4), `Shared code frame ${frame} with persistent line`);
    assert(current.fragments.every((fragment, index) => index <= offset ? !fragment.hidden && fragment.opacity === 1 : fragment.hidden && fragment.visibility === 'hidden'), `Code frame ${frame}: prior text visible, future hidden`);
  }
  await tab.playwright.locator('#prevBtn').click(); await observe();
  assert((await state()).frame === 3 && (await state()).fragments[2].hidden, 'Backward frame restores lanes');
  passed.push('code/text shared sparse frames 1→3→7, persistent highlights and backwards reset');

  await choose('4. Equations use the same clock');
  for (const [offset, frame] of [1, 3, 7].entries()) {
    await next();
    const current = await state();
    assert(current.frame === frame && current.terms.length === 2, `Real equation frame ${frame}`);
    assert(current.terms.every(term => term.highlight === (offset === 2 || (offset === 0 ? term.a : term.b))), `Selected equation terms ${frame}`);
    assert(current.fragments.slice(0, offset + 1).every(fragment => fragment.opacity === 1), 'Equation explanations do not dim');
  }
  passed.push('real classed KaTeX terms synchronize with ordinary text');

  await choose('5. Reveal the story without reading ahead');
  for (let offset = 0; offset < 4; offset++) {
    await next();
    const current = await state();
    assert(current.fragments.every((fragment, index) => index > offset ? fragment.hidden && fragment.visibility === 'hidden' : !fragment.hidden && (index === offset ? fragment.opacity === 1 : fragment.opacity < 1)), `Dim spans/lists frame ${offset + 1}`);
  }
  passed.push('dim spans and column list items hide future points and dim only past points');

  await tab.pressKey(null, 'End'); await observe();
  let current = await state();
  assert(current.id === 'main-result' && current.counter === '6 / 6' && current.nextDisabled, 'End/main counter/Next stop before appendix');
  await tab.playwright.getByRole('link', { name: 'The data', exact: true }).click(); await observe();
  current = await state();
  assert(current.id === 'appendix-data' && current.counter === 'Appendix 1 / 2', 'Named link enters appendix');
  await tab.back(); await observe();
  assert((await state()).id === 'main-result', 'Browser Back returns to main slide');
  await tab.playwright.getByRole('link', { name: 'The data', exact: true }).click(); await observe();
  await tab.playwright.getByRole('link', { name: 'More detail', exact: true }).click(); await observe();
  assert((await state()).counter === 'Appendix 2 / 2', 'Unmarked following slide inherits appendix');
  await tab.playwright.getByRole('link', { name: 'Back to the result', exact: true }).click(); await observe();
  assert((await state()).id === 'main-result', 'Explicit return link');
  passed.push('main boundary, live appendix links, inherited appendix counter and browser history');
  return { ok: true, passed };
}

export async function checkSemanticPresenter(tab) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await tab.getAXState({ emit: false });
  await tab.playwright.getByRole('button', { name: '1. A semantic story', exact: true }).click();
  await tab.getAXState({ emit: false });
  let notes = await tab.playwright.evaluate(() => ({
    math: document.querySelectorAll('#presenterNotes .katex').length,
    firstNote: !!document.querySelector('#notes-1-fn1'),
    bodyNote: !!document.querySelector('#slide-1-fn1'),
    unique: [...document.querySelectorAll('[id]')].length === new Set([...document.querySelectorAll('[id]')].map(el => el.id)).size,
  }));
  assert(notes.math === 1 && notes.firstNote && notes.bodyNote && notes.unique, 'Presenter math and distinct first cue/body footnotes');
  await tab.playwright.getByRole('button', { name: '2. Importance survives a theme change', exact: true }).click();
  await tab.getAXState({ emit: false });
  notes = await tab.playwright.evaluate(() => ({ secondNote: !!document.querySelector('#notes-2-fn1'), firstNote: !!document.querySelector('#notes-1-fn1'), bodyNote: !!document.querySelector('#slide-2-fn1') }));
  assert(notes.secondNote && notes.bodyNote && !notes.firstNote, 'Presenter cue replaces independent namespace');
  await tab.playwright.getByRole('button', { name: '4. Equations use the same clock', exact: true }).click();
  await tab.getAXState({ emit: false });
  const math = await tab.playwright.evaluate(() => ({ count: document.querySelectorAll('#presenterNotes .katex').length, errors: document.querySelectorAll('.katex-error').length }));
  assert(math.count === 1 && !math.errors, 'Dynamically inserted presenter math typesets');
  return { ok: true, passed: ['independent cue/body footnote IDs', 'unique live DOM IDs', 'dynamic note math on navigation'] };
}
