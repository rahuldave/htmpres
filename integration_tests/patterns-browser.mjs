import { checkDocsLayout } from './docs-layout-browser.mjs';

/** CUA flow on patterns.html; expectedSources comes from the generated manifest. */
export async function checkPatternsBrowser(tab, expectedSources, {modes = ['light', 'dark'], views = ['audience', 'presenter'], roundtrip = true} = {}) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  for (const mode of modes) for (const view of views) {
    await tab.playwright.locator('#example-mode').selectOption(mode);
    await tab.getAXState({emit:false});
    await tab.playwright.locator('#example-view').selectOption(view);
    await tab.getAXState({emit:false});
    for (let slide = 1; slide <= expectedSources.length; slide++) {
      await tab.playwright.locator('#example-slide').selectOption(String(slide));
      const status = slide === 7 ? 'Step 0 of 3 · before reveals' : 'This slide has no reveal steps';
      await tab.playwright.getByText(status, {exact:true}).waitFor({state:'visible', timeoutMs:30000});
      await tab.getAXState({emit:false});
      assert(await tab.playwright.locator('#example-markdown').textContent() === expectedSources[slide - 1].markdown,
        `Exact source: ${mode}/${view}/${slide}`);
      const fit = await tab.playwright.frameLocator('iframe').locator('#slideFit').evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {width:rect.width, height:rect.height};
      });
      assert(Math.abs(fit.width - 1280) < 2 && Math.abs(fit.height - 720) < 2,
        `Slide uses the available canvas: ${mode}/${view}/${slide}: ${JSON.stringify(fit)}`);
      if (slide === 7) {
        for (let step = 1; step <= 3; step++) {
          await tab.playwright.getByRole('button', {name:'Next step',exact:true}).click();
          await tab.playwright.getByText(`Step ${step} of 3`, {exact:true}).waitFor({state:'visible'});
          await tab.getAXState({emit:false});
        }
        assert(!await tab.playwright.getByRole('button', {name:'Next step',exact:true}).isEnabled(), 'Pattern steps stay bounded');
      }
      results.push(`${mode}/${view}/${slide}`);
    }
    await checkDocsLayout(tab);
  }
  if (!roundtrip) return results;
  await tab.playwright.locator('#example-slide').selectOption('3');
  await tab.playwright.getByText('This slide has no reveal steps', {exact:true}).waitFor({state:'visible'});
  await tab.getAXState({emit:false});
  await tab.playwright.frameLocator('iframe').getByRole('link', {name:'source record',exact:true}).click();
  await tab.getAXState({emit:false});
  assert((await tab.playwright.locator('#example-markdown').textContent()).startsWith('## Source record'), 'Credit reaches its appendix source and updates the source panel');
  await tab.playwright.frameLocator('iframe').getByRole('link', {name:'Back to the contained picture',exact:true}).click();
  await tab.getAXState({emit:false});
  assert((await tab.playwright.locator('#example-markdown').textContent()).startsWith('## Keep the whole picture visible'), 'Appendix returns to its picture');
  await tab.playwright.getByRole('button', {name:'Copy slide Markdown',exact:true}).click();
  await tab.getAXState({emit:false});
  // Some in-app browsers isolate the clipboard read API from native paste.
  const search = tab.playwright.getByRole('searchbox');
  await search.fill(''); await search.press('Meta+V'); await tab.getAXState({emit:false});
  const pasted = await search.evaluate(node => node.value);
  await search.fill(''); await search.press('Escape'); await tab.getAXState({emit:false});
  assert(pasted === expectedSources[2].markdown.replace(/[\r\n]/g, ''), 'Native paste contains the authored Markdown (single-line input removes line breaks)');
  return results;
}
