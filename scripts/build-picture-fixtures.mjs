// Disposable CSS coverage from an actual canonical render; no source HTML re-parsing.
// Run just pictures first; serve the printed output root.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { themeAssets } from '../_extensions/htmpres/themes/themes.mjs';
import { themeChoices, themeVariant } from './showcase.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.argv[2]?path.resolve(process.argv[2]):mkdtempSync(path.join(tmpdir(),'htmpres-picture-fixtures-'));
const read=file=>readFileSync(path.join(root,file),'utf8');
const catalog=JSON.parse(read('_extensions/htmpres/themes/catalog.json'));
const options={catalog,templateCss:read('_extensions/htmpres/templates/source.css'),localCss:'',blankCss:execFileSync('quarto',['run','scripts/htmpres.ts','theme','show','blank'],{cwd:root,encoding:'utf8'})};
const canonical={index:read('decks/pictures/index.html'),presenter:read('decks/pictures/presenter.html')};
const cases=[];
for(const theme of themeChoices(catalog))for(const mode of theme.modes){
  const prefix=`decks/${theme.name}/${mode}`;
  mkdirSync(path.join(output,prefix,'assets'),{recursive:true});
  for(const view of ['index','presenter']){
    const file=`${prefix}/${view}.html`;
    writeFileSync(path.join(output,file),themeVariant(canonical[view],{...options,name:theme.name,mode}));
    cases.push({theme:theme.name,mode,view,path:file});
  }
  for(const asset of readdirSync(path.join(root,'decks/pictures/assets')).filter(file=>file.endsWith('.svg')))copyFileSync(path.join(root,'decks/pictures/assets',asset),path.join(output,prefix,'assets',asset));
  for(const asset of themeAssets({light:theme.name,dark:theme.name,mode:'auto'},catalog)){
    const dest=path.join(output,'assets/htmpres-themes',asset);mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(path.join(root,'_extensions/htmpres/themes',asset),dest);
  }
}
cpSync(path.join(root,'decks/pictures/assets/htmpres-math'),path.join(output,'assets/htmpres-math'),{recursive:true});
for(const [source,target]of [['picture-matrix.html','index.html'],['picture-slides-browser.mjs','picture-slides-browser.mjs'],['deck-browser.mjs','deck-browser.mjs']])copyFileSync(path.join(root,'integration_tests',source),path.join(output,target));
writeFileSync(path.join(output,'manifest.json'),JSON.stringify(cases,null,2));
console.log(`Built ${cases.length} theme/mode/view picture cases in ${output}`);
