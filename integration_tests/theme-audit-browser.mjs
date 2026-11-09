/** Run via CUA against http://127.0.0.1:8773 after the research specimens target.
 * Import this file in cua_repl, then call checkThemeAuditBrowser(tab).
 * DOM evaluations are read-only; navigation and button clicks use CUA controls.
 * Contact-page screenshots remain a separate visual inspection, not asserted here.
 */
export async function checkThemeAuditBrowser(tab, base = 'http://127.0.0.1:8773') {
  const passed = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  for (const report of ['01-design-language', '02-presentation-color', '03-scientific-palettes']) {
    await tab.goto(`${base}/${report}.html`);
    await tab.getAXState({ emit: false });
    const state = await tab.playwright.evaluate(() => ({
      title: document.querySelector('h1')?.textContent,
      nav: document.querySelectorAll('nav a').length,
      images: [...document.images].map(image => ({ loaded: image.complete && image.naturalWidth > 0, alt: image.alt })),
      overflow: document.documentElement.scrollWidth > innerWidth,
      count: document.querySelectorAll('table').length,
    }));
    assert(state.title && state.nav === 3 && state.count > 0, `${report}: document structure`);
    assert(state.images.length && state.images.every(image => image.loaded && image.alt), `${report}: images loaded with alt descriptions`);
    assert(!state.overflow, `${report}: no page-level horizontal overflow`);
    passed.push(`${report}: structure, assets and viewport fit`);
  }
  await tab.goto(`${base}/specimens/atelier/light.html`);
  await tab.getAXState({ emit: false });
  const mode = () => tab.playwright.evaluate(() => document.documentElement.dataset.colorMode);
  assert(await mode() === 'light', 'Light specimen starts light');
  await tab.playwright.locator('#colorModeBtn').click();
  await tab.getAXState({ emit: false });
  assert(await mode() === 'dark', 'Mode button switches to dark');
  await tab.playwright.locator('#nextBtn').click();
  await tab.getAXState({ emit: false });
  const code = await tab.playwright.evaluate(() => ({
    title: document.querySelector('.slide.active h2')?.textContent,
    code: document.querySelector('.slide.active code')?.textContent,
  }));
  assert(code.title?.includes('Code') && code.code?.includes('greet'), 'Next enters code specimen');
  passed.push('Actual Atelier renderer: light→dark and next-slide code');
  return { ok: true, passed };
}
