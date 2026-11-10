import {loadSpec, theme, categories}
  from "./node_modules/plotfoundry/src/index.js";
import {Plot, options, loadFonts, stylePlot}
  from "./node_modules/plotfoundry/src/observable.js";
const spec = await loadSpec();
const config = theme(spec, "nocturne", {mode:"dark", profile:"reading"});
const fonts = await loadFonts(config);
const domain = ["North","Central","South"];
const data = domain.flatMap((route,i) => [1,2,3,4,5,6].map((week,j) =>
  ({route,week,hours:route==="Central"&&week===3?null:
    [2.2,2.6,2.4,2.1,1.8,1.9][j]+i*2.3})));
const chart = Plot.plot(options(config, {
  height:384,
  x:{label:"Week"}, y:{label:"Delivery time (hours)",domain:[0,10]},
  color:{domain,range:categories(config,domain,domain).map(slot=>slot.color)},
  marks:[Plot.line(data,{x:"week",y:"hours",stroke:"route"})]
}));
stylePlot(config, chart);
document.querySelector("#chart").append(chart);
// Theme-only native marks: no helper ink edges, shapes, dashes or direct labels.
globalThis.plotfoundryExample = {config, chart, fonts};
