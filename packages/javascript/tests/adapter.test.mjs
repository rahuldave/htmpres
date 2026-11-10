import test from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/node.js";
import { theme, colorScale } from "../src/index.js";
import { createPlotAdapter, loadFonts } from "../src/observable.js";
const spec = await loadSpec(),
  s = theme(spec, "tufte");
const fake = Object.fromEntries(
  ["plot", "line", "dot", "text", "rect", "link", "legend"].map((name) => [
    name,
    (data, options) => ({ name, data, options }),
  ]),
);
const adapter = createPlotAdapter(fake, { version: "0.6.19" });
test("layered categories preserve domains, gaps, facets and physical shared dashes", () => {
  const data = [
    { x: 0, y: 1, category: "B", cohort: "one" },
    { x: 1, y: null, category: "B", cohort: "one" },
    { x: 2, y: 3, category: "B", cohort: "two" },
  ];
  const before = structuredClone(data);
  const marks = adapter.line(s, data, { domain: ["A", "B"], fx: "cohort" });
  assert.deepEqual(data, before);
  assert.equal(marks[0].options.strokeWidth, 5.5);
  assert.equal(marks[1].options.strokeWidth, 2.5);
  assert.deepEqual(marks[0].options.strokeDasharray, [9.25, 4]);
  assert.deepEqual(marks[1].options.strokeDasharray, [9.25, 4]);
  assert.ok(Number.isNaN(marks[0].data[1].__pf_y));
  assert.equal(marks.at(-1).data.length, 2);
  const solid = adapter.line(s, [{ x: 0, y: 1, category: "A" }], {
    domain: ["A"],
  });
  assert.equal(solid[0].options.strokeLinecap, "square");
  assert.equal(marks[0].options.strokeLinecap, "butt");
});
test("helpers reject invalid input before native mark construction", () => {
  for (const bad of [Array(1), [undefined], [{ x: true, y: 0, category: "A" }]])
    assert.throws(() => adapter.line(s, bad, { domain: ["A"] }));
  assert.throws(() => adapter.line(s, [], { domain: ["A"], curve: "basis" }));
  assert.throws(() => adapter.plot(s, { projection: "mercator" }));
  assert.throws(() =>
    adapter.heatmap(s, Array(1), {
      scale: colorScale(s, { vmin: 0, vmax: 1 }),
    }),
  );
  assert.throws(() => createPlotAdapter({}));
});
test("missing cells freeze opposite diagonal coordinates; missing points retain cues", () => {
  const scale = colorScale(s, {
    kind: "diverging",
    vmin: -2,
    center: 0,
    vmax: 8,
  });
  const marks = adapter.heatmap(
    s,
    [{ x1: 0, x2: 1, y1: 0, y2: 1, value: null }],
    { scale },
  );
  const a = marks[1].options,
    b = marks[2].options,
    d = marks[1].data[0];
  assert.notEqual(a.y1(d), b.y1(d));
  assert.equal(a.y1(d), b.y2(d));
  assert.equal(a.stroke, s.case.roles.background);
  assert.equal(
    adapter.scatterValues(s, [{ x: 0, y: 0, value: null }], { scale }).length,
    2,
  );
});
test("font sessions coalesce concurrent loads and release only owned faces", async () => {
  const fonts = new Set();
  let loads = 0;
  class Face {
    constructor(f) {
      this.family = f;
    }
    async load() {
      loads++;
      await new Promise((r) => setTimeout(r, 3));
      return this;
    }
  }
  const document = { fonts, defaultView: { FontFace: Face } };
  const [a, b] = await Promise.all([
    loadFonts(s, { document }),
    loadFonts(s, { document }),
  ]);
  assert.equal(loads, 2);
  assert.equal(fonts.size, 2);
  a.dispose();
  assert.equal(fonts.size, 2);
  b.dispose();
  assert.equal(fonts.size, 0);
  b.dispose();
});
test('forged and cross-theme scales fail before drawing',()=>{
 const rows=[{x1:0,x2:1,y1:0,y2:1,value:0}];
 assert.throws(()=>adapter.heatmap(s,rows,{scale:{color:()=>"red"}}),/colorScale/);
 const other=theme(spec,'folio');assert.throws(()=>adapter.heatmap(s,rows,{scale:colorScale(other,{vmin:0,vmax:1})}),/colorScale/);
});
