import { attributionInk } from '../_extensions/htmpres/themes/attribution.mjs';
import { deckCounter, lintSource } from '../_extensions/htmpres/lib/source.mjs';
import { arrangeSlideCredits, counterPolicyFailures } from '../_extensions/htmpres/lib/render.mjs';
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
assert(deckCounter('## One\nBody.').value === 'true', 'Default counter');
for (const value of ['true', 'false', 'presenter']) {
  const source = `---\ndeck:\n  counter: ${value}\n---\n## One\nBody.`;
  assert(lintSource(source).length === 0, `Valid policy ${value}`);
  for (const mode of ['audience', 'presenter']) {
    const hidden = value === 'false' || (value === 'presenter' && mode === 'audience');
    assert(counterPolicyFailures(source, `<html data-counter="${value}"><div id="counter"${hidden ? ' hidden' : ''}>1 / 1</div></html>`, mode).length === 0, `${value}/${mode}: verified policy`);
  }
}
assert(lintSource('---\ndeck:\n  counter:\n---\n## One\nBody.')[0]?.code === 'deck-counter', 'Empty counter rejected');
const relocated = arrangeSlideCredits('<p><a href="#source"><span class="credit">Photo</span></a></p>');
assert(relocated.includes('<a href="#source"><span class="credit">Photo</span></a>'), 'Credit preserves Markdown link');
for (const view of ['index', 'presenter']) {
  const html = Deno.readTextFileSync(new URL(`../decks/authoring-hooks/${view}.html`, import.meta.url));
  assert(html.includes('class="statement"') && html.includes('class="source"') && html.includes('class="slide-credits"'), 'Rendered hook fixture');
  assert((view === 'index') === html.includes('id="counter" hidden'), `${view}: presenter counter policy`);
}
console.log('Talk hooks: semantic roles, credit relocation and counter policy passed.');

assert(attributionInk('#888888', '#ffffff') !== '#888888', 'Stock Minty attribution receives readable ink');
