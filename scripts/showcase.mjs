import { scanSource } from "../_extensions/htmpres/lib/source.mjs";
import { htmlToPlainText } from "../_extensions/htmpres/lib/render.mjs";

/** Theme variants of one canonical render; no Markdown or note re-parsing. */
import { colorModeControl, colorModeScript, legacyThemes, resolveTheme, themeAttributes, themeStyles } from "../_extensions/htmpres/themes/themes.mjs";

export function slideTitles(source, renderedHtml) {
  let fence = null;
  const titles = [];
  for (const line of source.split(/\r?\n/)) {
    const marker = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    const heading = /^## (.+?)(?:\s+\{.*\})?$/.exec(line);
    if (!fence && heading) titles.push(heading[1]);
  }
  if (renderedHtml !== undefined) {
    const labels = [...renderedHtml.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>/g)]
      .map(([tag]) => htmlToPlainText(/\sdata-title="([^"]*)"/.exec(tag)?.[1] || ""));
    if (labels.length !== titles.length || labels.some(label => !label)) throw new Error("Showcase source and rendered titles differ");
    return labels;
  }
  return titles;
}

/** Preserve the authored bytes, including heading attributes, notes and CRLF. */
export function slideSources(source) {
  const headings = scanSource(source).lines.filter(line => line.kind === "body" && /^##\s+/.test(line.text));
  return headings.map((line, index) => ({ line: line.number,
    markdown: source.slice(line.start, headings[index + 1]?.start ?? source.length) }));
}

export function themeChoices(catalog) {
  return [
    ...Object.entries(catalog.themes).map(([name, entry]) => ({ name, title: entry.title, family: entry.family,
      modes: ["light", "dark"], native: entry.native, complementary: entry.complementary })),
    ...legacyThemes.map(name => ({ name, title: name, family: "legacy", modes: ["light"], native: "light",
      complementary: "Original editable seed; no bundled dark pair." })),
  ];
}

export function variantPath(name, mode, view, catalog) {
  const entry = themeChoices(catalog).find(entry => entry.name === name);
  if (!entry || !entry.modes.includes(mode) || !["audience", "presenter"].includes(view)) {
    throw new Error(`Unsupported showcase selection: ${name}/${mode}/${view}`);
  }
  return `decks/${name}/${mode}/${view === "presenter" ? "presenter" : "index"}.html`;
}

function replaceOnce(source, before, after, label) {
  if (!before || source.split(before).length !== 2) throw new Error(`Showcase renderer boundary changed: ${label}`);
  return source.replace(before, () => after);
}

/** Register before the deck's preference listener; full views keep normal behavior. */
function isolateComparison() {
  const query = new URLSearchParams(location.search);
  const example = query.has("example-slide");
  if (!query.has("compare-slide") && !example) return;
  window.addEventListener("storage", event => event.stopImmediatePropagation(), true);
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("colorModeBtn");
    if (button) button.style.display = "none";
    const footer = document.querySelector(".footer-controls");
    if (footer) footer.style.gridTemplateColumns = "minmax(0, 1fr) repeat(4, auto)";
    if (!example) return;
    document.getElementById("slideFit")?.classList.add("no-tap-nav");
    // This bridge belongs to the website's example, not the exported deck UI.
    const style = document.createElement("style");
    style.textContent = `
      body .deck-shell { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: minmax(0, 1fr) !important; }
      body .toc, body .footer-controls { display: none !important; }
      body .stage-wrap { grid-column: 1 !important; grid-row: 1 !important; }
      body.presenter-mode .deck-shell { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: minmax(0, 1fr) 210px !important; }
      body.presenter-mode .stage-wrap { grid-column: 1 !important; grid-row: 1 !important; }
      body.presenter-mode .presenter-notes { grid-column: 1 !important; grid-row: 2 !important; border-left: 0; border-top: 1px solid var(--line); }
    `;
    document.head.append(style);
    window.htmpresExample = {
      getState() {
        const slide = slides[current];
        const state = slideStepStates.get(slide);
        return { slide: current + 1, cursor: state?.cursor || 0, total: state?.frames.length || 0,
          frame: Number(slide.dataset.activeFrame) };
      },
      setState(number, cursor) {
        goTo(number - 1);
        const slide = slides[current];
        const state = slideStepStates.get(slide);
        if (state) state.cursor = Math.max(0, Math.min(state.frames.length, cursor));
        applySlideStep(slide);
        updateNavigationButtons();
        scheduleTextFit();
        return this.getState();
      },
    };
    scheduleViewportLayout();
  });
}

export function themeVariant(html, { name, mode, catalog, templateCss, localCss, blankCss }) {
  variantPath(name, mode, "audience", catalog);
  const base = { light: "nocturne", dark: "nocturne", mode: "auto" };
  const plan = legacyThemes.includes(name) ? null : resolveTheme({ "deck.theme": name, "deck.color-mode": mode }, catalog);
  const headEnd = html.indexOf("</head>");
  if (headEnd < 0) throw new Error("Showcase input has no head");
  let head = html.slice(0, headEnd);
  let body = html.slice(headEnd);
  const oldCss = `${templateCss}\n${themeStyles(base, catalog)}\n${localCss}`;
  let newCss = `${templateCss}\n${themeStyles(plan, catalog)}\n${name === "blank" ? blankCss : ""}\n${localCss}`;
  // All variants share the font bundle; slide media remains deck-local.
  newCss = newCss.replaceAll("assets/htmpres-themes/", "../../../assets/htmpres-themes/");
  head = replaceOnce(head, oldCss, newCss, "canonical CSS");
  head = replaceOnce(head, colorModeScript(base), `<script>(${isolateComparison.toString()})();</script>\n${colorModeScript(plan)}`, "color-mode initialization");
  head = head.replace(/<html\b[^>]*>/, tag => {
    tag = tag.replace(/ data-(?:theme(?:-light|-dark)?|color-mode(?:-choice)?|bs-theme)="[^"]*"/g, "");
    const attrs = plan ? themeAttributes(plan) : { "data-theme": name };
    return tag.slice(0, -1) + Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("") + ">";
  });
  body = replaceOnce(body, colorModeControl(base), colorModeControl(plan), "mode control");
  // Math is a shared offline bundle, just like theme fonts.
  head = head.replaceAll('href="assets/htmpres-math/', 'href="../../../assets/htmpres-math/');
  body = body.replaceAll('src="assets/htmpres-math/', 'src="../../../assets/htmpres-math/');
  return head + body;
}
