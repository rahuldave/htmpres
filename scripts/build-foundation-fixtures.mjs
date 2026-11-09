/** Reproducible real renderer output, then the same public variant path as docs. */
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themeVariant } from './showcase.mjs';
import { themeAssets } from '../_extensions/htmpres/themes/themes.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.resolve(process.argv[2] || '/tmp/htmpres-foundation-qa');
const seed = path.join(destination, 'seed'); mkdirSync(seed, {recursive:true});
const read = file => readFileSync(path.join(root,file),'utf8');
const catalog = JSON.parse(read('_extensions/htmpres/themes/catalog.json'));
const localCss = read('decks/tutorial/source.css') + '\n/* Deliberate authored override after unchanged copied defaults. */\n.local-override { font-size:42px; color:var(--ink); }\n';
writeFileSync(path.join(seed,'source.css'), localCss);
writeFileSync(path.join(seed,'index.qmd'), read('integration_tests/foundation-presentation.qmd'));
execFileSync('quarto',['run',path.join(root,'scripts/htmpres.ts'),'render',path.join(seed,'index.qmd')],{cwd:root,stdio:'inherit'});
const templateCss = read('_extensions/htmpres/templates/source.css');
const links = [];
for (const [name, entry] of Object.entries(catalog.themes)) {
  if (!entry.foundation) continue;
  for (const mode of ['light','dark']) {
    const folder = path.join(destination,'decks',name,mode); mkdirSync(folder,{recursive:true});
    for (const view of ['index','presenter']) {
      const html = readFileSync(path.join(seed,view+'.html'),'utf8');
      writeFileSync(path.join(folder,view+'.html'),themeVariant(html,{name,mode,catalog,templateCss,localCss,blankCss:''}));
    }
    for (const asset of themeAssets({light:name,dark:name,mode},catalog)) {
      const target = path.join(destination,'assets/htmpres-themes',asset); mkdirSync(path.dirname(target),{recursive:true});
      cpSync(path.join(root,'_extensions/htmpres/themes',asset),target);
    }
    links.push(`<li><a href="decks/${name}/${mode}/index.html">${name} ${mode}</a></li>`);
  }
}
const clone = path.join(destination,'clone'); mkdirSync(clone,{recursive:true});
writeFileSync(path.join(clone,'source.css'),localCss);
writeFileSync(path.join(clone,'index.qmd'),read('integration_tests/foundation-presentation.qmd').replace('theme: nocturne','theme: my-folio'));
for (const args of [['theme','add',path.join(clone,'index.qmd'),'my-folio','--from','folio'],['render',path.join(clone,'index.qmd')]]) execFileSync('quarto',['run',path.join(root,'scripts/htmpres.ts'),...args],{cwd:root,stdio:'inherit'});
links.push('<li><a href="clone/index.html">Owned Folio clone (public theme add)</a></li>');
cpSync(path.join(root,'_extensions/htmpres/vendor/katex'),path.join(destination,'assets/htmpres-math'),{recursive:true});
writeFileSync(path.join(destination,'index.html'),`<!doctype html><title>Foundation acceptance</title><h1>Nine themes × two modes</h1><ul>${links.join('')}</ul>`);
console.log(`Foundation fixtures: ${destination}/index.html`);
