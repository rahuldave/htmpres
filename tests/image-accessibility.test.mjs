import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync,spawnSync} from 'node:child_process';
import {lintDeckSource} from '../_extensions/htmpres/lib/images.mjs';
import {normalizeImageAlts,imageAltFailures} from '../_extensions/htmpres/lib/render.mjs';
const parse=source=>JSON.parse(execFileSync('quarto',['pandoc','-f','markdown+native_divs+native_spans+fenced_divs+raw_html','-t','json'],{input:source,encoding:'utf8'}));
const lint=source=>lintDeckSource(source,'slides.qmd',parse);
test('image lint uses parsed Markdown, names the slide and rejects empty descriptions',async()=>{
 const d=await lint('## First {#first}\n![Useful](one.svg)\n\n## Empty {#empty}\n![](two.svg)\n');
 assert.equal(d.length,1);assert.equal(d[0].code,'image-description');assert.equal(d[0].severity,'error');
 assert.equal(d[0].line,4);assert.equal(d[0].column,1);assert.equal(d[0].slide,2);assert.equal(d[0].slideId,'empty');
 assert.equal(d[0].message,'Slide 2 (Empty): describe this picture, or mark a purely decorative picture with {.decorative}.');
});
test('image lint includes references, linked images, raw HTML, multiline and notes',async()=>{
 for(const image of ['![](x.svg)','![  ](x.svg)','![][photo]\n\n[photo]: x.svg "Not an alt"','[![](x.svg)](large.svg)','<img src="x.svg">','<img src="x.svg" alt="  ">', '<img src="x.svg" alt="&#32;">', '<img src="x.svg" alt="&Tab;&NewLine;&#x20;">','<img\n src="x.svg" title="a > b" alt="">','::: notes\n![](x.svg)\n:::']){
  const d=await lint('## A slide\r\n'+image.replace(/\n/g,'\r\n'));assert.equal(d.length,1,image);assert.equal(d[0].code,'image-description',image);
 }
});
test('image lint ignores code, comments, escaped syntax and accepts descriptions or explicit decoration',async()=>{
 for(const image of ['![Useful *description*](x.svg)', '!['+String.fromCharCode(34)+'A queue'+String.fromCharCode(34)+'](x.svg)', "!['A queue'](x.svg)", '![[@doe2020]](x.svg)','![Useful][photo]\n\n[photo]: x.svg','![](x.svg){.decorative}','<img src="x.svg" class="decorative">','<img src="x.svg" alt="Useful &amp; exact">','`![](x.svg)`','\\![](x.svg)','<!-- ![](x.svg) -->','```markdown\n![](x.svg)\n```','Intro.\n\n    ![](x.svg)'])assert.deepEqual(await lint('## A slide\n'+image),[],image);
});
test('all actual images gain alt, preserve descriptions, and decoration is intentionally silent',()=>{
 const html='<p><img src="a.svg"><img alt="A &amp; B" src="b.svg"><img class="decorative" src="c.svg"></p><script>"<img src=x>"</script><!-- <img> --><pre><code>&lt;img&gt;</code></pre>';
 const out=normalizeImageAlts(html);assert.match(out,/<img src="a.svg" alt="">/);assert.match(out,/<img alt="A &amp; B" src="b.svg">/);assert.match(out,/<img class="decorative" src="c.svg" alt="">/);assert.match(out,/<script>"<img src=x>"<\/script>/);
 for(const html of ['<img class="decorative" alt="unused">', "<img class='decorative' alt='unused'>", '<img class=decorative alt=unused>']) { const normalized=normalizeImageAlts(html); assert.match(normalized,/\balt=(["'])\1/); assert.deepEqual(imageAltFailures(normalized),[]); }
 assert.equal(normalizeImageAlts(out),out);assert.equal(imageAltFailures('<img src="x">').length,1);assert.equal(imageAltFailures(out).length,1);
 assert.deepEqual(imageAltFailures('<div aria-hidden="true"><img alt="" src="x"></div><img alt="" class="decorative">'),[]);
});

test('both CLI paths reject missing descriptions and verify mutated alt, including notes',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'htmpres-image-alt-')),file=path.join(dir,'slides.qmd');
 const run=(program,args)=>spawnSync(program,args,{encoding:'utf8'});
 const renderers=[['quarto',['run','scripts/htmpres.ts']],['node',['scripts/qmd-to-html.mjs']]];
 try{
  for(const [program,prefix] of renderers){
   writeFileSync(file,'## Empty {#empty}\n![](photo.svg)\n');
   const l=run(program,[...prefix,'lint',file,'--json']);assert.notEqual(l.status,0);const report=JSON.parse(l.stdout);assert.equal(report.version,1);assert.equal(report.ok,false);assert.equal(report.diagnostics[0].severity,'error');
   const r=run(program,[...prefix,...(program==='quarto'?['render']:[]),file]);assert.notEqual(r.status,0);assert.match(r.stdout+r.stderr,/image-description/);
   writeFileSync(file,'---\ndeck:\n  theme: nocturne\n---\n## ![Title description](photo.svg)\n\n![Exact & useful](photo.svg)\n\n![](photo.svg){.decorative}\n\n::: notes\n![Speaker cue description](photo.svg)\n\n<img class="decorative" src="photo.svg">\n:::\n');
   const good=run(program,[...prefix,...(program==='quarto'?['render']:[]),file]);assert.equal(good.status,0,good.stdout+good.stderr);
   for(const view of ['index','presenter']){
    const html=readFileSync(path.join(dir,view+'.html'),'utf8');assert.deepEqual(imageAltFailures(html),[]);
    if(view==='index')continue;
    const notes=JSON.parse(/<script id="deckNotes" type="application\/json">([\s\S]*?)<\/script>/.exec(html)[1]);assert.deepEqual(notes.flatMap(imageAltFailures),[]);assert.match(notes[0],/alt="Speaker cue description"/);
   }
  }
  execFileSync('quarto',['run','scripts/htmpres.ts','workspace','init',dir],{stdio:'pipe'});
  execFileSync('quarto',['run',path.join(dir,'_extensions/htmpres/htmpres.ts'),'render',file],{cwd:dir,stdio:'pipe'});
  assert.deepEqual(imageAltFailures(readFileSync(path.join(dir,'presenter.html'),'utf8')),[]);
  const verifiers=[['quarto',['run','scripts/htmpres.ts','verify']],['node',['scripts/verify-roundtrip.mjs']]];
  for(const [program,prefix]of verifiers){const v=run(program,[...prefix,file]);assert.equal(v.status,0,v.stdout+v.stderr);}
  const output=path.join(dir,'index.html'),valid=readFileSync(output,'utf8');writeFileSync(output,valid.replace('alt="Exact &amp; useful"',''));
  for(const [program,prefix]of verifiers){const v=run(program,[...prefix,file]);assert.notEqual(v.status,0);assert.match(v.stdout+v.stderr,/missing its alt attribute/);}
  writeFileSync(output,valid);
  const presenter=path.join(dir,'presenter.html');writeFileSync(presenter,readFileSync(presenter,'utf8').replace('Speaker cue description',''));
  for(const [program,prefix]of verifiers){const v=run(program,[...prefix,file]);assert.notEqual(v.status,0);assert.match(v.stdout+v.stderr,/empty description/);}
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Node lint and verify retain the HTML renderer budget for large data-URI images',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'htmpres-image-large-')),file=path.join(dir,'slides.qmd');
 try{
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'+ ' '.repeat(1100000)+'</svg>';
  writeFileSync(file,'---\ndeck:\n  theme: nocturne\n---\n## A large embedded image\n\n![A described embedded SVG](data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+')\n');
  for(const args of [['scripts/qmd-to-html.mjs','lint',file,'--json'],['scripts/qmd-to-html.mjs',file],['scripts/verify-roundtrip.mjs',file]]){
   const r=spawnSync('node',args,{encoding:'utf8',maxBuffer:256*1024*1024});assert.equal(r.status,0,r.stderr+r.stdout);
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('reference definitions do not leak between audience and presenter-note Markdown runs',async()=>{
 assert.deepEqual(await lint('## Separate surfaces\n![][only-notes]\n\n::: notes\n[only-notes]: x.svg\n:::'),[]);
});
