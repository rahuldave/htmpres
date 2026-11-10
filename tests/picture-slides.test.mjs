import assert from 'node:assert/strict';
import test from 'node:test';
import * as render from '../_extensions/htmpres/lib/render.mjs';
import { attributionTokens } from '../_extensions/htmpres/themes/attribution.mjs';
import { contrastRatio } from '../_extensions/htmpres/themes/matches.mjs';
import { readFileSync } from 'node:fs';

test('picture classification is shared, structural, and leaves arbitrary content alone',()=>{
  assert.equal(typeof render.slideMediaClasses,'function');
  const classify=render.slideMediaClasses;
  assert.deepEqual(classify('<figure><img src="a.svg" alt="Description"><figcaption>A caption</figcaption></figure><div class="slide-credits">Source</div>'),['htmpres-picture-slide']);
  assert.deepEqual(classify('<div class="ds-media"><figure><a href="large.svg"><img src="a.svg"></a><figcaption>Caption</figcaption></figure></div>'),['htmpres-picture-slide']);
  assert.deepEqual(classify('<p><img src="a.svg" alt=""></p>'),['htmpres-picture-slide']);
  assert.deepEqual(classify('<p><img src="a.svg"><img src="b.svg"></p>'),[]);
  assert.deepEqual(classify('<div class="ds-media"><figure><img src="a.svg"></figure><p>More explanation</p></div>'),[]);
  assert.deepEqual(classify('<p>Text <img src="a.svg"></p>'),[]);
  assert.deepEqual(classify('<figure><img src="a.svg"></figure><p>More explanation</p>'),[]);
  assert.deepEqual(classify('<div class="ds-full ds-media ds-readable"><figure><img alt="Description" src="a.svg"><figcaption>Caption</figcaption></figure></div>'),['htmpres-full-media']);
  assert.deepEqual(classify('<p>Claim</p>',true),['htmpres-full-media']);
  assert.deepEqual(classify('<div class="ds-left ds-media"><img src="a.svg"></div><div class="ds-right"><ul><li>Point</li></ul></div>'),['htmpres-split-media']);
  assert.deepEqual(classify('<div class="ds-left ds-media"><img src="a.svg"></div><ul><li>Explanation</li></ul>'),['htmpres-split-media']);
  assert.deepEqual(classify('<pre><code><div class="ds-full"><img src="a.svg"></div></code></pre>'),[]);
  assert.deepEqual(classify('<p title="example > class=\'ds-full\'">Text</p><!-- <div class="ds-full"> -->'),[]);
});

test('media text and section labels get opaque theme ground and readable ink in every paired mode',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../_extensions/htmpres/themes/catalog.json',import.meta.url)));
  for(const [name,entry]of Object.entries(catalog.themes))for(const mode of ['light','dark']){
    const p=entry.palettes[mode],t=attributionTokens(p);
    assert.equal(t['htmpres-media-text-bg'],'var(--paper)');
    const ink=t['htmpres-media-text-ink']==='var(--ink)'?p.ink:t['htmpres-media-text-ink'];
    assert.ok(ink&&contrastRatio(ink,p.paper)>=4.5,`${name}/${mode} media text contrast`);
    assert.equal(t['htmpres-media-label-bg'],'var(--paper)');
  }
});

test('packaged and project media styles stay identical',()=>{
  assert.equal(readFileSync(new URL('../_extensions/htmpres/runtime/htmpres-media.css',import.meta.url),'utf8'),readFileSync(new URL('../decks/scripts/htmpres-media.css',import.meta.url),'utf8'));
});
