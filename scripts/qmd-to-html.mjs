#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const decksDir = path.join(root, "decks");

const explicit = process.argv.slice(2);
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
  const slides = parseSlides(body);
  if (!slides.length) {
    throw new Error(`No level-2 slides found in ${file}`);
  }

  const title = meta.pagetitle || meta.title || humanTitle(path.basename(deckDir));
  const cssPath = path.join(deckDir, meta["deck.css"] || "source.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  const rendered = slides.map((slide, index) => {
    const { body, notes } = extractNotes(slide.body);
    const cleanSlide = { ...slide, body };
    return {
      slideHtml: renderSlide(cleanSlide, index),
      notesHtml: namespacePandocCodeIds(markdownToHtml(notes).trim(), `notes-${index + 1}`),
    };
  });
  const htmlSlides = rendered.map((slide) => slide.slideHtml).join("\n\n");
  const notes = rendered.map((slide) => slide.notesHtml);
  const audienceHtml = deckShell({
    mode: "audience",
    title,
    tocTitle: shortTitle(title),
    css,
    slides: htmlSlides,
    slideCount: slides.length,
    notes,
  });
  const presenterHtml = deckShell({
    mode: "presenter",
    title: `${title} - Presenter`,
    tocTitle: shortTitle(title),
    css,
    slides: htmlSlides,
    slideCount: slides.length,
    notes,
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

function renderSlide(slide, index) {
  const attrs = parsePandocAttrs(slide.attrText);
  const classes = ["slide", ...attrs.classes];
  if (index === 0) classes.push("active");
  const title = slide.title || attrs.keyValues["data-title"] || `Slide ${index + 1}`;
  const bodyHtml = namespacePandocCodeIds(markdownToHtml(slide.body).trim(), `slide-${index + 1}`);
  const dataAttrs = { ...attrs.keyValues };
  if (!dataAttrs["data-title"]) dataAttrs["data-title"] = title;
  const attrText = formatHtmlAttrs({
    class: unique(classes).join(" "),
    ...dataAttrs,
  });
  const headingClass = attrs.classes.includes("title-hidden") ? " class=\"visually-hidden\"" : "";
  return `<section${attrText}>
  <h2${headingClass}>${escapeHtml(title)}</h2>
${indentHtml(bodyHtml, "  ")}
</section>`;
}

function namespacePandocCodeIds(html, prefix) {
  return html
    .replace(/\bid="cb(\d+(?:-\d+)?)"/g, `id="${prefix}-cb$1"`)
    .replace(/\bhref="#cb(\d+(?:-\d+)?)"/g, `href="#${prefix}-cb$1"`);
}

function deckShell({ mode, title, tocTitle, css, slides, slideCount, notes }) {
  const deckJs = readFileSync(path.join(root, "decks", "scripts", "htmpres-custom-deck.js"), "utf8");
  const interactions = readFileSync(path.join(root, "decks", "scripts", "htmpres-interactions.html"), "utf8");
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
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
${css}
${runtimeCss()}
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
      <div class="counter" id="counter">1 / ${slideCount}</div>
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
${notesScript}

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

.slide div.sourceCode,
.slide pre {
  max-width: 100%;
  overflow: auto;
}

.slide > div.sourceCode,
.slide > pre {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 8px;
  background: var(--htmpres-code-bg, #172127);
  color: var(--htmpres-code-ink, #eff6f4);
  padding: 18px;
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
  color: rgba(226, 232, 240, 0.46);
  text-align: right;
  text-decoration: none;
  user-select: none;
}

.slide pre.numberSource code > span > a:first-child::before {
  content: counter(source-line);
}

.slide .code-line-highlight {
  background: rgba(193, 131, 34, 0.22);
  box-shadow: inset 4px 0 0 rgba(193, 131, 34, 0.9);
}

.slide .code-step-active .code-line-dim {
  opacity: 0.42;
}

.slide .sourceCode .al,
.slide .sourceCode .er {
  color: #fecdd3;
}

.slide .sourceCode .kw,
.slide .sourceCode .cf,
.slide .sourceCode .im {
  color: #7dd3fc;
  font-weight: 700;
}

.slide .sourceCode .dt,
.slide .sourceCode .at {
  color: #c4b5fd;
}

.slide .sourceCode .st,
.slide .sourceCode .ss,
.slide .sourceCode .ch {
  color: #a7f3d0;
}

.slide .sourceCode .dv,
.slide .sourceCode .bn,
.slide .sourceCode .fl {
  color: #fcd34d;
}

.slide .sourceCode .co {
  color: #94a3b8;
  font-style: italic;
}

.slide .sourceCode .fu,
.slide .sourceCode .bu,
.slide .sourceCode .ot {
  color: #f9a8d4;
}

.slide .sourceCode .op,
.slide .sourceCode .sc,
.slide .sourceCode .va {
  color: #f8fafc;
}

.slide > :not(.ds-full):not(.ds-left):not(.ds-right) {
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
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: var(--ds-radius, 8px);
  background: #ffffff;
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

.slide img.ds-rounded,
.slide video.ds-rounded,
.slide iframe.ds-rounded,
.slide .ds-rounded img,
.slide .ds-rounded video,
.slide .ds-rounded iframe {
  border-radius: var(--ds-radius, 16px);
}

.slide img.ds-bn,
.slide video.ds-bn,
.slide img.ds-bw,
.slide video.ds-bw,
.slide .ds-bn img,
.slide .ds-bn video,
.slide .ds-bw img,
.slide .ds-bw video {
  filter: grayscale(1);
}

.slide img.ds-vivid,
.slide video.ds-vivid,
.slide .ds-vivid img,
.slide .ds-vivid video {
  filter: saturate(1.35) contrast(1.12);
}

.slide img.ds-noir,
.slide video.ds-noir,
.slide .ds-noir img,
.slide .ds-noir video {
  filter: grayscale(1) contrast(1.25) brightness(0.85);
}

.slide img.ds-chrome,
.slide video.ds-chrome,
.slide .ds-chrome img,
.slide .ds-chrome video {
  filter: saturate(0.7) contrast(1.35) brightness(1.08);
}

.slide img.ds-fade,
.slide video.ds-fade,
.slide .ds-fade img,
.slide .ds-fade video {
  filter: saturate(0.75) opacity(0.78);
}

.slide img.ds-filter,
.slide video.ds-filter,
.slide .ds-filter img,
.slide .ds-filter video {
  filter:
    saturate(var(--ds-saturation, 1))
    contrast(var(--ds-contrast, 1))
    brightness(var(--ds-brightness, 1))
    sepia(var(--ds-sepia, 0))
    blur(var(--ds-blur, 0))
    opacity(var(--ds-opacity, 1));
}

.slide img.ds-alpha,
.slide video.ds-alpha,
.slide .ds-alpha img,
.slide .ds-alpha video {
  opacity: var(--ds-opacity, 0.6);
}

.slide img.ds-zoom,
.slide video.ds-zoom,
.slide .ds-zoom img,
.slide .ds-zoom video {
  transform: scale(var(--ds-scale, 1.2));
}

.slide .ds-vignette {
  position: relative;
}

.slide .ds-vignette::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 var(--ds-vignette-size, 160px) rgba(0, 0, 0, var(--ds-vignette, 0.35));
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
  border-left: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
  color: #172033;
  padding: 18px 20px;
  overflow: auto;
}

.presenter-notes h2 {
  margin: 0 0 14px;
  font-size: 0.9rem;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: uppercase;
  color: #64748b;
}

.presenter-note-body {
  font-size: 1rem;
  line-height: 1.5;
}

.presenter-note-body p {
  margin: 0 0 0.85rem;
}

.presenter-note-empty {
  color: #64748b;
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
  if (!markdown.trim()) return { body: markdown, notes: "" };
  const bodyLines = [];
  const noteBlocks = [];
  const lines = markdown.split(/\r?\n/);
  let inNotes = false;
  let notesFenceLen = 0;
  let currentNotes = [];
  let inCodeFence = false;
  let codeFenceChar = "";
  let codeFenceLen = 0;

  for (const line of lines) {
    const codeFence = /^(`{3,}|~{3,})/.exec(line);
    if (codeFence) {
      const marker = codeFence[1];
      if (!inCodeFence) {
        inCodeFence = true;
        codeFenceChar = marker[0];
        codeFenceLen = marker.length;
      } else if (marker[0] === codeFenceChar && marker.length >= codeFenceLen) {
        inCodeFence = false;
      }
    }

    if (!inNotes) {
      const opening = inCodeFence ? null : noteFenceOpening(line);
      if (opening) {
        inNotes = true;
        notesFenceLen = opening.length;
        currentNotes = [];
        continue;
      }
      bodyLines.push(line);
      continue;
    }

    if (!inCodeFence && noteFenceClosing(line, notesFenceLen)) {
      noteBlocks.push(currentNotes.join("\n").trim());
      inNotes = false;
      notesFenceLen = 0;
      currentNotes = [];
      continue;
    }

    currentNotes.push(line);
  }

  if (inNotes) {
    noteBlocks.push(currentNotes.join("\n").trim());
  }

  return {
    body: bodyLines.join("\n").trim(),
    notes: noteBlocks.filter(Boolean).join("\n\n"),
  };
}

function noteFenceOpening(line) {
  const match = /^(:{3,})\s+(?:notes|\{\s*\.notes\s*\})\s*$/.exec(line.trim());
  return match ? { length: match[1].length } : null;
}

function noteFenceClosing(line, fenceLen) {
  const trimmed = line.trim();
  if (!trimmed || /[^:]/.test(trimmed)) return false;
  return trimmed.length >= fenceLen;
}

function parseSlides(body) {
  const lines = body.split(/\r?\n/);
  const slides = [];
  let current = null;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  for (const line of lines) {
    const fence = /^(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceLen) {
        inFence = false;
      }
    }

    const heading = !inFence ? /^##\s+(.+?)(?:\s+(\{.*\}))?\s*$/.exec(line) : null;
    if (heading) {
      if (current) slides.push(current);
      current = {
        title: heading[1].trim(),
        attrText: heading[2] || "",
        bodyLines: [],
      };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) slides.push(current);
  return slides.map((slide) => ({
    ...slide,
    title: unescapeHeading(slide.title),
    body: slide.bodyLines.join("\n").trim(),
  }));
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
  if (!text.startsWith("---\n")) return { yaml: "", body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { yaml: "", body: text };
  return {
    yaml: text.slice(4, end),
    body: text.slice(end + 4).replace(/^\s*\n/, ""),
  };
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
