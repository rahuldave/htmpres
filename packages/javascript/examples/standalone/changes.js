import {loadSpec, theme, colorScale}
  from "./node_modules/plotfoundry/src/index.js";
import {plot, heatmap, legend, loadFonts, stylePlot}
  from "./node_modules/plotfoundry/src/observable.js";
const spec = await loadSpec();
const config = theme(spec, "litera-reading", {mode:"light", profile:"reading"});
const fonts = await loadFonts(config);
const values = [-2,-1,0,2, 1,null,4,6, -1,0,3,8];
const cells = values.map((change,i) => ({
  week:i%4, plant:Math.floor(i/4),
  x1:i%4, x2:i%4+1, y1:Math.floor(i/4), y2:Math.floor(i/4)+1,
  change
}));
const scale = colorScale(config, {kind:"diverging", vmin:-2, center:0, vmax:8});
const chart = plot(config, {
  height:320,
  x:{domain:[0,4], ticks:[.5,1.5,2.5,3.5],
     tickFormat:v=>"Week "+Math.floor(v+1), label:null},
  y:{domain:[0,3], reverse:true, ticks:[.5,1.5,2.5],
     tickFormat:v=>["Mill","Depot","Hub"][Math.floor(v)], label:null},
  marks:heatmap(config, cells, {value:"change", scale})
});
stylePlot(config, chart);
document.querySelector("#chart").append(chart,
  legend(config, {scale, label:"Change in delivery time (hours)"}));
globalThis.plotfoundryExample = {config, chart, fonts};
