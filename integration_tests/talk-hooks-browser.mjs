/** Run using CUA against decks/authoring-hooks/index.html or presenter.html. */
import { chooseDeckSlide } from './deck-browser.mjs';
export async function checkTalkHooksBrowser(tab, { expectShrink = false } = {}) {
  const assert=(value,message)=>{if(!value) throw new Error(message);};
  const observe=()=>tab.getAXState({emit:false});
  const choose=name=>chooseDeckSlide(tab,name);
  const passed=[];
  for(const mode of ['light','dark']) {
    for(let i=0;i<3;i++) {
      if(await tab.playwright.evaluate(()=>document.documentElement.dataset.colorModeChoice)===mode) break;
      await tab.playwright.locator('#colorModeBtn').click();await observe();
    }
    await choose('1. A statement');
    let state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),b=s.querySelector('.statement'),r=b.getBoundingClientRect(),a=s.getBoundingClientRect(),css=getComputedStyle(s),scale=a.height/s.offsetHeight;return {heading:!!s.querySelector('h2'),size:Number.parseFloat(getComputedStyle(b).fontSize),align:css.textAlign,center:Math.abs((r.top+r.bottom)-(a.top+a.bottom+(Number.parseFloat(css.paddingTop)-Number.parseFloat(css.paddingBottom))*scale))/2,scale:s.dataset.textFitScale,overflow:s.scrollHeight-s.clientHeight};});
    assert(!state.heading && state.align==='center' && state.center<4 && state.overflow<=4,`${mode}: solo statement deliberately centered and fits`);
    await choose('2. Importance in context');
    state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),size=e=>Number.parseFloat(getComputedStyle(e).fontSize);return {body:size(s.querySelector('p')),statement:size(s.querySelector('.statement')),key:size(s.querySelector('.key')),aside:size(s.querySelector('.aside')),source:size(s.querySelector('.source')),weight:getComputedStyle(s.querySelector('.statement')).fontWeight};});
    assert(state.statement>state.key && state.key>state.body && state.aside<state.body && state.source<=state.aside && +state.weight>=600,`${mode}: role hierarchy and available statement weight`);
    await choose('3. A picture with attribution');
    state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),lane=s.querySelector('.slide-credits'),credit=lane.querySelector('.credit'),label=getComputedStyle(s,'::after');return {slide:s.getBoundingClientRect().toJSON(),lane:lane.getBoundingClientRect().toJSON(),content:[...s.querySelectorAll(':scope > h2,:scope > .card')].map(e=>e.getBoundingClientRect().toJSON()),credits:[...lane.querySelectorAll('.credit')].filter(el=>!el.parentElement.closest('.credit')).length,foreground:getComputedStyle(credit).color,background:getComputedStyle(credit).backgroundColor,position:getComputedStyle(lane).position,labelBottom:Number.parseFloat(label.bottom),labelSize:Number.parseFloat(label.fontSize),logicalHeight:lane.offsetHeight,scale:s.getBoundingClientRect().width/s.offsetWidth,footer:document.querySelector('.footer-controls').getBoundingClientRect().toJSON()};});
    assert(state.position==='absolute' && state.credits===2 && state.lane.bottom<=state.slide.bottom && state.lane.right<=state.slide.right && state.lane.top>=state.slide.top,`${mode}: credit span/link and block share contained lower-right lane`);
    assert(state.lane.bottom>state.slide.top+state.slide.height*.75,`${mode}: credit is at slide bottom`);
    assert(state.content.every(r=>r.bottom<=state.lane.top),`${mode}: credit does not cover body or title`);
    assert(state.labelBottom>state.logicalHeight+24,`${mode}: section label has separate reserved lane`);
    assert(state.footer.top>=state.lane.bottom,`${mode}: footer controls stay clear`);
    const rgb=v=>v.match(/[\d.]+/g).slice(0,3).map(Number),lum=v=>rgb(v).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const fg=lum(state.foreground),bg=lum(state.background);
    assert(state.background!=='rgba(0, 0, 0, 0)' && (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5,`${mode}: opaque readable picture credit`);
    await choose('4. A quotation and its source');
    state=await tab.playwright.evaluate(()=>{const q=document.querySelector('.slide.active blockquote'),style=e=>getComputedStyle(e);return {quote:Number.parseFloat(style(q).fontSize),key:Number.parseFloat(style(q.querySelector('.key')).fontSize),source:Number.parseFloat(style(q.querySelector('.source')).fontSize),sourceAlign:style(q.querySelector('.source').parentElement).textAlign};});
    assert(state.key>state.quote && state.source<state.quote && state.sourceAlign==='right',`${mode}: quote emphasizes key and separates source`);
    await choose('5. A fitted statement');
    state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),css=getComputedStyle(s),content=s.querySelector('.statement');return {scale:Number(s.dataset.textFitScale),minimum:Number.parseFloat(s.dataset.textFitMin||document.documentElement.dataset.textFitMin||css.getPropertyValue('--htmpres-text-fit-min'))||.62,overflow:s.scrollHeight-s.clientHeight,scrollable:['auto','scroll'].includes(css.overflowY),topReachable:content.getBoundingClientRect().top>=s.getBoundingClientRect().top-2};});
    assert(state.overflow<=4 || (state.scale<=state.minimum+.002 && state.scrollable && state.topReachable),`${mode}: statement fits or preserves reachable scrolling at its protected floor`);
    assert(!expectShrink || state.scale<1,`${mode}: constrained fixture actually shrinks`);
    passed.push(`${mode}: statement/span/block/fit, full-picture credits, quote/key/source`);
  }
  return passed;
}

/** Center short statements; keep both ends reachable after minimum-fit overflow. */
export async function checkStatementReachabilityBrowser(tab, { expectShrink = false } = {}) {
  const assert=(value,message)=>{if(!value) throw new Error(message);};
  const observe=()=>tab.getAXState({emit:false});
  const choose=name=>chooseDeckSlide(tab,name);
  const snapshot=()=>tab.playwright.evaluate(()=>{
    const s=document.querySelector('.slide.active'),b=s.querySelector('.statement'),r=s.getBoundingClientRect(),css=getComputedStyle(s);
    return {slide:r.toJSON(),block:b.getBoundingClientRect().toJSON(),contentCenter:(r.top+r.bottom+(Number.parseFloat(css.paddingTop)-Number.parseFloat(css.paddingBottom))*r.height/s.offsetHeight)/2,
      overflow:s.scrollHeight-s.clientHeight,scrollTop:s.scrollTop,overflowY:getComputedStyle(s).overflowY,
      scale:Number(s.dataset.textFitScale),minimum:Number.parseFloat(s.dataset.textFitMin||document.documentElement.dataset.textFitMin||getComputedStyle(s).getPropertyValue('--htmpres-text-fit-min'))||.62};
  });
  const passed=[];
  for(const mode of ['light','dark']) {
    for(let i=0;i<3;i++) {
      if(await tab.playwright.evaluate(()=>document.documentElement.dataset.colorModeChoice)===mode) break;
      await tab.playwright.locator('#colorModeBtn').click();await observe();
    }
    await choose('1. A statement');
    let state=await snapshot();
    assert(Math.abs((state.block.top+state.block.bottom)/2-state.contentCenter)<4,`${mode}: short statement stays centered within the slide's content area`);
    await choose('5. A fitted statement');state=await snapshot();
    assert(state.scale>0 && state.scale<=1 && state.block.top>=state.slide.top,`${mode}: fitted statement starts inside the reachable scrollport`);
    assert(!expectShrink || state.scale<1,`${mode}: constrained fixture actually shrinks`);
    if(state.overflow>4) {
      assert(state.scale<=state.minimum+.002 && /auto|scroll/.test(state.overflowY),`${mode}: excess copy uses the documented minimum-fit scroll fallback`);
      await tab.scroll([state.slide.left+state.slide.width/2,state.slide.top+state.slide.height/2],'down',8);await observe();
      state=await snapshot();
      assert(state.scrollTop>0 && state.block.bottom<=state.slide.bottom+4,`${mode}: scrolling reaches the end of the statement`);
    }
    passed.push(`${mode}: centered short statement and reachable fitted copy`);
  }
  return passed;
}

/** Counter policy is retained while main/appendix counts continue to update. */
export async function checkCounterBrowser(tab) {
  const assert=(value,message)=>{if(!value) throw new Error(message);};
  const observe=()=>tab.getAXState({emit:false});
  const snapshot=()=>tab.playwright.evaluate(()=>{const c=document.querySelector('#counter');return {policy:document.documentElement.dataset.counter,presenter:document.body.classList.contains('presenter-mode'),hidden:c.hidden,display:getComputedStyle(c).display,text:c.textContent};});
  const passed=[];
  for(const mode of ['light','dark']) {
    for(let i=0;i<3;i++) {
      if(await tab.playwright.evaluate(()=>document.documentElement.dataset.colorModeChoice)===mode) break;
      await tab.playwright.locator('#colorModeBtn').click();await observe();
    }
    for(const [button,expected] of [['5. A fitted statement','5 / 5'],['A1. Source record','Appendix 1 / 1'],['1. A statement','1 / 5']]) {
      await chooseDeckSlide(tab,button);
      const state=await snapshot(),hidden=state.policy==='false'||(state.policy==='presenter'&&!state.presenter);
      assert(state.hidden===hidden && (state.display==='none')===hidden,`${mode}: policy controls actual counter visibility`);
      assert(state.text===expected,`${mode}: main/appendix counting remains correct`);
    }
    passed.push(`${mode}: counter policy and appendix count`);
  }
  return passed;
}

/** A supplied batch of prebuilt theme/mode variants, including optional foundation snapshots. */
export async function checkHookCatalog(tab, base, cases) {
  const passed=[];
  for(const item of cases) {
    await tab.goto(`${base}/${item.path}`); await tab.getAXState({emit:false});
    let state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),b=s.querySelector('.statement');return {heading:!!s.querySelector('h2'),display:getComputedStyle(s).display,align:getComputedStyle(s).textAlign,size:Number.parseFloat(getComputedStyle(b).fontSize),height:s.scrollHeight-s.clientHeight};});
    if(state.heading||state.display!=='flex'||state.align!=='center'||state.height>4) throw new Error(`${item.theme}/${item.mode}: statement layout ${JSON.stringify(state)}`);
    await chooseDeckSlide(tab,'2. Importance in context');
    state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),size=selector=>Number.parseFloat(getComputedStyle(s.querySelector(selector)).fontSize);return {body:size('p'),statement:size('.statement'),key:size('.key'),source:size('.source')};});
    if(!(state.statement>state.key&&state.key>state.body&&state.source<state.body)) throw new Error(`${item.theme}/${item.mode}: hierarchy ${JSON.stringify(state)}`);
    await chooseDeckSlide(tab,'3. A picture with attribution');
    state=await tab.playwright.evaluate(()=>{const s=document.querySelector('.slide.active'),lane=s.querySelector('.slide-credits'),r=lane.getBoundingClientRect(),credit=lane.querySelector('.credit');return {position:getComputedStyle(lane).position,contained:r.bottom<=s.getBoundingClientRect().bottom+1,clear:[...s.querySelectorAll(':scope > h2,:scope > .card')].every(e=>e.getBoundingClientRect().bottom<=r.top),foreground:getComputedStyle(credit).color,background:getComputedStyle(credit).backgroundColor};});
    if(state.position!=='absolute'||!state.contained||!state.clear||state.background==='rgba(0, 0, 0, 0)') throw new Error(`${item.theme}/${item.mode}: credit geometry ${JSON.stringify(state)}`);
    const lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
    const f=lum(state.foreground),b=lum(state.background);
    if((Math.max(f,b)+.05)/(Math.min(f,b)+.05)<4.5) throw new Error(`${item.theme}/${item.mode}: credit contrast`);
    await chooseDeckSlide(tab,'4. A quotation and its source');
    state=await tab.playwright.evaluate(()=>{const q=document.querySelector('.slide.active blockquote'),size=e=>Number.parseFloat(getComputedStyle(e).fontSize);return {quote:size(q),key:size(q.querySelector('.key')),source:size(q.querySelector('.source'))};});
    if(!(state.key>state.quote&&state.source<state.quote)) throw new Error(`${item.theme}/${item.mode}: quote hierarchy`);
    passed.push(`${item.theme}/${item.mode}`);
  }
  return passed;
}
