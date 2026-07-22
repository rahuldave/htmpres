#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

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
  "ds-split",
  "ds-top",
  "ds-vignette",
  "ds-vignette-light",
  "ds-vivid",
  "ds-zoom",
  "flow",
  "flow-strip",
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
  "pill-row",
  "profile-fragment-grid",
  "profile-grid",
  "release-ladder",
  "story-bridge",
  "story-stat-grid",
  "story-steps",
  "timeline",
];

function usage() {
  console.log(`Usage:
  node scripts/html-to-qmd.mjs
  node scripts/html-to-qmd.mjs source_presentations/path/to/deck.html [...]

By default this converts every .html deck under source_presentations/.`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  usage();
  process.exit(0);
}

const decks = args.length
  ? args.map((source) => ({ source, slug: inferSlug(source), note: "User-specified source deck." }))
  : discoverDecks();

for (const deck of decks) {
  convertDeck(deck);
}

function convertDeck(deck) {
  const sourcePath = path.resolve(root, deck.source);
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source deck: ${deck.source}`);
  }

  const html = readFileSync(sourcePath, "utf8");
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i)?.trim() || humanTitle(deck.slug);
  const slides = extractSlides(html);
  if (!slides.length) {
    throw new Error(`No <section class="slide"> elements found in ${deck.source}`);
  }

  const outDir = path.resolve(root, "decks", deck.slug);
  mkdirSync(outDir, { recursive: true });
  copyDeckAssets(sourcePath, outDir);
  writeSourceCss(html, outDir);

  const body = slides.map((slide, index) => convertSlide(slide, index, outDir)).join("\n\n");
  const qmd = `${frontMatter(title, deck.note)}\n\n${body}\n`;
  const outPath = path.join(outDir, "index.qmd");
  writeFileSync(outPath, qmd, "utf8");
  console.log(`Converted ${deck.source} -> ${path.relative(root, outPath)} (${slides.length} slides)`);
}

function discoverDecks() {
  const sourceRoot = path.resolve(root, "source_presentations");
  const htmlFiles = findFiles(sourceRoot, (file) => file.endsWith(".html"));
  return htmlFiles
    .map((file) => path.relative(root, file))
    .sort()
    .map((source) => ({
      source,
      slug: inferSlug(source),
      note: "Generated from the copied source presentation snapshot.",
    }));
}

function findFiles(dir, predicate) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      found.push(...findFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      found.push(fullPath);
    }
  }
  return found;
}

function frontMatter(title, note) {
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

function convertSlide(slide, index, outDir) {
  const attrs = parseAttributes(slide.attrs);
  const sectionClasses = splitClasses(attrs.class).filter((name) => name !== "slide" && name !== "active");
  const h2 = extractFirstH2(slide.inner);
  const hasVisibleTitle = Boolean(h2);
  const h2Attrs = h2 ? parseAttributes(h2.attrs) : {};
  const h2Classes = splitClasses(h2Attrs.class);
  const titleHtml = h2 ? h2.inner : attrs["data-title"] || `Slide ${index + 1}`;
  const title = htmlToText(titleHtml) || attrs["data-title"] || `Slide ${index + 1}`;

  let inner = h2 ? slide.inner.slice(0, h2.start) + slide.inner.slice(h2.end) : slide.inner;
  const classes = unique([...sectionClasses, ...h2Classes, hasVisibleTitle ? "" : "title-hidden"]);
  const headingAttrs = formatHeadingAttrs(classes, pickDataAttrs(attrs));

  const markdown = htmlToQuartoMarkdown(inner, outDir).trim();
  return `## ${escapeHeading(title)}${headingAttrs}\n\n${markdown}`;
}

function htmlToQuartoMarkdown(html, outDir) {
  const rawBlocks = [];
  let prepared = extractDataUriImages(html, outDir);
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

  const markdown = pandocHtmlToMarkdown(prepared);
  return restoreRawBlocks(markdown, rawBlocks);
}

function pandocHtmlToMarkdown(html) {
  const result = spawnSync(
    "quarto",
    [
      "pandoc",
      "-f",
      "html",
      "-t",
      "markdown+native_divs+native_spans+fenced_divs+pipe_tables+raw_html",
      "--wrap=none",
    ],
    {
      input: html,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 20,
    },
  );
  if (result.status !== 0) {
    throw new Error(`quarto pandoc failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function extractSlides(html) {
  const slides = [];
  const re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = re.exec(html))) {
    const attrs = match[1] || "";
    if (/\bclass="[^"]*\bslide\b/i.test(attrs)) {
      slides.push({ attrs, inner: match[2] || "" });
    }
  }
  return slides;
}

function extractFirstH2(html) {
  const match = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/i.exec(html);
  if (!match) return null;
  return {
    attrs: match[1] || "",
    inner: match[2] || "",
    start: match.index,
    end: match.index + match[0].length,
  };
}

function protectTables(html, rawBlocks) {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (raw) => rawToken(rawBlocks, raw));
}

function extractDataUriImages(html, outDir) {
  return html.replace(/<img\b[^>]*>/gi, (raw) => {
    const attrs = parseAttributes(raw);
    if (!attrs.src?.startsWith("data:image/")) return raw;
    const assetPath = writeDataUriImage(attrs.src, outDir, attrs.alt);
    return replaceAttribute(raw, "src", assetPath);
  });
}

function protectDataUriImages(html, rawBlocks) {
  return html.replace(/<img\b[^>]*>/gi, (raw) => {
    const attrs = parseAttributes(raw);
    const classes = splitClasses(attrs.class);
    if (attrs.src?.startsWith("data:") && classes.includes("zoomable")) {
      return rawToken(rawBlocks, raw);
    }
    return raw;
  });
}

function writeDataUriImage(dataUri, outDir, alt = "") {
  const parsed = parseDataUri(dataUri);
  if (!parsed) return dataUri;
  const hash = createHash("sha256").update(parsed.buffer).digest("hex").slice(0, 12);
  const label = slugify(alt) || "embedded-image";
  const fileName = `${label}-${hash}.${extensionForMime(parsed.mime)}`;
  const assetDir = path.join(outDir, "assets", "generated");
  mkdirSync(assetDir, { recursive: true });
  writeFileSync(path.join(assetDir, fileName), parsed.buffer);
  return `assets/generated/${fileName}`;
}

function parseDataUri(dataUri) {
  const match = /^data:([^;,]+)(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i.exec(dataUri);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const payload = match[3];
  const buffer = match[2]
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buffer };
}

function extensionForMime(mime) {
  const map = {
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

function replaceAttribute(tag, name, value) {
  const escaped = escapeHtmlAttr(value);
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i");
  if (re.test(tag)) return tag.replace(re, `${name}="${escaped}"`);
  return tag.replace(/\/?>$/, ` ${name}="${escaped}"$&`);
}

function protectButtons(html, rawBlocks) {
  return html.replace(/<button\b[\s\S]*?<\/button>/gi, (raw) => rawToken(rawBlocks, raw));
}

function protectDivsByClass(html, classNames, rawBlocks) {
  let cursor = 0;
  let out = "";
  while (cursor < html.length) {
    const start = html.slice(cursor).search(/<div\b[^>]*>/i);
    if (start < 0) {
      out += html.slice(cursor);
      break;
    }
    const absoluteStart = cursor + start;
    const opening = /<div\b[^>]*>/i.exec(html.slice(absoluteStart))[0];
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

function findMatchingDivEnd(html, start) {
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let depth = 0;
  let match;
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

function rawToken(rawBlocks, raw) {
  const token = `@@HTMPRES_RAW_${rawBlocks.length}@@`;
  rawBlocks.push(raw.trim());
  return `\n\n${token}\n\n`;
}

function restoreRawBlocks(markdown, rawBlocks) {
  return rawBlocks.reduce(
    (text, raw, index) => text.replaceAll(`@@HTMPRES_RAW_${index}@@`, normalizeRawHtml(raw)),
    markdown,
  );
}

function normalizeRawHtml(raw) {
  return raw.replace(/\n[ \t]+/g, "\n").trim();
}

function parseAttributes(source) {
  const attrs = {};
  const attrSource = source.replace(/^<\w+\b|>$/g, "");
  const re = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
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

function pickDataAttrs(attrs) {
  const picked = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("data-")) picked[key] = value;
  }
  return picked;
}

function formatHeadingAttrs(classes, dataAttrs) {
  const bits = classes.map((name) => `.${name}`);
  for (const [key, value] of Object.entries(dataAttrs)) {
    bits.push(`${key}="${escapeAttr(value)}"`);
  }
  return bits.length ? ` {${bits.join(" ")}}` : "";
}

function copyDeckAssets(sourcePath, outDir) {
  const sourceDir = path.dirname(sourcePath);
  for (const name of ["assets", "diagrams"]) {
    const source = path.join(sourceDir, name);
    if (existsSync(source)) {
      cpSync(source, path.join(outDir, name), { recursive: true, force: true });
    }
  }
}

function writeSourceCss(html, outDir) {
  const style = firstRawMatch(html, /<style\b[^>]*>([\s\S]*?)<\/style>/i);
  if (style) {
    writeFileSync(path.join(outDir, "source.css"), style.trim() + "\n", "utf8");
  }
}

function inferSlug(source) {
  const parsed = path.parse(source);
  if (parsed.base === "index.html") return path.basename(parsed.dir);
  return parsed.name;
}

function firstMatch(text, re) {
  const match = re.exec(text);
  return match ? htmlToText(match[1]) : "";
}

function firstRawMatch(text, re) {
  const match = re.exec(text);
  return match ? match[1] : "";
}

function htmlToText(html) {
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

function escapeHeading(text) {
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function escapeAttr(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function yamlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function humanTitle(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
