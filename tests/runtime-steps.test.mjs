import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runtimeHarness } from './runtime-harness.mjs';
import './match-summary.test.mjs';

// Characterization: an unmapped code block starts at snapshot 1, and persistent
// highlights join each snapshot. The unified clock must preserve this baseline.
test('legacy code baseline and persistent selections', () => {
  const { context } = runtimeHarness();
  vm.runInContext(`
    const slide = fakeElement();
    const root = fakeElement();
    const lines = [1, 2, 3].map(line => fakeElement({ line: String(line) }));
    const block = { root, lines, staticLines: new Set([3]), stepLines: [new Set([1]), new Set([2])] };
    slideCodeStates.set(slide, { blocks: [block], maxSteps: 2, step: 0 });
    applyCodeStep(slide);
  `, context);
  assert.equal(vm.runInContext('lines[0].classes.has("code-line-highlight")', context), true);
  assert.equal(vm.runInContext('lines[1].classes.has("code-line-dim")', context), true);
  assert.equal(vm.runInContext('lines[2].classes.has("code-line-highlight")', context), true);
  assert.equal(vm.runInContext('root.dataset.activeStep', context), '1');
  vm.runInContext('slideCodeStates.get(slide).step = 1; applyCodeStep(slide);', context);
  assert.equal(vm.runInContext('lines[0].classes.has("code-line-dim")', context), true);
  assert.equal(vm.runInContext('lines[1].classes.has("code-line-highlight")', context), true);
  assert.equal(vm.runInContext('lines[2].classes.has("code-line-highlight")', context), true);
});

test('code selections parse ranges, reversed ranges and all', () => {
  const { context } = runtimeHarness();
  const selected = expression => [...vm.runInContext(expression, context)];
  assert.deepEqual(selected('parseLineSelection("2-4, 6", 5)'), [2, 3, 4]);
  assert.deepEqual(selected('parseLineSelection("4-2", 5)'), [2, 3, 4]);
  assert.deepEqual(selected('parseLineSelection("all", 3)'), [1, 2, 3]);
  assert.deepEqual(selected('parseLineSelection("none", 3)'), []);
});

test('shared sparse indices compile into one clock without empty keypresses', () => {
  const { run } = runtimeHarness();
  const graph = run(`compileStepGraph([
    { type: 'code', explicitIndex: 2 },
    { type: 'code', explicitIndex: 8 },
    { type: 'fragment', explicitIndex: 2 },
    { type: 'fragment', explicitIndex: 8 },
    { type: 'equation', explicitIndex: 8 },
  ])`);
  assert.deepEqual([...graph.frames], [2, 8]);
  assert.deepEqual([...graph.events].map(event => event.index), [2, 8, 2, 8, 8]);
});

test('implicit events follow source order and fragment zero stays a baseline', () => {
  const { run } = runtimeHarness();
  assert.deepEqual([...run(`compileStepGraph([
    { explicitIndex: 0 }, { explicitIndex: null },
    { explicitIndex: 4 }, { explicitIndex: null },
  ]).frames`)], [1, 4, 5]);
});

test('mapped snapshots validate cardinality, positivity, integer syntax and strict order', () => {
  const { run, warnings } = runtimeHarness();
  assert.deepEqual([...run('parseStepIndices("1|3|8", 3)')], [1, 3, 8]);
  for (const value of ['0|2', '2|2', '3|1', '1.5|2', '1e1|11', '1|', '1', '1|2|3', '9007199254740992|9007199254740993']) {
    assert.equal(run(`parseStepIndices(${JSON.stringify(value)}, 2)`), null, value);
  }
  assert.equal(warnings.length, 9);
  assert.equal(run('parseStepIndices("", 2)'), null);
});

test('two legacy unmapped code blocks share kth snapshots and preserve first snapshot baseline', () => {
  const { run } = runtimeHarness();
  run(`
    const blocks = [2, 3].map(count => ({ root: fakeElement(), lines: [], staticLines: new Set(),
      stepLines: Array.from({ length: count }, () => new Set([1])), stepIndices: null }));
    slideCodeStates.set(slides[0], { blocks, step: 0 });
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.deepEqual([...run('slideStepStates.get(slides[0]).frames')], [1, 2]);
  assert.deepEqual([...run('blocks.map(block => block.activeSnapshot)')], [0, 0]);
  run('changeSlideStep(1)');
  assert.deepEqual([...run('blocks.map(block => block.activeSnapshot)')], [1, 1]);
  run('changeSlideStep(1)');
  assert.deepEqual([...run('blocks.map(block => block.activeSnapshot)')], [1, 2]);
  assert.equal(run('changeSlideStep(1)'), false);
});

test('mapped code and text advance together, hold state, retreat and reset', () => {
  const { run } = runtimeHarness();
  run(`
    const lineNodes = [1, 2, 3].map(line => fakeElement({ line: String(line) }));
    const block = { root: fakeElement(), lines: lineNodes, staticLines: new Set([3]),
      stepLines: [new Set([1]), new Set([2])], stepIndices: [2, 8] };
    const text = [fakeElement(), fakeElement()].map((element, offset) => ({ element, explicitIndex: [2, 8][offset] }));
    slideCodeStates.set(slides[0], { blocks: [block], step: 0 });
    slideFragmentStates.set(slides[0], { fragments: text, step: 0 });
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('block.root.dataset.activeStep'), undefined);
  assert.equal(run('lineNodes[2].classes.has("code-line-highlight")'), true);
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), false);
  run('changeSlideStep(1)');
  assert.equal(run('block.root.dataset.activeStep'), '1');
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), true);
  assert.equal(run('text[1].element.classes.has("fragment-visible")'), false);
  run('changeSlideStep(1)');
  assert.equal(run('block.root.dataset.activeStep'), '2');
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), true);
  assert.equal(run('text[1].element.classes.has("fragment-current")'), true);
  run('changeSlideStep(-1)');
  assert.equal(run('block.root.dataset.activeStep'), '1');
  assert.equal(run('text[1].element.classes.has("fragment-visible")'), false);
  run('resetSlideSteps(slides[0])');
  assert.equal(run('block.root.dataset.activeStep'), undefined);
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), false);
});

test('dim current text holds while only another lane advances, future text stays hidden', () => {
  const { run } = runtimeHarness();
  run(`
    const fragments = [1, 3].map(index => ({ element: fakeElement(), index }));
    slideFragmentStates.set(slides[0], { fragments, step: 2 });
    applyFragmentStep(slides[0]);
  `);
  assert.equal(run('fragments[0].element.classes.has("fragment-current")'), true);
  assert.equal(run('fragments[0].element.classes.has("fragment-past")'), false);
  assert.equal(run('fragments[1].element.classes.has("fragment-visible")'), false);
  assert.equal(run('fragments[1].element.attributes.get("aria-hidden")'), 'true');
  run('slideFragmentStates.get(slides[0]).step = 3; applyFragmentStep(slides[0])');
  assert.equal(run('fragments[0].element.classes.has("fragment-past")'), true);
  assert.equal(run('fragments[1].element.classes.has("fragment-current")'), true);
});

test('spans and list items inside columns inherit incremental dim; explicit effects win', () => {
  const { run } = runtimeHarness();
  run(`
    const owner = fakeElement({ fragmentEffect: 'dim' }); owner.classes.add('incremental');
    const column = fakeElement(); column.parentElement = owner;
    const span = fakeElement(); span.parentElement = column;
    const list = fakeElement(); list.classes.add('incremental'); list.parentElement = column;
    const item = fakeElement(); item.parentElement = list;
    const custom = fakeElement({ fragmentEffect: 'highlight' }); custom.parentElement = column;
    slides[0].queries.set('.fragment', [span, custom]);
    slides[0].queries.set('.incremental > li, .incremental > ol > li, .incremental > ul > li, ol.incremental > li, ul.incremental > li', [item]);
    prepareFragments(); prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('span.classes.has("fragment-dim")'), true);
  assert.equal(run('item.classes.has("fragment-dim")'), true);
  assert.equal(run('custom.classes.has("fragment-highlight")'), true);
  assert.equal(run('custom.classes.has("fragment-dim")'), false);
  assert.equal(run('span.attributes.get("aria-hidden")'), 'true');
});

test('mapped equation terms follow the shared clock and leave text revealed', () => {
  const { run } = runtimeHarness();
  run(`
    const a = fakeElement(); a.classes.add('term-a');
    const b = fakeElement(); b.classes.add('term-b');
    const root = fakeElement({ equationSteps: 'term-a|term-b|term-a,term-b', stepIndices: '1|4|9' });
    root.queries.set('.term-a, .term-b', [a, b]);
    slides[0].queries.set('.equation-steps[data-equation-steps]', [root]);
    const text = [1, 4, 9].map(index => ({ element: fakeElement(), explicitIndex: index }));
    slideFragmentStates.set(slides[0], { fragments: text, step: 0 });
    prepareEquationSteppers(); prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('root.dataset.activeStep'), undefined);
  assert.equal(run('a.classes.has("equation-term-dim")'), false);
  run('changeSlideStep(1)');
  assert.equal(run('a.classes.has("equation-term-highlight")'), true);
  assert.equal(run('b.classes.has("equation-term-dim")'), true);
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), true);
  run('changeSlideStep(1)');
  assert.equal(run('a.classes.has("equation-term-dim")'), true);
  assert.equal(run('b.classes.has("equation-term-highlight")'), true);
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), true);
  run('changeSlideStep(1)');
  assert.equal(run('a.classes.has("equation-term-highlight")'), true);
  assert.equal(run('b.classes.has("equation-term-highlight")'), true);
  run('changeSlideStep(-1)');
  assert.equal(run('a.classes.has("equation-term-dim")'), true);
});

test('mixed implicit fragment then code follows source order from an inactive baseline', () => {
  const { run } = runtimeHarness();
  run(`
    const text = { element: fakeElement(), explicitIndex: null };
    const block = { root: fakeElement(), lines: [], staticLines: new Set(),
      stepLines: [new Set([1]), new Set([2])], stepIndices: null };
    slideFragmentStates.set(slides[0], { fragments: [text], step: 0 });
    slideCodeStates.set(slides[0], { blocks: [block], step: 0 });
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('block.baseline'), -1);
  assert.equal(run('block.activeSnapshot'), -1);
  assert.equal(run('block.root.dataset.activeStep'), undefined);
  assert.deepEqual([...run('slideStepStates.get(slides[0]).frames')], [1, 2, 3]);
  run('changeSlideStep(1)');
  assert.equal(run('text.element.classes.has("fragment-visible")'), true);
  assert.equal(run('block.activeSnapshot'), -1);
  run('changeSlideStep(1)');
  assert.equal(run('block.activeSnapshot'), 0);
  assert.equal(run('block.root.dataset.activeStep'), '1');
  run('changeSlideStep(1)');
  assert.equal(run('block.activeSnapshot'), 1);
  assert.equal(run('block.root.dataset.activeStep'), '2');
  run('changeSlideStep(-1); changeSlideStep(-1)');
  assert.equal(run('block.activeSnapshot'), -1);
});

test('mixed implicit fragment then equation schedules its first snapshot after the text', () => {
  const { run } = runtimeHarness();
  run(`
    const text = { element: fakeElement(), explicitIndex: null };
    const a = fakeElement(); a.classes.add('term-a');
    const b = fakeElement(); b.classes.add('term-b');
    const root = fakeElement({ equationSteps: 'term-a|term-b' });
    root.queries.set('.term-a, .term-b', [a, b]);
    slides[0].queries.set('.equation-steps[data-equation-steps]', [root]);
    slideFragmentStates.set(slides[0], { fragments: [text], step: 0 });
    prepareEquationSteppers(); prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('slideEquationStates.get(slides[0]).blocks[0].baseline'), -1);
  assert.equal(run('root.dataset.activeStep'), undefined);
  assert.equal(run('a.classes.has("equation-term-highlight")'), false);
  assert.deepEqual([...run('slideStepStates.get(slides[0]).frames')], [1, 2, 3]);
  run('changeSlideStep(1)');
  assert.equal(run('text.element.classes.has("fragment-visible")'), true);
  assert.equal(run('root.dataset.activeStep'), undefined);
  run('changeSlideStep(1)');
  assert.equal(run('root.dataset.activeStep'), '1');
  assert.equal(run('a.classes.has("equation-term-highlight")'), true);
  assert.equal(run('b.classes.has("equation-term-dim")'), true);
  run('changeSlideStep(1)');
  assert.equal(run('root.dataset.activeStep'), '2');
  assert.equal(run('b.classes.has("equation-term-highlight")'), true);
  run('resetSlideSteps(slides[0])');
  assert.equal(run('root.dataset.activeStep'), undefined);
});

test('matching adds exactly one real final frame and restores the last teaching frame on reverse/reset', () => {
  const { run } = runtimeHarness();
  run(`
    slides[0].dataset.stepSummary = 'match'; slides[0].dataset.matchGroups = 'input|mean';
    const text = [1, 7].map((index, i) => ({ element: fakeElement({ match: ['input', 'mean'][i] }), explicitIndex: index }));
    text.forEach(t => t.element.classes.add('fragment-dim'));
    slides[0].queries.set('[data-match]', text.map(t => t.element));
    const lines = [1,2].map(line => fakeElement({ line: String(line) }));
    const root = fakeElement({ matchRanges: '1-1:1|2-2:2' });
    const block = { root, lines, staticLines: new Set([1]), stepLines: [new Set([1]), new Set([2])], stepIndices: [1,7] };
    slideCodeStates.set(slides[0], { blocks: [block], step: 0 });
    slideFragmentStates.set(slides[0], { fragments: text, step: 0 });
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('slideStepStates.get(slides[0]).frames.length'), 3, 'two real frames plus summary, not eight');
  assert.equal(run('lines[0].dataset.matchSlot'), undefined);
  run('changeSlideStep(1)');
  assert.equal(run('lines[0].dataset.matchSlot'), '1', 'First teaching reveal colors its source number');
  assert.equal(run('text[0].element.dataset.matchSlot'), '1');
  assert.equal(run('lines[1].dataset.matchSlot'), undefined);
  assert.equal(run('text[1].element.attributes.get("aria-hidden")'), 'true');
  run('changeSlideStep(1)');
  assert.equal(run('lines[0].dataset.matchSlot'), '1', 'Earlier matches retain their colors');
  assert.equal(run('lines[1].dataset.matchSlot'), '2');
  assert.equal(run('text[1].element.dataset.matchSlot'), '2');
  assert.equal(run('lines[1].classes.has("code-line-highlight")'), true);
  assert.equal(run('slides[0].classes.has("step-summary-active")'), false);
  run('changeSlideStep(1)');
  assert.equal(run('slides[0].classes.has("step-summary-active")'), true);
  assert.equal(run('lines.some(line => line.classes.has("code-line-highlight") || line.classes.has("code-line-dim"))'), false);
  assert.equal(run('lines[0].dataset.matchSlot'), '1');
  assert.equal(run('lines[1].dataset.matchSlot'), '2');
  assert.equal(run('text[1].element.dataset.matchSlot'), '2');
  assert.equal(run('text.every(t => t.element.classes.has("fragment-visible"))'), true);
  assert.equal(run('changeSlideStep(1)'), false);
  run('changeSlideStep(-1)');
  assert.equal(run('slides[0].classes.has("step-summary-active")'), false);
  assert.equal(run('lines[1].classes.has("code-line-highlight")'), true);
  assert.equal(run('text[0].element.classes.has("fragment-past")'), true);
  assert.equal(run('lines[1].dataset.matchSlot'), '2', 'Leaving summary retains revealed matches');
  run('changeSlideStep(-1)');
  assert.equal(run('lines[0].dataset.matchSlot'), '1');
  assert.equal(run('lines[1].dataset.matchSlot'), undefined, 'Reverse removes unrevealed colors');
  run('resetSlideSteps(slides[0])');
  assert.equal(run('lines[0].dataset.matchSlot'), undefined);
  assert.equal(run('text[1].element.dataset.matchSlot'), undefined);
  assert.equal(run('text[0].element.classes.has("fragment-visible")'), false);
});

test('equation matching colors each named term independently of cumulative snapshots', () => {
  const { run } = runtimeHarness();
  run(`
    slides[0].dataset.stepSummary = 'match'; slides[0].dataset.matchGroups = 'term-a|term-b';
    const a = fakeElement(); a.classes.add('term-a'); const b = fakeElement(); b.classes.add('term-b');
    const root = fakeElement({ equationSteps: 'term-a|term-b|term-a,term-b', stepIndices: '1|3|7' });
    root.queries.set('.term-a, .term-b', [a,b]); root.queries.set('.enclosing.term-a', [a]); root.queries.set('.enclosing.term-b', [b]);
    slides[0].queries.set('.equation-steps[data-equation-steps]', [root]);
    const text = ['term-a','term-b'].map(match => fakeElement({ match }));
    slides[0].queries.set('[data-match]', text);
    slideFragmentStates.set(slides[0], { fragments: text.map((element,i)=>({element, explicitIndex:[1,3][i]})), step:0 });
    prepareEquationSteppers(); prepareStepGraphs(); resetSlideSteps(slides[0]);
    changeSlideStep(1);
  `);
  assert.equal(run('a.dataset.matchSlot'), '1'); assert.equal(run('b.dataset.matchSlot'), undefined);
  assert.equal(run('text[1].attributes.get("aria-hidden")'), 'true');
  run(`
    changeSlideStep(1);
  `);
  assert.equal(run('a.dataset.matchSlot'), '1'); assert.equal(run('b.dataset.matchSlot'), '2');
  run(`
    changeSlideStep(1); changeSlideStep(1);
  `);
  assert.equal(run('a.dataset.matchSlot'), '1'); assert.equal(run('b.dataset.matchSlot'), '2');
  assert.equal(run('a.classes.has("equation-term-highlight") || b.classes.has("equation-term-dim")'), false);
  run('changeSlideStep(-1)');
  assert.equal(run('a.classes.has("equation-term-highlight") && b.classes.has("equation-term-highlight")'), true);
});

test('static matched slides have one summary frame; safe-integer last events and legacy baseline remain valid', () => {
  const { run } = runtimeHarness();
  run(`
    slides[0].dataset.stepSummary = 'match'; slides[0].dataset.matchGroups = 'mean';
    const text = fakeElement({ match: 'mean' }); slides[0].queries.set('[data-match]', [text]);
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.deepEqual([...run('slideStepStates.get(slides[0]).frames')], ['summary']);
  run('changeSlideStep(1)');
  assert.equal(run('slides[0].dataset.activeFrame'), 'summary');
  run(`
    slideFragmentStates.set(slides[0], { fragments: [{ element: text, explicitIndex: Number.MAX_SAFE_INTEGER }], step: 0 });
    prepareStepGraphs(); resetSlideSteps(slides[0]); changeSlideStep(1); changeSlideStep(1);
  `);
  assert.deepEqual([...run('slideStepStates.get(slides[0]).frames')], [Number.MAX_SAFE_INTEGER, 'summary']);
  assert.equal(run('text.classes.has("fragment-visible")'), true);
});

test('semantic keys cannot collide with internal effective ink or background variables', () => {
  const { run } = runtimeHarness();
  run(`
    slides[0].dataset.stepSummary = 'match'; slides[0].dataset.matchGroups = 'ink|surface|number-bg';
    const targets = ['ink','surface','number-bg'].map(match => fakeElement({ match }));
    slides[0].queries.set('[data-match]', targets);
    prepareStepGraphs(); resetSlideSteps(slides[0]); changeSlideStep(1);
  `);
  assert.equal(run('targets[0].properties.get("--_htmpres-match-ink")'), 'var(--htmpres-match-ink, var(--htmpres-match-1, var(--ink)))');
  assert.equal(run('targets[1].properties.get("--_htmpres-match-ink")'), 'var(--htmpres-match-surface, var(--htmpres-match-2, var(--ink)))');
  assert.equal(run('targets[2].properties.get("--_htmpres-match-ink")'), 'var(--htmpres-match-number-bg, var(--htmpres-match-3, var(--ink)))');
  run('resetSlideSteps(slides[0])');
  assert.equal(run('targets.every(target => target.properties.size === 0)'), true);
});

test('matching onset follows enclosing fragments, repeated explanations and explicit baseline zero', () => {
  const {run}=runtimeHarness();
  run(`
    slides[0].dataset.stepSummary='match'; slides[0].dataset.matchGroups='mean|baseline';
    const wrapper=fakeElement(), early=fakeElement({match:'mean'}), later=fakeElement({match:'mean'}), baseline=fakeElement({match:'baseline'});
    wrapper.children.push(early); early.parentElement=wrapper;
    slides[0].queries.set('[data-match]',[early,later,baseline]);
    slideFragmentStates.set(slides[0],{fragments:[{element:wrapper,explicitIndex:1},{element:later,explicitIndex:3},{element:baseline,explicitIndex:0}],step:0});
    prepareStepGraphs(); resetSlideSteps(slides[0]);
  `);
  assert.equal(run('early.dataset.matchSlot'), undefined);
  assert.equal(run('baseline.dataset.matchSlot'), '2');
  run('changeSlideStep(1)');
  assert.equal(run('early.dataset.matchSlot'), '1');
  assert.equal(run('later.dataset.matchSlot'), undefined, 'A repeated hidden explanation is not activated early');
  assert.equal(run('later.attributes.get("aria-hidden")'), 'true');
  run('changeSlideStep(1)'); assert.equal(run('later.dataset.matchSlot'),'1');
  run('changeSlideStep(-1)'); assert.equal(run('later.dataset.matchSlot'),undefined);
});
