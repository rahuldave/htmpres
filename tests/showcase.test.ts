import { slideTitles, themeChoices, themeVariant, variantPath } from "../scripts/showcase.mjs";
import { initialSlide, selection } from "../docs/assets/theme-comparison.mjs";

const read = (path: string) => Deno.readTextFileSync(new URL(`../${path}`, import.meta.url));
const catalog = JSON.parse(read("_extensions/htmpres/themes/catalog.json"));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
function throws(run: () => unknown) { let failed = false; try { run(); } catch { failed = true; } assert(failed, "Expected invalid input to fail"); }
const themes = themeChoices(catalog);
assert(JSON.stringify(slideTitles('## Real {.hero}\n````markdown\n## Example only\n```\n## Still code\n````\n## Second')) === JSON.stringify(["Real", "Second"]), "Ignore headings in nested fenced examples");
assert(themes.length === 38 && themes.filter(theme => theme.modes.length === 2).length === 35, "Catalog coverage");
const manifest = { themes, slides: Array.from({ length: 9 }, (_, index) => `Slide ${index + 1}`) };
assert(slideTitles('## A *claim*', '<section class="slide" data-title="A claim &amp; evidence">')[0] === "A claim & evidence", "Gallery labels use rendered plain titles");
throws(() => slideTitles('## One', ''));
for (const [query, expected] of [["?slide=5", 5], ["?slide=9", 9], ["?slide=0", 1], ["?slide=10", 1], ["?slide=1.5", 1], ["?slide=bad", 1], ["", 1]]) assert(initialSlide(query, manifest) === expected, `Feature link ${query}`);
const first = selection("nocturne", "light", "audience", 1, manifest);
const next = selection("nocturne", "light", "audience", 4, manifest);
assert(first.preview.split("#")[0] !== next.preview.split("#")[0], "Slide changes must reload the document, not only the hash");
assert(next.preview.endsWith("?compare-slide=4#/4"), "Slide URL");
assert(selection("simplex-reading", "dark", "presenter", 9, manifest).open.endsWith("presenter.html#/9"), "Presenter URL");
assert(!selection("blank", "light", "audience", 1, manifest).config.includes("color-mode"), "Legacy declaration must not invent a mode");
for (const args of [["missing", "light", "audience", 1], ["blank", "dark", "audience", 1], ["nocturne", "auto", "audience", 1], ["nocturne", "light", "notes", 1], ["nocturne", "light", "audience", 0], ["nocturne", "light", "audience", 10], ["nocturne", "light", "audience", 1.5]]) {
  throws(() => selection(...args, manifest));
}
throws(() => variantPath("../escape", "light", "audience", catalog));
const canonical = read("decks/example/index.html");
const presenter = read("decks/example/presenter.html");
// The main gallery itself must demonstrate the features, not only a separate deck.
assert((canonical.match(/<section class="slide/g) || []).length === 12, "Main showcase has ten talk slides and two appendix slides");
for (const id of ["importance", "layering", "code-steps", "equation-steps", "main-result", "appendix-data", "appendix-detail"]) {
  assert(canonical.includes(`id="${id}"`), `Main showcase demonstrates ${id}`);
}
assert((canonical.match(/data-step-indices="1\|3\|7"/g) || []).length === 2, "Code and equation lanes synchronize with explaining text");
assert(canonical.includes('data-equation-steps="term-a|term-b|term-a,term-b"'), "Main gallery has real equation steps");
assert(canonical.includes('data-fragment-effect="dim"') && canonical.includes('class="fragment"'), "Main gallery demonstrates span and list layering");
assert(canonical.includes('<em>source</em>') && canonical.includes('id="slide-3-fn1"') && canonical.includes('id="slide-11-fn1"'), "Title emphasis and repeated footnotes are demonstrated");

const options = { catalog, templateCss: read("_extensions/htmpres/templates/source.css"), localCss: read("decks/example/source.css"), blankCss: "html[data-theme=\"blank\"] { --paper: white; }" };
for (const theme of themes) for (const mode of theme.modes) {
  for (const input of [canonical, presenter]) {
    const output = themeVariant(input, { ...options, name: theme.name, mode });
    const withoutControl = (value: string) => value.slice(value.indexOf("</head>")).replace(/<button class="nav-btn" id="colorModeBtn"[^>]*>Color mode<\/button>/, "").replaceAll("../../../assets/htmpres-math/", "assets/htmpres-math/");
    assert(withoutControl(output) === withoutControl(input), `Body, notes and runtime changed: ${theme.name}/${mode}`);
    assert(output.includes('href="../../../assets/htmpres-math/katex.min.css"') && output.includes('src="../../../assets/htmpres-math/katex.min.js"'), "Shared offline math URLs");
    assert(output.includes(`data-theme="${theme.name}"`), "Theme attribute");
    assert(output.includes('data-text-fit-min="0.66"') && output.includes('data-overflow="fit-scroll"'), "Unrelated attributes preserved");
    if (theme.family !== "legacy") assert(output.includes(`data-color-mode="${mode}"`), "Explicit mode");
    else assert(!output.slice(0, output.indexOf("<head>")).includes("data-color-mode"), "Legacy attrs removed");
  }
}
throws(() => themeVariant(canonical.replace(options.localCss, "changed"), { ...options, name: "nocturne", mode: "light" }));
// Execute the emitted head scripts: a full view follows storage changes, an embedded comparison stays fixed.
for (const embedded of [false, true]) {
  const listeners = [];
  const root = { dataset: {}, style: {}, classList: { toggle() {} } };
  const window = { matchMedia: () => ({ matches: false, addEventListener() {} }),
    dispatchEvent() {}, addEventListener: (name, callback) => { if (name === "storage") listeners.push(callback); } };
  const document = { documentElement: root, getElementById: () => null, addEventListener() {} };
  const location = { pathname: "/decks/nocturne/light/index.html", search: embedded ? "?compare-slide=3" : "" };
  const output = themeVariant(canonical, { ...options, name: "nocturne", mode: "light" });
  for (const script of output.slice(0, output.indexOf("<style>")).matchAll(/<script>(.*?)<\/script>/gs)) {
    new Function("window", "document", "location", script[1])(window, document, location);
  }
  assert(root.dataset.colorMode === "light", "Initial comparison mode");
  let stopped = false;
  const event = { key: "htmpres-color-mode:/decks/nocturne/light/:nocturne:nocturne", newValue: "dark", stopImmediatePropagation: () => { stopped = true; } };
  for (const listener of listeners) { listener(event); if (stopped) break; }
  assert(root.dataset.colorMode === (embedded ? "light" : "dark"), "Only full views follow external palette preferences");
}
console.log("Showcase tests passed: 38 themes, 146 body-preserving variants, selection validation and reload semantics.");

await import("./example-page.test.ts");

assert(JSON.stringify(slideTitles('---\npagetitle: Mixed\n---\n\n---\nOpening.\n## Two\nBody.\n---\n## {data-title="Backup data"}\nData.')) === JSON.stringify(['Slide 1', 'Two', 'Backup data']), 'Showcase labels share mixed boundaries and untitled fallback');
