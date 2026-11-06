import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { colorModeScript, legacyThemes, resolveTheme, themeAssets, themeAttributes, themeStyles } from "../_extensions/htmpres/themes/themes.mjs";

const catalog = JSON.parse(readFileSync(new URL("../_extensions/htmpres/themes/catalog.json", import.meta.url), "utf8"));
const plan = (name, mode = "auto") => resolveTheme({ "deck.theme": name, "deck.color-mode": mode }, catalog);

test("catalog contains every local public theme, with two distinct palettes", () => {
  const stock = "cerulean cosmo cyborg darkly flatly journal litera lumen lux materia minty morph pulse quartz sandstone simplex sketchy slate solar spacelab superhero united vapor yeti zephyr".split(" ");
  const additional = "bootstrap folio atelier nocturne zephyr-reading simplex-reading pulse-reading litera-reading darkly-reading tufte".split(" ");
  assert.deepEqual(Object.keys(catalog.themes).sort(), [...stock, ...additional].sort());
  assert.deepEqual(legacyThemes, ["sage", "mono-grid", "blank"]);
  for (const [name, entry] of Object.entries(catalog.themes)) {
    assert.notEqual(entry.palettes.light.paper, entry.palettes.dark.paper, name);
    assert.match(catalog.sources[name].sha256, /^[a-f0-9]{64}$/);
    for (const mode of ["light", "dark"]) {
      for (const key of ["paper", "ink", "panel", "line", "accent", "muted", "secondary", "code"]) {
        assert.match(entry.palettes[mode][key], /^#[0-9a-f]{6}$/i, `${name} ${mode} ${key}`);
      }
      assert.match(themeStyles(plan(name, mode), catalog), new RegExp(`--paper: ${entry.palettes[mode].paper}`));
    }
  }
});

test("native anchors and Reading typography retain their source identity", () => {
  assert.equal(catalog.themes.folio.palettes.light.paper, "#f8f4eb");
  assert.equal(catalog.themes.folio.palettes.dark.paper, "#14271e");
  assert.equal(catalog.themes["darkly-reading"].palettes.dark.paper, "#222222");
  assert.equal(catalog.themes["litera-reading"].palettes.light.paper, "#ffffff");
  assert.match(catalog.themes["zephyr-reading"].body, /Inter/);
  assert.match(catalog.themes["simplex-reading"].body, /Open Sans/);
  assert.match(catalog.themes.journal.heading, /News Cycle.*Arial Narrow Bold/);
  assert.match(catalog.themes.minty.heading, /Montserrat/);
  assert.match(catalog.themes.sketchy.heading, /Cabin Sketch.*cursive/);
  assert.equal(catalog.themes.tufte.palettes.light.paper, "#fffff8");
  assert.equal(catalog.themes.tufte.palettes.dark.paper, "#151515");
});

test("configuration handles scalar, paired, local, legacy and invalid declarations", () => {
  assert.deepEqual(plan("folio"), { light: "folio", dark: "folio", mode: "auto" });
  assert.deepEqual(resolveTheme({ "deck.theme.light": "litera-reading", "deck.theme.dark": "darkly-reading" }, catalog),
    { light: "litera-reading", dark: "darkly-reading", mode: "auto" });
  assert.equal(resolveTheme({ "deck.theme": "mono-grid" }, catalog), null);
  assert.equal(resolveTheme({}, catalog), null);
  assert.equal(resolveTheme({ "deck.theme": "my-local" }, catalog), null);
  const seed = themeStyles(plan("folio"), catalog, "my-folio");
  assert.deepEqual(resolveTheme({ "deck.theme": "my-folio" }, catalog, seed), { light: "my-folio", dark: "my-folio", mode: "auto" });
  assert.deepEqual(resolveTheme({ "deck.theme": "my-folio" }, catalog, seed.replaceAll('"', "'")), { light: "my-folio", dark: "my-folio", mode: "auto" });
  assert.equal(resolveTheme({ "deck.theme": "mono-grid" }, catalog, seed + '\nhtml[data-theme="mono-grid"] { --paper: white; }'), null);
  assert.throws(() => plan("folio", "sepia"), /Invalid deck.color-mode/);
  assert.throws(() => resolveTheme({ "deck.theme.light": "folio" }, catalog), /both light and dark/);
  assert.throws(() => resolveTheme({ "deck.theme.light": "folio", "deck.theme.dark": "missing" }, catalog), /Unknown paired theme/);
  assert.throws(() => plan("my-local", "dark"), /requires a bundled theme/);
  assert.throws(() => themeStyles(plan("folio"), catalog, 'bad"]{}'), /Invalid theme name/);
});

test("generated CSS keeps mode specificity low and all font URLs portable", () => {
  for (const name of Object.keys(catalog.themes)) {
    const css = themeStyles(plan(name), catalog);
    assert.ok(css.includes(`html[data-theme="${name}"]:where([data-color-mode="light"])`));
    assert.doesNotMatch(css, /@import|https?:\/\/(?!github)/);
    const assets = themeAssets(plan(name), catalog);
    for (const [, url] of css.matchAll(/url\(([^)]+)\)/g)) {
      assert.ok(url.startsWith("assets/htmpres-themes/"), url);
      assert.ok(assets.includes(url.replace("assets/htmpres-themes/", "")), url);
    }
    for (const file of assets) assert.ok(existsSync(new URL(`../_extensions/htmpres/themes/${file}`, import.meta.url)), file);
  }
  assert.deepEqual(themeAttributes(plan("folio", "dark"))["data-color-mode"], "dark");
  assert.equal(themeStyles(null, catalog), "");
});

function browser(config, { systemDark = false, saved = null, blockedStorage = false } = {}) {
  const events = new Map();
  const buttonEvents = new Map();
  const attributes = new Map();
  const button = { textContent: "", setAttribute: (k, v) => attributes.set(k, v), getAttribute: k => attributes.get(k),
    addEventListener: (k, v) => buttonEvents.set(k, v) };
  const root = { dataset: {}, style: {}, classList: { toggle() {} } };
  const media = { matches: systemDark, addEventListener: (k, v) => events.set("system", v) };
  const storage = new Map();
  const context = {
    document: { documentElement: root, getElementById: () => button, addEventListener: (k, v) => events.set(k, v) },
    location: { pathname: "/talk/index.html" }, Event: class {},
    window: { matchMedia: () => media, dispatchEvent() {}, addEventListener: (k, v) => events.set(k, v) },
    localStorage: { getItem() { if (blockedStorage) throw Error("blocked"); return saved; },
      setItem(k, v) { if (blockedStorage) throw Error("blocked"); storage.set(k, v); } },
  };
  const script = colorModeScript(config).replace(/^<script>/, "").replace(/<\/script>$/, "");
  vm.runInNewContext(script, context);
  events.get("DOMContentLoaded")();
  return { root, button, attributes, storage, buttonEvents, click: () => buttonEvents.get("click")(),
    receive: value => events.get("storage")({ key: "htmpres-color-mode:/talk/:folio:folio", newValue: value }),
    system: dark => { media.matches = dark; events.get("system")(); } };
}

test("auto tracks the system, cycles modes, and exposes accessible state", () => {
  const b = browser(plan("folio"), { systemDark: true });
  assert.equal(b.root.dataset.colorMode, "dark");
  b.system(false);
  assert.equal(b.root.dataset.colorMode, "light");
  b.click();
  assert.equal(b.root.dataset.colorModeChoice, "light");
  b.system(true);
  assert.equal(b.root.dataset.colorMode, "light");
  b.click();
  assert.equal(b.root.dataset.colorMode, "dark");
  assert.match(b.attributes.get("aria-label"), /dark.*auto/);
  b.click();
  assert.equal(b.root.dataset.colorModeChoice, "auto");
  assert.ok([...b.storage.keys()][0].includes("/talk/:folio:folio"));
  let stopped = false;
  b.buttonEvents.get("keydown")({ stopPropagation() { stopped = true; } });
  assert.ok(stopped, "mode-control keyboard events must not advance slides");
  b.receive("light");
  assert.equal(b.root.dataset.colorMode, "light", "presenter and audience should respond to shared preference changes");
});

test("fixed declarations win initially, storage failures are harmless, pairs switch names", () => {
  assert.equal(browser(plan("folio", "light"), { systemDark: true, saved: "dark" }).root.dataset.colorMode, "light");
  assert.equal(browser(plan("folio", "dark"), { saved: "light" }).root.dataset.colorMode, "dark");
  const b = browser(plan("folio"), { systemDark: true, blockedStorage: true });
  b.click();
  assert.equal(b.root.dataset.colorMode, "light");
  const pair = resolveTheme({ "deck.theme.light": "litera-reading", "deck.theme.dark": "darkly-reading" }, catalog);
  const paired = browser(pair, { systemDark: true });
  assert.equal(paired.root.dataset.theme, "darkly-reading");
  paired.system(false);
  assert.equal(paired.root.dataset.theme, "litera-reading");
});
