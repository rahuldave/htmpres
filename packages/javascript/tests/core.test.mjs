import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  loadSpec,
  theme,
  normalize,
  lookup,
  categories,
} from "../src/index.js";
const readResource = async (path) =>
  new Uint8Array(
    await readFile(new URL("../resources/" + path, import.meta.url)),
  );
test("approved snapshot resolves72cases without DOM or Plot", async () => {
  const spec = await loadSpec({ readResource });
  assert.equal(spec.cases.length, 72);
  for (const c of spec.cases)
    assert.equal(
      theme(spec, c.theme, {
        mode: c.mode,
        profile: c.profile,
        surface: c.surface,
      }).case.id,
      c.id,
    );
});
test("explicit normalization clips, preserves missing and extreme finite ranges", () => {
  assert.equal(normalize(0, -1e308, 1e308), 0.5);
  assert.equal(normalize(3, -2, 8, { center: 3 }), 0.5);
  assert.equal(normalize(null, 0, 1), null);
  assert.equal(normalize(NaN, 0, 1), null);
  for (const bad of [true, "1", Infinity])
    assert.throws(() => normalize(bad, 0, 1));
});
test("exact listed bins and variant-scoped explicit domains", async () => {
  const spec = await loadSpec({ readResource });
  const s = theme(spec, "tufte");
  assert.deepEqual(
    lookup(s, 0.5, { map: "BrBG" }),
    spec.maps.BrBG.samples[128],
  );
  const slots = categories(s, ["beta", "alpha"], ["alpha"]);
  assert.equal(slots[0].id, "B");
  assert.throws(() => categories(s, ["A", "A"], []));
  assert.throws(() => categories(s, ["A"], ["B"]));
  for (const bad of [1, true, ["cividis"]])
    assert.throws(() => lookup(s, 0.5, { map: bad }));
});
test("dense category IDs, owned glyph copies and representable SVG lengths", async () => {
  const spec = await loadSpec({ readResource });
  const s = theme(spec, "tufte");
  assert.throws(() => categories(s, Array(1), [undefined]));
  assert.throws(() => categories(s, ["A"], Array(1)));
  const { glyphs, size } = await import("../src/index.js");
  const hash = s.case.fonts.ui;
  const a = glyphs(spec, hash);
  a.push(999999);
  assert.ok(!glyphs(spec, hash).includes(999999));
  assert.throws(() => theme(spec, "tufte", { width: Number.MIN_VALUE }));
  assert.throws(() =>
    size(theme(spec, "tufte", { width: Number.MAX_VALUE }), Number.MAX_VALUE),
  );
});
test("reader cannot substitute bytes after hash using an overridden slice", async () => {
  const malicious = async (path) => {
    const b = await readResource(path);
    if (path === "data/spec.json")
      b.slice = () => new TextEncoder().encode('{"specVersion":"UNVERIFIED"}');
    return b;
  };
  assert.equal(
    (await loadSpec({ readResource: malicious })).specVersion,
    "0.1.0",
  );
});
