/** Run in cua_repl: await checkShowcaseBrowser(tab) on a gallery full view.
 * UI actions use CUA; evaluation only observes DOM and computed styles.
 */
import { chooseDeckSlide } from './deck-browser.mjs';
export async function checkShowcaseBrowser(tab) {
  const passed = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({ emit: false });
  const choose = name => chooseDeckSlide(tab,name);
  const next = async () => { await tab.playwright.locator('#nextBtn').click(); await observe(); };
  const state = () => tab.playwright.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    return { id: slide.id, frame: Number(slide.dataset.activeFrame), counter: document.querySelector('#counter').textContent,
      nextDisabled: document.querySelector('#nextBtn').disabled,
      fragments: [...slide.querySelectorAll('.fragment')].map(el => ({ hidden: el.getAttribute('aria-hidden') === 'true', opacity: Number(getComputedStyle(el).opacity), visibility: getComputedStyle(el).visibility })),
      lines: [...slide.querySelectorAll('.code-line-highlight')].map(el => Number(el.dataset.line)),
      terms: [...slide.querySelectorAll('.equation-term')].map(el => ({ a: el.classList.contains('mean'), b: el.classList.contains('total'), c: el.classList.contains('count'), highlighted: el.classList.contains('equation-term-highlight') })) };
  });
  await choose('1. One source for slides and notes');
  assert(await tab.playwright.evaluate(() => document.querySelector('.slide.active h2 em').textContent === 'source'), 'Title emphasis renders as markup');
  await choose('3. Mark main points and qualifications');
  const roles = await tab.playwright.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    const size = selector => Number(getComputedStyle(slide.querySelector(selector)).fontSize.replace('px', ''));
    return { normal: size('p'), key: size('div.key'), aside: size('div.aside'), inlineKey: size('span.key'), inlineAside: size('span.aside'), unique: (() => { const ids = [...document.querySelectorAll('[id]')].map(el => el.id); return ids.length === new Set(ids).size; })() };
  });
  assert(roles.unique && roles.key > roles.normal && roles.aside < roles.normal && roles.inlineKey > roles.normal && roles.inlineAside < roles.normal, 'Importance scale and unique IDs');
  await tab.playwright.locator('#slide-3-fnref1').click(); await observe();
  assert((await state()).id === 'importance', 'Footnote stays on the slide');
  await tab.playwright.locator('#importance a[href="#slide-3-fnref1"]').click(); await observe();
  passed.push('inline title, key/aside spans and blocks, unique IDs, footnote round trip');
  await choose('4. Reveal points one at a time');
  assert((await state()).fragments.every(item => item.hidden), 'Layering hides future points at baseline');
  for (let frame = 1; frame <= 4; frame++) {
    await next();
    assert((await state()).fragments.every((item, i) => i >= frame ? item.hidden && item.visibility === 'hidden' : !item.hidden && (i === frame - 1 ? item.opacity === 1 : item.opacity < 1)), `Span/list dim frame ${frame}`);
  }
  passed.push('dim spans and list items inside columns, no reading ahead');
  for (const [title, lane] of [['5. Reveal code with its explanation', 'code'], ['6. Reveal equation terms with their explanations', 'equation']]) {
    await choose(title);
    assert((await state()).fragments.every(item => item.hidden), `${lane} starts without future explanation`);
    for (const [offset, frame] of [1, 3, 7].entries()) {
      await next(); const current = await state();
      assert(current.frame === frame, `${lane} shared frame ${frame}`);
      assert(current.fragments.every((item, i) => i <= offset ? !item.hidden && item.opacity === 1 : item.hidden && item.visibility === 'hidden'), `${lane} text stays visible as next explanation appears`);
      if (lane === 'code') assert(JSON.stringify(current.lines) === JSON.stringify([offset + 1]), `code line ${offset + 1}`);
      else assert(current.terms.length === 3 && current.terms.every(term => term.highlighted === (offset === 0 ? term.a : offset === 1 ? term.b : term.c)), `equation terms ${frame}`);
    }
    await tab.playwright.locator('#prevBtn').click(); await observe();
    assert((await state()).frame === 3 && (await state()).fragments[2].hidden, `${lane} reverses both lanes`);
    passed.push(`${lane}/text synchronized frames 1→3→7 and reverse navigation`);
  }
  assert(await tab.playwright.evaluate(() => document.querySelectorAll('.katex math').length >= 3 && document.querySelectorAll('.katex-error').length === 0), 'Real accessible KaTeX');
  await tab.pressKey(null, 'End'); await observe();
  let current = await state();
  assert(current.id === 'main-result' && current.counter === '10 / 10' && current.nextDisabled, 'Main talk stops before appendix');
  await tab.playwright.getByRole('link', { name: 'Open the supporting data', exact: true }).click(); await observe();
  assert((await state()).id === 'appendix-data' && (await state()).counter === 'Appendix 1 / 2', 'Live appendix jump and separate counter');
  await tab.playwright.getByRole('link', { name: 'More detail', exact: true }).click(); await observe();
  assert((await state()).id === 'appendix-detail' && (await state()).counter === 'Appendix 2 / 2', 'Trailing appendix inheritance');
  await tab.playwright.getByRole('link', { name: 'Back to the result', exact: true }).click(); await observe();
  assert((await state()).counter === '10 / 10', 'Appendix return');
  passed.push('End/Next/main counter, appendix links/return and trailing inheritance');
  return passed;
}
