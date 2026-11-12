import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,writeFileSync,readFileSync,copyFileSync,mkdirSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('real Deno and Node renders classify figures and preserve descriptions in both views',()=>{
  const scratch=mkdtempSync(path.join(tmpdir(),'htmpres-pictures-'));
  try{
    for(const theme of ['nocturne','flatly','sage']){
      const dir=path.join(scratch,theme);mkdirSync(path.join(dir,'assets'),{recursive:true});
      copyFileSync(path.join(root,'decks/pictures/assets/photo.svg'),path.join(dir,'assets/photo.svg'));
      if(theme==='sage')copyFileSync(path.join(root,'_extensions/htmpres/templates/source.css'),path.join(dir,'source.css'));
      const file=path.join(dir,'slides.qmd');
      writeFileSync(file,`---\ndeck:\n  theme: ${theme}\n${theme==='sage'?'':'  color-mode: light\n'}---\n## A titled image\n\n![A useful description](assets/photo.svg){.ds-fit}\n\n[Photograph source]{.credit}\n\n## Full\n\n::: {.ds-full .ds-media .ds-readable}\n![Full picture description](assets/photo.svg){.ds-fill}\n:::\n\n::: {.ds-layer}\n[The point]{.key}\n:::\n\n## Background {data-background-image="assets/photo.svg"}\n\n[The point]{.key}\n\n::: {.ds-panel}\n[Panel point]{.key}\n:::\n\n## Whole-slide panels {.ds-panel data-background-image="assets/photo.svg"}\n\n[All text boxes have panels]{.key}\n`);
      for(const command of [['quarto',['run','scripts/htmpres.ts','render',file]],['node',['scripts/qmd-to-html.mjs',file]]]){
        execFileSync(command[0],command[1],{cwd:root,stdio:'pipe'});
        for(const view of ['index','presenter']){
          const html=readFileSync(path.join(dir,view+'.html'),'utf8');
          assert.match(html,/<section class="slide active htmpres-picture-slide"/);
          assert.equal((html.match(/<section class="slide(?: ds-panel)? htmpres-full-media"/g)||[]).length,3);
          assert.match(html,/<img[^>]*alt="A useful description"/);
          assert.match(html,/<img[^>]*alt="Full picture description"/);
          assert.match(html,/<figcaption[^>]*>A useful description<\/figcaption>/);
          assert.match(html,/\.slide \.ds-full figcaption \{ display: none; \}/);
          assert.match(html,/htmpres-media-text-bg/);
          assert.match(html,/<div class="ds-layer">/);
          assert.match(html,/<div class="ds-panel">/);
          assert.match(html,/<section class="slide ds-panel htmpres-full-media"/);
          assert.match(html,/<div class="slide-credits"/);
        }
      }
    }
  }finally{rmSync(scratch,{recursive:true,force:true});}
});
