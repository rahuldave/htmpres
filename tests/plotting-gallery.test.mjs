import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { defaults, options, selection, selectedView, clearPlotSelection, plottingFailure } from "../docs/assets/plotting-gallery.mjs";
const manifest = JSON.parse(readFileSync(new URL("../docs/_plotting/manifest.json", import.meta.url)));
test("invalid URL states normalize to safe documented defaults", () => {
  assert.deepEqual(selection("?theme=javascript:alert(1)&mode=other&size=huge"), defaults);
  assert.equal(selection("?interface=r-base&theme=tufte&mode=dark&profile=presentation&surface=panel&size=intended").interface, "r-base");
});
test("all native control combinations resolve one public view", () => {
  let count = 0;
  for (const interface_ of options.interface) for (const theme of options.theme) for (const mode of options.mode) for (const profile of options.profile) for (const surface of options.surface) {
    const state = { interface: interface_, theme, mode, profile, surface };
    const view = selectedView(manifest.views, state);
    assert.equal(view.case, [theme, mode, profile, surface].join("/")); count++;
  }
  assert.equal(count, 216);
});
test("format availability is explicit and covers all families/native routes", () => {
  assert.equal(manifest.views.filter(v => v.interface === "python" && v.downloads.svg && v.downloads.pdf).length, 72);
  for (const interface_ of ["r-base", "r-ggplot"]) {
    const vector = manifest.views.filter(v => v.interface === interface_ && v.downloads.svg);
    assert.equal(vector.length, 9); assert.equal(new Set(vector.map(v => v.case.split("/")[0])).size, 9);
  }
});

test("loading and failed replacement clear every previous-case dependent field", () => {
  const fields = Object.fromEntries(["figure", "figcaption", "#plot-downloads", "#plot-preview", "#plot-metadata", "#plot-vector-policy", "#plot-reproduce", "#plot-status"].map(key => [key, { textContent: "old case", hidden: false, children: ["old download"], replaceChildren() { this.children = []; }, removeAttribute(name) { this.removed = name; } }]));
  const host = { querySelector: key => fields[key], setAttribute(name, value) { this[name] = value; } };
  clearPlotSelection(host);
  assert.equal(fields.figure.hidden, true); assert.equal(host["aria-busy"], "true");
  for (const key of ["figcaption", "#plot-metadata", "#plot-vector-policy", "#plot-reproduce"]) assert.equal(fields[key].textContent, "");
  assert.deepEqual(fields["#plot-downloads"].children, []); assert.equal(fields["#plot-preview"].removed, "src");
  plottingFailure(host, "Report unavailable");
  assert.equal(host["aria-busy"], "false"); assert.match(fields["#plot-status"].textContent, /Report unavailable/);
});
