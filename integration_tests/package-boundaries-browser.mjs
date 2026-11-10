/** Read-only real-browser gate for the clean npm-installed example URL. */
export async function checkPackageBrowser(tab) {
  await tab.getAXState({emit: false});
  const state = await tab.playwright.evaluate(() => ({
    info: JSON.parse(document.querySelector('#identity').textContent),
    path: location.pathname,
    origin: location.origin,
    scripts: performance.getEntriesByType('resource')
      .filter(entry => entry.initiatorType === 'script').map(entry => entry.name),
    hasNodeProcess: typeof process !== 'undefined',
  }));
  if (state.info.name !== 'plotfoundry' || state.info.status !== 'scaffold') throw Error('Installed identity');
  if (!state.path.includes('/node_modules/plotfoundry/')) throw Error('Not installed consumer');
  if (state.hasNodeProcess) throw Error('Browser test must not use Node shims');
  if (!state.scripts.some(url => url.endsWith('/plotfoundry/src/index.js'))) throw Error('ESM was not loaded');
  if (!state.scripts.every(url => url.startsWith(state.origin + '/'))) throw Error('Remote script dependency');
  return {passed: true, ...state};
}
