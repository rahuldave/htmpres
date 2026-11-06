// The renderer, linter and verifiers share this line scanner. Offsets refer to
// the original source, including CRLF; masked output retains source line numbers.
export function scanSource(text) {
  const lines = [];
  const lineRe = /([^\r\n]*)(\r\n|\n|\r|$)/g;
  let match;
  while ((match = lineRe.exec(text)) && match[0]) {
    lines.push({ text: match[1], number: lines.length + 1, start: match.index, end: lineRe.lastIndex, kind: "body" });
  }
  let yamlEnd = -1;
  if (lines[0]?.text.replace(/^\uFEFF/, "").trimEnd() === "---") {
    yamlEnd = lines.findIndex((line, index) => index > 0 && /^(?:---|\.\.\.)[ \t]*$/.test(line.text));
    if (yamlEnd >= 0) for (let index = 0; index <= yamlEnd; index++) lines[index].kind = "yaml";
  }
  let fence = null;
  let rawTag = "";
  for (const line of lines) {
    if (line.kind === "yaml") continue;
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
    }
  }
  return { lines, yamlEnd };
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

export function lintSource(text, file = "<source>") {
  return scanSource(text).lines.filter(line => line.kind === "body" && /^ {0,3}---[ \t]*$/.test(line.text)).map(line => ({
    file,
    line: line.number,
    column: line.text.indexOf("---") + 1,
    code: "slide-break",
    severity: "error",
    message: "Standalone --- is not a slide break in htmpres. Start a slide with ##; remove this rule. Initial YAML delimiters and code examples are exempt.",
  }));
}


export function parseSlides(body) {
  const slides = [];
  let current = null;
  for (const line of scanSource(body).lines) {
    const heading = line.kind === "body" ? /^##\s+(.+?)(?:\s+(\{.*\}))?\s*$/.exec(line.text) : null;
    if (heading) {
      if (current) slides.push(current);
      current = { title: heading[1].trim().replace(/\\([{}])/g, "$1"), attrText: heading[2] || "", bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line.text);
    }
  }
  if (current) slides.push(current);
  return slides.map(slide => ({ ...slide, body: slide.bodyLines.join("\n").trim() }));
}

export function extractNotes(markdown) {
  const body = [];
  const notes = [];
  let current = null;
  let fenceLength = 0;
  for (const line of scanSource(markdown).lines) {
    const opening = line.kind === "body" && /^(:{3,})\s+(?:notes|\{\s*\.notes\s*\})\s*$/.exec(line.text.trim());
    if (!current && opening) {
      current = [];
      fenceLength = opening[1].length;
    } else if (current && line.kind === "body" && new RegExp(`^:{${fenceLength},}$`).test(line.text.trim())) {
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
