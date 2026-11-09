import { themeStyles } from "../_extensions/htmpres/themes/themes.mjs";
import "./matched-colors.test.ts";
const root = new URL("../", import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
const catalog = JSON.parse(read("_extensions/htmpres/themes/catalog.json"));
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
for (const [name, entry] of Object.entries(catalog.themes)) {
  const css = themeStyles({ light: name, dark: name, mode: "auto" }, catalog);
  for (const mode of ["light", "dark"]) {
    const selector = `html[data-theme="${name}"]:where([data-color-mode="${mode}"]) {`;
    const start = css.indexOf(selector);
    const block = css.slice(start, css.indexOf("}", start));
    assert(block.includes(`--htmpres-importance-1-ink: ${entry.palettes[mode].muted};`), `${name}/${mode}: minor points use theme muted ink`);
    assert(block.includes(`--htmpres-importance-3-ink: ${entry.palettes[mode].ink};`), `${name}/${mode}: key points use theme foreground`);
    for (let level = 0; level < 5; level++) {
      for (const token of ["scale", "weight", "ink"]) assert(block.includes(`--htmpres-importance-${level}-${token}:`), `${name}/${mode}: extensible level ${level} ${token}`);
    }
  }
}
const css = read("_extensions/htmpres/runtime/htmpres-semantic.css");
assert(css === read("decks/scripts/htmpres-semantic.css"), "Packaged and local semantic styles agree");
assert(css.includes(".key") && css.includes(".aside"), "Both semantic roles are supported");
assert(css.includes("--htmpres-importance-3-scale") && css.includes("--htmpres-importance-1-scale"), "Roles use the shared importance scale");
assert(css.includes(".slide.htmpres-text-fit-active :is(div, section, aside, blockquote):is(.key, .aside)"), "Fitted importance blocks outrank existing card/callout/lead size rules (browser regression)");
assert(!/#[0-9a-f]{3,8}\b|\brgba?\(/i.test(css), "Role CSS delegates palette values to themes");
for (let level = 0; level < 5; level++) assert(css.includes(`--htmpres-importance-${level}-ink`), `Legacy/default fallback for level ${level}`);
console.log("Semantic importance tests passed: spans/blocks share five token levels across 35 themes × two modes and legacy defaults.");
