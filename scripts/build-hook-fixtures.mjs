// Build disposable, audience-scale hook fixtures. Run `just authoring-hooks` first.
// Optional --foundations points at a separate adoption checkout, read-only.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { themeAssets } from '../_extensions/htmpres/themes/themes.mjs';
import { themeChoices, themeVariant } from './showcase.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||'/tmp/htmpres-hook-fixtures');
const foundationIndex=process.argv.indexOf('--foundations');
const foundationRoot=foundationIndex<0?null:path.resolve(process.argv[foundationIndex+1]);
const read=file=>readFileSync(path.join(root,file),'utf8');
const catalog=JSON.parse(read('_extensions/htmpres/themes/catalog.json'));
const canonical={index:read('decks/authoring-hooks/index.html'),presenter:read('decks/authoring-hooks/presenter.html')};
const options={catalog,templateCss:read('_extensions/htmpres/templates/source.css'),localCss:'',blankCss:execFileSync('quarto',['run','scripts/htmpres.ts','theme','show','blank'],{cwd:root,encoding:'utf8'})};
function write(file,text){const target=path.join(output,file);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,text);}
function copy(from,file){const target=path.join(output,file);mkdirSync(path.dirname(target),{recursive:true});copyFileSync(from,target);}
const cases=[];
for(const theme of themeChoices(catalog)) for(const mode of theme.modes) {
  const prefix=`decks/${theme.name}/${mode}`;
  for(const view of ['index','presenter']) write(`${prefix}/${view}.html`,themeVariant(canonical[view],{...options,name:theme.name,mode}));
  copy(path.join(root,'decks/authoring-hooks/assets/two-views.svg'),`${prefix}/assets/two-views.svg`);
  cases.push({theme:theme.name,mode,path:`${prefix}/index.html`});
  for(const asset of themeAssets({light:theme.name,dark:theme.name,mode:'auto'},catalog)) copy(path.join(root,'_extensions/htmpres/themes',asset),`assets/htmpres-themes/${asset}`);
}
if(foundationRoot){
  const foundationCatalog=JSON.parse(readFileSync(path.join(foundationRoot,'_extensions/htmpres/themes/catalog.json'),'utf8'));
  const {foundationTokens,foundationStyles}=await import(pathToFileURL(path.join(foundationRoot,'_extensions/htmpres/themes/foundations.mjs')));
  for(const [name,entry] of Object.entries(foundationCatalog.themes).filter(([,entry])=>entry.foundation)) for(const mode of ['light','dark']) {
    const selector=`html[data-theme="${name}"][data-color-mode="${mode}"]`;
    const tokens=foundationTokens(entry,mode);
    // The real adopter upgrades component defaults. Pin the same token aliases
    // explicitly here so this isolated compatibility fixture tests semantic hooks.
    for(const [key,value] of Object.entries({...tokens})) if(key.startsWith('foundation-default-')) tokens[key.slice('foundation-default-'.length)]=value;
    const css=`${entry.fontCss||''}\n${selector}{${Object.entries(tokens).map(([k,v])=>`--${k}:${v};`).join('')}}\n${foundationStyles(selector,entry)}`.replaceAll('assets/htmpres-themes/','../../../assets/htmpres-themes/');
    const prefix=`decks/foundation-${name}/${mode}`;
    for(const view of ['index','presenter']) write(`${prefix}/${view}.html`,themeVariant(canonical[view],{...options,name,mode}).replace('</head>',`<style>${css}</style></head>`));
    copy(path.join(root,'decks/authoring-hooks/assets/two-views.svg'),`${prefix}/assets/two-views.svg`);
    for(const asset of entry.assets) copy(path.join(foundationRoot,'_extensions/htmpres/themes',asset),`assets/htmpres-themes/${asset}`);
    cases.push({theme:`foundation-${name}`,mode,path:`${prefix}/index.html`});
  }
}
// A real 520px iframe exercises the mobile media query without resizing the host app.
// It reports read-only geometry into visible output, after fonts/layout settle.
for(const mode of ['light','dark']) for(const view of ['index','presenter']) {
  const src=`decks/nocturne/${mode}/${view}.html#/3`;
  write(`narrow-${mode}-${view}.html`,`<!doctype html><html><head><meta charset="utf-8"><title>Narrow credit check</title></head><body><h1>Narrow credit check: ${mode}, ${view}</h1><iframe title="520px presentation" src="${src}" width="520" height="900"></iframe><pre id="report" aria-live="polite">Loading layout…</pre><script>
  const frame=document.querySelector('iframe');frame.addEventListener('load',async()=>{const doc=frame.contentDocument;await doc.fonts.ready;await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(()=>frame.contentWindow.requestAnimationFrame(resolve)));const s=doc.querySelector('.slide.active'),lane=s.querySelector('.slide-credits'),rect=e=>e.getBoundingClientRect().toJSON();document.querySelector('#report').textContent=JSON.stringify({width:frame.contentWindow.innerWidth,slide:rect(s),lane:rect(lane),footer:rect(doc.querySelector('.footer-controls')),content:[...s.querySelectorAll(':scope > h2,:scope > .card')].map(rect),scroll:s.scrollHeight-s.clientHeight,position:frame.contentWindow.getComputedStyle(lane).position},null,2);});
  </script></body></html>`);
}
write('manifest.json',JSON.stringify(cases,null,2));
console.log(`Built ${cases.length} mode/theme hook fixtures in ${output}`);
