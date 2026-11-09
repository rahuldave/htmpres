import { attributionInk, attributionTokens } from '../_extensions/htmpres/themes/attribution.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as renderer from '../_extensions/htmpres/lib/render.mjs';

test('picture credits move to one ordered lane without moving source or literal examples', () => {
  assert.equal(typeof renderer.arrangeSlideCredits, 'function');
  const source = '<div class="ds-full"><img src="image.svg"><p><span class="credit">Image: <a href="#endnotes">A</a></span></p></div><p>Body <em>copy</em>.</p><div class="credit"><p>Second credit</p></div><blockquote><p><span class="source">Quote author</span></p></blockquote><pre><code>&lt;span class="credit"&gt;literal&lt;/span&gt;</code></pre>';
  const result = renderer.arrangeSlideCredits(source);
  assert.match(result, /<div class="ds-full"><img src="image.svg"><\/div>/);
  assert.match(result, /<p>Body <em>copy<\/em>\.<\/p>/);
  assert.match(result, /<blockquote><p><span class="source">Quote author<\/span>/);
  assert.match(result, /<div class="slide-credits" aria-label="Picture credits"><p><span class="credit">Image: <a href="#endnotes">A<\/a><\/span><\/p>\s*<div class="credit"><p>Second credit<\/p><\/div><\/div>$/);
  assert.match(result, /&lt;span class="credit"&gt;literal/);
  assert.equal((result.match(/class="slide-credits"/g)||[]).length, 1);
  assert.equal(renderer.arrangeSlideCredits('<p>No credits.</p>'), '<p>No credits.</p>');
});

test('nested credits stay together and code nodes are not treated as author marks', () => {
  assert.equal(typeof renderer.arrangeSlideCredits, 'function');
  const result=renderer.arrangeSlideCredits('<pre><code><span class="credit">literal</span></code></pre><div class="credit">Outer <span class="credit">Inner</span></div>');
  assert.match(result, /^<pre><code><span class="credit">literal<\/span><\/code><\/pre>/);
  assert.match(result, /<div class="slide-credits"[^>]*><div class="credit">Outer <span class="credit">Inner<\/span><\/div><\/div>$/);
});

test('statement, quote attribution and picture attribution consume semantic theme roles', () => {
  const css=readFileSync(new URL('../_extensions/htmpres/runtime/htmpres-semantic.css',import.meta.url),'utf8');
  for(const role of ['.statement','.credit','.source','.quote']) assert.ok(css.includes(role), role);
  assert.match(css, /--htmpres-importance-4-scale/);
  assert.match(css, /--htmpres-importance-0-scale/);
  assert.match(css, /\.slide-credits/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i);
});

test('credit relocation retains a surrounding Markdown link or emphasis', () => {
  for(const wrapper of ['a href="https://example.test/source"','em','strong']) {
    const name=wrapper.split(' ')[0];
    const source=`<p><${wrapper}><span class="credit">Photo</span></${name}></p>`;
    const result=renderer.arrangeSlideCredits(source);
    assert.equal(result,`\n<div class="slide-credits" aria-label="Picture credits">${source}</div>`);
  }
});

test('attribution colors preserve readable theme ink and repair faint stock foregrounds', () => {
  const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const catalog=JSON.parse(readFileSync(new URL('../_extensions/htmpres/themes/catalog.json',import.meta.url)));
  for(const [name,entry] of Object.entries(catalog.themes)) for(const mode of ['light','dark']) {
    const p=entry.palettes[mode],t=attributionTokens(p);
    const resolve=value=>value==='var(--ink)'?p.ink:value==='var(--htmpres-importance-0-ink)'?p.muted:value;
    for(const key of ['htmpres-credit-ink','htmpres-source-ink']) assert.ok(ratio(resolve(t[key]),p.paper)>=4.5,`${name}/${mode}/${key}`);
    if(ratio(p.ink,p.paper)>=4.8) assert.equal(t['htmpres-credit-ink'],'var(--ink)','Preserve live foundation ink aliases');
  }
  assert.notEqual(attributionInk('#888888','#ffffff'),'#888888','Minty credit requires stronger ink');
});
