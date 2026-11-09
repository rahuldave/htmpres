// The renderer, linter and verifiers share this line scanner. Offsets refer to
// the original source, including CRLF; masked output retains source line numbers.
export function scanSource(text, { frontMatter = true } = {}) {
  const lines = [];
  const lineRe = /([^\r\n]*)(\r\n|\n|\r|$)/g;
  let match;
  while ((match = lineRe.exec(text)) && match[0]) {
    lines.push({ text: match[1], number: lines.length + 1, start: match.index, end: lineRe.lastIndex, kind: "body" });
  }
  let yamlEnd = -1;
  if (frontMatter && lines[0]?.text.replace(/^\uFEFF/, "").trimEnd() === "---") {
    yamlEnd = lines.findIndex((line, index) => index > 0 && /^(?:---|\.\.\.)[ \t]*$/.test(line.text));
    if (yamlEnd >= 0) for (let index = 0; index <= yamlEnd; index++) lines[index].kind = "yaml";
  }
  let fence = null;
  let rawTag = "";
  let comment = false;
  let divDepth = 0;
  for (const line of lines) {
    line.divDepth = divDepth;
    if (line.kind === "yaml") continue;
    if (comment) {
      line.inComment = true;
      const visible = stripComments(line.text, comment);
      comment = visible.open;
      line.kind = visible.text.trim() ? "body" : "comment";
      continue;
    }
    if (rawTag) {
      line.kind = "code";
      if (new RegExp(`</${rawTag}\\s*>`, "i").test(line.text)) rawTag = "";
      continue;
    }
    if (fence) {
      line.kind = "code";
      const closing = /^ {0,3}(`+|~+)[ \t]*$/.exec(line.text);
      if (closing && closing[1][0] === fence.char && closing[1].length >= fence.length) fence = null;
      continue;
    }
    const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line.text);
    if (opening && (opening[1][0] !== "`" || !opening[2].includes("`"))) {
      fence = { char: opening[1][0], length: opening[1].length };
      line.kind = "code";
      continue;
    }
    const rawOpening = /^ {0,3}<(pre|script|style|textarea)\b/i.exec(line.text);
    if (rawOpening) {
      line.kind = "code";
      if (!new RegExp(`</${rawOpening[1]}\\s*>`, "i").test(line.text)) rawTag = rawOpening[1];
    } else if (/^(?: {4}|\t)/.test(line.text)) {
      line.kind = "code";
    } else {
      // Ignore comment markers shown as inline code; an actual comment may
      // start after prose and continue across apparent slide boundaries.
      const commentText = line.text.replace(/(`+).*?\1/g, match => "x".repeat(match.length));
      const visible = stripComments(commentText);
      comment = visible.open;
      if (commentText.includes("<!--") && !visible.text.trim()) {
        line.kind = "comment";
        continue;
      }
      const div = /^ {0,3}(:{3,})[ \t]*(.*?)\s*$/.exec(line.text);
      if (div?.[2]) {
        line.divOpen = div[2];
        divDepth++;
      } else if (div && divDepth) {
        line.divClose = true;
        divDepth--;
      }
    }
  }
  return { lines, yamlEnd };
}

// Preserve content outside comments, including when one closes and another
// opens on the same line. Original source bytes remain on the scanned line.
function stripComments(text, open = false) {
  let cursor = 0;
  let visible = "";
  while (cursor < text.length) {
    const marker = open ? "-->" : "<!--";
    const index = text.indexOf(marker, cursor);
    if (index < 0) {
      if (!open) visible += text.slice(cursor);
      break;
    }
    if (!open) visible += text.slice(cursor, index);
    cursor = index + marker.length;
    open = !open;
  }
  return { text: visible, open };
}

export function splitFrontMatter(text) {
  const { lines, yamlEnd } = scanSource(text);
  if (yamlEnd < 0) return { yaml: "", body: text };
  return {
    yaml: text.slice(lines[0].end, lines[yamlEnd].start),
    body: text.slice(lines[yamlEnd].end).replace(/^(?:[ \t]*\r?\n)+/, ""),
  };
}

export function maskCodeAndMetadata(text) {
  return scanSource(text).lines.map(line => line.kind === "body" ? line.text : "").join("\n");
}

// Use document mode for complete QMD, body mode after removing front matter.
// Keeping source offsets here makes list/show/insert/replace agree with rendering.
export function slideSegments(text, { frontMatter = true } = {}) {
  const slides = [];
  let current = null;
  let leadingComments = [];
  for (const line of scanSource(text, { frontMatter }).lines) {
    if (line.kind === "yaml") continue;
    const topLevel = line.kind === "body" && !line.inComment && line.divDepth === 0;
    const separator = topLevel && /^ {0,3}---[ \t]*$/.test(line.text);
    const heading = topLevel ? /^ {0,3}##(?:[ \t]+(.*?))?[ \t]*$/.exec(line.text) : null;
    if (separator || heading) {
      leadingComments = [];
      // A heading immediately following a separator labels that same slide.
      const coalesce = heading && current?.boundary === "separator" && current.bodyLines.every(line => !line.trim());
      if (!coalesce) {
        if (current) slides.push({ ...current, end: line.start });
        current = { title: "", attrText: "", bodyLines: [], start: line.start, startLine: line.number,
          column: line.text.search(/\S/) + 1, boundary: separator ? "separator" : "heading", headingLine: "" };
      }
      if (heading) {
        const content = (heading[1] || "").trim();
        const attrs = /(?:^|[ \t]+)(\{.*\})$/.exec(content);
        current.title = (attrs ? content.slice(0, attrs.index) : content).trim().replace(/\\([{}])/g, "$1");
        current.attrText = attrs?.[1] || "";
        current.headingLine = line.text;
        current.boundary = "heading";
      }
    } else {
      if (!current && line.kind !== "comment" && line.text.trim()) {
        const first = leadingComments[0] || line;
        current = { title: "", attrText: "", bodyLines: leadingComments.map(line => line.text), start: first.start, startLine: first.number,
          column: 1, boundary: "implicit", headingLine: "" };
        leadingComments = [];
      }
      if (current) current.bodyLines.push(line.text);
      else if (line.kind === "comment" || leadingComments.length) leadingComments.push(line);
    }
  }
  if (current) slides.push({ ...current, end: text.length });
  return slides.map(slide => ({ ...slide, body: slide.bodyLines.join("\n").trim() }));
}

export function lintSource(text, file = "<source>") {
  const diagnostics = slideSegments(text).filter(slide => !slide.title && !slide.body).map(slide => ({
    file,
    line: slide.startLine,
    column: slide.column,
    code: "empty-slide",
    severity: "error",
    message: "Empty slide: add content or remove this slide boundary. A --- followed by ## (with only blank lines between) starts one slide.",
  }));
  return [...deckCounter(text, file).diagnostics, ...diagnostics];
}

/** Counter policy uses block-style deck metadata; retain empty values for diagnostics. */
export function deckCounter(text, file = "<source>") {
  const stack = [], diagnostics = [];
  let value = 'true';
  for (const line of scanSource(text).lines.filter(line => line.kind === 'yaml')) {
    if (!line.text.trim() || line.text.trim().startsWith('#')) continue;
    const match = /^([ \t]*)([^:]+):[ \t]*(.*)$/.exec(line.text);
    if (!match) continue;
    const indent = match[1].length;
    while (stack.length && stack.at(-1).indent >= indent) stack.pop();
    const key = [...stack.map(item => item.key), match[2].trim()].join('.');
    stack.push({ indent, key: match[2].trim() });
    if (key !== 'deck.counter') continue;
    const raw = match[3].replace(/\s+#.*$/, '').trim();
    const normalized = raw.replace(/^(["'])(.*)\1$/, '$2').toLowerCase();
    if (['true', 'false', 'presenter'].includes(normalized)) value = normalized;
    else diagnostics.push({ file, line: line.number, column: indent + 1, code: 'deck-counter', severity: 'error', message: 'deck.counter must be true, false, or presenter; omit it to show the counter in both views.' });
  }
  return { value, diagnostics };
}

// This API receives the body, not a complete document. A leading --- is a
// slide boundary even if another separator occurs later in the body.
export function parseSlides(body) {
  return slideSegments(body, { frontMatter: false });
}

export function extractNotes(markdown) {
  const body = [];
  const notes = [];
  let current = null;
  let notesDepth = 0;
  for (const line of scanSource(markdown, { frontMatter: false }).lines) {
    const opening = line.divOpen && /^(?:notes|\{\s*\.notes\s*\})$/.test(line.divOpen);
    if (!current && opening) {
      current = [];
      notesDepth = line.divDepth;
    } else if (current && line.divClose && line.divDepth === notesDepth + 1) {
      notes.push(current.join("\n").trim());
      current = null;
    } else if (current) {
      current.push(line.text);
    } else {
      body.push(line.text);
    }
  }
  if (current) notes.push(current.join("\n").trim());
  return { body: body.join("\n").trim(), notes: notes.filter(Boolean).join("\n\n") };
}
