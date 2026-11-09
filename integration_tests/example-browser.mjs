/** Run through cua_repl on example.html. Exercises actual UI, never evaluates mutations. */
export async function checkExampleBrowser(tab) {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const observe = () => tab.getAXState({emit:false, disableDiffing:true});
  const waitStep = async value => { await tab.playwright.getByText(value,{exact:true}).waitFor({state:'visible',timeoutMs:30000}); return observe(); };
  const bodyKey = async key => {
    await tab.playwright.getByRole('heading',{name:'Learn from the Markdown',exact:true}).click(); await observe();
    await tab.pressKey(null,key); return observe();
  };
  const preview = ax => ax.slice(ax.indexOf('AXWebArea htmpres'),ax.indexOf('link Description: Open full deck'));
  await tab.playwright.locator('#example-slide').selectOption('5'); await waitStep('Step 0 of 4 · before reveals');
  assert(!preview(await observe()).includes('Collect three observations.'),'Future explanation hidden in iframe, despite visible source');
  await bodyKey('ArrowRight');
  assert(preview(await waitStep('Step 1 of 4')).includes('Collect three observations.'),'Page Right advances the actual code/text preview');
  await tab.playwright.getByRole('button',{name:'Next step',exact:true}).click();
  assert(preview(await waitStep('Step 2 of 4')).includes('Add them to get a total of 12.'),'Next reveals matched second explanation');
  await tab.playwright.locator('.example-source pre').press('PageDown'); await observe();
  assert(await tab.playwright.locator('#example-step-status').textContent() === 'Step 2 of 4','Source-reading keys do not change the preview');
  await tab.playwright.locator('#example-view').selectOption('presenter');
  assert((await waitStep('Step 2 of 4')).includes('Presenter cue 5.'),'View switch keeps step and shows presenter cue');
  await tab.playwright.locator('#example-mode').selectOption('dark'); await waitStep('Step 2 of 4');
  await tab.playwright.getByRole('button',{name:'Copy slide Markdown',exact:true}).press('Space'); await observe();
  assert(await tab.playwright.locator('#example-step-status').textContent() === 'Step 2 of 4','Space on a control keeps native activation, does not advance');
  await bodyKey(' '); await waitStep('Step 3 of 4');
  await bodyKey('ArrowRight'); await waitStep('Step 4 of 4 · matched summary');
  await tab.playwright.locator('#example-view').selectOption('audience'); await waitStep('Step 4 of 4 · matched summary');
  await tab.playwright.locator('#example-mode').selectOption('light'); await waitStep('Step 4 of 4 · matched summary');
  await tab.playwright.locator('#example-view').selectOption('presenter'); await waitStep('Step 4 of 4 · matched summary');
  await tab.playwright.locator('#example-mode').selectOption('dark'); await waitStep('Step 4 of 4 · matched summary');
  await bodyKey('ArrowRight'); await waitStep('Step 4 of 4 · matched summary');
  assert(await tab.playwright.evaluate(() => document.querySelector('#example-slide').value) === '5' && !(await tab.playwright.getByRole('button',{name:'Next step',exact:true}).isEnabled()),'Final step stays on selected slide');
  await bodyKey('ArrowLeft'); await waitStep('Step 3 of 4');
  await tab.playwright.getByRole('button',{name:'Restart steps',exact:true}).click(); await waitStep('Step 0 of 4 · before reveals');

  await tab.playwright.locator('#example-slide').selectOption('6'); let ax=await waitStep('Step 0 of 4 · before reveals');
  assert(await tab.playwright.locator('#example-copy-status').textContent() === '', 'Changing slides clears stale copied status');
  const heading = ax.split('\n').find(line=>/heading Equations use the same clock/.test(line));
  const index=Number(/^\s*(\d+)/.exec(heading)[1]);
  await tab.click(index); await observe(); await tab.pressKey(null,'ArrowRight');
  assert(preview(await waitStep('Step 1 of 4')).includes('The mean is the quantity we want.'),'Right inside iframe advances shared lab controls exactly once');
  await bodyKey('Home'); await waitStep('Step 0 of 4 · before reveals');
  const source = await tab.playwright.locator('#example-markdown').textContent();
  assert(source.includes('\\htmlClass{mean}') && source.includes('data-step-indices="1|3|7"') && source.includes('::: notes'),'Equation source includes actual math, mappings and cue');

  await tab.playwright.locator('#example-slide').selectOption('10'); ax=await waitStep('This slide has no reveal steps');
  const link = ax.split('\n').find(line=>/link Description: The supporting data/.test(line));
  await tab.click(Number(/^\s*(\d+)/.exec(link)[1])); await observe();
  assert((await tab.playwright.locator('#example-markdown').textContent()).startsWith('## Supporting data'),'Appendix navigation updates Markdown and selected slide');
  return ['page and iframe keyboard','bounded Next/Previous/Restart','actual code/equation explaining text','view/mode preserve teaching and summary cursors','native control focus','raw equation source','appendix/source reconciliation'];
}
