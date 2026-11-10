import {loadSpec, theme} from "./node_modules/plotfoundry/src/index.js";
import {line, plot, loadFonts, stylePlot, watchPlot, exportSvg, exportPng}
  from "./node_modules/plotfoundry/src/observable.js";
const spec = await loadSpec();
const config = theme(spec, "folio", {mode: "light", profile: "reading"});
const fonts = await loadFonts(config);
const deliveries = ["North", "Central", "South"].flatMap((route, i) =>
  [1,2,3,4,5,6].map((week, j) => ({route, week,
    hours: route === "Central" && week === 3 ? null :
      [2.2,2.6,2.4,2.1,1.8,1.9][j] + i * 2.3})));
const chart = plot(config, {
  height: 384, x: {label: "Week"},
  y: {label: "Delivery time (hours)", domain: [0,10]},
  marks: line(config, deliveries, {
    x: "week", y: "hours", category: "route",
    domain: ["North", "Central", "South"]
  })
});
stylePlot(config, chart);
document.querySelector("#chart").append(chart);
const observer = watchPlot(config, chart);
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.textContent = "Download " + name;
  document.querySelector("#downloads").append(link, " ");
  // Revoke the URL when your app removes the link.
}
download((await exportSvg(config, chart)).blob, "deliveries.svg");
download((await exportPng(config, chart, {pixelRatio:2})).blob, "deliveries.png");
// When removing the chart: observer.dispose(); fonts.dispose();
globalThis.plotfoundryExample = {config, chart};
