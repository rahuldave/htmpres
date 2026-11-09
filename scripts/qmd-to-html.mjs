#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { colorModeControl, colorModeScript, resolveTheme, themeAssets, themeAttributes, themeStyles } from "../_extensions/htmpres/themes/themes.mjs";
import { matchThemeStyles } from "../_extensions/htmpres/themes/matches.mjs";

import { arrangeSlideCredits, assignSlideIds, compileMatchSummary, maximumMatchGroups, renderTitle, namespacePandocIds } from "../_extensions/htmpres/lib/render.mjs";
import { deckCounter, extractNotes as extractSourceNotes, lintSource, maskCodeAndMetadata, parseSlides as parseSourceSlides, splitFrontMatter as splitSourceFrontMatter } from "../_extensions/htmpres/lib/source.mjs";

const themeDirectory = new URL("../_extensions/htmpres/themes/", import.meta.url);
const bundledThemes = JSON.parse(readFileSync(new URL("catalog.json", themeDirectory), "utf8"));

const root = process.cwd();
const decksDir = path.join(root, "decks");

const explicit = process.argv.slice(2);
if (explicit[0] === "lint") { lintCommand(explicit.slice(1)); process.exit(); }
const qmdFiles = explicit.length
  ? explicit
  : findFiles(decksDir, (file) => file.endsWith("index.qmd")).map((file) => path.relative(root, file));

for (const file of qmdFiles.sort()) {
  renderDeck(file);
}

function renderDeck(file) {
  const qmdPath = path.resolve(root, file);
  const deckDir = path.dirname(qmdPath);
  const qmd = readFileSync(qmdPath, "utf8");
  const { yaml, body } = splitFrontMatter(qmd);
  const meta = parseSimpleYaml(yaml);
  const diagnostics = lintSource(qmd, file);
  if (diagnostics.length) throw new Error(diagnostics.map(formatDiagnostic).join("\n"));
  const slides = assignSlideIds(parseSlides(body), parsePandocAttrs);
  if (!slides.length) {
    throw new Error(`No slides found (use --- or ##) in ${file}`);
  }

  const title = meta.pagetitle || meta.title || humanTitle(path.basename(deckDir));
  const theme = meta["deck.theme"] || meta.theme || "";
  const background = deckBackground(meta);
  const textFit = deckTextFit(meta);
  const counterPolicy = deckCounter(qmd).value;
  const cssPath = path.join(deckDir, meta["deck.css"] || "source.css");
  const localCss = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  const themePlan = resolveTheme(meta, bundledThemes, localCss);
  const baseCss = themePlan ? readFileSync(new URL("../_extensions/htmpres/templates/source.css", import.meta.url), "utf8") : "";
  for (const file of themeAssets(themePlan, bundledThemes)) {
    const bytes = readFileSync(new URL(file, themeDirectory));
    const target = path.join(deckDir, "assets", "htmpres-themes", file);
    if (existsSync(target) && readFileSync(target).equals(bytes)) continue;
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  copyMathAssets(deckDir);
  const rendered = slides.map((slide, index) => {
    const { body, notes } = extractNotes(slide.body);
    const cleanSlide = { ...slide, body };
    return {
      slideHtml: renderSlide(cleanSlide, index, background),
      notesHtml: namespacePandocIds(markdownToHtml(notes).trim(), `notes-${index + 1}`),
    };
  });
  const htmlSlides = rendered.map((slide) => slide.slideHtml).join("\n\n");
  const matchCss = matchThemeStyles(themePlan, bundledThemes, maximumMatchGroups(htmlSlides), theme);
  const css = themePlan ? `${baseCss}\n${themeStyles(themePlan, bundledThemes)}${matchCss}\n${localCss}` : `${matchCss}${localCss}`;
  const notes = rendered.map((slide) => slide.notesHtml);
  const audienceHtml = deckShell({
    mode: "audience",
    title,
    tocTitle: shortTitle(title),
    css,
    slides: htmlSlides,
    slideCount: slides.length,
    notes,
    theme,
    themePlan,
    textFit,
    counterPolicy,
  });
  const presenterHtml = deckShell({
    mode: "presenter",
    title: `${title} - Presenter`,
    tocTitle: shortTitle(title),
    css,
    slides: htmlSlides,
    slideCount: slides.length,
    notes,
    theme,
    themePlan,
    textFit,
    counterPolicy,
  });

  const outPath = path.join(deckDir, "index.html");
  const presenterPath = path.join(deckDir, "presenter.html");
  writeFileSync(outPath, audienceHtml, "utf8");
  writeFileSync(presenterPath, presenterHtml, "utf8");
  const notesCount = notes.filter(Boolean).length;
  console.log(
    `Rendered ${file} -> ${path.relative(root, outPath)} and ${path.relative(root, presenterPath)} (${slides.length} slides, ${notesCount} notes, custom no-reveal shell)`,
  );
}

function renderSlide(slide, index, globalBackground) {
  const attrs = parsePandocAttrs(slide.attrText);
  const classes = ["slide", ...attrs.classes];
  if (index === 0) classes.push("active");
  const title = slide.title;
  const renderedTitle = title ? renderTitle(markdownToHtml(`# ${title}`), `slide-${index + 1}`) : { inlineHtml: "", plainText: "", footnotesHtml: "" };
  let bodyHtml = namespacePandocIds(markdownToHtml(slide.body).trim(), `slide-${index + 1}`);
  let matches;
  try {
    matches = compileMatchSummary(bodyHtml, attrs.keyValues["data-step-summary"], { id: slide.id, colors: attrs.keyValues["data-match-colors"], darkColors: attrs.keyValues["data-match-colors-dark"] });
  } catch (error) { throw new Error(`Slide ${index + 1} (${title}): ${error.message}`); }
  bodyHtml = arrangeSlideCredits(matches.html);
  const backgroundHtml = renderBackgroundLayer(attrs, globalBackground);
  const dataAttrs = { ...attrs.keyValues, id: slide.id || attrs.keyValues.id || `slide-${index + 1}` };
  if (matches.groups.length) dataAttrs["data-match-groups"] = matches.groups.join("|");
  if (!dataAttrs["data-title"]) dataAttrs["data-title"] = renderedTitle.plainText || `Slide ${index + 1}`;
  const attrText = formatHtmlAttrs({
    class: unique(classes).join(" "),
    ...dataAttrs,
  });
  const headingClass = attrs.classes.includes("title-hidden") ? " class=\"visually-hidden\"" : "";
  return `${matches.css ? `<style>${matches.css}</style>\n` : ""}<section${attrText}>
${backgroundHtml ? indentHtml(backgroundHtml, "  ") + "\n" : ""}
${title ? `  <h2${headingClass}>${renderedTitle.inlineHtml}</h2>\n` : ""}
${indentHtml(bodyHtml, "  ")}
${renderedTitle.footnotesHtml ? indentHtml(renderedTitle.footnotesHtml, "  ") + "\n" : ""}</section>`;
}

function deckBackground(meta) {
  const image = firstMeta(meta, ["deck.background-image", "deck.background.image", "background-image"]);
  if (!image) return null;
  return {
    image,
    fit: firstMeta(meta, ["deck.background-fit", "deck.background.fit", "background-fit"]) || "fill",
    filter: firstMeta(meta, ["deck.background-filter", "deck.background.filter", "background-filter"]) || "theme",
    position: firstMeta(meta, ["deck.background-position", "deck.background.position", "background-position"]) || "",
    opacity: firstMeta(meta, ["deck.background-opacity", "deck.background.opacity", "background-opacity"]) || "",
    className: firstMeta(meta, ["deck.background-class", "deck.background.class", "background-class"]) || "",
  };
}

function deckTextFit(meta) {
  const enabled = boolMeta(firstMeta(meta, ["deck.text-fit", "deck.autoscale", "text-fit", "autoscale"]));
  return {
    enabled,
    min: firstMeta(meta, ["deck.text-fit-min", "deck.autoscale-min", "text-fit-min", "autoscale-min"]) || "",
  };
}

function renderBackgroundLayer(attrs, globalBackground) {
  if (attrs.classes.includes("no-background")) return "";
  const explicitImage = attrs.keyValues["data-background-image"] || "";
  if (explicitImage && isNoneValue(explicitImage)) return "";
  const image = explicitImage || globalBackground?.image || "";
  if (!image) return "";

  const fit = attrs.keyValues["data-background-fit"] || globalBackground?.fit || "fill";
  const filter = attrs.keyValues["data-background-filter"] || globalBackground?.filter || "theme";
  const position = attrs.keyValues["data-background-position"] || globalBackground?.position || "";
  const opacity = attrs.keyValues["data-background-opacity"] || globalBackground?.opacity || "";
  const extraClass = attrs.keyValues["data-background-class"] || globalBackground?.className || "";
  const mediaClasses = unique([
    backgroundFitClass(fit),
    ...backgroundFilterClasses(filter),
    ...splitClasses(extraClass),
  ]);
  const style = backgroundStyle(position, opacity);

  return `<div class="ds-global-background ds-full ds-media ds-no-pad" aria-hidden="true"${style}>
  <img src="${escapeHtmlAttr(image)}" alt="" class="${escapeHtmlAttr(mediaClasses.join(" "))}">
</div>`;
}

function backgroundFitClass(value) {
  return sanitizeClassToken(value) === "fit" ? "ds-fit" : "ds-fill";
}

function backgroundFilterClasses(value) {
  const tokens = value.split(/[\s,]+/).map(sanitizeClassToken).filter(Boolean);
  if (!tokens.length) return ["ds-theme-filter"];
  if (tokens.some(isNoneValue)) return ["ds-original"];
  return tokens.flatMap((token) => {
    if (token === "theme" || token === "filtered") return ["ds-theme-filter"];
    if (token === "bn" || token === "bw") return [`ds-${token}`];
    if (token.startsWith("ds-")) return [token];
    return [`ds-${token}`];
  });
}

function backgroundStyle(position, opacity) {
  const styles = [];
  if (position) styles.push(`--ds-bg-position: ${escapeCssValue(position)}`);
  if (opacity) styles.push(`--ds-bg-opacity: ${escapeCssValue(opacity)}`);
  return styles.length ? ` style="${escapeHtmlAttr(styles.join("; "))}"` : "";
}

function firstMeta(meta, keys) {
  for (const key of keys) {
    if (meta[key] != null && meta[key] !== "") return meta[key];
  }
  return "";
}

function boolMeta(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function isNoneValue(value) {
  return /^(none|false|off|original)$/i.test(String(value || "").trim());
}

function sanitizeClassToken(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeCssValue(value) {
  return String(value).replace(/[;"'<>]/g, "");
}


function deckShell({ mode, title, tocTitle, css, slides, slideCount, notes, theme, themePlan, textFit, counterPolicy }) {
  const deckJs = readRuntimeFile("htmpres-custom-deck.js");
  const interactions = readRuntimeFile("htmpres-interactions.html");
  const isPresenter = mode === "presenter";
  const notesScript = isPresenter
    ? `\n  <script id="deckNotes" type="application/json">${escapeScriptJson(JSON.stringify(notes))}</script>`
    : "";
  const presenterPanel = isPresenter
    ? `
    <aside class="presenter-notes" aria-label="Presenter notes">
      <h2>Presenter Notes</h2>
      <div class="presenter-note-body" id="presenterNotes"></div>
    </aside>`
    : "";
  const htmlAttrs = formatHtmlAttrs({
    lang: "en",
    "data-counter": counterPolicy || "true",
    "data-theme": theme || "",
    ...themeAttributes(themePlan),
    "data-text-fit": textFit?.enabled ? "true" : "",
    "data-autoscale": textFit?.enabled ? "true" : "",
    "data-text-fit-min": textFit?.min || "",
  });
  return `<!doctype html>
<html${htmlAttrs}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${colorModeScript(themePlan)}
  <link rel="stylesheet" href="assets/htmpres-math/katex.min.css">
  <style>
${css}
${runtimeCss()}
.counter[hidden] { display: none !important; }
${readRuntimeFile("htmpres-semantic.css")}
${readRuntimeFile("htmpres-steps.css")}
  </style>
</head>
<body class="${mode}-mode">
  <div class="deck-shell">
    <aside class="toc" aria-label="Slide list">
      <h1>${escapeHtml(tocTitle)}</h1>
      <p class="hint">${isPresenter ? "Presenter view: notes are on the right. " : ""}Arrow keys or Space advance. O opens overview. Click diagrams to zoom.</p>
      <div class="toc-list" id="tocList"></div>
    </aside>

    <main class="stage-wrap">
      <div class="slide-fit" id="slideFit">
        <div class="slides" id="slides">
${indentHtml(slides, "          ")}
        </div>
      </div>
    </main>
${presenterPanel}

    <footer class="footer-controls">
      <div class="progress" aria-label="Deck progress"><span id="progressBar"></span></div>
      <div class="counter" id="counter"${counterPolicy === "false" || (counterPolicy === "presenter" && !isPresenter) ? " hidden" : ""}>1 / ${slideCount}</div>
      ${colorModeControl(themePlan)}
      <button class="nav-btn" id="overviewBtn" aria-label="Open overview">O</button>
      <button class="nav-btn" id="prevBtn" aria-label="Previous slide">Prev</button>
      <button class="nav-btn primary" id="nextBtn" aria-label="Next slide">Next</button>
    </footer>
  </div>

  <div class="overview" id="overview"><div class="overview-grid" id="overviewGrid"></div></div>
  <div class="zoom zoom-modal" id="zoom" aria-modal="true" role="dialog" aria-label="Diagram zoom">
    <button class="zoom-close" id="zoomClose" type="button">Close</button>
    <img id="zoomImg" alt="Zoomed diagram">
  </div>
  <svg class="htmpres-filter-defs" aria-hidden="true" focusable="false" width="0" height="0">
    <filter id="htmpres-sharpen">
      <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"></feConvolveMatrix>
    </filter>
  </svg>
${notesScript}

  <script src="assets/htmpres-math/katex.min.js"></script>
  <script>
${indent(readRuntimeFile("htmpres-math.js"), "    ")}
  </script>
  <script>
${indent(deckJs, "    ")}
  </script>
  ${interactions}
</body>
</html>
`;
}

function runtimeCss() {
  return `

/* Custom htmpres runtime overrides generated after the source deck CSS. */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

body.audience-mode .slide .notes {
  display: none !important;
}

.htmpres-filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.slide div.sourceCode,
.slide pre {
  max-width: 100%;
  overflow: auto;
}

.slide > div.sourceCode,
.slide > pre {
  margin-top: 24px;
  border: 1px solid var(--htmpres-code-border, rgba(15, 23, 42, 0.16));
  border-radius: var(--htmpres-code-radius, 8px);
  background: var(--htmpres-code-bg, #172127);
  color: var(--htmpres-code-ink, #eff6f4);
  padding: var(--htmpres-code-pad, 18px);
}

.slide div.sourceCode > pre,
.slide pre.sourceCode {
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  box-shadow: none;
}

.slide pre.sourceCode,
.slide pre.sourceCode code {
  white-space: pre;
}

.slide pre code {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
}

.slide pre.numberSource code {
  counter-reset: source-line;
}

.slide pre.numberSource code > span,
.slide code > .code-line {
  display: inline-block;
  min-width: 100%;
  min-height: 1.45em;
  box-sizing: border-box;
  padding-left: 0.65rem;
  padding-right: 0.65rem;
  transition: background 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
}

.slide pre.numberSource code > span {
  counter-increment: source-line;
  position: relative;
  padding-left: 3.1rem;
}

.slide pre.numberSource code > span > a:first-child {
  position: absolute;
  left: 0;
  width: 2.35rem;
  padding-right: 0.5rem;
  color: var(--htmpres-code-line-number, rgba(226, 232, 240, 0.46));
  text-align: right;
  text-decoration: none;
  user-select: none;
}

.slide pre.numberSource code > span > a:first-child::before {
  content: counter(source-line);
}

.slide .code-line-highlight {
  background: var(--htmpres-code-highlight-bg, rgba(193, 131, 34, 0.22));
  box-shadow: inset var(--htmpres-code-highlight-bar-width, 4px) 0 0 var(--htmpres-code-highlight-bar, rgba(193, 131, 34, 0.9));
}

.slide .code-step-active .code-line-dim {
  opacity: 0.42;
}

.slide.transition-fade.active,
.slide.transition-slide.active,
.slide.transition-zoom.active {
  animation-duration: var(--slide-transition-duration, 220ms);
  animation-fill-mode: both;
  animation-timing-function: ease;
}

.slide.transition-fade.active {
  animation-name: htmpres-slide-fade;
}

.slide.transition-slide.active {
  animation-name: htmpres-slide-next;
}

html[data-slide-direction="prev"] .slide.transition-slide.active {
  animation-name: htmpres-slide-prev;
}

.slide.transition-zoom.active {
  animation-name: htmpres-slide-zoom;
}

.slide.transition-none.active,
html[data-slide-direction="none"] .slide.transition-fade.active,
html[data-slide-direction="none"] .slide.transition-slide.active,
html[data-slide-direction="none"] .slide.transition-zoom.active {
  animation: none;
}

@keyframes htmpres-slide-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes htmpres-slide-next {
  from {
    opacity: 0;
    transform: translateX(28px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes htmpres-slide-prev {
  from {
    opacity: 0;
    transform: translateX(-28px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes htmpres-slide-zoom {
  from {
    opacity: 0;
    transform: scale(0.985);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.slide .fragment {
  opacity: 0;
  visibility: hidden;
  transform: translateY(var(--fragment-offset, 12px));
  transition:
    opacity var(--fragment-duration, 180ms) ease,
    transform var(--fragment-duration, 180ms) ease,
    filter var(--fragment-duration, 180ms) ease,
    background-color var(--fragment-duration, 180ms) ease,
    box-shadow var(--fragment-duration, 180ms) ease;
}

.slide .fragment.fragment-visible {
  opacity: 1;
  visibility: visible;
  transform: none;
}

.slide .fragment.fragment-none {
  transition: none;
  transform: none;
}

.slide .fragment.fragment-scale:not(.fragment-visible) {
  transform: scale(0.96);
}

.slide .fragment.fragment-left:not(.fragment-visible) {
  transform: translateX(-18px);
}

.slide .fragment.fragment-right:not(.fragment-visible) {
  transform: translateX(18px);
}

.slide .fragment.fragment-rise:not(.fragment-visible),
.slide .fragment.fragment-slide:not(.fragment-visible) {
  transform: translateY(18px);
}

.slide .fragment.fragment-blur:not(.fragment-visible) {
  filter: blur(4px);
}

.slide .fragment.fragment-highlight.fragment-current {
  background: var(--htmpres-fragment-highlight-bg, rgba(193, 131, 34, 0.14));
  box-shadow: inset var(--htmpres-fragment-highlight-bar-width, 4px) 0 0 var(--htmpres-fragment-highlight-bar, rgba(193, 131, 34, 0.75));
}

.slide .fragment.fragment-dim.fragment-past {
  opacity: 0.42;
}

.slide .fragment.fragment-dim.fragment-current {
  opacity: 1;
}

.slide.htmpres-text-fit-active {
  --htmpres-text-fit-scale: 1;
}

.slide.htmpres-text-fit-active h2 {
  font-size: calc(var(--htmpres-h2-size, 2.35rem) * var(--htmpres-text-fit-scale));
}

.slide.htmpres-text-fit-active .hero-title h2 {
  font-size: calc(var(--htmpres-hero-title-size, 3rem) * var(--htmpres-text-fit-scale));
}

.slide.htmpres-text-fit-active h3 {
  font-size: calc(var(--htmpres-h3-size, 1.18rem) * var(--htmpres-text-fit-scale));
}

.slide.htmpres-text-fit-active p,
.slide.htmpres-text-fit-active li,
.slide.htmpres-text-fit-active .card,
.slide.htmpres-text-fit-active .callout {
  font-size: calc(var(--htmpres-body-size, 1rem) * var(--htmpres-text-fit-scale));
}

.slide.htmpres-text-fit-active .eyebrow,
.slide.htmpres-text-fit-active .source-line {
  font-size: calc(var(--htmpres-small-size, 0.78rem) * var(--htmpres-text-fit-scale));
}

@media (prefers-reduced-motion: reduce) {
  .slide.transition-fade.active,
  .slide.transition-slide.active,
  .slide.transition-zoom.active {
    animation: none;
  }

  .slide .fragment {
    transition: none;
    transform: none;
  }
}

@media print {
  .slide .fragment {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    filter: none !important;
  }
}

.slide .sourceCode .al,
.slide .sourceCode .er {
  color: var(--htmpres-code-token-alert, #fecdd3);
}

.slide .sourceCode .kw,
.slide .sourceCode .cf,
.slide .sourceCode .im {
  color: var(--htmpres-code-token-keyword, #7dd3fc);
  font-weight: 700;
}

.slide .sourceCode .dt,
.slide .sourceCode .at {
  color: var(--htmpres-code-token-type, #c4b5fd);
}

.slide .sourceCode .st,
.slide .sourceCode .ss,
.slide .sourceCode .ch {
  color: var(--htmpres-code-token-string, #a7f3d0);
}

.slide .sourceCode .dv,
.slide .sourceCode .bn,
.slide .sourceCode .fl {
  color: var(--htmpres-code-token-number, #fcd34d);
}

.slide .sourceCode .co {
  color: var(--htmpres-code-token-comment, #94a3b8);
  font-style: italic;
}

.slide .sourceCode .fu,
.slide .sourceCode .bu,
.slide .sourceCode .ot {
  color: var(--htmpres-code-token-function, #f9a8d4);
}

.slide .sourceCode .op,
.slide .sourceCode .sc,
.slide .sourceCode .va {
  color: var(--htmpres-code-token-base, #f8fafc);
}

.slide > :not(.ds-full):not(.ds-left):not(.ds-right):not(.slide-credits) {
  position: relative;
  z-index: 1;
}

.slide .ds-full,
.slide .ds-left,
.slide .ds-right {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 0;
  min-width: 0;
  min-height: 0;
  display: grid;
  align-content: center;
  justify-items: stretch;
  gap: 1rem;
  overflow: hidden;
  padding: 48px 58px;
}

.slide .ds-full {
  left: 0;
  right: 0;
}

.slide .ds-global-background {
  pointer-events: none;
  opacity: var(--ds-bg-opacity, 1);
}

.slide .ds-left {
  left: 0;
  width: 50%;
  padding-right: 29px;
}

.slide .ds-right {
  right: 0;
  width: 50%;
  padding-left: 29px;
}

.slide .ds-layer {
  position: relative;
  z-index: 1;
}

.slide .ds-no-pad {
  padding: 0 !important;
}

.slide .ds-center {
  place-items: center;
  text-align: center;
}

.slide .ds-top {
  align-content: start;
}

.slide .ds-bottom {
  align-content: end;
}

.slide .ds-split {
  display: grid;
  grid-template-columns: repeat(var(--ds-columns, 2), minmax(0, 1fr));
  gap: var(--ds-gap, 0);
  min-height: var(--ds-height, 420px);
  margin-top: var(--ds-margin-top, 24px);
  overflow: hidden;
}

.slide .ds-pane,
.slide .ds-media {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.slide .ds-pane {
  display: grid;
  align-content: center;
  gap: 1rem;
  padding: var(--ds-pad, 28px);
  background: var(--ds-bg, transparent);
  border: var(--ds-border, 0);
  border-radius: var(--ds-radius, 0);
}

.slide .ds-media {
  display: grid;
  place-items: center;
}

.slide .ds-frame {
  border: 1px solid var(--ds-frame-border, rgba(15, 23, 42, 0.14));
  border-radius: var(--ds-radius, 8px);
  background: var(--ds-frame-bg, #ffffff);
}

.slide .ds-no-border {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.slide .ds-hide {
  display: none !important;
}

.slide .ds-media > p,
.slide .ds-media > figure,
.slide .ds-media.ds-fit > p,
.slide .ds-media.ds-fit > figure,
.slide .ds-media.ds-fill > p,
.slide .ds-media.ds-fill > figure {
  width: 100%;
  height: 100%;
  margin: 0;
  display: grid;
  place-items: center;
}

.slide .ds-media img,
.slide .ds-media video,
.slide .ds-media iframe,
.slide .ds-media object,
.slide .ds-media embed,
.slide img.ds-fit,
.slide video.ds-fit,
.slide iframe.ds-fit,
.slide object.ds-fit,
.slide embed.ds-fit,
.slide img.ds-fill,
.slide video.ds-fill,
.slide iframe.ds-fill,
.slide object.ds-fill,
.slide embed.ds-fill,
.slide .ds-media.ds-fit img,
.slide .ds-media.ds-fit video,
.slide .ds-media.ds-fit iframe,
.slide .ds-media.ds-fit object,
.slide .ds-media.ds-fit embed,
.slide .ds-media.ds-fill img,
.slide .ds-media.ds-fill video,
.slide .ds-media.ds-fill iframe,
.slide .ds-media.ds-fill object,
.slide .ds-media.ds-fill embed {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
}

.slide .ds-media img,
.slide .ds-media video,
.slide .ds-media iframe,
.slide .ds-media object,
.slide .ds-media embed {
  object-fit: contain;
}

.slide .ds-global-background img,
.slide .ds-global-background video,
.slide .ds-global-background iframe,
.slide .ds-global-background object,
.slide .ds-global-background embed {
  object-position: var(--ds-bg-position, center);
}

.slide img.ds-fit,
.slide video.ds-fit,
.slide iframe.ds-fit,
.slide object.ds-fit,
.slide embed.ds-fit,
.slide .ds-media.ds-fit img,
.slide .ds-media.ds-fit video,
.slide .ds-media.ds-fit iframe,
.slide .ds-media.ds-fit object,
.slide .ds-media.ds-fit embed {
  object-fit: contain;
}

.slide img.ds-fill,
.slide video.ds-fill,
.slide iframe.ds-fill,
.slide object.ds-fill,
.slide embed.ds-fill,
.slide .ds-media.ds-fill img,
.slide .ds-media.ds-fill video,
.slide .ds-media.ds-fill iframe,
.slide .ds-media.ds-fill object,
.slide .ds-media.ds-fill embed {
  object-fit: cover;
}

.slide audio.ds-fit,
.slide audio.ds-fill,
.slide .ds-media audio {
  width: 100%;
  height: auto;
}

.slide .ds-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-gap, 14px);
}

.slide .ds-inline > p,
.slide .ds-inline > figure {
  margin: 0;
}

.slide .ds-inline img,
.slide .ds-inline video,
.slide .ds-inline iframe {
  width: var(--ds-inline-size, 160px);
  height: auto;
  max-width: 100%;
}

.slide .ds-grid {
  display: grid;
  grid-template-columns: repeat(var(--ds-columns, 3), minmax(0, 1fr));
  gap: var(--ds-gap, 12px);
}

.slide .ds-grid > * {
  min-width: 0;
}

.slide .ds-grid > p,
.slide .ds-grid > figure {
  margin: 0;
}

.slide img.ds-rounded,
.slide video.ds-rounded,
.slide iframe.ds-rounded,
.slide object.ds-rounded,
.slide embed.ds-rounded,
.slide .ds-rounded img,
.slide .ds-rounded video,
.slide .ds-rounded iframe,
.slide .ds-rounded object,
.slide .ds-rounded embed {
  border-radius: var(--ds-radius, 16px);
}

.slide img.ds-bn,
.slide video.ds-bn,
.slide iframe.ds-bn,
.slide object.ds-bn,
.slide embed.ds-bn,
.slide img.ds-bw,
.slide video.ds-bw,
.slide iframe.ds-bw,
.slide object.ds-bw,
.slide embed.ds-bw,
.slide .ds-bn img,
.slide .ds-bn video,
.slide .ds-bn iframe,
.slide .ds-bn object,
.slide .ds-bn embed,
.slide .ds-bw img,
.slide .ds-bw video,
.slide .ds-bw iframe,
.slide .ds-bw object,
.slide .ds-bw embed {
  --ds-filter-preset: var(--ds-bn-filter, grayscale(1));
}

.slide img.ds-vivid,
.slide video.ds-vivid,
.slide iframe.ds-vivid,
.slide object.ds-vivid,
.slide embed.ds-vivid,
.slide .ds-vivid img,
.slide .ds-vivid video,
.slide .ds-vivid iframe,
.slide .ds-vivid object,
.slide .ds-vivid embed {
  --ds-filter-preset: var(--ds-vivid-filter, saturate(1.35) contrast(1.12));
}

.slide img.ds-noir,
.slide video.ds-noir,
.slide iframe.ds-noir,
.slide object.ds-noir,
.slide embed.ds-noir,
.slide .ds-noir img,
.slide .ds-noir video,
.slide .ds-noir iframe,
.slide .ds-noir object,
.slide .ds-noir embed {
  --ds-filter-preset: var(--ds-noir-filter, grayscale(1) contrast(1.36) brightness(0.9));
}

.slide img.ds-chrome,
.slide video.ds-chrome,
.slide iframe.ds-chrome,
.slide object.ds-chrome,
.slide embed.ds-chrome,
.slide .ds-chrome img,
.slide .ds-chrome video,
.slide .ds-chrome iframe,
.slide .ds-chrome object,
.slide .ds-chrome embed {
  --ds-filter-preset: var(--ds-chrome-filter, saturate(1.45) contrast(1.16) brightness(1.06));
}

.slide img.ds-fade,
.slide video.ds-fade,
.slide iframe.ds-fade,
.slide object.ds-fade,
.slide embed.ds-fade,
.slide .ds-fade img,
.slide .ds-fade video,
.slide .ds-fade iframe,
.slide .ds-fade object,
.slide .ds-fade embed {
  --ds-filter-preset: var(--ds-fade-filter, saturate(0.62) contrast(0.92) brightness(1.12) opacity(0.82));
}

.slide img.ds-filter,
.slide video.ds-filter,
.slide iframe.ds-filter,
.slide object.ds-filter,
.slide embed.ds-filter,
.slide .ds-filter img,
.slide .ds-filter video,
.slide .ds-filter iframe,
.slide .ds-filter object,
.slide .ds-filter embed {
  --ds-filter-custom:
    grayscale(var(--ds-grayscale, 0))
    sepia(var(--ds-sepia, 0))
    saturate(var(--ds-saturation, 1))
    contrast(var(--ds-contrast, 1))
    brightness(clamp(0, calc(var(--ds-brightness, 1) + var(--ds-exposure, 0)), 3))
    hue-rotate(var(--ds-hue, 0deg))
    blur(var(--ds-blur, 0))
    opacity(var(--ds-opacity, 1));
}

.slide img.ds-alpha,
.slide video.ds-alpha,
.slide iframe.ds-alpha,
.slide object.ds-alpha,
.slide embed.ds-alpha,
.slide .ds-alpha img,
.slide .ds-alpha video,
.slide .ds-alpha iframe,
.slide .ds-alpha object,
.slide .ds-alpha embed {
  opacity: var(--ds-opacity, 0.6);
}

.slide img.ds-zoom,
.slide video.ds-zoom,
.slide iframe.ds-zoom,
.slide object.ds-zoom,
.slide embed.ds-zoom,
.slide .ds-zoom img,
.slide .ds-zoom video,
.slide .ds-zoom iframe,
.slide .ds-zoom object,
.slide .ds-zoom embed {
  transform: scale(var(--ds-scale, 1.2));
}

.slide img.ds-theme-filter,
.slide video.ds-theme-filter,
.slide iframe.ds-theme-filter,
.slide object.ds-theme-filter,
.slide embed.ds-theme-filter,
.slide .ds-theme-filter img,
.slide .ds-theme-filter video,
.slide .ds-theme-filter iframe,
.slide .ds-theme-filter object,
.slide .ds-theme-filter embed {
  --ds-filter-preset: var(--ds-theme-filter, );
}

.slide img.ds-sharpen,
.slide video.ds-sharpen,
.slide iframe.ds-sharpen,
.slide object.ds-sharpen,
.slide embed.ds-sharpen,
.slide .ds-sharpen img,
.slide .ds-sharpen video,
.slide .ds-sharpen iframe,
.slide .ds-sharpen object,
.slide .ds-sharpen embed {
  --ds-filter-sharpen: var(--ds-sharpen-filter, url("#htmpres-sharpen"));
}

.slide img.ds-bn,
.slide video.ds-bn,
.slide iframe.ds-bn,
.slide object.ds-bn,
.slide embed.ds-bn,
.slide img.ds-bw,
.slide video.ds-bw,
.slide iframe.ds-bw,
.slide object.ds-bw,
.slide embed.ds-bw,
.slide img.ds-vivid,
.slide video.ds-vivid,
.slide iframe.ds-vivid,
.slide object.ds-vivid,
.slide embed.ds-vivid,
.slide img.ds-noir,
.slide video.ds-noir,
.slide iframe.ds-noir,
.slide object.ds-noir,
.slide embed.ds-noir,
.slide img.ds-chrome,
.slide video.ds-chrome,
.slide iframe.ds-chrome,
.slide object.ds-chrome,
.slide embed.ds-chrome,
.slide img.ds-fade,
.slide video.ds-fade,
.slide iframe.ds-fade,
.slide object.ds-fade,
.slide embed.ds-fade,
.slide img.ds-filter,
.slide video.ds-filter,
.slide iframe.ds-filter,
.slide object.ds-filter,
.slide embed.ds-filter,
.slide img.ds-theme-filter,
.slide video.ds-theme-filter,
.slide iframe.ds-theme-filter,
.slide object.ds-theme-filter,
.slide embed.ds-theme-filter,
.slide img.ds-sharpen,
.slide video.ds-sharpen,
.slide iframe.ds-sharpen,
.slide object.ds-sharpen,
.slide embed.ds-sharpen,
.slide .ds-bn img,
.slide .ds-bn video,
.slide .ds-bn iframe,
.slide .ds-bn object,
.slide .ds-bn embed,
.slide .ds-bw img,
.slide .ds-bw video,
.slide .ds-bw iframe,
.slide .ds-bw object,
.slide .ds-bw embed,
.slide .ds-vivid img,
.slide .ds-vivid video,
.slide .ds-vivid iframe,
.slide .ds-vivid object,
.slide .ds-vivid embed,
.slide .ds-noir img,
.slide .ds-noir video,
.slide .ds-noir iframe,
.slide .ds-noir object,
.slide .ds-noir embed,
.slide .ds-chrome img,
.slide .ds-chrome video,
.slide .ds-chrome iframe,
.slide .ds-chrome object,
.slide .ds-chrome embed,
.slide .ds-fade img,
.slide .ds-fade video,
.slide .ds-fade iframe,
.slide .ds-fade object,
.slide .ds-fade embed,
.slide .ds-filter img,
.slide .ds-filter video,
.slide .ds-filter iframe,
.slide .ds-filter object,
.slide .ds-filter embed,
.slide .ds-theme-filter img,
.slide .ds-theme-filter video,
.slide .ds-theme-filter iframe,
.slide .ds-theme-filter object,
.slide .ds-theme-filter embed,
.slide .ds-sharpen img,
.slide .ds-sharpen video,
.slide .ds-sharpen iframe,
.slide .ds-sharpen object,
.slide .ds-sharpen embed {
  filter: var(--ds-filter-preset, ) var(--ds-filter-custom, ) var(--ds-filter-sharpen, );
}

.slide img.ds-original,
.slide video.ds-original,
.slide iframe.ds-original,
.slide object.ds-original,
.slide embed.ds-original,
.slide .ds-original img,
.slide .ds-original video,
.slide .ds-original iframe,
.slide .ds-original object,
.slide .ds-original embed {
  filter: none !important;
  opacity: 1;
}

.slide .ds-readable,
.slide .ds-vignette {
  position: relative;
  isolation: isolate;
}

.slide .ds-readable::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    var(--ds-readable-angle, 90deg),
    rgba(0, 0, 0, var(--ds-readable-start, 0.5)),
    rgba(0, 0, 0, var(--ds-readable-end, 0.16))
  );
}

.slide .ds-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  box-shadow: inset 0 0 var(--ds-vignette-size, 160px) var(--ds-vignette-color, rgba(0, 0, 0, var(--ds-vignette, 0.35)));
}

.slide .ds-vignette-light {
  --ds-vignette-color: rgba(255, 255, 255, var(--ds-vignette, 0.35));
}

.slide .ds-readable .ds-layer,
.slide .ds-vignette .ds-layer {
  z-index: 2;
}

body.presenter-mode .deck-shell {
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr) minmax(280px, 360px) !important;
  grid-template-rows: minmax(0, 1fr) 58px !important;
}

body.presenter-mode .stage-wrap {
  grid-column: 2 !important;
}

body.presenter-mode .footer-controls {
  grid-column: 2 / 4 !important;
}

.presenter-notes {
  grid-column: 3;
  grid-row: 1;
  min-width: 0;
  border-left: 1px solid var(--htmpres-panel-border, rgba(15, 23, 42, 0.14));
  background: var(--htmpres-panel-bg, #fff);
  color: var(--htmpres-panel-ink, #172033);
  padding: 18px 20px;
  overflow: auto;
}

.presenter-notes h2 {
  margin: 0 0 14px;
  font-size: 0.9rem;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--htmpres-panel-muted, #64748b);
}

.presenter-note-body {
  font-size: 1rem;
  line-height: 1.5;
}

.presenter-note-body p {
  margin: 0 0 0.85rem;
}

.presenter-note-empty {
  color: var(--htmpres-panel-muted, #64748b);
  font-style: italic;
}

@media (max-width: 980px) {
  body.presenter-mode .deck-shell {
    display: block !important;
    min-height: 100vh;
    overflow: auto;
  }

  .presenter-notes {
    border-left: 0;
    border-top: 1px solid rgba(15, 23, 42, 0.14);
    max-height: 34vh;
  }
}
`;
}

function markdownToHtml(markdown) {
  if (!markdown.trim()) return "";
  const result = spawnSync(
    "quarto",
    [
      "pandoc",
      "-f",
      "markdown+native_divs+native_spans+fenced_divs+pipe_tables+raw_html+yaml_metadata_block",
      "-t",
      "html",
      "--wrap=none",
      "--katex",
    ],
    {
      input: markdown,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 256,
    },
  );
  if (result.status !== 0) {
    throw new Error(`quarto pandoc failed while rendering slide markdown:\n${result.stderr || result.stdout}`);
  }
  return result.stdout || result.stderr;
}

function extractNotes(markdown) {
  return extractSourceNotes(markdown);
}

function parseSlides(body) {
  return parseSourceSlides(body);
}

function parsePandocAttrs(attrText = "") {
  const classes = [];
  const keyValues = {};
  const inner = attrText.trim().replace(/^\{|\}$/g, "");
  const tokenRe = /(?:^|\s)(#[^\s.{}]+|\.[^\s.{}]+|[A-Za-z_:][-A-Za-z0-9_:.]*=(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\s]+))/g;
  let match;
  while ((match = tokenRe.exec(inner))) {
    const token = match[1];
    if (token.startsWith(".")) {
      classes.push(token.slice(1));
    } else if (token.startsWith("#")) {
      keyValues.id = token.slice(1);
    } else {
      const eq = token.indexOf("=");
      const key = token.slice(0, eq);
      let value = token.slice(eq + 1);
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      keyValues[key] = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return { classes, keyValues };
}

function splitFrontMatter(text) {
  return splitSourceFrontMatter(text);
}

function parseSimpleYaml(yaml) {
  const meta = {};
  const stack = [];
  for (const rawLine of yaml.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indentSize = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();
    const match = /^([^:]+):(?:\s+(.*))?$/.exec(line);
    if (!match) continue;
    while (stack.length && stack[stack.length - 1].indent >= indentSize) stack.pop();
    const key = [...stack.map((item) => item.key), match[1].trim()].join(".");
    const value = match[2] ?? "";
    if (value) meta[key] = stripYamlQuotes(value);
    stack.push({ indent: indentSize, key: match[1].trim() });
  }
  return meta;
}

function findFiles(dir, predicate) {
  const found = [];
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) found.push(...findFiles(fullPath, predicate));
    else if (predicate(fullPath)) found.push(fullPath);
  }
  return found;
}

function formatHtmlAttrs(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join("");
}

function splitClasses(value = "") {
  return String(value).split(/\s+/).filter(Boolean);
}

function shortTitle(title) {
  return title.replace(/\s+Presentation$/i, "");
}

function stripYamlQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

function unescapeHeading(text) {
  return text.replace(/\\([{}])/g, "$1");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

function escapeScriptJson(text) {
  return text.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function indent(text, prefix) {
  return text
    .split("\n")
    .map((line) => (line ? prefix + line : line))
    .join("\n");
}

function indentHtml(text, prefix) {
  let inPre = false;
  return text
    .split("\n")
    .map((line) => {
      const shouldIndent = line && !inPre;
      const out = shouldIndent ? prefix + line : line;
      if (/<pre\b/i.test(line) && !/<\/pre>/i.test(line)) inPre = true;
      if (inPre && /<\/pre>/i.test(line)) inPre = false;
      return out;
    })
    .join("\n");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function humanTitle(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readRuntimeFile(name) {
  const local = path.join(root, "decks", "scripts", name);
  return readFileSync(existsSync(local) ? local : new URL(`../_extensions/htmpres/runtime/${name}`, import.meta.url), "utf8");
}

function copyMathAssets(deckDir) {
  const sourceDir = new URL("../_extensions/htmpres/vendor/katex/", import.meta.url);
  function copy(directory, relative = "") {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = `${relative}${entry.name}`;
      if (entry.isDirectory()) { copy(new URL(`${entry.name}/`, directory), `${file}/`); continue; }
      const bytes = readFileSync(new URL(entry.name, directory));
      const target = path.join(deckDir, "assets", "htmpres-math", file);
      if (existsSync(target) && readFileSync(target).equals(bytes)) continue;
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
  }
  copy(sourceDir);
}

function formatDiagnostic(diagnostic) {
  return `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}: ${diagnostic.code}: ${diagnostic.message}`;
}

function lintCommand(args) {
  const files = args.filter(arg => arg !== "--json");
  const diagnostics = files.flatMap(file => {
    try { return lintSource(readFileSync(path.resolve(root, file), "utf8"), file); }
    catch (error) { return [{ file, line: 1, column: 1, code: "source-read", severity: "error", message: String(error) }]; }
  });
  if (!files.length) diagnostics.push({ file: "", line: 1, column: 1, code: "usage", severity: "error", message: "lint requires at least one QMD source file." });
  const report = { version: 1, ok: diagnostics.length === 0, diagnostics };
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else if (report.ok) console.log(`Source lint passed (${files.length} files).`);
  else for (const diagnostic of diagnostics) console.error(formatDiagnostic(diagnostic));
  if (!report.ok) process.exit(1);
}
