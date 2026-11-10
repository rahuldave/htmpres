import test from "node:test";
import assert from "node:assert/strict";
import {
  cp,
  mkdtemp,
  readFile,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSpec } from "../src/node.js";
const source = new URL("../resources", import.meta.url);
test("complete pins reject coherent spec/inventory drift and font bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "plotfoundry-js-mutation-"));
  try {
    await cp(source, root, { recursive: true });
    const path = join(root, "data/spec.json"),
      s = JSON.parse(await readFile(path));
    s.categories.treatment.foreground_css_px = 0.01;
    const bytes = Buffer.from(JSON.stringify(s));
    await writeFile(path, bytes);
    const { createHash } = await import("node:crypto");
    const manifestPath = join(root, "data/manifest.json"),
      m = JSON.parse(await readFile(manifestPath));
    m.files["spec.json"].sha256 = createHash("sha256")
      .update(bytes)
      .digest("hex");
    await writeFile(manifestPath, JSON.stringify(m));
    await assert.rejects(loadSpec({ root }), /mismatch/);
    await cp(source, root, { recursive: true, force: true });
    const fontPath = join(root, "data/fonts/dm-sans-400-normal.ttf");
    const font = await readFile(fontPath);
    font[font.length - 1] ^= 1;
    await writeFile(fontPath, font);
    await assert.rejects(loadSpec({ root }), /mismatch/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("native Node resources reject extra files and root/nested symlinks", async () => {
  const temp = await mkdtemp(join(tmpdir(), "plotfoundry-js-closure-")),
    root = join(temp, "resources");
  try {
    await cp(source, root, { recursive: true });
    const extra = join(root, "private.txt");
    await writeFile(extra, "not shipped");
    await assert.rejects(loadSpec({ root }), /closure/);
    await rm(extra);
    await symlink(join(root, "data/spec.json"), extra);
    await assert.rejects(loadSpec({ root }), /symlink/);
    await rm(extra);
    await symlink(root, join(temp, "alias"));
    await assert.rejects(loadSpec({ root: join(temp, "alias") }), /symlink/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
test("vendor mutation and missing notice fail closure checks", async () => {
  const { spawnSync } = await import("node:child_process");
  const root = await mkdtemp(join(tmpdir(), "plotfoundry-js-vendor-"));
  const sourceRoot = new URL("../", import.meta.url);
  try {
    for (const name of [
      "src",
      "resources",
      "vendor",
      "tools",
      "package.json",
      "package-lock.json",
    ])
      await cp(new URL(name, sourceRoot), join(root, name), {
        recursive: true,
      });
    const bundle = join(root, "vendor/plot.js"),
      original = await readFile(bundle);
    await writeFile(
      bundle,
      Buffer.concat([original, Buffer.from("\n// drift")]),
    );
    let result = spawnSync(
      process.execPath,
      [join(root, "tools/check-package.mjs")],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    await writeFile(bundle, original);
    const provenance = JSON.parse(
        await readFile(join(root, "vendor/provenance.json")),
      ),
      notice = Object.keys(provenance.files).find((n) =>
        n.startsWith("notices/"),
      );
    await rm(join(root, "vendor", notice));
    result = spawnSync(
      process.execPath,
      [join(root, "tools/check-package.mjs")],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("vendor builder rejects output symlinks before touching an external sentinel", async () => {
  const { spawnSync } = await import("node:child_process");
  const root = await mkdtemp(join(tmpdir(), "plotfoundry-js-build-"));
  try {
    await cp(new URL("../tools", import.meta.url), join(root, "tools"), {
      recursive: true,
    });
    await symlink(
      new URL("../node_modules", import.meta.url),
      join(root, "node_modules"),
      "dir",
    );
    const outside = join(root, "outside");
    await cp(new URL("../vendor", import.meta.url), outside, {
      recursive: true,
    });
    const sentinel = join(outside, "plot.js"),
      before = await readFile(sentinel);
    await symlink(outside, join(root, "vendor"), "dir");
    const result = spawnSync(
      process.execPath,
      [join(root, "tools/build-vendor.mjs")],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symlink/);
    assert.deepEqual(await readFile(sentinel), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
