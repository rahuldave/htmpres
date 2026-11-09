/** Navigate through the visible presenter list or the audience overview. */
export async function chooseDeckSlide(tab, label) {
  const observe=()=>tab.getAXState({emit:false});
  const listButton=tab.playwright.locator('#tocList').getByRole('button',{name:label,exact:true});
  if(await listButton.isVisible()) {
    await listButton.click();await observe();return;
  }
  if(!(await tab.playwright.locator('#overviewGrid').isVisible())) {
    await tab.playwright.locator('#overviewBtn').click();await observe();
  }
  const match=/^(A?)(\d+)\.\s*(.*)$/.exec(label);
  if(!match) throw new Error(`Expected a numbered slide label: ${label}`);
  const position=(match[1]?'Appendix ':'')+match[2];
  const title=match[3].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await tab.playwright.locator('#overviewGrid').getByRole('button',{name:new RegExp(`^${position} / \\d+(?: - .*)? ${title}$`)}).click();
  await observe();
}
