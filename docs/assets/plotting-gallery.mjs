/** Static, native-control gallery. No plotting runtime executes in the browser. */
export const defaults = { interface: "python", theme: "folio", mode: "light", profile: "reading", surface: "paper", size: "fit" };
export const options = {
  interface: ["python", "r-ggplot", "r-base"],
  theme: ["folio", "atelier", "nocturne", "tufte", "zephyr-reading", "simplex-reading", "pulse-reading", "litera-reading", "darkly-reading"],
  mode: ["light", "dark"], profile: ["reading", "presentation"], surface: ["paper", "panel"], size: ["fit", "intended"],
};
export function selection(search) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, options[key].includes(params.get(key)) ? params.get(key) : fallback]));
}
export function selectedView(views, state) {
  return views.find(view => view.interface === state.interface && view.case === [state.theme, state.mode, state.profile, state.surface].join("/"));
}
export function clearPlotSelection(host) {
  host.querySelector("figure").hidden = true;
  host.setAttribute("aria-busy", "true");
  host.querySelector("#plot-downloads").replaceChildren();
  host.querySelector("#plot-preview").removeAttribute("src");
  host.querySelector("#plot-preview").alt = "";
  for (const selector of ["figcaption", "#plot-metadata", "#plot-vector-policy", "#plot-reproduce"]) host.querySelector(selector).textContent = "";
}
export function plottingFailure(host, message) {
  clearPlotSelection(host);
  host.setAttribute("aria-busy", "false");
  host.querySelector("#plot-status").textContent = `${message}. Use the static download index below.`;
}
const host = globalThis.document?.querySelector("#plotting-gallery");
if (host) {
  const base = new URL("../_generated/plotting/", import.meta.url);
  const status = host.querySelector("#plot-status");
  const figure = host.querySelector("figure");
  const preview = host.querySelector("#plot-preview");
  const links = host.querySelector("#plot-downloads");
  const selectors = Object.fromEntries(Object.keys(defaults).map(key => [key, host.querySelector(`#plot-${key}`)]));
  let generation = 0;
  const labels = { python: "Python · Matplotlib", "r-ggplot": "R · ggplot2", "r-base": "R · base graphics" };
  for (const [key, select] of Object.entries(selectors)) {
    for (const value of options[key]) {
      const item = document.createElement("option"); item.value = value;
      item.textContent = key === "interface" ? labels[value] : value.replaceAll("-", " ");
      select.append(item);
    }
  }
  try {
    const response = await fetch(new URL("manifest.json", base));
    if (!response.ok) throw new Error("Gallery manifest unavailable");
    const manifest = await response.json();
    async function show(fromURL = false) {
      const serial = ++generation;
      const state = fromURL ? selection(location.search) : Object.fromEntries(Object.entries(selectors).map(([key, element]) => [key, element.value]));
      for (const [key, value] of Object.entries(state)) selectors[key].value = value;
      const url = new URL(location.href); url.search = new URLSearchParams(state).toString();
      if (fromURL) history.replaceState(null, "", url); else history.pushState(null, "", url);
      const view = selectedView(manifest.views, state);
      clearPlotSelection(host);
      status.textContent = `Loading ${labels[state.interface]} · ${view.case}…`;
      try {
        const image = new Image();
        const loaded = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error("Image could not be loaded")); });
        image.src = new URL(view.downloads.png, base).href;
        const getReport = async () => {
          const response = await fetch(new URL(view.report, base));
          if (!response.ok) throw new Error("Export report could not be loaded");
          return response.json();
        };
        const [report] = await Promise.all([getReport(), loaded]);
        if (serial !== generation) return;
        preview.src = image.src;
        preview.alt = `${labels[state.interface]}, ${view.case}. Categorical lines and edged markers with direct labels; sequential and centered heatmaps with crossed missing cells.`;
        preview.style.setProperty("--plot-placement", `${view.placedWidthCssPx}px`);
        preview.classList.toggle("is-intended", state.size === "intended");
        host.querySelector("figcaption").textContent = `${labels[state.interface]} · ${view.case}. Native canvas ${view.canvasInches.join(" × ")} inches; intended width ${view.placedWidthCssPx} CSS pixels. ${state.size === "fit" ? "Fit preview shrinks the labels; choose intended width to inspect their placed size." : "Intended-width preview: scroll horizontally on a narrow screen."}`;
        host.querySelector("#plot-metadata").textContent = `Spec ${report.specVersion}; ${Object.entries(report.devices).map(([name, version]) => `${name} ${version}`).join("; ")}. Figure palette is independent of the website theme.`;
        for (const [kind, path] of Object.entries(view.downloads)) {
          const link = document.createElement("a"); link.href = new URL(path, base); link.textContent = `Download ${kind.toUpperCase()}`; link.download = ""; links.append(link);
        }
        for (const [name, path] of [["Gallery source", view.source], ["Export report", view.report]]) {
          const link = document.createElement("a"); link.href = new URL(path, base); link.textContent = name; link.download = ""; links.append(link);
        }
        host.querySelector("#plot-vector-policy").textContent = view.downloads.svg ? "PNG, SVG and PDF are staged for this case." : "This case has PNG only in the website bundle. Run the downloaded gallery source for SVG/PDF; the native package supports them.";
        host.querySelector("#plot-reproduce").textContent = state.interface === "python" ? `python python-gallery.py --case ${view.case} --output plots` : `Rscript ${state.interface}-gallery.R plots ${view.case}`;
        figure.hidden = false; host.setAttribute("aria-busy", "false"); status.textContent = `Showing ${labels[state.interface]} · ${view.case}. 72 configurations, 216 interface views available.`;
      } catch (error) {
        if (serial !== generation) return;
        plottingFailure(host, `Could not load this selection: ${error.message}`);
      }
    }
    for (const select of Object.values(selectors)) select.addEventListener("change", () => show());
    addEventListener("popstate", () => show(true));
    await show(true);
  } catch (error) { plottingFailure(host, `Gallery unavailable: ${error.message}`); }
}
