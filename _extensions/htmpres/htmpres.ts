type DeckSource = {
  source: string;
  slug: string;
  note: string;
};

type SourceSlide = {
  attrs: string;
  inner: string;
};

type QmdSlide = {
  title: string;
  attrText: string;
  bodyLines: string[];
  body: string;
};

type PandocAttrs = {
  classes: string[];
  keyValues: Record<string, string>;
};

const root = Deno.cwd();
const extensionDir = dirname(fileUrlToPath(import.meta.url));
const commandScript = relativePath(root, fileUrlToPath(import.meta.url));
const decksDir = join(root, "decks");
const sourceRoot = join(root, "source_presentations");
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const rawDivClasses = [
  "axis",
  "axis-map",
  "core-cycle",
  "ds-alpha",
  "ds-bn",
  "ds-bottom",
  "ds-bw",
  "ds-center",
  "ds-chrome",
  "ds-fade",
  "ds-fill",
  "ds-filter",
  "ds-fit",
  "ds-frame",
  "ds-full",
  "ds-grid",
  "ds-global-background",
  "ds-hide",
  "ds-inline",
  "ds-layer",
  "ds-left",
  "ds-media",
  "ds-no-border",
  "ds-no-pad",
  "ds-noir",
  "ds-original",
  "ds-pane",
  "ds-readable",
  "ds-right",
  "ds-rounded",
  "ds-sharpen",
  "ds-split",
  "ds-theme-filter",
  "ds-top",
  "ds-vignette",
  "ds-vignette-light",
  "ds-vivid",
  "ds-zoom",
  "flow",
  "flow-strip",
  "autoscale",
  "fragment",
  "fragment-blur",
  "fragment-dim",
  "fragment-fade",
  "fragment-highlight",
  "fragment-left",
  "fragment-none",
  "fragment-right",
  "fragment-rise",
  "fragment-scale",
  "fragment-slide",
  "incremental",
  "kpi-grid",
  "mini-cycle-list",
  "mini-diagram",
  "numbered",
  "no-background",
  "no-autoscale",
  "pill-row",
  "profile-fragment-grid",
  "profile-grid",
  "release-ladder",
  "story-bridge",
  "story-stat-grid",
  "story-steps",
  "timeline",
];

const interactiveAttrs = [
  "data-autoscale",
  "data-background-class",
  "data-background-filter",
  "data-background-fit",
  "data-background-image",
  "data-background-opacity",
  "data-background-position",
  "data-target",
  "data-text-fit",
  "data-text-fit-min",
  "data-update-target",
  "data-filter",
  "data-item-filter",
  "data-filter-target",
  "data-fragment-effect",
  "data-fragment-index",
  "data-transition",
];

await main();

async function main() {
  const [command = "help", ...args] = Deno.args;
  if (command === "--help" || command === "-h" || command === "help") {
    usage();
    return;
  }

  try {
    switch (command) {
      case "all":
        await convertCommand([]);
        await renderCommand([]);
        verifyCommand();
        break;
      case "convert":
      case "import":
        await convertCommand(args);
        break;
      case "render":
        await renderCommand(args);
        break;
      case "verify":
        verifyCommand();
        break;
      default:
        console.error(`Unknown command: ${command}\n`);
        usage();
        Deno.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

function usage() {
  console.log(`Usage:
  quarto run ${commandScript} convert [source.html ...]
  quarto run ${commandScript} render [decks/name/index.qmd ...]
  quarto run ${commandScript} verify
  quarto run ${commandScript} all

Commands:
  convert   Convert HTML decks in source_presentations/ to decks/*/index.qmd.
  render    Render QMD decks to index.html and presenter.html.
  verify    Compare copied source decks, QMD, and rendered HTML outputs.
  all       Run convert, render, and verify.

This script runs on Quarto's bundled Deno runtime and does not require Node.`);
}

async function convertCommand(args: string[]) {
  const decks = args.length
    ? args.map((source) => ({ source, slug: inferSlug(source), note: "User-specified source deck." }))
    : discoverDecks();

  for (const deck of decks) {
    await convertDeck(deck);
  }
}

function discoverDecks(): DeckSource[] {
  return findFiles(sourceRoot, (file) => file.endsWith(".html"))
    .map((file) => relativePath(root, file))
    .sort()
    .map((source) => ({
      source,
      slug: inferSlug(source),
      note: "Generated from the copied source presentation snapshot.",
    }));
}

async function convertDeck(deck: DeckSource) {
  const sourcePath = resolvePath(root, deck.source);
  if (!exists(sourcePath)) {
    throw new Error(`Missing source deck: ${deck.source}`);
  }

  const html = Deno.readTextFileSync(sourcePath);
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i)?.trim() || humanTitle(deck.slug);
  const slides = extractSlides(html);
  if (!slides.length) {
    throw new Error(`No <section class="slide"> elements found in ${deck.source}`);
  }

  const outDir = join(root, "decks", deck.slug);
  Deno.mkdirSync(outDir, { recursive: true });
  copyDeckAssets(sourcePath, outDir);
  writeSourceCss(html, outDir);

  const rendered: string[] = [];
  for (let index = 0; index < slides.length; index += 1) {
    rendered.push(await convertSlide(slides[index], index, outDir));
  }

  const qmd = `${frontMatter(title, deck.note)}\n\n${rendered.join("\n\n")}\n`;
  const outPath = join(outDir, "index.qmd");
  Deno.writeTextFileSync(outPath, qmd);
  console.log(`Converted ${deck.source} -> ${relativePath(root, outPath)} (${slides.length} slides)`);
}

function frontMatter(title: string, note: string) {
  return `---
pagetitle: "${yamlString(title)}"
execute:
  enabled: false
resources:
  - assets/**

deck:
  css: source.css
  renderer: custom
deck-note: "${yamlString(note)}"
---`;
}

async function convertSlide(slide: SourceSlide, index: number, outDir: string) {
  const attrs = parseAttributes(slide.attrs);
  const sectionClasses = splitClasses(attrs.class).filter((name) => name !== "slide" && name !== "active");
  const h2 = extractFirstH2(slide.inner);
  const hasVisibleTitle = Boolean(h2);
  const h2Attrs = h2 ? parseAttributes(h2.attrs) : {};
  const h2Classes = splitClasses(h2Attrs.class);
  const titleHtml = h2 ? h2.inner : attrs["data-title"] || `Slide ${index + 1}`;
  const title = htmlToText(titleHtml) || attrs["data-title"] || `Slide ${index + 1}`;

  const inner = h2 ? slide.inner.slice(0, h2.start) + slide.inner.slice(h2.end) : slide.inner;
  const classes = unique([...sectionClasses, ...h2Classes, hasVisibleTitle ? "" : "title-hidden"]);
  const headingAttrs = formatHeadingAttrs(classes, pickDataAttrs(attrs));

  const markdown = (await htmlToQuartoMarkdown(inner, outDir)).trim();
  return `## ${escapeHeading(title)}${headingAttrs}\n\n${markdown}`;
}

async function htmlToQuartoMarkdown(html: string, outDir: string) {
  const rawBlocks: string[] = [];
  let prepared = await extractDataUriImages(html, outDir);
  prepared = protectTables(prepared, rawBlocks);
  prepared = protectDataUriImages(prepared, rawBlocks);
  prepared = protectDivsByClass(prepared, rawDivClasses, rawBlocks);
  prepared = protectButtons(prepared, rawBlocks);
  prepared = prepared.replace(
    /<aside\b([^>]*\bclass="[^"]*\bnotes\b[^"]*"[^>]*)>([\s\S]*?)<\/aside>/gi,
    "<div$1>$2</div>",
  );
  prepared = prepared.replace(
    /<p\b([^>]*\bclass="[^"]+"[^>]*)>([\s\S]*?)<\/p>/gi,
    "<div$1>$2</div>",
  );

  const markdown = await pandocHtmlToMarkdown(prepared);
  return restoreRawBlocks(markdown, rawBlocks);
}

async function pandocHtmlToMarkdown(html: string) {
  const result = await runProcess(
    [
      "quarto",
      "pandoc",
      "-f",
      "html",
      "-t",
      "markdown+native_divs+native_spans+fenced_divs+pipe_tables+raw_html",
      "--wrap=none",
    ],
    html,
  );
  if (result.code !== 0) {
    throw new Error(`quarto pandoc failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout || result.stderr;
}

function extractSlides(html: string): SourceSlide[] {
  const slides: SourceSlide[] = [];
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const attrs = match[1] || "";
    if (/\bclass="[^"]*\bslide\b/i.test(attrs)) {
      slides.push({ attrs, inner: match[2] || "" });
    }
  }
  return slides;
}

function extractFirstH2(html: string) {
  const match = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/i.exec(html);
  if (!match) return null;
  return {
    attrs: match[1] || "",
    inner: match[2] || "",
    start: match.index,
    end: match.index + match[0].length,
  };
}

function protectTables(html: string, rawBlocks: string[]) {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (raw) => rawToken(rawBlocks, raw));
}

async function extractDataUriImages(html: string, outDir: string) {
  const re = /<img\b[^>]*>/gi;
  let out = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const raw = match[0];
    out += html.slice(cursor, match.index);
    const attrs = parseAttributes(raw);
    if (attrs.src?.startsWith("data:image/")) {
      const assetPath = await writeDataUriImage(attrs.src, outDir, attrs.alt);
      out += replaceAttribute(raw, "src", assetPath);
    } else {
      out += raw;
    }
    cursor = match.index + raw.length;
  }
  return out + html.slice(cursor);
}

function protectDataUriImages(html: string, rawBlocks: string[]) {
  return html.replace(/<img\b[^>]*>/gi, (raw) => {
    const attrs = parseAttributes(raw);
    const classes = splitClasses(attrs.class);
    if (attrs.src?.startsWith("data:") && classes.includes("zoomable")) {
      return rawToken(rawBlocks, raw);
    }
    return raw;
  });
}

async function writeDataUriImage(dataUri: string, outDir: string, alt = "") {
  const parsed = parseDataUri(dataUri);
  if (!parsed) return dataUri;
  const hash = (await sha256Hex(parsed.bytes)).slice(0, 12);
  const label = slugify(alt) || "embedded-image";
  const fileName = `${label}-${hash}.${extensionForMime(parsed.mime)}`;
  const assetDir = join(outDir, "assets", "generated");
  Deno.mkdirSync(assetDir, { recursive: true });
  Deno.writeFileSync(join(assetDir, fileName), parsed.bytes);
  return `assets/generated/${fileName}`;
}

function parseDataUri(dataUri: string) {
  const match = /^data:([^;,]+)(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i.exec(dataUri);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const payload = match[3];
  const bytes = match[2]
    ? bytesFromBase64(payload)
    : encoder.encode(decodeURIComponent(payload));
  return { mime, bytes };
}

function extensionForMime(mime: string) {
  const map: Record<string, string> = {
    "image/svg+xml": "svg",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return map[mime] || "img";
}

function replaceAttribute(tag: string, name: string, value: string) {
  const escaped = escapeHtmlAttr(value);
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  if (re.test(tag)) return tag.replace(re, `${name}="${escaped}"`);
  return tag.replace(/\/?>$/, ` ${name}="${escaped}"$&`);
}

function protectButtons(html: string, rawBlocks: string[]) {
  return html.replace(/<button\b[\s\S]*?<\/button>/gi, (raw) => rawToken(rawBlocks, raw));
}

function protectDivsByClass(html: string, classNames: string[], rawBlocks: string[]) {
  let cursor = 0;
  let out = "";
  while (cursor < html.length) {
    const start = html.slice(cursor).search(/<div\b[^>]*>/i);
    if (start < 0) {
      out += html.slice(cursor);
      break;
    }
    const absoluteStart = cursor + start;
    const opening = /<div\b[^>]*>/i.exec(html.slice(absoluteStart))?.[0] || "";
    const attrs = parseAttributes(opening);
    const classes = splitClasses(attrs.class);
    if (!classes.some((name) => classNames.includes(name))) {
      out += html.slice(cursor, absoluteStart + opening.length);
      cursor = absoluteStart + opening.length;
      continue;
    }

    const end = findMatchingDivEnd(html, absoluteStart);
    if (end < 0) {
      out += html.slice(cursor);
      break;
    }

    out += html.slice(cursor, absoluteStart);
    out += rawToken(rawBlocks, html.slice(absoluteStart, end));
    cursor = end;
  }
  return out;
}

function findMatchingDivEnd(html: string, start: number) {
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    if (match[0][1] === "/") {
      depth -= 1;
      if (depth === 0) return tagRe.lastIndex;
    } else {
      depth += 1;
    }
  }
  return -1;
}

function rawToken(rawBlocks: string[], raw: string) {
  const token = `@@HTMPRES_RAW_${rawBlocks.length}@@`;
  rawBlocks.push(raw.trim());
  return `\n\n${token}\n\n`;
}

function restoreRawBlocks(markdown: string, rawBlocks: string[]) {
  let out = markdown;
  rawBlocks.forEach((raw, index) => {
    out = out.split(`@@HTMPRES_RAW_${index}@@`).join(normalizeRawHtml(raw));
  });
  return out;
}

function normalizeRawHtml(raw: string) {
  return raw.replace(/\n[ \t]+/g, "\n").trim();
}

async function renderCommand(args: string[]) {
  const qmdFiles = args.length
    ? args
    : findFiles(decksDir, (file) => basename(file) === "index.qmd").map((file) => relativePath(root, file));

  for (const file of qmdFiles.sort()) {
    await renderDeck(file);
  }
}

async function renderDeck(file: string) {
  const qmdPath = resolvePath(root, file);
  const deckDir = dirname(qmdPath);
  const qmd = Deno.readTextFileSync(qmdPath);
  const { yaml, body } = splitFrontMatter(qmd);
  const meta = parseSimpleYaml(yaml);
  const slides = parseSlides(body);
  if (!slides.length) {
    throw new Error(`No level-2 slides found in ${file}`);
  }

  const title = meta.pagetitle || meta.title || humanTitle(basename(deckDir));
  const theme = meta["deck.theme"] || meta.theme || "";
  const background = deckBackground(meta);
  const textFit = deckTextFit(meta);
  const cssPath = join(deckDir, meta["deck.css"] || "source.css");
  const css = exists(cssPath) ? Deno.readTextFileSync(cssPath) : "";
  const rendered: { slideHtml: string; notesHtml: string }[] = [];

  for (let index = 0; index < slides.length; index += 1) {
    const { body, notes } = extractNotes(slides[index].body);
    const cleanSlide = { ...slides[index], body };
    rendered.push({
      slideHtml: await renderSlide(cleanSlide, index, background),
      notesHtml: namespacePandocCodeIds((await markdownToHtml(notes)).trim(), `notes-${index + 1}`),
    });
  }

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
    theme,
    textFit,
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
    textFit,
  });

  const outPath = join(deckDir, "index.html");
  const presenterPath = join(deckDir, "presenter.html");
  Deno.writeTextFileSync(outPath, audienceHtml);
  Deno.writeTextFileSync(presenterPath, presenterHtml);
  const notesCount = notes.filter(Boolean).length;
  console.log(
    `Rendered ${file} -> ${relativePath(root, outPath)} and ${relativePath(root, presenterPath)} (${slides.length} slides, ${notesCount} notes, custom no-reveal shell)`,
  );
}

async function renderSlide(slide: QmdSlide, index: number, globalBackground: DeckBackground | null) {
  const attrs = parsePandocAttrs(slide.attrText);
  const classes = ["slide", ...attrs.classes];
  if (index === 0) classes.push("active");
  const title = slide.title || attrs.keyValues["data-title"] || `Slide ${index + 1}`;
  const bodyHtml = namespacePandocCodeIds((await markdownToHtml(slide.body)).trim(), `slide-${index + 1}`);
  const backgroundHtml = renderBackgroundLayer(attrs, globalBackground);
  const dataAttrs = { ...attrs.keyValues };
  if (!dataAttrs["data-title"]) dataAttrs["data-title"] = title;
  const attrText = formatHtmlAttrs({
    class: unique(classes).join(" "),
    ...dataAttrs,
  });
  const headingClass = attrs.classes.includes("title-hidden") ? ' class="visually-hidden"' : "";
  return `<section${attrText}>
${backgroundHtml ? indentHtml(backgroundHtml, "  ") + "\n" : ""}
  <h2${headingClass}>${escapeHtml(title)}</h2>
${indentHtml(bodyHtml, "  ")}
</section>`;
}

type DeckBackground = {
  image: string;
  fit: string;
  filter: string;
  position: string;
  opacity: string;
  className: string;
};

type DeckTextFit = {
  enabled: boolean;
  min: string;
};

function deckBackground(meta: Record<string, string>): DeckBackground | null {
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

function deckTextFit(meta: Record<string, string>): DeckTextFit {
  const enabled = boolMeta(firstMeta(meta, ["deck.text-fit", "deck.autoscale", "text-fit", "autoscale"]));
  return {
    enabled,
    min: firstMeta(meta, ["deck.text-fit-min", "deck.autoscale-min", "text-fit-min", "autoscale-min"]) || "",
  };
}

function renderBackgroundLayer(attrs: PandocAttrs, globalBackground: DeckBackground | null) {
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

function backgroundFitClass(value: string) {
  return sanitizeClassToken(value) === "fit" ? "ds-fit" : "ds-fill";
}

function backgroundFilterClasses(value: string) {
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

function backgroundStyle(position: string, opacity: string) {
  const styles = [];
  if (position) styles.push(`--ds-bg-position: ${escapeCssValue(position)}`);
  if (opacity) styles.push(`--ds-bg-opacity: ${escapeCssValue(opacity)}`);
  return styles.length ? ` style="${escapeHtmlAttr(styles.join("; "))}"` : "";
}

function firstMeta(meta: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    if (meta[key] != null && meta[key] !== "") return meta[key];
  }
  return "";
}

function boolMeta(value: string) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function isNoneValue(value: string) {
  return /^(none|false|off|original)$/i.test(String(value || "").trim());
}

function sanitizeClassToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeCssValue(value: string) {
  return String(value).replace(/[;"'<>]/g, "");
}

function namespacePandocCodeIds(html: string, prefix: string) {
  return html
    .replace(/\bid="cb(\d+(?:-\d+)?)"/g, `id="${prefix}-cb$1"`)
    .replace(/\bhref="#cb(\d+(?:-\d+)?)"/g, `href="#${prefix}-cb$1"`);
}

function deckShell({
  mode,
  title,
  tocTitle,
  css,
  slides,
  slideCount,
  notes,
  theme,
  textFit,
}: {
  mode: "audience" | "presenter";
  title: string;
  tocTitle: string;
  css: string;
  slides: string;
  slideCount: number;
  notes: string[];
  theme?: string;
  textFit?: DeckTextFit;
}) {
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
    "data-theme": theme || "",
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
  <svg class="htmpres-filter-defs" aria-hidden="true" focusable="false" width="0" height="0">
    <filter id="htmpres-sharpen">
      <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"></feConvolveMatrix>
    </filter>
  </svg>
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

async function markdownToHtml(markdown: string) {
  if (!markdown.trim()) return "";
  const result = await runProcess(
    [
      "quarto",
      "pandoc",
      "-f",
      "markdown+native_divs+native_spans+fenced_divs+pipe_tables+raw_html+yaml_metadata_block",
      "-t",
      "html",
      "--wrap=none",
    ],
    markdown,
  );
  if (result.code !== 0) {
    throw new Error(`quarto pandoc failed while rendering slide markdown:\n${result.stderr || result.stdout}`);
  }
  return result.stdout || result.stderr;
}

function extractNotes(markdown: string) {
  if (!markdown.trim()) return { body: markdown, notes: "" };
  const bodyLines: string[] = [];
  const noteBlocks: string[] = [];
  const lines = markdown.split(/\r?\n/);
  let inNotes = false;
  let notesFenceLen = 0;
  let currentNotes: string[] = [];
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

function noteFenceOpening(line: string) {
  const match = /^(:{3,})\s+(?:notes|\{\s*\.notes\s*\})\s*$/.exec(line.trim());
  return match ? { length: match[1].length } : null;
}

function noteFenceClosing(line: string, fenceLen: number) {
  const trimmed = line.trim();
  if (!trimmed || /[^:]/.test(trimmed)) return false;
  return trimmed.length >= fenceLen;
}

function parseSlides(body: string): QmdSlide[] {
  const lines = body.split(/\r?\n/);
  const slides: QmdSlide[] = [];
  let current: QmdSlide | null = null;
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
        body: "",
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

function parsePandocAttrs(attrText = ""): PandocAttrs {
  const classes: string[] = [];
  const keyValues: Record<string, string> = {};
  const inner = attrText.trim().replace(/^\{|\}$/g, "");
  const tokenRe = /(?:^|\s)(#[^\s.{}]+|\.[^\s.{}]+|[A-Za-z_:][-A-Za-z0-9_:.]*=(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\s]+))/g;
  let match: RegExpExecArray | null;
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

function splitFrontMatter(text: string) {
  if (!text.startsWith("---\n")) return { yaml: "", body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { yaml: "", body: text };
  return {
    yaml: text.slice(4, end),
    body: text.slice(end + 4).replace(/^\s*\n/, ""),
  };
}

function parseSimpleYaml(yaml: string) {
  const meta: Record<string, string> = {};
  const stack: { indent: number; key: string }[] = [];
  for (const rawLine of yaml.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indentSize = rawLine.match(/^\s*/)?.[0].length || 0;
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

function formatHtmlAttrs(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join("");
}

function verifyCommand() {
  const failures: string[] = [];
  const sourceSlugs = new Set<string>();

  for (const sourcePath of discoverSourceDecks()) {
    const slug = inferSlug(sourcePath);
    sourceSlugs.add(slug);
    const deckDir = join(decksDir, slug);
    const source = Deno.readTextFileSync(sourcePath);
    const qmdPath = join(deckDir, "index.qmd");
    const audiencePath = join(deckDir, "index.html");
    const presenterPath = join(deckDir, "presenter.html");

    const qmd = readRequired(qmdPath, failures);
    const audience = readRequired(audiencePath, failures);
    const presenter = readRequired(presenterPath, failures);
    const notes = extractDeckNotes(presenter);
    verifyQmdVerbatimBlocks(slug, qmd, qmdPath, failures);
    verifyGeneratedHtml(slug, qmd, audience, audiencePath, "audience", failures);
    verifyGeneratedHtml(slug, qmd, presenter, presenterPath, "presenter", failures);
    const row: Record<string, number | string | boolean> = {
      deck: slug,
      sourceSlides: countSlides(source),
      qmdSlides: countQmdSlides(qmd),
      audienceSlides: countSlides(audience),
      presenterSlides: countSlides(presenter),
      sourceNotes: countSourceNotes(source),
      qmdNotes: countQmdNotes(qmd),
      audienceNoteClasses: countNoteClasses(audience),
      presenterNotes: notes.filter(Boolean).length,
      sourceZoomable: countZoomable(source),
      audienceZoomable: countZoomable(audience),
      presenterZoomable: countZoomable(presenter),
      presenterNoteSlots: presenterNoteSlots(presenter),
      qmdVerbatim: extractExpectedPreBlocks(qmd).length,
      audienceVerbatim: extractHtmlPreBlocks(audience).length,
      presenterVerbatim: extractHtmlPreBlocks(presenter).length,
    };

    compare(row, "qmdSlides", row.sourceSlides as number, qmdPath, failures);
    compare(row, "audienceSlides", row.sourceSlides as number, audiencePath, failures);
    compare(row, "presenterSlides", row.sourceSlides as number, presenterPath, failures);
    compare(row, "qmdNotes", row.sourceNotes as number, qmdPath, failures);
    compare(row, "presenterNotes", row.sourceNotes as number, presenterPath, failures);
    compare(row, "audienceNoteClasses", 0, audiencePath, failures);
    compare(row, "audienceZoomable", row.sourceZoomable as number, audiencePath, failures);
    compare(row, "presenterZoomable", row.sourceZoomable as number, presenterPath, failures);
    compare(row, "presenterNoteSlots", row.sourceSlides as number, presenterPath, failures);

    const sourceInteractive = stripHtmlPreBlocks(source);
    const audienceInteractive = stripHtmlPreBlocks(audience);
    const presenterInteractive = stripHtmlPreBlocks(presenter);
    for (const attr of interactiveAttrs) {
      const sourceCount = countAttr(sourceInteractive, attr);
      if (!sourceCount) continue;
      const audienceCount = countAttr(audienceInteractive, attr);
      const presenterCount = countAttr(presenterInteractive, attr);
      row[attr] = `${sourceCount}/${audienceCount}/${presenterCount}`;
      if (audienceCount !== sourceCount) fail(slug, audiencePath, `${attr} count ${audienceCount} did not match source ${sourceCount}`, failures);
      if (presenterCount !== sourceCount) fail(slug, presenterPath, `${attr} count ${presenterCount} did not match source ${sourceCount}`, failures);
    }

    console.log(formatRow(row));
  }

  for (const qmdPath of discoverQmdDecks()) {
    const slug = basename(dirname(qmdPath));
    if (sourceSlugs.has(slug)) continue;
    const deckDir = dirname(qmdPath);
    const qmd = readRequired(qmdPath, failures);
    const audiencePath = join(deckDir, "index.html");
    const presenterPath = join(deckDir, "presenter.html");
    const audience = readRequired(audiencePath, failures);
    const presenter = readRequired(presenterPath, failures);
    const notes = extractDeckNotes(presenter);
    verifyQmdVerbatimBlocks(slug, qmd, qmdPath, failures);
    verifyGeneratedHtml(slug, qmd, audience, audiencePath, "audience", failures);
    verifyGeneratedHtml(slug, qmd, presenter, presenterPath, "presenter", failures);
    const row: Record<string, number | string | boolean> = {
      deck: slug,
      qmdOnly: true,
      qmdSlides: countQmdSlides(qmd),
      audienceSlides: countSlides(audience),
      presenterSlides: countSlides(presenter),
      qmdNotes: countQmdNotes(qmd),
      audienceNoteClasses: countNoteClasses(audience),
      presenterNotes: notes.filter(Boolean).length,
      qmdZoomable: countQmdZoomable(qmd),
      audienceZoomable: countZoomable(audience),
      presenterZoomable: countZoomable(presenter),
      presenterNoteSlots: presenterNoteSlots(presenter),
      qmdVerbatim: extractExpectedPreBlocks(qmd).length,
      audienceVerbatim: extractHtmlPreBlocks(audience).length,
      presenterVerbatim: extractHtmlPreBlocks(presenter).length,
    };

    compare(row, "audienceSlides", row.qmdSlides as number, audiencePath, failures);
    compare(row, "presenterSlides", row.qmdSlides as number, presenterPath, failures);
    compare(row, "presenterNotes", row.qmdNotes as number, presenterPath, failures);
    compare(row, "audienceNoteClasses", 0, audiencePath, failures);
    compare(row, "audienceZoomable", row.qmdZoomable as number, audiencePath, failures);
    compare(row, "presenterZoomable", row.qmdZoomable as number, presenterPath, failures);
    compare(row, "presenterNoteSlots", row.qmdSlides as number, presenterPath, failures);

    const audienceInteractive = stripHtmlPreBlocks(audience);
    const presenterInteractive = stripHtmlPreBlocks(presenter);
    for (const attr of interactiveAttrs) {
      const qmdCount = countAttr(stripCodeFences(qmd), attr);
      if (!qmdCount) continue;
      const audienceCount = countAttr(audienceInteractive, attr);
      const presenterCount = countAttr(presenterInteractive, attr);
      row[attr] = `${qmdCount}/${audienceCount}/${presenterCount}`;
      if (audienceCount !== qmdCount) fail(slug, audiencePath, `${attr} count ${audienceCount} did not match QMD ${qmdCount}`, failures);
      if (presenterCount !== qmdCount) fail(slug, presenterPath, `${attr} count ${presenterCount} did not match QMD ${qmdCount}`, failures);
    }

    console.log(formatRow(row));
  }

  if (failures.length) {
    console.error("\nDeck verification failed:");
    for (const failureText of failures) console.error(`- ${failureText}`);
    Deno.exit(1);
  }

  console.log("\nDeck verification passed.");
}

function discoverSourceDecks() {
  return findFiles(sourceRoot, (file) => file.endsWith(".html")).sort();
}

function discoverQmdDecks() {
  return findFiles(decksDir, (file) => basename(file) === "index.qmd").sort();
}

function readRequired(file: string, failures: string[]) {
  if (!exists(file)) {
    fail(basename(dirname(file)), file, "missing generated file", failures);
    return "";
  }
  return Deno.readTextFileSync(file);
}

function verifyQmdVerbatimBlocks(slug: string, qmd: string, file: string, failures: string[]) {
  const blocks = extractExpectedPreBlocks(qmd);
  blocks.forEach((block, index) => {
    if (!block.trim()) {
      fail(slug, file, `verbatim block ${index + 1} is empty`, failures);
    }
    const suspicious = suspiciousIndentLine(block);
    if (suspicious) {
      fail(slug, file, `verbatim block ${index + 1} has suspicious leading indentation on line ${suspicious.line}`, failures);
    }
  });
}

function verifyGeneratedHtml(
  slug: string,
  qmd: string,
  html: string,
  file: string,
  mode: "audience" | "presenter",
  failures: string[],
) {
  const expected = extractExpectedPreBlocks(qmd);
  const actual = extractHtmlPreBlocks(html);

  if (actual.length !== expected.length) {
    fail(slug, file, `rendered verbatim block count ${actual.length} did not match QMD ${expected.length}`, failures);
  }

  const count = Math.min(actual.length, expected.length);
  for (let index = 0; index < count; index += 1) {
    if (!actual[index].trim()) {
      fail(slug, file, `rendered verbatim block ${index + 1} is empty`, failures);
      continue;
    }
    if (actual[index] !== expected[index]) {
      fail(slug, file, verbatimMismatchMessage(index, expected[index], actual[index]), failures);
    }
    const suspicious = suspiciousIndentLine(actual[index]);
    if (suspicious) {
      fail(slug, file, `rendered verbatim block ${index + 1} has suspicious leading indentation on line ${suspicious.line}`, failures);
    }
  }

  if (/@@HTMPRES_RAW_\d+@@/.test(html)) {
    fail(slug, file, "unrestored raw HTML placeholder token remains in output", failures);
  }
  if (/\bid="cb\d+(?:-\d+)?"|\bhref="#cb\d+(?:-\d+)?"/.test(html)) {
    fail(slug, file, "unnamespaced Pandoc code anchor remains in output", failures);
  }
  if (/index_files\/libs\/revealjs|revealjs\/|Reveal\.initialize/.test(html)) {
    fail(slug, file, "reveal.js reference remains in custom renderer output", failures);
  }
  if (mode === "audience" && /<script\b[^>]*\bid="deckNotes"/i.test(html)) {
    fail(slug, file, "audience output contains presenter notes JSON", failures);
  }
  if (mode === "presenter" && !/<script\b[^>]*\bid="deckNotes"/i.test(html)) {
    fail(slug, file, "presenter output is missing presenter notes JSON", failures);
  }
}

function countSlides(html: string) {
  return countClassedTag(html, "section", "slide");
}

function countSourceNotes(html: string) {
  return countClassedTag(html, "aside", "notes");
}

function countNoteClasses(html: string) {
  return countClassedTag(html, "[a-z0-9:-]+", "notes");
}

function countZoomable(html: string) {
  return countClassName(html, "zoomable");
}

function countClassedTag(html: string, tag: string, className: string) {
  const re = new RegExp(`<${tag}\\b[^>]*\\bclass=(["'])[^"']*\\b${escapeRegExp(className)}\\b[^"']*\\1`, "gi");
  return (html.match(re) || []).length;
}

function countClassName(html: string, className: string) {
  const re = new RegExp(`\\bclass=(["'])[^"']*\\b${escapeRegExp(className)}\\b[^"']*\\1`, "gi");
  return (html.match(re) || []).length;
}

function countAttr(html: string, attr: string) {
  const re = new RegExp(`\\b${escapeRegExp(attr)}=`, "gi");
  return (html.match(re) || []).length;
}

function countQmdSlides(qmd: string) {
  return (stripCodeFences(qmd).match(/^##\s+/gm) || []).length;
}

function countQmdNotes(qmd: string) {
  return (stripCodeFences(qmd).match(/^:{3,}\s+(?:notes|\{\s*\.notes\s*\})\s*$/gm) || []).length;
}

function countQmdZoomable(qmd: string) {
  const stripped = stripCodeFences(qmd);
  return (stripped.match(/\{[^}]*\.zoomable\b[^}]*\}/g) || []).length + countClassName(stripped, "zoomable");
}

function extractDeckNotes(html: string) {
  const match = /<script\b[^>]*\bid="deckNotes"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function presenterNoteSlots(html: string) {
  return extractDeckNotes(html).length;
}

function extractExpectedPreBlocks(qmd: string) {
  const { body } = splitFrontMatter(qmd);
  return parseSlides(body).flatMap((slide) => {
    const visible = extractNotes(slide.body).body;
    return extractMarkdownPreBlocks(visible);
  });
}

function extractMarkdownPreBlocks(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const events: { start: number; end: number; text: string }[] = [];
  const fenceRanges: { start: number; end: number }[] = [];
  const fenceRe = /(^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:\n\2[ \t]*(?=\n|$))/g;
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRe.exec(normalized))) {
    const start = fenceMatch.index + fenceMatch[1].length;
    const end = fenceRe.lastIndex;
    fenceRanges.push({ start, end });
    events.push({
      start,
      end,
      text: canonicalPreText(fenceMatch[3]),
    });
  }

  const occupiedRanges = [...fenceRanges];
  const preRe = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let preMatch: RegExpExecArray | null;
  while ((preMatch = preRe.exec(normalized))) {
    const start = preMatch.index;
    const end = preRe.lastIndex;
    if (fenceRanges.some((range) => start >= range.start && start < range.end)) continue;
    occupiedRanges.push({ start, end });
    events.push({
      start,
      end,
      text: extractPreText(preMatch[1]),
    });
  }

  events.push(...extractIndentedCodeBlocks(normalized, occupiedRanges));
  return events.sort((a, b) => a.start - b.start).map((event) => event.text);
}

function extractIndentedCodeBlocks(markdown: string, occupiedRanges: { start: number; end: number }[]) {
  const events: { start: number; end: number; text: string }[] = [];
  const lines = markdown.split("\n");
  let lineIndex = 0;
  let offset = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    if (rangeContains(occupiedRanges, offset) || !isIndentedCodeLine(line)) {
      offset += line.length + 1;
      lineIndex += 1;
      continue;
    }

    const start = offset;
    const blockLines: string[] = [];
    while (lineIndex < lines.length) {
      const current = lines[lineIndex];
      if (rangeContains(occupiedRanges, offset)) break;
      if (isIndentedCodeLine(current)) {
        blockLines.push(removeCodeIndent(current));
      } else if (current.trim() === "" && blockLines.length) {
        blockLines.push("");
      } else {
        break;
      }
      offset += current.length + 1;
      lineIndex += 1;
    }

    while (blockLines.length && blockLines[blockLines.length - 1] === "") blockLines.pop();
    events.push({ start, end: offset, text: blockLines.join("\n") });
  }

  return events;
}

function isIndentedCodeLine(line: string) {
  return /^(?: {4,}|\t)/.test(line);
}

function removeCodeIndent(line: string) {
  if (line.startsWith("\t")) return line.slice(1);
  return line.startsWith("    ") ? line.slice(4) : line;
}

function rangeContains(ranges: { start: number; end: number }[], offset: number) {
  return ranges.some((range) => offset >= range.start && offset < range.end);
}

function extractHtmlPreBlocks(html: string) {
  const blocks: string[] = [];
  const preRe = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let match: RegExpExecArray | null;
  while ((match = preRe.exec(html))) {
    blocks.push(extractPreText(match[1]));
  }
  return blocks;
}

function extractPreText(innerHtml: string) {
  const codeMatch = /^\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*$/i.exec(innerHtml);
  const inner = codeMatch ? codeMatch[1] : innerHtml;
  return canonicalPreText(decodeHtmlEntities(stripHtmlTags(inner)));
}

function canonicalPreText(text: string) {
  return text.replace(/\r\n?/g, "\n").replace(/^\n/, "").replace(/\n$/, "");
}

function stripHtmlTags(text: string) {
  return text.replace(/<[^>]+>/g, "");
}

function decodeHtmlEntities(text: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (raw, entity) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return named[lower] ?? raw;
  });
}

function suspiciousIndentLine(text: string) {
  const lines = text.split("\n");
  for (let index = 1; index < lines.length; index += 1) {
    if (/^ {10,}\S/.test(lines[index])) return { line: index + 1 };
  }
  return null;
}

function verbatimMismatchMessage(index: number, expected: string, actual: string) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let line = 0; line < max; line += 1) {
    if ((expectedLines[line] ?? "") !== (actualLines[line] ?? "")) {
      return `rendered verbatim block ${index + 1} differs from QMD at line ${line + 1}: expected ${previewLine(expectedLines[line])}, got ${previewLine(actualLines[line])}`;
    }
  }
  return `rendered verbatim block ${index + 1} differs from QMD`;
}

function previewLine(value: string | undefined) {
  if (value == null) return "<missing>";
  const clipped = value.length > 80 ? `${value.slice(0, 77)}...` : value;
  return JSON.stringify(clipped);
}

function compare(row: Record<string, number | string | boolean>, key: string, expected: number, file: string, failures: string[]) {
  if (row[key] !== expected) fail(String(row.deck), file, `${key} ${row[key]} did not match expected ${expected}`, failures);
}

function fail(deck: string, file: string, message: string, failures: string[]) {
  failures.push(`${deck}: ${message} (${relativePath(root, file)})`);
}

function formatRow(row: Record<string, number | string | boolean>) {
  const interactive = interactiveAttrs
    .filter((attr) => row[attr])
    .map((attr) => `${attr} ${row[attr]}`)
    .join(", ");
  const suffix = interactive
    ? ` | interactions ${row.qmdOnly ? "qmd/audience/presenter" : "source/audience/presenter"}: ${interactive}`
    : "";
  if (row.qmdOnly) {
    return [
      `${row.deck}:`,
      `qmd-only slides ${row.qmdSlides}/${row.audienceSlides}/${row.presenterSlides}`,
      `notes ${row.qmdNotes}/audience:${row.audienceNoteClasses}/presenter:${row.presenterNotes}`,
      `zoom ${row.qmdZoomable}/${row.audienceZoomable}/${row.presenterZoomable}`,
      `verbatim ${row.qmdVerbatim}/${row.audienceVerbatim}/${row.presenterVerbatim}`,
    ].join(" ") + suffix;
  }
  return [
    `${row.deck}:`,
    `slides ${row.sourceSlides}/${row.qmdSlides}/${row.audienceSlides}/${row.presenterSlides}`,
    `notes ${row.sourceNotes}/${row.qmdNotes}/audience:${row.audienceNoteClasses}/presenter:${row.presenterNotes}`,
    `zoom ${row.sourceZoomable}/${row.audienceZoomable}/${row.presenterZoomable}`,
    `verbatim ${row.qmdVerbatim}/${row.audienceVerbatim}/${row.presenterVerbatim}`,
  ].join(" ") + suffix;
}

function stripCodeFences(text: string) {
  return text.replace(/^(`{3,}|~{3,})[\s\S]*?^\1\s*$/gm, "");
}

function stripHtmlPreBlocks(text: string) {
  return text.replace(/<pre\b[\s\S]*?<\/pre>/gi, "");
}

function parseAttributes(source: string) {
  const attrs: Record<string, string> = {};
  const attrSource = source.replace(/^<\w+\b|>$/g, "");
  const re = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrSource))) {
    const key = match[1];
    if (key === "div" || key === "section" || key === "h2") continue;
    attrs[key] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}

function splitClasses(value = "") {
  return value.split(/\s+/).map((name) => name.trim()).filter(Boolean);
}

function pickDataAttrs(attrs: Record<string, string>) {
  const picked: Record<string, string> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("data-")) picked[key] = value;
  }
  return picked;
}

function formatHeadingAttrs(classes: string[], dataAttrs: Record<string, string>) {
  const bits = classes.map((name) => `.${name}`);
  for (const [key, value] of Object.entries(dataAttrs)) {
    bits.push(`${key}="${escapeAttr(value)}"`);
  }
  return bits.length ? ` {${bits.join(" ")}}` : "";
}

function copyDeckAssets(sourcePath: string, outDir: string) {
  const sourceDir = dirname(sourcePath);
  for (const name of ["assets", "diagrams"]) {
    const source = join(sourceDir, name);
    if (exists(source)) {
      copyRecursive(source, join(outDir, name));
    }
  }
}

function readRuntimeFile(name: string) {
  const projectRuntime = join(root, "decks", "scripts", name);
  if (exists(projectRuntime)) return Deno.readTextFileSync(projectRuntime);

  const extensionRuntime = join(extensionDir, "runtime", name);
  if (exists(extensionRuntime)) return Deno.readTextFileSync(extensionRuntime);

  throw new Error(`Missing htmpres runtime file: ${name}`);
}

function writeSourceCss(html: string, outDir: string) {
  const style = firstRawMatch(html, /<style\b[^>]*>([\s\S]*?)<\/style>/i);
  if (style) {
    Deno.writeTextFileSync(join(outDir, "source.css"), style.trim() + "\n");
  }
}

function inferSlug(source: string) {
  const parsed = parsePath(source);
  if (parsed.base === "index.html") return basename(parsed.dir);
  return parsed.name;
}

function firstMatch(text: string, re: RegExp) {
  const match = re.exec(text);
  return match ? htmlToText(match[1]) : "";
}

function firstRawMatch(text: string, re: RegExp) {
  const match = re.exec(text);
  return match ? match[1] : "";
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHeading(text: string) {
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function escapeAttr(value: string) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeHtmlAttr(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function yamlString(value: string) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function slugify(value: string) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function shortTitle(title: string) {
  return title.replace(/\s+Presentation$/i, "");
}

function stripYamlQuotes(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

function unescapeHeading(text: string) {
  return text.replace(/\\([{}])/g, "$1");
}

function escapeHtml(text: string) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeScriptJson(text: string) {
  return text.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function indent(text: string, prefix: string) {
  return text
    .split("\n")
    .map((line) => (line ? prefix + line : line))
    .join("\n");
}

function indentHtml(text: string, prefix: string) {
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

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function humanTitle(slug: string) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function runProcess(cmd: string[], input: string) {
  const deno = Deno as unknown as {
    Command?: new (
      command: string,
      options: {
        args?: string[];
        stdin?: "piped";
        stdout?: "piped";
        stderr?: "piped";
      },
    ) => {
      spawn: () => {
        stdin: WritableStream<Uint8Array>;
        output: () => Promise<{ code: number; stdout: Uint8Array; stderr: Uint8Array }>;
      };
    };
    run?: (options: {
      cmd: string[];
      stdin: "piped";
      stdout: "piped";
      stderr: "piped";
    }) => {
      stdin: { write: (bytes: Uint8Array) => Promise<number>; close: () => void };
      status: () => Promise<{ code: number }>;
      output: () => Promise<Uint8Array>;
      stderrOutput: () => Promise<Uint8Array>;
      close: () => void;
    };
  };

  if (typeof deno.Command === "function") {
    const command = new deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(encoder.encode(input));
    await writer.close();
    const output = await child.output();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
    };
  }

  if (typeof deno.run !== "function") {
    throw new Error("This Quarto Deno runtime exposes neither Deno.run nor Deno.Command.");
  }

  const process = deno.run({
    cmd,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  await process.stdin.write(encoder.encode(input));
  process.stdin.close();
  const [status, stdoutBytes, stderrBytes] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();

  return {
    code: status.code,
    stdout: decoder.decode(stdoutBytes),
    stderr: decoder.decode(stderrBytes),
  };
}

function findFiles(dir: string, predicate: (file: string) => boolean): string[] {
  const found: string[] = [];
  if (!exists(dir)) return found;
  for (const entry of Deno.readDirSync(dir)) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory) {
      found.push(...findFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      found.push(fullPath);
    }
  }
  return found;
}

function copyRecursive(source: string, destination: string) {
  const stat = Deno.statSync(source);
  if (stat.isDirectory) {
    Deno.mkdirSync(destination, { recursive: true });
    for (const entry of Deno.readDirSync(source)) {
      copyRecursive(join(source, entry.name), join(destination, entry.name));
    }
    return;
  }

  Deno.mkdirSync(dirname(destination), { recursive: true });
  Deno.copyFileSync(source, destination);
}

function exists(file: string) {
  try {
    Deno.statSync(file);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function fileUrlToPath(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "file:") throw new Error(`Expected file URL, got ${url}`);
  return decodeURIComponent(parsed.pathname);
}

function resolvePath(...parts: string[]) {
  let resolved = "";
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("/")) resolved = part;
    else resolved = join(resolved || root, part);
  }
  return normalizePath(resolved || root);
}

function join(...parts: string[]) {
  const joined = parts.filter(Boolean).join("/");
  return normalizePath(joined || ".");
}

function dirname(file: string) {
  const normalized = normalizePath(file);
  if (normalized === "/") return "/";
  const index = normalized.lastIndexOf("/");
  if (index < 0) return ".";
  if (index === 0) return "/";
  return normalized.slice(0, index);
}

function basename(file: string) {
  const normalized = normalizePath(file);
  if (normalized === "/") return "/";
  const index = normalized.lastIndexOf("/");
  return index < 0 ? normalized : normalized.slice(index + 1);
}

function parsePath(file: string) {
  const dir = dirname(file);
  const base = basename(file);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return { dir, base, name: base, ext: "" };
  return {
    dir,
    base,
    name: base.slice(0, dot),
    ext: base.slice(dot),
  };
}

function relativePath(from: string, to: string) {
  const fromParts = normalizePath(from).split("/").filter(Boolean);
  const toParts = normalizePath(to).split("/").filter(Boolean);
  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common += 1;
  }
  const up = fromParts.slice(common).map(() => "..");
  const down = toParts.slice(common);
  const rel = [...up, ...down].join("/");
  return rel || ".";
}

function normalizePath(file: string) {
  const absolute = file.startsWith("/");
  const parts: string[] = [];
  for (const part of file.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (parts.length && parts[parts.length - 1] !== "..") {
        parts.pop();
      } else if (!absolute) {
        parts.push(part);
      }
    } else {
      parts.push(part);
    }
  }
  const normalized = parts.join("/");
  if (absolute) return `/${normalized}`;
  return normalized || ".";
}
