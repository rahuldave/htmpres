/** Run from CUA on a direct /decks/<theme>/<mode>/index.html fixture.
 * Read-only style inspection; ordinary controls perform navigation and gestures.
 * Narrow screenshots and calibrated projection checks remain separate gates.
 */
export function inspectFoundationView() {
  const slide = document.querySelector('.slide.active');
  const snapshot = element => {
    if (!element) return null;
    const css = getComputedStyle(element), rect = element.getBoundingClientRect();
    return { tag:element.tagName, classes:element.className, fontSize:css.fontSize,
      lineHeight:css.lineHeight, fontFamily:css.fontFamily, fontWeight:css.fontWeight,
      color:css.color, background:css.backgroundColor, backgroundImage:css.backgroundImage,
      padding:css.padding, margin:css.margin, radius:css.borderRadius, shadow:css.boxShadow,
      border:css.border, outline:css.outline, outlineWidth:css.outlineWidth, outlineStyle:css.outlineStyle, opacity:css.opacity,
      x:rect.x,y:rect.y,width:rect.width,height:rect.height };
  };
  return { theme:document.documentElement.dataset.theme, mode:document.documentElement.dataset.colorMode,
    width:innerWidth, slideId:slide.id, slide:snapshot(slide), title:snapshot(slide.querySelector('h2')),
    prose:snapshot(slide.querySelector('p')), unordered:snapshot(slide.querySelector('ul li')),
    ordered:snapshot(slide.querySelector('ol li')), card:snapshot(slide.querySelector('.card')),
    strong:snapshot(slide.querySelector("strong,b")), sectionLabel:snapshot(slide),
    cardProse:snapshot(slide.querySelector('.card p')), callout:snapshot(slide.querySelector('.callout')),
    calloutHeader:snapshot(slide.querySelector('.callout-header')), calloutBody:snapshot(slide.querySelector('.callout-body')),
    pre:snapshot(slide.querySelector('pre')), code:snapshot(slide.querySelector('pre code')),
    codeSpans:Array.from(slide.querySelectorAll('pre code span')).slice(0,8).map(snapshot),
    pseudoLabel: {fontSize:getComputedStyle(slide,'::after').fontSize},
    codeEmphasisWeight:getComputedStyle(document.documentElement).getPropertyValue('--htmpres-code-emphasis-weight').trim(),
    keyword:snapshot(slide.querySelector('code .kw')),
    summaryNumber:slide.querySelector('.code-line') ? {fontWeight:getComputedStyle(slide.querySelector('.code-line'),'::before').fontWeight} : null,
    widgets:Array.from(slide.querySelectorAll('.sample-label,.pill,.control-chip,.action-button')).map(snapshot),
    codeShell:snapshot(slide.querySelector('div.sourceCode')),
    jobs:Object.fromEntries(['selected-fill','selected-ink','disabled-fill','disabled-ink'].map(name=>[name,getComputedStyle(document.documentElement).getPropertyValue('--foundation-'+name).trim()])),
    controls:Array.from(slide.querySelectorAll('button,input,select')).map(element => ({id:element.id,disabled:element.disabled,...snapshot(element)})),
    localOverride:snapshot(slide.querySelector('#local-override')),
    footer:snapshot(document.querySelector('.footer-controls')),
    overflow:{scrollWidth:slide.scrollWidth,clientWidth:slide.clientWidth,scrollHeight:slide.scrollHeight,clientHeight:slide.clientHeight} };
}

export async function checkFoundationBrowser(tab) {
  const observe = () => tab.getAXState({emit:false});
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const choose = async name => { await tab.playwright.getByRole('button',{name,exact:true}).click(); await observe(); };
  await observe();
  await choose('1. Foundation title');
  let initial = await tab.playwright.evaluate(inspectFoundationView);
  if(initial.theme === 'folio') assert(initial.title.fontFamily.includes('Libre Caslon Display'),'Folio title uses display-only Caslon');
  assert(initial.slide.padding === '64px','Desktop canvas inset consumes the profile');
  await choose('2. Primary prose and hierarchy');
  let state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.prose.fontSize === '30px' && state.ordered.fontSize === '30px' && state.unordered.fontSize === '30px','Desktop paragraph and both list jobs');
  assert(state.title.fontSize === '36px' && state.title.lineHeight === '43.2px','Section heading size and leading');
  await choose('3. Flat groups'); state = await tab.playwright.evaluate(inspectFoundationView);
  if(['folio','nocturne'].includes(state.theme)) assert(state.strong.fontWeight === '600','Bundled serif body emphasis');
  assert(state.cardProse.fontSize === '30px' && state.calloutBody.fontSize === '30px','Card/callout body jobs');
  assert(state.card.shadow === 'none' && state.card.backgroundImage === 'none','Flat resting surface');
  if(state.theme === 'tufte') assert(state.card.background === 'rgba(0, 0, 0, 0)' && state.card.border.startsWith('0px') && state.callout.background === 'rgba(0, 0, 0, 0)' && state.callout.border.startsWith('0px'),'Tufte actual group surfaces are unboxed');
  await choose('4. Code and explanation'); state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.pre.fontSize === '30px' && state.code.fontSize === '30px' && state.codeSpans.every(row => row.fontSize === '30px'),'Code profile consumed by actual elements');
  if(state.theme === 'tufte') assert(state.codeShell.background === 'rgba(0, 0, 0, 0)' && state.codeShell.border.startsWith('0px'),'Tufte code shell is unboxed');
  if(state.keyword) assert(+state.keyword.fontWeight === +state.codeEmphasisWeight,'Code keyword uses an available mono weight');
  await choose('5. Controls carry explicit jobs');
  await tab.playwright.locator('#foundation-name').fill('Verified input'); await observe();
  assert(!(await tab.playwright.locator('#foundation-disabled').isEnabled()),'Native disabled behavior');
  await choose('7. Semantic hierarchy and authored CSS'); state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.localOverride.fontSize === '42px','Explicit authored override survives the defaults migration');
  await choose('8. Matched colors remain independent');
  for (let index=0;index<3;index++) { await tab.playwright.locator('#nextBtn').click(); await observe(); }
  const summary = await tab.playwright.evaluate(() => document.querySelector('.slide.active').classList.contains('step-summary-active'));
  assert(summary,'Matched colors preserve their final summary frame');
  state = await tab.playwright.evaluate(inspectFoundationView);
  assert(+state.summaryNumber.fontWeight === +state.codeEmphasisWeight,'Summary line number uses an available mono weight');
  await choose('6. State actions'); state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.controls.every(row=>row.fontSize === '24px' && row.backgroundImage === 'none'),'Semantic controls consume audience jobs without gradients');
  await choose('9. Built-in audience widgets'); state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.widgets.every(row=>row.fontSize === '24px'),'Built-in audience widget jobs');
  assert(state.pseudoLabel.fontSize === '24px','Section pseudo label audience job');
  const selected = state.controls.find(row=>row.id === 'foundation-state-selected');
  const disabled = state.controls.find(row=>row.id === 'foundation-state-disabled-selected');
  const pairs = Object.fromEntries(Object.entries(state.jobs).map(([key,value]) => {
    const hex=value.replace('#','');
    return [key,`rgb(${parseInt(hex.slice(0,2),16)}, ${parseInt(hex.slice(2,4),16)}, ${parseInt(hex.slice(4,6),16)})`];
  }));
  const activeAction=state.widgets.find(row=>row.classes.includes('action-button'));
  assert(activeAction.background === pairs['selected-fill'] && activeAction.color === pairs['selected-ink'],'Active action widget keeps selected pair');
  assert(selected.background === pairs['selected-fill'] && selected.color === pairs['selected-ink'],'Semantic selected action keeps selected pair');
  assert(disabled.background === pairs['disabled-fill'] && disabled.color === pairs['disabled-ink'],'Disabled selected action keeps disabled pair');
  await tab.playwright.locator('.control-chip').click(); await observe();
  await tab.playwright.locator('.control-chip').press('Shift+Tab'); await observe();
  state = await tab.playwright.evaluate(inspectFoundationView);
  assert(state.controls.find(row=>row.id === 'foundation-pill').outlineWidth === '2px' && state.controls.find(row=>row.id === 'foundation-pill').outlineStyle === 'solid','Audience pill retains visible focus');
  return {passed:true, final:await tab.playwright.evaluate(inspectFoundationView)};
}
