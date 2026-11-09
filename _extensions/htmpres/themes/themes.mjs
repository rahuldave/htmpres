import { attributionTokens } from "./attribution.mjs";
/** Shared, dependency-free theme adapter for the Deno and Node renderers. */
export const legacyThemes = ["sage", "mono-grid", "blank"];

export function validateThemeName(name) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid theme name: ${name}`);
  return name;
}

function localThemeHasBothModes(css, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const theme = new RegExp(`\\[data-theme\\s*=\\s*(["'])${escaped}\\1\\]`);
  const selectors = [...css.matchAll(/([^{}]+)\{/g)].flatMap(match => match[1].split(/,(?![^()]*\))/));
  return ["light", "dark"].every(mode => {
    const qualifier = new RegExp(`\\[data-color-mode\\s*=\\s*(["'])${mode}\\1\\]`);
    return selectors.some(selector => theme.test(selector) && qualifier.test(selector));
  });
}

/** Flattened metadata comes from the existing simple YAML reader. */
export function resolveTheme(meta, catalog, localCss = "") {
  const scalar = meta["deck.theme"] || meta.theme || "";
  const light = meta["deck.theme.light"] || scalar;
  const dark = meta["deck.theme.dark"] || scalar;
  const paired = Boolean(meta["deck.theme.light"] || meta["deck.theme.dark"]);
  const requestedMode = meta["deck.color-mode"];
  if (requestedMode && !["light", "dark", "auto"].includes(requestedMode)) {
    throw new Error(`Invalid deck.color-mode: ${requestedMode}. Use light, dark, or auto.`);
  }
  if (paired && (!light || !dark)) throw new Error("deck.theme requires both light and dark names.");
  const localPair = scalar && localThemeHasBothModes(localCss, scalar);
  const managed = paired || Boolean(catalog.themes[scalar]) || Boolean(localPair);
  if (!managed) {
    if (requestedMode) throw new Error("deck.color-mode requires a bundled theme or a local paired theme.");
    return null; // Preserve existing deck-local themes and their original CSS.
  }
  for (const name of [light, dark]) {
    validateThemeName(name);
    if (!catalog.themes[name] && !(name === scalar && localPair)) throw new Error(`Unknown paired theme: ${name}`);
  }
  return { light, dark, mode: requestedMode || "auto" };
}

function tokens(entry, mode) {
  const p = entry.palettes[mode];
  const dark = mode === "dark";
  // Semantic roles can gain additional mappings without changing authored QMD.
  const importance = [
    [0.8, 400, p.muted],
    [0.9, 400, p.muted],
    [1, 400, p.ink],
    [1.12, 700, p.ink],
    [3, 800, p.ink],
  ];
  const values = {
    ...attributionTokens(p),
    "bg": p.panel, "paper": p.paper, "surface": p.panel,
    "ink": p.ink, "muted": p.muted, "line": p.line,
    "teal": p.accent, "amber": p.secondary, "rose": p.secondary,
    "indigo": p.accent, "violet": p.secondary,
    "font-body": entry.body, "font-display": entry.heading, "font-mono": entry.mono,
    ...Object.fromEntries(importance.flatMap(([scale, weight, ink], level) => [
      [`htmpres-importance-${level}-scale`, scale],
      [`htmpres-importance-${level}-weight`, weight],
      [`htmpres-importance-${level}-ink`, ink],
    ])),
    "shadow": dark ? "0 18px 45px rgba(0,0,0,.4)" : "0 18px 45px rgba(0,0,0,.14)",
    "toc-bg": p.panel, "toc-ink": p.ink, "toc-hover-border": p.line,
    "footer-label": p.muted, "hero-copy": p.ink, "source-copy": p.muted,
    "callout-bg": p.panel, "callout-ink": p.ink,
    "code-card-bg": p.code, "code-card-ink": p.ink,
    "control-border": p.line, "control-bg": p.paper, "control-subtle-bg": p.panel,
    "caption-bg": p.paper, "caption-border": p.line, "caption-ink": p.ink,
    "caption-shadow": "var(--shadow)", "progress-track": p.line,
    "overview-bg": dark ? "rgba(0,0,0,.94)" : "rgba(20,25,30,.9)",
    "overview-card-border": "rgba(255,255,255,.3)", "zoom-bg": "rgba(0,0,0,.94)",
    "zoom-close-border": "rgba(255,255,255,.4)", "zoom-close-bg": "rgba(255,255,255,.1)",
    "print-border": p.line, "ds-frame-bg": p.paper, "ds-frame-border": p.line,
    "ds-theme-filter": "none", "ds-bn-filter": "grayscale(1)",
    "ds-vivid-filter": "saturate(1.4) contrast(1.12)", "ds-noir-filter": "grayscale(1) contrast(1.4)",
    "ds-chrome-filter": "saturate(1.5) contrast(1.17)", "ds-fade-filter": "saturate(.6) contrast(.92) brightness(1.1)",
    "htmpres-panel-bg": p.paper, "htmpres-panel-ink": p.ink,
    "htmpres-panel-muted": p.muted, "htmpres-panel-border": p.line,
    "htmpres-code-bg": p.code, "htmpres-code-ink": p.ink, "htmpres-code-border": p.line,
    "htmpres-code-token-alert": dark ? "#ffb4b4" : "#a01c28",
    "htmpres-code-token-keyword": dark ? "#8bcaff" : "#174a8b",
    "htmpres-code-token-type": dark ? "#d4b8ff" : "#653294",
    "htmpres-code-token-string": dark ? "#a6e3b6" : "#246039",
    "htmpres-code-token-number": dark ? "#f6d58b" : "#79520c",
    "htmpres-code-token-comment": p.muted,
    "htmpres-code-token-function": dark ? "#f8b8dc" : "#8d2e62",
    "htmpres-code-token-base": p.ink, "htmpres-code-line-number": p.muted,
    "htmpres-code-highlight-bg": "color-mix(in srgb, var(--teal) 12%, transparent)",
    "htmpres-code-highlight-bar": p.accent,
    "htmpres-fragment-highlight-bg": "color-mix(in srgb, var(--teal) 12%, transparent)",
    "htmpres-fragment-highlight-bar": p.accent,
    "htmpres-heading-weight": entry.headingWeight || (entry.family === "tufte" || entry.family === "elegant" ? "400" : "600"),
    "bs-body-bg": p.paper, "bs-body-color": p.ink, "bs-primary": p.accent,
    "bs-link-color": p.accent, "bs-border-color": p.line,
    "bs-font-sans-serif": entry.heading, "bs-font-monospace": entry.mono,
  };
  return Object.entries(values).map(([key, value]) => `  --${key}: ${value};`).join("\n");
}

/** Mode qualifiers add no specificity, so equivalent deck-local rules win. */
export function themeStyles(plan, catalog, alias = "") {
  if (!plan) return "";
  const fontRules = new Set();
  const rules = [];
  for (const mode of ["light", "dark"]) {
    const name = plan[mode];
    const entry = catalog.themes[name];
    if (!entry) continue; // A custom paired seed already lives in deck CSS.
    const selector = `html[data-theme="${validateThemeName(alias || name)}"]:where([data-color-mode="${mode}"])`;
    if (entry.fontCss) fontRules.add(entry.fontCss);
    rules.push(`${selector} {\n  color-scheme: ${mode};\n${tokens(entry, mode)}\n}`);
    rules.push(`${selector} :is(h2, h3) { font-weight: var(--htmpres-heading-weight); }`);
    if (entry.family === "tufte") rules.push(`${selector} :is(h2, h3) { font-style: italic; }`);
  }
  rules.push(`:where(html[data-color-mode]) a { color: var(--teal); }
html[data-color-mode] .footer-controls { grid-template-columns: minmax(0, 1fr) repeat(5, auto); }
@media (max-width: 980px) {
  html[data-color-mode] .footer-controls { grid-template-columns: minmax(0, 1fr) repeat(4, auto); gap: 6px; }
  html[data-color-mode] .footer-controls .progress { display: none; }
}`);
  return [...fontRules, ...rules].join("\n\n") + "\n";
}

export function themeAssets(plan, catalog) {
  if (!plan) return [];
  return [...new Set(["licenses/bootstrap-LICENSE", "licenses/bootswatch-LICENSE",
    ...[plan.light, plan.dark].flatMap(name => catalog.themes[name]?.assets || [])])].sort();
}

export function themeAttributes(plan) {
  if (!plan) return {};
  const mode = plan.mode === "auto" ? "light" : plan.mode;
  return { "data-theme": plan[mode], "data-theme-light": plan.light, "data-theme-dark": plan.dark,
    "data-color-mode": mode, "data-color-mode-choice": plan.mode, "data-bs-theme": mode };
}

/** Runs in <head> before paint; a blocked localStorage must not break a deck. */
function initializeColorMode(config) {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const key = `htmpres-color-mode:${location.pathname.replace(/[^/]*$/, "")}:${config.light}:${config.dark}`;
  let choice = config.mode;
  if (choice === "auto") {
    try {
      const saved = localStorage.getItem(key);
      if (["auto", "light", "dark"].includes(saved)) choice = saved;
    } catch { /* Private/file URL contexts may disable storage. */ }
  }
  const apply = () => {
    const mode = choice === "auto" ? (media.matches ? "dark" : "light") : choice;
    root.dataset.theme = config[mode];
    root.dataset.colorMode = mode;
    root.dataset.colorModeChoice = choice;
    root.dataset.bsTheme = mode;
    root.style.colorScheme = mode;
    root.classList.toggle("quarto-dark", mode === "dark");
    root.classList.toggle("quarto-light", mode === "light");
    const button = document.getElementById("colorModeBtn");
    if (button) {
      button.textContent = choice === "auto" ? `Auto (${mode})` : mode === "dark" ? "Dark" : "Light";
      button.setAttribute("aria-label", `Color mode: ${choice}. Switch to ${choice === "auto" ? "light" : choice === "light" ? "dark" : "auto"}.`);
      button.title = button.getAttribute("aria-label");
    }
    window.dispatchEvent(new Event("resize"));
  };
  apply();
  media.addEventListener("change", () => { if (choice === "auto") apply(); });
  document.fonts?.addEventListener("loadingdone", () => window.dispatchEvent(new Event("resize")));
  window.addEventListener("storage", event => {
    if (event.key === key && ["auto", "light", "dark"].includes(event.newValue)) {
      choice = event.newValue;
      apply();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("colorModeBtn");
    if (!button) return;
    button.addEventListener("keydown", event => event.stopPropagation());
    button.addEventListener("click", () => {
      choice = choice === "auto" ? "light" : choice === "light" ? "dark" : "auto";
      try { localStorage.setItem(key, choice); } catch { /* Optional persistence. */ }
      apply();
    });
    apply();
  });
}

export function colorModeScript(plan) {
  if (!plan) return "";
  const config = JSON.stringify(plan).replace(/</g, "\\u003c");
  return `<script>(${initializeColorMode.toString()})(${config});</script>`;
}

export function colorModeControl(plan) {
  return plan ? '<button class="nav-btn" id="colorModeBtn" type="button" aria-label="Change color mode">Color mode</button>' : "";
}
