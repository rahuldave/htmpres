import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(path.join(tmpdir(), "htmpres-theme-parity-"));

function assetSnapshot(dir, prefix = "") {
  if (!existsSync(dir)) return {};
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    const key = prefix + entry.name;
    return entry.isDirectory() ? Object.entries(assetSnapshot(file, key + "/")) : [[key, readFileSync(file)]];
  }));
}

for (const [name, declaration] of Object.entries({
  light: "  theme: folio\n  color-mode: light",
  dark: "  theme: nocturne\n  color-mode: dark",
  auto: "  theme: zephyr-reading\n  color-mode: auto",
  paired: "  theme:\n    light: litera-reading\n    dark: darkly-reading",
  legacy: "  theme: mono-grid",
})) {
  test(`Deno and Node render the same theme contract: ${name}`, () => {
    const dir = path.join(scratch, name);
    mkdirSync(dir);
    const source = path.join(dir, "index.qmd");
    writeFileSync(source, `---\ndeck:\n${declaration}\n  css: custom.css\n---\n\n## A theme\n\nRead **this**.\n\n::: notes\nPrivate cue.\n:::\n`);
    const custom = 'html[data-theme="folio"] { --paper: #fdf0df; }\n';
    writeFileSync(path.join(dir, "custom.css"), custom);
    execFileSync("quarto", ["run", path.join(root, "scripts/htmpres.ts"), "render", source], { cwd: root, stdio: "pipe" });
    const deno = ["index.html", "presenter.html"].map(file => readFileSync(path.join(dir, file), "utf8"));
    const assets = path.join(dir, "assets", "htmpres-themes");
    const denoAssets = assetSnapshot(assets);
    rmSync(assets, { recursive: true, force: true });
    execFileSync(process.execPath, [path.join(root, "scripts/qmd-to-html.mjs"), source], { cwd: root, stdio: "pipe" });
    assert.deepEqual(assetSnapshot(assets), denoAssets, "Node must independently recreate fonts and licenses");
    const node = ["index.html", "presenter.html"].map(file => readFileSync(path.join(dir, file), "utf8"));
    for (let i = 0; i < 2; i++) {
      const attributes = html => Object.fromEntries([...html.match(/<html([^>]+)>/)[1].matchAll(/(data-[\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
      assert.deepEqual(attributes(deno[i]), attributes(node[i]));
      const script = html => html.match(/<script>\(function initializeColorMode[\s\S]*?<\/script>/)?.[0];
      assert.equal(script(deno[i]), script(node[i]));
      const themeCss = html => html.split("<style>\n")[1].split("/* Custom htmpres runtime overrides")[0];
      assert.equal(themeCss(deno[i]), themeCss(node[i]));
      assert.equal(deno[i].includes('id="colorModeBtn"'), name !== "legacy");
    }
    assert.equal(readFileSync(path.join(dir, "custom.css"), "utf8"), custom);
    assert.ok(!node[0].includes("Private cue."));
    assert.ok(node[1].includes("Private cue."));
  });
}
