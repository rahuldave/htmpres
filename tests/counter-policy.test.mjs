import test from 'node:test';
import assert from 'node:assert/strict';
import * as source from '../_extensions/htmpres/lib/source.mjs';
import * as render from '../_extensions/htmpres/lib/render.mjs';

test('counter policy has an explicit default, both views and stable YAML diagnostics', () => {
  assert.equal(typeof source.deckCounter, 'function');
  for(const [raw,expected] of [[undefined,'true'],['true','true'],['false','false'],['presenter','presenter'],['"presenter" # speaker only','presenter']]) {
    const text=`---\npagetitle: Counter\n${raw===undefined?'':`deck:\n  counter: ${raw}\n`}---\n## One\nContent.`;
    assert.deepEqual(source.deckCounter(text),{value:expected,diagnostics:[]});
    assert.deepEqual(source.lintSource(text),[]);
  }
  for(const raw of ['audience','0','1','null','', '""']) {
    const text=`---\npagetitle: Counter\ndeck:\n  counter: ${raw}\n---\n## One\nContent.`;
    const diagnostics=source.lintSource(text,'talk.qmd');
    assert.deepEqual(diagnostics.map(d=>[d.file,d.line,d.column,d.code,d.severity]),[['talk.qmd',4,3,'deck-counter','error']]);
  }
  assert.equal(source.deckCounter('## One\n```yaml\ndeck:\n  counter: bad\n```').value,'true');
});

test('both verifiers detect a stale counter policy and hidden-state corruption', () => {
  assert.equal(typeof render.counterPolicyFailures,'function');
  for(const value of ['true','false','presenter']) for(const mode of ['audience','presenter']) {
    const text=`---\ndeck:\n  counter: ${value}\n---\n## One\nContent.`;
    const hidden=value==='false'||(value==='presenter'&&mode==='audience');
    const html=`<html data-counter="${value}"><body><div class="counter" id="counter"${hidden?' hidden':''}>1 / 2</div></body></html>`;
    assert.deepEqual(render.counterPolicyFailures(text,html,mode),[]);
    const corrupt=hidden?html.replace(' hidden',''):html.replace('id="counter"','id="counter" hidden');
    assert.ok(render.counterPolicyFailures(text,corrupt,mode).some(message=>message.includes('visibility')));
    assert.ok(render.counterPolicyFailures(text,html.replace(`data-counter="${value}"`,'data-counter="stale"'),mode).some(message=>message.includes('policy')));
  }
});

test('counter visibility checks actual boolean attributes, not quoted payload text', () => {
  const text='---\ndeck:\n  counter: false\n---\n## One\nContent.';
  const html=attrs=>`<html data-counter="false"><div id="counter" ${attrs}>1 / 1</div></html>`;
  assert.ok(render.counterPolicyFailures(text,html('title="example hidden here"'),'audience').some(message=>message.includes('visibility')));
  for(const attrs of ['hidden','hidden=""','hidden="false"']) assert.deepEqual(render.counterPolicyFailures(text,html(attrs),'audience'),[]);
});
