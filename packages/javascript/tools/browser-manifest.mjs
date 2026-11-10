/** Explicitly record reviewed browser-doc inputs; normal website builds only validate. */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const paths = [
  "src/index.js",
  "src/pins.js",
  "src/vendor-pins.js",
  "src/observable.js",
  "examples/browser.html",
  "examples/browser.js",
  "examples/data.js",
  "examples/quarto.qmd",
  "README.md",
  "LICENSE",
];
async function walk(dir) {
  for (const e of await readdir(root + "/" + dir, { withFileTypes: true })) {
    if (e.isSymbolicLink()) throw Error("Symlink");
    if (e.isDirectory()) await walk(dir + "/" + e.name);
    else if (e.isFile()) paths.push(dir + "/" + e.name);
  }
}
for (const name of ["deliveries", "energy", "changes", "native"])
  paths.push("examples/standalone/" + name + ".js");
await walk("resources");
await walk("vendor");
const files = {};
for (const p of paths.sort())
  files[p] = createHash("sha256")
    .update(await readFile(root + "/" + p))
    .digest("hex");
await writeFile(
  root + "/browser-manifest.json",
  JSON.stringify({ schemaVersion: 1, files }, null, 2) + "\n",
);
