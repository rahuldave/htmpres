#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "source_presentations");
const decksDir = path.join(root, "decks");
const interactiveAttrs = ["data-target", "data-update-target", "data-filter", "data-item-filter", "data-filter-target"];
const failures = [];
const sourceSlugs = new Set();

for (const sourcePath of discoverSourceDecks()) {
  const slug = inferSlug(sourcePath);
  sourceSlugs.add(slug);
  const deckDir = path.join(decksDir, slug);
  const source = readFileSync(sourcePath, "utf8");
  const qmdPath = path.join(deckDir, "index.qmd");
  const audiencePath = path.join(deckDir, "index.html");
  const presenterPath = path.join(deckDir, "presenter.html");

  const qmd = readRequired(qmdPath);
  const audience = readRequired(audiencePath);
  const presenter = readRequired(presenterPath);
  const notes = extractDeckNotes(presenter);
  verifyQmdVerbatimBlocks(slug, qmd, qmdPath);
  verifyGeneratedHtml(slug, qmd, audience, audiencePath, "audience");
  verifyGeneratedHtml(slug, qmd, presenter, presenterPath, "presenter");
  const row = {
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

  compare(row, "qmdSlides", row.sourceSlides, qmdPath);
  compare(row, "audienceSlides", row.sourceSlides, audiencePath);
  compare(row, "presenterSlides", row.sourceSlides, presenterPath);
  compare(row, "qmdNotes", row.sourceNotes, qmdPath);
  compare(row, "presenterNotes", row.sourceNotes, presenterPath);
  compare(row, "audienceNoteClasses", 0, audiencePath);
  compare(row, "audienceZoomable", row.sourceZoomable, audiencePath);
  compare(row, "presenterZoomable", row.sourceZoomable, presenterPath);
  compare(row, "presenterNoteSlots", row.sourceSlides, presenterPath);

  const sourceInteractive = stripHtmlPreBlocks(source);
  const audienceInteractive = stripHtmlPreBlocks(audience);
  const presenterInteractive = stripHtmlPreBlocks(presenter);
  for (const attr of interactiveAttrs) {
    const sourceCount = countAttr(sourceInteractive, attr);
    if (!sourceCount) continue;
    const audienceCount = countAttr(audienceInteractive, attr);
    const presenterCount = countAttr(presenterInteractive, attr);
    row[attr] = `${sourceCount}/${audienceCount}/${presenterCount}`;
    if (audienceCount !== sourceCount) fail(row.deck, audiencePath, `${attr} count ${audienceCount} did not match source ${sourceCount}`);
    if (presenterCount !== sourceCount) fail(row.deck, presenterPath, `${attr} count ${presenterCount} did not match source ${sourceCount}`);
  }

  console.log(formatRow(row));
}

for (const qmdPath of discoverQmdDecks()) {
  const slug = path.basename(path.dirname(qmdPath));
  if (sourceSlugs.has(slug)) continue;
  const deckDir = path.dirname(qmdPath);
  const qmd = readRequired(qmdPath);
  const audiencePath = path.join(deckDir, "index.html");
  const presenterPath = path.join(deckDir, "presenter.html");
  const audience = readRequired(audiencePath);
  const presenter = readRequired(presenterPath);
  const notes = extractDeckNotes(presenter);
  verifyQmdVerbatimBlocks(slug, qmd, qmdPath);
  verifyGeneratedHtml(slug, qmd, audience, audiencePath, "audience");
  verifyGeneratedHtml(slug, qmd, presenter, presenterPath, "presenter");
  const row = {
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

  compare(row, "audienceSlides", row.qmdSlides, audiencePath);
  compare(row, "presenterSlides", row.qmdSlides, presenterPath);
  compare(row, "presenterNotes", row.qmdNotes, presenterPath);
  compare(row, "audienceNoteClasses", 0, audiencePath);
  compare(row, "audienceZoomable", row.qmdZoomable, audiencePath);
  compare(row, "presenterZoomable", row.qmdZoomable, presenterPath);
  compare(row, "presenterNoteSlots", row.qmdSlides, presenterPath);

  const audienceInteractive = stripHtmlPreBlocks(audience);
  const presenterInteractive = stripHtmlPreBlocks(presenter);
  for (const attr of interactiveAttrs) {
    const qmdCount = countAttr(stripCodeFences(qmd), attr);
    if (!qmdCount) continue;
    const audienceCount = countAttr(audienceInteractive, attr);
    const presenterCount = countAttr(presenterInteractive, attr);
    row[attr] = `${qmdCount}/${audienceCount}/${presenterCount}`;
    if (audienceCount !== qmdCount) fail(row.deck, audiencePath, `${attr} count ${audienceCount} did not match QMD ${qmdCount}`);
    if (presenterCount !== qmdCount) fail(row.deck, presenterPath, `${attr} count ${presenterCount} did not match QMD ${qmdCount}`);
  }

  console.log(formatRow(row));
}

if (failures.length) {
  console.error("\nDeck verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nDeck verification passed.");

function discoverSourceDecks() {
  return findFiles(sourceRoot, (file) => file.endsWith(".html")).sort();
}

function discoverQmdDecks() {
  return findFiles(decksDir, (file) => path.basename(file) === "index.qmd").sort();
}

function findFiles(dir, predicate) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) found.push(...findFiles(fullPath, predicate));
    else if (predicate(fullPath)) found.push(fullPath);
  }
  return found;
}

function inferSlug(sourcePath) {
  const parsed = path.parse(sourcePath);
  if (parsed.base === "index.html") return path.basename(parsed.dir);
  return parsed.name;
}

function readRequired(file) {
  if (!existsSync(file)) {
    fail(path.basename(path.dirname(file)), file, "missing generated file");
    return "";
  }
  return readFileSync(file, "utf8");
}

function verifyQmdVerbatimBlocks(deck, qmd, file) {
  const blocks = extractExpectedPreBlocks(qmd);
  blocks.forEach((block, index) => {
    if (!block.trim()) fail(deck, file, `verbatim block ${index + 1} is empty`);
    const suspicious = suspiciousIndentLine(block);
    if (suspicious) {
      fail(deck, file, `verbatim block ${index + 1} has suspicious leading indentation on line ${suspicious.line}`);
    }
  });
}

function verifyGeneratedHtml(deck, qmd, html, file, mode) {
  const expected = extractExpectedPreBlocks(qmd);
  const actual = extractHtmlPreBlocks(html);

  if (actual.length !== expected.length) {
    fail(deck, file, `rendered verbatim block count ${actual.length} did not match QMD ${expected.length}`);
  }

  const count = Math.min(actual.length, expected.length);
  for (let index = 0; index < count; index += 1) {
    if (!actual[index].trim()) {
      fail(deck, file, `rendered verbatim block ${index + 1} is empty`);
      continue;
    }
    if (actual[index] !== expected[index]) {
      fail(deck, file, verbatimMismatchMessage(index, expected[index], actual[index]));
    }
    const suspicious = suspiciousIndentLine(actual[index]);
    if (suspicious) {
      fail(deck, file, `rendered verbatim block ${index + 1} has suspicious leading indentation on line ${suspicious.line}`);
    }
  }

  if (/@@HTMPRES_RAW_\d+@@/.test(html)) fail(deck, file, "unrestored raw HTML placeholder token remains in output");
  if (/\bid="cb\d+(?:-\d+)?"|\bhref="#cb\d+(?:-\d+)?"/.test(html)) fail(deck, file, "unnamespaced Pandoc code anchor remains in output");
  if (/index_files\/libs\/revealjs|revealjs\/|Reveal\.initialize/.test(html)) fail(deck, file, "reveal.js reference remains in custom renderer output");
  if (mode === "audience" && /<script\b[^>]*\bid="deckNotes"/i.test(html)) fail(deck, file, "audience output contains presenter notes JSON");
  if (mode === "presenter" && !/<script\b[^>]*\bid="deckNotes"/i.test(html)) fail(deck, file, "presenter output is missing presenter notes JSON");
}

function countSlides(html) {
  return countClassedTag(html, "section", "slide");
}

function countSourceNotes(html) {
  return countClassedTag(html, "aside", "notes");
}

function countNoteClasses(html) {
  return countClassedTag(html, "[a-z0-9:-]+", "notes");
}

function countZoomable(html) {
  return countClassName(html, "zoomable");
}

function countClassedTag(html, tag, className) {
  const re = new RegExp(`<${tag}\\b[^>]*\\bclass=(["'])[^"']*\\b${escapeRegExp(className)}\\b[^"']*\\1`, "gi");
  return (html.match(re) || []).length;
}

function countClassName(html, className) {
  const re = new RegExp(`\\bclass=(["'])[^"']*\\b${escapeRegExp(className)}\\b[^"']*\\1`, "gi");
  return (html.match(re) || []).length;
}

function countAttr(html, attr) {
  const re = new RegExp(`\\b${escapeRegExp(attr)}=`, "gi");
  return (html.match(re) || []).length;
}

function countQmdSlides(qmd) {
  return (stripCodeFences(qmd).match(/^##\s+/gm) || []).length;
}

function countQmdNotes(qmd) {
  return (stripCodeFences(qmd).match(/^:{3,}\s+(?:notes|\{\s*\.notes\s*\})\s*$/gm) || []).length;
}

function countQmdZoomable(qmd) {
  const stripped = stripCodeFences(qmd);
  return (stripped.match(/\{[^}]*\.zoomable\b[^}]*\}/g) || []).length + countClassName(stripped, "zoomable");
}

function extractDeckNotes(html) {
  const match = /<script\b[^>]*\bid="deckNotes"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function presenterNoteSlots(html) {
  return extractDeckNotes(html).length;
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
    body: slide.bodyLines.join("\n").trim(),
  }));
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

  if (inNotes) noteBlocks.push(currentNotes.join("\n").trim());

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

function extractExpectedPreBlocks(qmd) {
  const { body } = splitFrontMatter(qmd);
  return parseSlides(body).flatMap((slide) => {
    const visible = extractNotes(slide.body).body;
    return extractMarkdownPreBlocks(visible);
  });
}

function extractMarkdownPreBlocks(markdown) {
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const events = [];
  const fenceRanges = [];
  const fenceRe = /(^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:\n\2[ \t]*(?=\n|$))/g;
  let fenceMatch;
  while ((fenceMatch = fenceRe.exec(normalized))) {
    const start = fenceMatch.index + fenceMatch[1].length;
    const end = fenceRe.lastIndex;
    fenceRanges.push({ start, end });
    events.push({ start, end, text: canonicalPreText(fenceMatch[3]) });
  }

  const occupiedRanges = [...fenceRanges];
  const preRe = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let preMatch;
  while ((preMatch = preRe.exec(normalized))) {
    const start = preMatch.index;
    const end = preRe.lastIndex;
    if (fenceRanges.some((range) => start >= range.start && start < range.end)) continue;
    occupiedRanges.push({ start, end });
    events.push({ start, end, text: extractPreText(preMatch[1]) });
  }

  events.push(...extractIndentedCodeBlocks(normalized, occupiedRanges));
  return events.sort((a, b) => a.start - b.start).map((event) => event.text);
}

function extractIndentedCodeBlocks(markdown, occupiedRanges) {
  const events = [];
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
    const blockLines = [];
    while (lineIndex < lines.length) {
      const current = lines[lineIndex];
      if (rangeContains(occupiedRanges, offset)) break;
      if (isIndentedCodeLine(current)) blockLines.push(removeCodeIndent(current));
      else if (current.trim() === "" && blockLines.length) blockLines.push("");
      else break;
      offset += current.length + 1;
      lineIndex += 1;
    }

    while (blockLines.length && blockLines[blockLines.length - 1] === "") blockLines.pop();
    events.push({ start, end: offset, text: blockLines.join("\n") });
  }

  return events;
}

function isIndentedCodeLine(line) {
  return /^(?: {4,}|\t)/.test(line);
}

function removeCodeIndent(line) {
  if (line.startsWith("\t")) return line.slice(1);
  return line.startsWith("    ") ? line.slice(4) : line;
}

function rangeContains(ranges, offset) {
  return ranges.some((range) => offset >= range.start && offset < range.end);
}

function extractHtmlPreBlocks(html) {
  const blocks = [];
  const preRe = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let match;
  while ((match = preRe.exec(html))) blocks.push(extractPreText(match[1]));
  return blocks;
}

function extractPreText(innerHtml) {
  const codeMatch = /^\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*$/i.exec(innerHtml);
  const inner = codeMatch ? codeMatch[1] : innerHtml;
  return canonicalPreText(decodeHtmlEntities(stripHtmlTags(inner)));
}

function canonicalPreText(text) {
  return text.replace(/\r\n?/g, "\n").replace(/^\n/, "").replace(/\n$/, "");
}

function stripHtmlTags(text) {
  return text.replace(/<[^>]+>/g, "");
}

function decodeHtmlEntities(text) {
  const named = {
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

function suspiciousIndentLine(text) {
  const lines = text.split("\n");
  for (let index = 1; index < lines.length; index += 1) {
    if (/^ {10,}\S/.test(lines[index])) return { line: index + 1 };
  }
  return null;
}

function verbatimMismatchMessage(index, expected, actual) {
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

function previewLine(value) {
  if (value == null) return "<missing>";
  const clipped = value.length > 80 ? `${value.slice(0, 77)}...` : value;
  return JSON.stringify(clipped);
}

function compare(row, key, expected, file) {
  if (row[key] !== expected) fail(row.deck, file, `${key} ${row[key]} did not match expected ${expected}`);
}

function fail(deck, file, message) {
  failures.push(`${deck}: ${message} (${path.relative(root, file)})`);
}

function formatRow(row) {
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

function stripCodeFences(text) {
  return text.replace(/^(`{3,}|~{3,})[\s\S]*?^\1\s*$/gm, "");
}

function stripHtmlPreBlocks(text) {
  return text.replace(/<pre\b[\s\S]*?<\/pre>/gi, "");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
