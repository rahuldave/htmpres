/** Run from CUA: await checkPlottingDocsBrowser(tab), against plotting-gallery.html.
 * Uses native select/keyboard gestures and read-only DOM observations. Network
 * failure/delayed-response probes need the independent headless-browser runner.
 */
export async function checkPlottingDocsBrowser(tab) {
  const assert = (value, message) => { if (!value) throw Error(message); };
  const state = () => tab.playwright.evaluate(() => ({
    busy: document.querySelector("#plotting-gallery").getAttribute("aria-busy"),
    hidden: document.querySelector("figure").hidden,
    alt: document.querySelector("#plot-preview").alt,
    caption: document.querySelector("figcaption").textContent,
    status: document.querySelector("#plot-status").textContent,
    command: document.querySelector("#plot-reproduce").textContent,
    url: location.search,
    links: [...document.querySelectorAll("#plot-downloads a")].map(a => ({ name: a.textContent, url: a.href })),
    previewWidth: document.querySelector("#plot-preview").getBoundingClientRect().width,
    pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  }));
  const wait = async () => {
    for (let i = 0; i < 25; i++) {
      await tab.getAXState({ emit: false }); const current = await state();
      if (current.busy === "false") { assert(!current.hidden, current.status); return current; }
    }
    throw Error("Gallery did not settle");
  };
  await wait(); const passed = [];
  for (const interface_ of ["python", "r-ggplot", "r-base"]) {
    await tab.playwright.locator("#plot-interface").selectOption(interface_);
    for (const family of ["folio", "atelier", "nocturne", "tufte", "zephyr-reading", "simplex-reading", "pulse-reading", "litera-reading", "darkly-reading"]) {
      await tab.playwright.locator("#plot-theme").selectOption(family);
      const current = await wait();
      assert(current.alt.includes(family) && current.caption.includes(family) && current.command.includes(family), "Atomic case text");
      assert(current.links.every(link => link.url.includes("/_generated/plotting/")), "Local allowlisted downloads");
      assert(!current.pageOverflow, "No page overflow");
    }
    passed.push(`${interface_}: all nine families`);
  }
  for (const [key, value] of [["mode", "dark"], ["profile", "presentation"], ["surface", "panel"], ["size", "intended"]]) {
    await tab.playwright.locator(`#plot-${key}`).selectOption(value); await wait();
  }
  const intended = await state(); assert(Math.abs(intended.previewWidth - 1152) < 1, "Intended 1152 CSS-pixel preview");
  await tab.playwright.locator("#plot-size").selectOption("fit"); await wait();
  await tab.playwright.locator("#plot-mode").press("Home"); await wait();
  passed.push("mode/profile/surface, intended placement, native keyboard and local download URLs");
  return { passed, final: await state() };
}
