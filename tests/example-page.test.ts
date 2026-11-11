import { slideSources } from "../scripts/showcase.mjs";
import { stepAction, exampleKeyboardAction, exampleCanvas } from "../docs/assets/deck-example.mjs";
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const original = '---\r\ntitle: Example\r\n---\r\n\r\n## A *claim* {#claim}\r\n\r\n````markdown\r\n## Only code\r\n```\r\n````\r\n\r\n::: notes\r\nA cue.\r\n:::\r\n\r\n## Another\r\n\r\nBody.\r\n';
const chunks = slideSources(original);
assert(chunks.length === 2, "Only actual slide headings split source");
assert(chunks[0].markdown + chunks[1].markdown === original.slice(original.indexOf('## A')), "Source chunks preserve every byte including CRLF, notes and attributes");
assert(chunks[0].line === 5 && chunks[1].line === 16, "Source line references are exact");
assert(stepAction(0, 3, 'next') === 1 && stepAction(3, 3, 'next') === 3, "Next is bounded to current slide");
assert(stepAction(1, 3, 'previous') === 0 && stepAction(0, 3, 'previous') === 0, "Previous is bounded");
assert(stepAction(2, 3, 'restart') === 0 && stepAction(0, 0, 'next') === 0, "Restart and slides without steps");
for (const [key, shiftKey, expected] of [['ArrowRight', false, 'next'], [' ', false, 'next'], ['PageDown', false, 'next'], ['ArrowLeft', false, 'previous'], [' ', true, 'previous'], ['Home', false, 'restart']]) {
  assert(exampleKeyboardAction({ key, shiftKey }, false) === expected, `Keyboard ${key}`);
}
for (const event of [{key:' ', ctrlKey:true}, {key:'ArrowRight', metaKey:true}, {key:'ArrowRight', isComposing:true}, {key:'x'}]) assert(exampleKeyboardAction(event, false) === null, "Do not steal modified/composing/other keys");
assert(exampleKeyboardAction({key:' '}, true) === null, "Do not steal input/button/link keys");
console.log('Example page models passed: byte-exact source, bounded steps and keyboard focus.');

// Exercise the preview-only bridge against a tiny real step-state model.
const { themeVariant } = await import('../scripts/showcase.mjs');
const read = (path: string) => Deno.readTextFileSync(new URL(`../${path}`, import.meta.url));
const catalog = JSON.parse(read('_extensions/htmpres/themes/catalog.json'));
const html = themeVariant(read('decks/example/index.html'), { name:'nocturne', mode:'light', catalog,
  templateCss:read('_extensions/htmpres/templates/source.css'), localCss:read('decks/example/source.css'), blankCss:'' });
const headScripts = [...html.slice(0, html.indexOf('<style>')).matchAll(/<script>(.*?)<\/script>/gs)].map(match => match[1]).join('\n');
for (const query of ['', '?compare-slide=1', '?example-slide=1']) {
  const ready = [];
  let paused = 0, removed = 0;
  const automaticMedia = { autoplay:true, pause(){paused++;}, classList:{remove(name){ if(name === 'ds-autoplay') removed++; }} };
  const window = { matchMedia: () => ({ matches:false, addEventListener(){} }), addEventListener(){}, dispatchEvent(){}, htmpresExample:undefined };
  const document = { documentElement:{dataset:{},style:{},classList:{toggle(){}}}, head:{append(){}},
    getElementById:()=>null, querySelector:()=>null, querySelectorAll:()=>[automaticMedia], createElement:()=>({textContent:''}),
    addEventListener:(type, callback)=>{ if(type === 'DOMContentLoaded') ready.push(callback); } };
  new Function('window','document','location', `
    const slides = [{dataset:{activeFrame:'0'}}, {dataset:{activeFrame:'0'}}]; let current = 0;
    const slideStepStates = new Map([[slides[0], {cursor:0,frames:[1,3,7]}], [slides[1], {cursor:0,frames:[]}]]);
    function goTo(index) { current = Math.max(0, Math.min(1, index)); }
    function applySlideStep(slide) { const s=slideStepStates.get(slide); slide.dataset.activeFrame=String(s.cursor ? s.frames[s.cursor-1] : 0); }
    function updateNavigationButtons() {} function scheduleTextFit() {} function scheduleViewportLayout() {}
    ${headScripts}`)(window,document,{search:query,pathname:'/deck/index.html'});
  ready.forEach(run=>run());
  assert(paused === (query.includes('example-slide') ? 1 : 0) && removed === paused,
    'Only the interactive source preview pauses authored autoplay; full and comparison decks retain it');
  const api = window.htmpresExample;
  if (!query.includes('example-slide')) assert(!api, 'Full decks and comparison do not expose the example controls');
  else {
    assert(api.getState().total === 3 && api.getState().cursor === 0, 'Bridge reports graph state');
    assert(api.setState(1,99).frame === 7 && api.getState().cursor === 3, 'Bridge clamps to final reveal');
    assert(api.setState(1,-1).frame === 0, 'Bridge restarts to baseline');
    assert(api.setState(2,3).total === 0 && api.getState().cursor === 0, 'Slides without steps stay bounded');
  }
}
console.log('Example-only bridge passed: shared runtime state, boundaries and full/comparison isolation.');


const mixedBoundaries = '---\npagetitle: Mixed\n---\n\n---\nOpening.\n## Two\nBody.\n---\n## {#third}\nEnd.';
const mixedSources = slideSources(mixedBoundaries);
assert(mixedSources.length === 3 && mixedSources[0].line === 5 && mixedSources[2].markdown.startsWith('---\n## {#third}'), 'Source picker preserves mixed boundaries as one slice per slide');

for (const [view, height] of [['audience', 720], ['presenter', 930]]) {
  const canvas = exampleCanvas(view);
  assert(canvas.width === 1280 && canvas.height === height, 'Virtual desktop slide and optional notes have explicit geometry');
}
const patterns = { themes: [{name:'nocturne',modes:['light','dark']}], slides:['Picture'], deckSet:'patterns' };
const {selection} = await import('../docs/assets/theme-comparison.mjs');
assert(selection('nocturne','dark','presenter',1,patterns).open === '_generated/patterns/nocturne/dark/presenter.html#/1', 'Pattern lab has an independent source and deck root');
let rejectedPath = false;
try { selection('nocturne','light','audience',1,{...patterns,deckSet:'../private'}); } catch { rejectedPath=true; }
assert(rejectedPath, 'Manifest deck root stays within a named generated set');

const syntax = {...patterns,deckSet:'syntax'};
assert(selection('nocturne','light','audience',1,syntax).open === '_generated/syntax/nocturne/light/index.html#/1', 'Syntax lab keeps its own deck paths');
