import { lintSource, parseSlides, splitFrontMatter } from "../_extensions/htmpres/lib/source.mjs";

const root = new URL("../", import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
const source = read("decks/semantic/index.qmd");
assert(!/\bstyle\s*=|#[0-9a-f]{6}\b/i.test(source), "Public semantic source has no inline visual styling");
assert(lintSource(source).length === 0, "Public source passes slide-break lint");
assert(parseSlides(splitFrontMatter(source).body).length === 8, "Eight example slides");
for (const view of ["index", "presenter"]) {
  const html = read(`decks/semantic/${view}.html`);
  const content = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const ids = [...content.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert(ids.length === new Set(ids).size, `${view}: unique generated IDs`);
  assert(html.includes('<h2>A <em>semantic</em> story</h2>'), `${view}: inline title Markdown`);
  assert([...html.matchAll(/data-step-indices="1\|3\|7"/g)].length === 2 && html.includes('data-steps="1|2|3"'), `${view}: code and equation both retain sparse shared step mappings`);
  assert(html.includes('data-equation-steps="mean|total|mean,total"'), `${view}: named equation terms`);
  assert(html.includes('data-kind="appendix"') && html.includes('id="appendix-detail"'), `${view}: trailing appendix fixture`);
  assert(html.includes('href="#slide-1-fn1"') && html.includes('href="#slide-2-fn1"'), `${view}: independent footnotes`);
  assert(html.includes('src="assets/htmpres-math/katex.min.js"') && html.includes('href="assets/htmpres-math/katex.min.css"'), `${view}: local math bundle`);
  assert(!/<(?:script|link)\b[^>]*(?:src|href)="https?:\/\//i.test(html), `${view}: no network scripts/styles`);
  assert(html.includes(".slide.htmpres-text-fit-active :is(div, section, aside, blockquote):is(.key, .aside, .statement)"), `${view}: semantic CSS loaded after shell`);
  if (view === "index") assert(!html.includes('id="deckNotes"') && !html.includes("This note has a separate"), "Audience notes isolated");
  else assert(html.includes("notes-1-fn1") && html.includes("notes-2-fn1"), "Presenter note references have independent namespaces");
}
for (const file of ["katex.min.js", "katex.min.css", "LICENSE", "fonts/KaTeX_Main-Regular.woff2"]) {
  assert(Deno.statSync(new URL(`decks/semantic/assets/htmpres-math/${file}`, root)).isFile, `Offline bundle contains ${file}`);
}
console.log("Semantic example checks passed: unstyled QMD, title emphasis, unique notes/footnotes, shared frames, appendix and local math assets.");
