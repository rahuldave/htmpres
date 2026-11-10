/** Maintainer verification, independent of Python/R runtime. Never regenerates to hide drift. */
import { readFile, readdir, lstat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { loadSpec } from "../src/node.js";
import { packageInfo } from "../src/index.js";
import {pins as vendorPins} from "../src/vendor-pins.js";
const root = resolve(import.meta.dirname, "..");
const hash = (b) => createHash("sha256").update(b).digest("hex");
const provenance = JSON.parse(await readFile(root + "/vendor/provenance.json"));
assert.equal(
  provenance.lockSha256,
  hash(await readFile(root + "/package-lock.json")),
);
async function files(dir, prefix = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error("Vendor symlink");
    if (entry.isDirectory())
      out.push(
        ...(await files(dir + "/" + entry.name, prefix + entry.name + "/")),
      );
    else if (entry.isFile()) out.push(prefix + entry.name);
    else throw Error("Nonregular vendor file");
  }
  return out;
}
if ((await lstat(root + "/vendor")).isSymbolicLink())
  throw Error("Vendor root symlink");
const actual = await files(root + "/vendor");
assert.deepEqual(
  actual.filter((n) => n !== "provenance.json").sort(),
  Object.keys(provenance.files).sort(),
);
for (const [path, sha] of Object.entries(provenance.files))
  assert.equal(hash(await readFile(root + "/vendor/" + path)), sha, path);
for(const [path,sha] of Object.entries(vendorPins))assert.equal(hash(await readFile(root+"/vendor/"+path)),sha,path);
assert.deepEqual(actual.sort(),Object.keys(vendorPins).sort());
const meta = JSON.parse(await readFile(root + "/package.json"));
assert.equal(packageInfo().version, meta.version);
assert.ok(!meta.dependencies);
assert.ok(!meta.scripts?.postinstall);
const spec = await loadSpec();
assert.equal(spec.cases.length, 72);
console.log("Native JavaScript closure, versions, notices and72cases verified");
