import { loadSpec, theme, colorScale, packageInfo } from "../src/index.js";
import {
  Plot,
  line,
  scatter,
  scatterValues,
  heatmap,
  plot,
  options,
  loadFonts,
  stylePlot,
  watchPlot,
  legend,
  exportSvg,
  exportPng,
} from "../src/observable.js";
import { deliveries, sensors, changes } from "./data.js";
export const spec = await loadSpec();
document.querySelector("#identity").textContent = JSON.stringify(packageInfo());
const select = document.querySelector("#case");
for (const c of spec.cases) select.add(new Option(c.id, c.id));
let fontSession, observer, current;
export async function renderCase(caseId) {
  const c = spec.cases.find((c) => c.id === caseId);
  if (!c) throw Error("Unknown case");
  fontSession?.dispose();
  observer?.dispose();
  const s = theme(spec, c.theme, c);
  fontSession = await loadFonts(s);
  document.querySelector("#plots").replaceChildren();
  const marks = line(s, deliveries, {
    x: "week",
    y: "hours",
    category: "route",
    domain: ["North", "Central", "South"],
  });
  const chart = plot(s, {
    height: s.width * 0.6,
    x: { label: "Week" },
    y: { label: "Delivery time (hours)", domain: [0, 10] },
    marks,
  });
  const heading = document.createElement("h2");
  heading.textContent = "Delivery time by route";
  heading.dataset.pfRole = "heading";
  heading.style.fontSize = s.case.typography.heading * s.scale + "px";
  const wrap = document.createElement("figure");
  wrap.append(heading, chart);
  stylePlot(s, wrap);
  document.querySelector("#plots").append(wrap);
  observer = watchPlot(s, wrap);
  const seq = colorScale(s, { vmin: 10, vmax: 61 });
  const continuous = plot(s, {
    height: s.width * 0.5,
    x: { label: "Temperature (C)" },
    y: { label: "Load (%)" },
    marks: scatterValues(s, sensors, {
      x: "temperature",
      y: "load",
      value: "energy",
      scale: seq,
    }),
  });
  stylePlot(s, continuous);
  document
    .querySelector("#plots")
    .append(continuous, legend(s, { scale: seq, label: "Energy (kWh)" }));
  const div = colorScale(s, {
    kind: "diverging",
    vmin: -2,
    center: 0,
    vmax: 8,
  });
  const cells = plot(s, {
    height: s.width * 0.4,
    x: {
      domain: [0, 4],
      ticks: [0.5, 1.5, 2.5, 3.5],
      tickFormat: (v) => "Week " + Math.floor(v + 1),
      label: null,
    },
    y: {
      domain: [0, 3],
      ticks: [0.5, 1.5, 2.5],
      tickFormat: (v) => ["Mill", "Depot", "Hub"][Math.floor(v)],
      label: null,
      reverse: true,
    },
    marks: heatmap(s, changes, { value: "change", scale: div }),
  });
  stylePlot(s, cells);
  document
    .querySelector("#plots")
    .append(cells, legend(s, { scale: div, label: "Change (hours)" }));
  current = { s, chart, wrap, continuous, cells };
  globalThis.fixture = {
    ...current,
    spec,
    Plot,
    options,
    scatter,
    stylePlot,
    loadFonts,
    line,
    legend,
    colorScale,
    exportSvg,
    exportPng,
    packageInfo,
  };
  document.querySelector("#status").textContent = "Ready: " + s.case.id;
  select.value = caseId;
  return current;
}
select.addEventListener("change", () =>
  renderCase(select.value).catch(
    (e) => (document.querySelector("#status").textContent = e.message),
  ),
);
document.querySelector("#save").addEventListener("click", async () => {
  const result = await exportSvg(current.s, current.chart);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(result.blob);
  a.download = "deliveries.svg";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
await renderCase(
  new URLSearchParams(location.search).get("case") ?? spec.cases[0].id,
);
globalThis.renderCase = renderCase;
