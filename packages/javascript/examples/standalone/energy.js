import {loadSpec, theme, colorScale}
  from "./node_modules/plotfoundry/src/index.js";
import {plot, scatterValues, legend, loadFonts, stylePlot}
  from "./node_modules/plotfoundry/src/observable.js";
const spec = await loadSpec();
const config = theme(spec, "tufte", {mode:"dark", profile:"reading"});
const fonts = await loadFonts(config);
const sensors = Array.from({length:18}, (_,i) => ({
  temperature:12+i, load:20+(i%6)*5+Math.floor(i/6)*2,
  energy:i===5 ? null : 10+i*3
}));
const scale = colorScale(config, {vmin:10, vmax:61});
const chart = plot(config, {
  height:384,
  x:{label:"Temperature (C)"}, y:{label:"Load (%)"},
  marks:scatterValues(config, sensors, {
    x:"temperature", y:"load", value:"energy", scale
  })
});
stylePlot(config, chart);
document.querySelector("#chart").append(chart,
  legend(config, {scale, label:"Energy (kWh)"}));
// Dispose fonts when removing every chart that uses this session.
globalThis.plotfoundryExample = {config, chart, fonts};
