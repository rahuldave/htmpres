/** Small comparison model shared with focused tests; DOM work starts below. */
export function selection(theme, mode, view, slide, manifest) {
  const entry = manifest.themes.find(item => item.name === theme);
  if (!entry || !entry.modes.includes(mode) || !["audience", "presenter"].includes(view) ||
      !Number.isInteger(slide) || slide < 1 || slide > manifest.slides.length) throw new Error("Invalid comparison selection");
  const file = view === "presenter" ? "presenter.html" : "index.html";
  // A changing query forces a document load: the deck reads the hash only at startup.
  const path = `_generated/decks/${theme}/${mode}/${file}`;
  return { preview: `${path}?compare-slide=${slide}#/${slide}`, open: `${path}#/${slide}`,
    config: `deck:\n  theme: ${theme}${entry.family === "legacy" ? "" : `\n  color-mode: ${mode}`}` };
}

export async function startComparison(root, manifest) {
  const slideSelect = root.querySelector("#compare-slide");
  const viewSelect = root.querySelector("#compare-view");
  manifest.slides.forEach((title, index) => slideSelect.add(new Option(`${index + 1}. ${title}`, String(index + 1))));
  const panes = [...root.querySelectorAll(".compare-pane")];
  const states = panes.map((pane, index) => ({ pane, theme: index === 0 ? "nocturne" : "simplex-reading", mode: "light" }));
  for (const state of states) {
    const select = state.pane.querySelector(".theme-select");
    const groups = new Map();
    for (const entry of manifest.themes) {
      if (!groups.has(entry.family)) {
        const group = document.createElement("optgroup"); group.label = entry.family; groups.set(entry.family, group); select.append(group);
      }
      groups.get(entry.family).append(new Option(entry.title, entry.name));
    }
    select.value = state.theme;
    select.addEventListener("change", () => { state.theme = select.value; updateModes(state); render(state); });
    const mode = state.pane.querySelector(".mode-select");
    mode.addEventListener("change", () => { state.mode = mode.value; render(state); });
    const frame = state.pane.querySelector("iframe");
    const resize = () => { frame.style.transform = `scale(${frame.parentElement.clientWidth / 1440})`; };
    new ResizeObserver(resize).observe(frame.parentElement); resize();
    updateModes(state);
  }
  function updateModes(state) {
    const entry = manifest.themes.find(item => item.name === state.theme);
    if (!entry.modes.includes(state.mode)) state.mode = entry.modes[0];
    const select = state.pane.querySelector(".mode-select");
    select.replaceChildren(...entry.modes.map(mode => new Option(mode === "dark" ? "Dark" : "Light", mode)));
    select.value = state.mode; select.disabled = entry.modes.length === 1;
  }
  function render(state) {
    const view = viewSelect.value;
    const links = selection(state.theme, state.mode, view, Number(slideSelect.value), manifest);
    const entry = manifest.themes.find(item => item.name === state.theme);
    const frame = state.pane.querySelector("iframe");
    frame.src = links.preview;
    frame.title = `${entry.title} ${state.mode} ${view} preview`;
    state.pane.querySelector(".open-deck").href = links.open;
    state.pane.querySelector(".theme-config").textContent = links.config;
    state.pane.querySelector(".theme-detail").textContent = `${entry.family} · ${entry.native} native. ${entry.complementary || "Paired source palettes."}`;
  }
  for (const select of [slideSelect, viewSelect]) select.addEventListener("change", () => states.forEach(render));
  states.forEach(render);
  root.querySelector("#compare-status").textContent = `${manifest.themes.length} themes · ${manifest.slides.length} slides`;
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#theme-comparison");
  if (root) fetch("_generated/manifest.json").then(response => {
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    return response.json();
  }).then(manifest => startComparison(root, manifest)).catch(error => {
    root.querySelector("#compare-status").textContent = `Comparison unavailable. ${error.message}. Run just docs to rebuild.`;
  });
}
