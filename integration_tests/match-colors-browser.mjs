/** CUA browser checks against the generated semantic audience or presenter deck. */
import { chooseDeckSlide } from './deck-browser.mjs';
export async function checkMatchColorsBrowser(tab) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({ emit: false });
  const choose = name => chooseDeckSlide(tab,name);
  const next = async () => { await tab.playwright.locator('#nextBtn').click(); await observe(); };
  const snapshot = () => tab.playwright.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    return { frame: slide.dataset.activeFrame, summary: slide.classList.contains('step-summary-active'),
      highlights: slide.querySelectorAll('.code-line-highlight, .equation-term-highlight, .equation-term-dim, .code-line-dim').length,
      fragments: [...slide.querySelectorAll('.fragment')].map(el => ({visible: el.getAttribute('aria-hidden') === 'false', opacity:getComputedStyle(el).opacity})),
      text: [...slide.querySelectorAll('[data-match]')].map(el => ({key:el.dataset.match, color:getComputedStyle(el).color, slot:el.dataset.matchSlot})),
      code: [...slide.querySelectorAll('.code-line')].map(el => ({line:el.dataset.line, slot:el.dataset.matchSlot, color:getComputedStyle(el,'::before').color, number:getComputedStyle(el,'::before').content, backing:getComputedStyle(el,'::before').backgroundColor})),
      terms: [...slide.querySelectorAll('.enclosing[data-match-slot]')].map(el => ({slot:el.dataset.matchSlot,color:getComputedStyle(el).color,opacity:getComputedStyle(el).opacity})),
      mode:document.documentElement.dataset.colorMode,
    };
  });
  const passed = [];
  for (const mode of ['light','dark']) {
    for (let i=0;i<3;i++) {
      if (await tab.playwright.evaluate(() => document.documentElement.dataset.colorModeChoice) === mode) break;
      await tab.playwright.locator('#colorModeBtn').click(); await observe();
    }
    for (const [name, type] of [['3. Code and explanation share one clock','code'],['4. Equations use the same clock','equation']]) {
      await choose('1. A semantic story'); await choose(name);
      assert(!(await snapshot()).summary, 'Summary is opt-in final state, not baseline');
      for (let i=0;i<3;i++) {
        await next();
        const teaching = await snapshot();
        const colored = teaching.text.filter(text => text.slot);
        assert(colored.length === Math.min(i+1, teaching.text.length), `${mode}/${type}: colors begin on the first reveal and accumulate`);
        const parts = type === 'code' ? teaching.code.filter(part => part.slot) : teaching.terms;
        assert(parts.length === colored.length && parts.every(part => colored.some(text => text.slot === part.slot && text.color === part.color)), `${mode}/${type}: teaching source and explanation colors agree`);
        assert(teaching.fragments.slice(i+1).every(fragment => !fragment.visible), 'Future explaining text stays hidden');
      }
      const teaching = await snapshot(); assert(teaching.frame === '7' && !teaching.summary, 'Last teaching highlight remains available');
      if(type==='equation') assert(teaching.terms.length===3 && teaching.terms.filter(term=>Number(term.opacity)<1).length===2, 'Three equation pairs finish on one active term; the overview has two dimmed terms to restore');
      await next();
      const summary = await snapshot();
      assert(summary.summary && summary.frame === 'summary' && !summary.highlights, `${mode}/${type}: final highlight/dimming clears`);
      assert(summary.fragments.every(f=>f.visible && f.opacity === '1'), 'All explaining text remains readable');
      assert(new Set(summary.text.map(t=>t.color)).size === summary.text.length, 'Pairs receive distinct theme colors');
      const source = type === 'code' ? summary.code.filter(c=>c.slot) : summary.terms;
      assert(source.length === summary.text.length && source.every(part=>summary.text.some(text=>text.slot === part.slot && text.color === part.color)), `${mode}/${type}: source and explanation colors agree`);
      if(type==='equation') assert(summary.terms.every(term=>term.opacity==='1'), 'Equation overview visibly restores all three colored terms');
      if(type === 'code') assert(source.every(part=>part.number === `"${part.line}"` && part.backing !== 'rgba(0, 0, 0, 0)'), 'Summary has real visible line numbers on opaque backing');
      await tab.playwright.locator('#prevBtn').click(); await observe();
      const previous = await snapshot(); assert(previous.frame === '7' && !previous.summary && previous.highlights, 'Previous restores the final teaching frame');
      await next();
      await tab.playwright.locator('#prevBtn').click(); await observe();
      // Return from summary, then retreat to the first reveal.
      await tab.playwright.locator('#prevBtn').click(); await observe();
      await tab.playwright.locator('#prevBtn').click(); await observe();
      assert((await snapshot()).text.filter(text=>text.slot).length===1, 'Retreat removes colors for unrevealed groups');
      await choose('1. A semantic story'); await choose(name);
      assert((await snapshot()).text.every(t=>!t.slot) && (await snapshot()).fragments.every(f=>!f.visible), 'Navigation reset clears matching and hides future text');
      passed.push(`${mode} ${type}: final pairs, previous and reset`);
    }
  }
  return passed;
}

/** Run on one retained check-match-syntax.py override case. */
export async function checkDirectMatchColorsBrowser(tab) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({emit:false});
  for (const [mode, expected] of [['light','rgb(36, 92, 136)'],['dark','rgb(145, 201, 240)']]) {
    for(let i=0;i<3;i++) {
      if(await tab.playwright.evaluate(()=>document.documentElement.dataset.colorModeChoice) === mode) break;
      await tab.playwright.locator('#colorModeBtn').click(); await observe();
    }
    for(let i=0;i<5;i++) {
      if(await tab.playwright.evaluate(()=>document.querySelector('.slide.active').classList.contains('step-summary-active'))) break;
      await tab.playwright.locator('#nextBtn').click(); await observe();
    }
    const state = await tab.playwright.evaluate(() => {
      const slide=document.querySelector('.slide.active');
      return {summary:slide.classList.contains('step-summary-active'), values:[...slide.querySelectorAll('[data-match="mean"], .enclosing.mean')].map(el=>getComputedStyle(el).color)};
    });
    assert(state.summary && state.values.length >= 2 && state.values.every(value=>value === expected), `${mode}: named pair uses the documented override`);
  }
  return ['documented light/dark override applied to both term and explanation'];
}
