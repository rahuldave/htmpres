/** Rebuild the locked browser closure. Validate all managed destinations before writing. */
import { build, version as esbuildVersion } from "esbuild";
import { readFile, writeFile, mkdir, readdir, lstat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "..");
const hash = (b) => createHash("sha256").update(b).digest("hex");
async function guard(path) {
  for (let p = path; ; p = dirname(p)) {
    try {
      if ((await lstat(p)).isSymbolicLink())
        throw Error("Managed vendor symlink: " + p);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    if (p === root) break;
    if (p === dirname(p)) throw Error("Managed output outside package");
  }
}
await guard(root + "/vendor");
async function checkTree(dir) {
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = dir + "/" + e.name;
      if (e.isSymbolicLink()) throw Error("Managed vendor symlink: " + p);
      if (e.isDirectory()) await checkTree(p);
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
await checkTree(root + "/vendor");
const files = {};
for (const [name, entry] of [
  ["plot.js", "@observablehq/plot/dist/plot.js"],
  ["opentype.js", "opentype.js/dist/opentype.module.js"],
]) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [root + "/node_modules/" + entry],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    outfile: root + "/vendor/" + name,
    legalComments: "inline",
    write: false,
  });
  files[name] = result.outputFiles[0].contents;
}
const lockBytes = await readFile(root + "/package-lock.json"),
  lock = JSON.parse(lockBytes),
  packages = [];
for (const [path, record] of Object.entries(lock.packages)) {
  if (!path || path.includes("esbuild")) continue;
  const notices = (await readdir(root + "/" + path)).filter((n) =>
    /^(LICENSE|COPYING)([.-]|$)/i.test(n),
  );
  if (!notices.length) throw Error("Missing dependency notice " + path);
  for (const name of notices) {
    const destination =
      path.replace("node_modules/", "").replaceAll("/", "-") + "-" + name;
    files["notices/" + destination] = await readFile(
      root + "/" + path + "/" + name,
    );
  }
  packages.push({
    name: path.replace("node_modules/", ""),
    version: record.version,
    integrity: record.integrity,
    license: record.license,
  });
}
const provenance = {
  plotVersion: "0.6.19",
  opentypeVersion: "1.3.4",
  esbuildVersion,
  target: "browser-es2022-esm",
  settings: {
    absWorkingDir: "package root",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    legalComments: "inline",
  },
  lockSha256: hash(lockBytes),
  files: Object.fromEntries(
    Object.entries(files).map(([p, b]) => [p, hash(b)]),
  ),
  packages,
};
files["provenance.json"] = new TextEncoder().encode(
  JSON.stringify(provenance, null, 2) + "\n",
);
await guard(root+"/src/vendor-pins.js");
const vendorPins=Object.fromEntries(Object.entries(files).map(([p,b])=>[p,hash(b)]));
for (const name of Object.keys(files)) await guard(root + "/vendor/" + name);
for (const [name, bytes] of Object.entries(files)) {
  const path = root + "/vendor/" + name;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
}
await writeFile(root+"/src/vendor-pins.js","// Generated native vendor closure; code is the trust root.\nexport const pins = Object.freeze("+JSON.stringify(vendorPins,null,2)+");\n");
console.log("Bundled pinned browser ESM and exact dependency notices");
