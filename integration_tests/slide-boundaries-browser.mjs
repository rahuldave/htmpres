/** Run through CUA against `just slide-breaks` output served by htmpres serve.
 * const { checkSlideBoundaries } = await import('/absolute/path/integration_tests/slide-boundaries-browser.mjs');
 * await checkSlideBoundaries(tab); // audience or presenter tab
 */
export async function checkSlideBoundaries(tab, presenter = false) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({ emit: false });
  const state = () => tab.playwright.evaluate(() => {
    const slide = document.querySelector('.slide.active');
    return {
      count: document.querySelectorAll('.slide').length,
      id: slide.id, heading: slide.querySelector('h2')?.textContent || '',
      counter: document.querySelector('#counter').textContent,
      notes: document.querySelector('#presenterNotes')?.textContent || '',
      noteRules: document.querySelectorAll('#presenterNotes hr').length,
      nextDisabled: document.querySelector('#nextBtn').disabled,
      overview: [...document.querySelectorAll('.overview-card strong')].map(el => el.textContent),
    };
  });
  await observe();
  await tab.playwright.getByRole('button', { name: '1. Slide 1', exact: true }).click(); await observe();
  let current = await state();
  assert(current.count === 3 && current.id === 'slide-1' && !current.heading, 'Three slides and an untitled first slide');
  assert(current.counter === '1 / 2' && current.overview[0] === 'Slide 1', 'Untitled fallback label and main counter');
  if (presenter) assert(current.notes.includes('First cue') && current.notes.includes('Still the first') && current.noteRules === 1, 'Rule and both cue paragraphs remain in first notes');
  else assert(!current.notes, 'No audience notes');
  await tab.playwright.locator('#overviewBtn').click(); await observe();
  assert(await tab.playwright.locator('#overview').isVisible(), 'Overview opens');
  await tab.playwright.locator('#overview .overview-card').filter({ hasText: 'A heading starts slide two' }).click(); await observe();
  current = await state();
  assert(current.id === 'second' && current.heading === 'A heading starts slide two' && current.counter === '2 / 2' && current.nextDisabled, 'Heading-only slide and main-talk end');
  if (presenter) assert(current.notes.includes('Second slide cue') && !current.notes.includes('First cue'), 'Second notes replace first');
  await tab.playwright.getByRole('link', { name: 'Open the appendix', exact: true }).click(); await observe();
  current = await state();
  assert(current.id === 'appendix-data' && !current.heading && current.counter === 'Appendix 1 / 1', 'Coalesced empty heading preserves appendix ID/kind');
  assert(current.overview[2] === 'Backup data', 'Untitled data-title override');
  if (presenter) assert(current.notes.includes('Third slide cue') && !current.notes.includes('Second slide cue'), 'Third notes stay with coalesced slide');
  await tab.playwright.getByRole('link', { name: 'Back to slide two', exact: true }).click(); await observe();
  assert((await state()).id === 'second', 'Named return link');
  return { ok: true, mode: presenter ? 'presenter' : 'audience', checks: ['three boundaries', 'no phantom slides', 'untitled labels and headings', 'overview selection', 'main/appendix counters', 'named navigation', 'notes ownership'] };
}
