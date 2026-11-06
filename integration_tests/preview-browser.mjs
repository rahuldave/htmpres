/** In cua_repl open both views at #/2, edit a scratch deck and its cue using
 * the file tools, then call checkReloadedViews. Do not manually reload either
 * tab. Repeat after stopping/restarting serve to check reconnection.
 */
export async function checkReloadedViews(audience, presenter, { text, cue, slideId }) {
  const proof = [];
  for (const [view, tab] of [['audience', audience], ['presenter', presenter]]) {
    await tab.playwright.getByText(text, { exact: true }).waitFor({ state: 'visible', timeoutMs: 30000 });
    const ax = await tab.getAXState({ emit: false });
    const state = await tab.playwright.evaluate(() => ({
      slide: document.querySelector('.slide.active').id,
      notes: document.querySelector('#presenterNotes')?.textContent || '',
    }));
    if (state.slide !== slideId) throw new Error(`${view}: reload changed the slide`);
    if (!ax.includes(view === 'presenter' ? '/presenter.html#/2' : '/index.html#/2')) throw new Error(`${view}: reload changed the URL/view`);
    if (view === 'presenter' && !state.notes.includes(cue)) throw new Error('Presenter cue did not reload');
    proof.push({ view, slide: state.slide, updated: true });
  }
  return proof;
}
