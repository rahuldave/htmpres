/** Optional Node resource reader. Browser/core imports never load Node built-ins. */
import { readFile, readdir, lstat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { loadSpec as coreLoadSpec } from "./index.js";
import { pins } from "./pins.js";
export async function loadSpec({
  root = fileURLToPath(new URL("../resources/", import.meta.url)),
} = {}) {
  const names = [];
  async function walk(dir) {
    if ((await lstat(dir)).isSymbolicLink())
      throw Error("Resource symlink rejected");
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isSymbolicLink()) throw Error("Resource symlink rejected");
      if (item.isDirectory()) await walk(path);
      else if (item.isFile())
        names.push(relative(root, path).replaceAll("\\", "/"));
      else throw Error("Only regular resources supported");
    }
  }
  await walk(root);
  if (JSON.stringify(names.sort()) !== JSON.stringify(Object.keys(pins).sort()))
    throw Error("Resource closure mismatch");
  return coreLoadSpec({
    readResource: async (name) =>
      new Uint8Array(await readFile(join(root, name))),
  });
}
