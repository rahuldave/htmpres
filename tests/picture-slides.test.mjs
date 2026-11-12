import assert from 'node:assert/strict';
import test from 'node:test';
import * as render from '../_extensions/htmpres/lib/render.mjs';
import { attributionTokens } from '../_extensions/htmpres/themes/attribution.mjs';
import { contrastRatio } from '../_extensions/htmpres/themes/matches.mjs';
import { readFileSync } from 'node:fs';
import { mediaTextFailures } from '../integration_tests/media-panels-browser.mjs';

test('browser backing checks distinguish transparent defaults, explicit panels and unreadable list ink',()=>{
  const box={tag:'DIV',panel:false,ground:'rgba(0, 0, 0, 0)',ink:'rgb(0, 0, 0)',emphasis:[]};
  assert.deepEqual(mediaTextFailures([box]),[]);
  assert.match(mediaTextFailures([{...box,ground:'rgb(255, 255, 255)'}])[0],/default picture text must be transparent/);
  assert.deepEqual(mediaTextFailures([{...box,panel:true,ground:'rgb(255, 255, 255)'}]),[]);
  assert.match(mediaTextFailures([{...box,panel:true,ground:'rgb(255, 255, 255)',emphasis:['rgb(166, 166, 166)']}])[0],/readable theme colors/);
  assert.match(mediaTextFailures([{...box,panel:true}])[0],/opaque readable theme colors/);
});

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

test('opt-in media panels and section labels get readable theme colors in every paired mode',()=>{
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
