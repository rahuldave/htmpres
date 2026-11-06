// Run after `just example`. Owns only docs/_generated and generated site fonts.
import { themeAssets } from "../_extensions/htmpres/themes/themes.mjs";
import { slideTitles, themeChoices, themeVariant, variantPath } from "./showcase.mjs";

const root = new URL("../", import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
const output = new URL("docs/_generated/", root);
try { Deno.removeSync(output, { recursive: true }); } catch (error) { if (!(error instanceof Deno.errors.NotFound)) throw error; }
function write(path: string, text: string) {
  const target = new URL(path, output);
  Deno.mkdirSync(new URL("./", target), { recursive: true });
  Deno.writeTextFileSync(target, text);
}
function copy(source: URL, target: URL) {
  Deno.mkdirSync(new URL("./", target), { recursive: true });
  Deno.copyFileSync(source, target);
}
const catalog = JSON.parse(read("_extensions/htmpres/themes/catalog.json"));
const themes = themeChoices(catalog);
const canonical = { audience: read("decks/example/index.html"), presenter: read("decks/example/presenter.html") };
const seed = new Deno.Command("quarto", { args: ["run", "scripts/htmpres.ts", "theme", "show", "blank"], cwd: root, stdout: "piped", stderr: "inherit" }).outputSync();
if (!seed.success) throw new Error("Could not read the renderer's blank seed");
const options = { catalog, templateCss: read("_extensions/htmpres/templates/source.css"), localCss: read("decks/example/source.css"), blankCss: new TextDecoder().decode(seed.stdout) };
const assets = new Set<string>();
for (const theme of themes) {
  for (const mode of theme.modes) {
    for (const view of ["audience", "presenter"] as const) {
      write(variantPath(theme.name, mode, view, catalog), themeVariant(canonical[view], { ...options, name: theme.name, mode }));
    }
    copy(new URL("decks/example/assets/two-views.svg", root), new URL(`decks/${theme.name}/${mode}/assets/two-views.svg`, output));
  }
  for (const asset of themeAssets({ light: theme.name, dark: theme.name, mode: "auto" }, catalog)) assets.add(asset);
}
for (const asset of assets) copy(new URL(`_extensions/htmpres/themes/${asset}`, root), new URL(`assets/htmpres-themes/${asset}`, output));
// Vendor site fonts from the same licensed bundle; do not depend on a sibling checkout.
for (const asset of catalog.themes.nocturne.assets) {
  if (asset.startsWith("fonts/")) copy(new URL(`_extensions/htmpres/themes/${asset}`, root), new URL(`docs/_extensions/nocturne/${asset}`, root));
}
const titles = slideTitles(read("decks/example/index.qmd"));
write("manifest.json", JSON.stringify({ version: 1, themes, slides: titles }, null, 2) + "\n");
write("source/index.qmd.txt", read("decks/example/index.qmd"));
write("source/source.css.txt", read("decks/example/source.css"));
copy(new URL("decks/example/assets/two-views.svg", root), new URL("source/two-views.svg", output));
write("source/README.txt", "Save index.qmd.txt as index.qmd and source.css.txt as source.css; place two-views.svg in assets/. Render with just render <path>/index.qmd. The QMD includes presenter notes.\n");
console.log(`Built ${themes.length} themes and ${themes.reduce((sum, theme) => sum + theme.modes.length * 2, 0)} deck views in docs/_generated`);
