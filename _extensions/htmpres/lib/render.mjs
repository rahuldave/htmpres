// Scan tags and attribute values separately. Quoted payloads may contain > or
// snippets such as id='fn1'; neither is HTML structure. Offsets retain the
// original bytes so rewriting does not reserialize author markup.
function tagAttributes(tag) {
  const prefix = /^<\/?[A-Za-z][A-Za-z0-9:-]*/.exec(tag);
  const attributes = [];
  let index = prefix?.[0].length || 0;
  while (index < tag.length) {
    while (/\s/.test(tag[index] || "") && index < tag.length) index++;
    if (index >= tag.length || tag[index] === ">" || tag[index] === "/") break;
    const start = index;
    while (index < tag.length && !/[\s=/>]/.test(tag[index])) index++;
    if (index === start) { index++; continue; }
    const name = tag.slice(start, index).toLowerCase();
    while (index < tag.length && /\s/.test(tag[index])) index++;
    if (tag[index] !== "=") continue;
    index++;
    while (index < tag.length && /\s/.test(tag[index])) index++;
    const quote = tag[index] === '"' || tag[index] === "'" ? tag[index++] : "";
    const valueStart = index;
    if (quote) while (index < tag.length && tag[index] !== quote) index++;
    else while (index < tag.length && !/[\s>]/.test(tag[index])) index++;
    attributes.push({ name, value: tag.slice(valueStart, index), start: valueStart, end: index });
    if (quote && tag[index] === quote) index++;
  }
  return attributes;
}

function htmlTags(html) {
  const tags = [];
  let index = 0;
  while ((index = html.indexOf("<", index)) >= 0) {
    const start = index;
    if (html.startsWith("<!--", index)) {
      const closing = html.indexOf("-->", index + 4);
      index = closing >= 0 ? closing + 3 : html.length;
      tags.push({ start, end: index, raw: html.slice(start, index), name: "", closing: false, skip: true, attributes: [] });
      continue;
    }
    const prefix = /^<(\/?)([A-Za-z][A-Za-z0-9:-]*)(?=[\s/>])/.exec(html.slice(index));
    if (!prefix) { index++; continue; }
    index += prefix[0].length;
    let quote = "";
    for (; index < html.length; index++) {
      const char = html[index];
      if (quote) { if (char === quote) quote = ""; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === ">") { index++; break; }
    }
    const name = prefix[2].toLowerCase();
    const closing = !!prefix[1];
    const raw = html.slice(start, index);
    if (!closing && /^(?:script|style|textarea)$/.test(name)) {
      const close = new RegExp(`</${name}\\s*>`, "ig");
      close.lastIndex = index;
      const found = close.exec(html);
      index = found ? close.lastIndex : html.length;
      tags.push({ start, end: index, raw: html.slice(start, index), name, closing, skip: true, attributes: [] });
    } else {
      tags.push({ start, end: index, raw, name, closing, skip: false, attributes: closing ? [] : tagAttributes(raw) });
    }
  }
  return tags;
}

function mapTags(html, transform) {
  const tags = htmlTags(html);
  let output = "";
  let previous = 0;
  for (const tag of tags) {
    output += html.slice(previous, tag.start) + (tag.skip || tag.closing ? tag.raw : transform(tag));
    previous = tag.end;
  }
  return output + html.slice(previous);
}

/** Semantic keys are safe in both data attributes and KaTeX class selectors. */
function matchKey(value) {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) throw new Error(`Invalid match key: ${JSON.stringify(value)}`);
  if (value === "enclosing") throw new Error('Reserved match key: enclosing is a KaTeX structural class.');
  return value;
}

export function parseLineMatches(value) {
  const ranges = [];
  for (const entry of value.split("|")) {
    const pair = /^([^:]+):([a-z][a-z0-9-]*)$/.exec(entry.trim());
    if (!pair) throw new Error(`Invalid data-line-matches entry: ${entry}`);
    for (const selection of pair[1].split(",")) {
      const range = /^(\d+)(?:-(\d+))?$/.exec(selection.trim());
      const start = Number(range?.[1]), end = Number(range?.[2] || range?.[1]);
      if (!range || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start) throw new Error(`Invalid data-line-matches range: ${selection}`);
      if (ranges.some(previous => start <= previous.end && end >= previous.start)) throw new Error(`Overlapping data-line-matches range: ${selection}`);
      ranges.push({ start, end, group: pair[2] });
    }
  }
  return ranges;
}

export function matchSummaryGroups(html, option) {
  if (!option) return [];
  if (option !== "match") throw new Error(`Invalid data-step-summary: ${option}. Use match or omit the attribute.`);
  const groups = [], lineGroups = [], ancestors = [];
  for (const tag of htmlTags(html)) {
    if (tag.skip) continue;
    if (tag.closing) {
      const index = ancestors.map(ancestor => ancestor.name).lastIndexOf(tag.name);
      if (index >= 0) ancestors.length = index;
      continue;
    }
    const parentKey = ancestors.at(-1)?.key;
    const ownKey = tag.attributes.find(attr => attr.name === "data-match")?.value;
    if (ownKey && parentKey && ownKey !== parentKey) throw new Error(`Nested match groups ${parentKey} and ${ownKey} overlap.`);
    if (!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag.name)) ancestors.push({ name: tag.name, key: ownKey || parentKey });
    for (const attr of tag.attributes) {
      if (attr.name === "data-match") {
        const key = matchKey(attr.value);
        if (!groups.includes(key)) groups.push(key);
      }
      if (attr.name === "data-line-matches") lineGroups.push(...parseLineMatches(attr.value).map(range => range.group));
    }
  }
  if (!groups.length) throw new Error('data-step-summary="match" needs at least one data-match explanation.');
  for (const key of lineGroups) if (!groups.includes(key)) throw new Error(`data-line-matches refers to missing data-match="${key}" explanation.`);
  return groups;
}

/** Compile line names to small numeric ranges; runtime never parses author syntax. */
function matchColor(value) {
  if (/^(?:#[a-f\d]{3,4}|#[a-f\d]{6}|#[a-f\d]{8}|[a-z]+|var\(--[a-z][a-z\d-]*\)|(?:rgba?|hsla?|oklch|oklab|lab|lch)\([\d.,% /+-]+\))$/i.test(value)) return value;
  throw new Error(`Invalid match color: ${JSON.stringify(value)}. Use a CSS color or var(--token).`);
}

function matchColorMap(value, groups) {
  const result = new Map();
  if (!value) return result;
  for (const entry of value.split("|")) {
    const separator = entry.indexOf("=");
    const key = entry.slice(0, separator).trim();
    if (separator < 0 || !groups.includes(key)) throw new Error(`Unknown match color key: ${key}`);
    if (result.has(key)) throw new Error(`Duplicate match color key: ${key}`);
    result.set(key, matchColor(entry.slice(separator + 1).trim()));
  }
  return result;
}

export function compileMatchSummary(html, option, settings = {}) {
  const groups = matchSummaryGroups(html, option);
  if (!groups.length) return { html, groups, css: "" };
  const colors = matchColorMap(settings.colors, groups), darkColors = matchColorMap(settings.darkColors, groups);
  const inlineColors = new Map(), inlineDark = new Map();
  const tags = htmlTags(html);
  for (const tag of tags) {
    if (tag.skip || tag.closing) continue;
    const key = tag.attributes.find(attr => attr.name === "data-match")?.value;
    for (const [attrName, target] of [["data-match-color", inlineColors], ["data-match-color-dark", inlineDark]]) {
      const value = tag.attributes.find(attr => attr.name === attrName)?.value;
      if (value === undefined) continue;
      if (!key) throw new Error(`${attrName} needs data-match on the same element.`);
      const color = matchColor(value);
      if (target.has(key) && target.get(key) !== color) throw new Error(`Conflicting match colors for ${key}`);
      target.set(key, color);
    }
  }
  inlineColors.forEach((value, key) => { colors.set(key, value); darkColors.set(key, value); });
  inlineDark.forEach((value, key) => darkColors.set(key, value));
  // IDs are authored; escape every character with meaning inside a CSS string.
  const id = String(settings.id || "").replace(/[^a-zA-Z0-9_-]/g, char => `\\${char.codePointAt(0).toString(16)} `);
  const declarations = values => [...values].map(([key, value]) => `  --htmpres-match-${key}: ${value};`).join("\n");
  const css = (colors.size ? `\nhtml .slide[id="${id}"] {\n${declarations(colors)}\n}\n` : "") + (darkColors.size ? `\nhtml[data-color-mode="dark"] .slide[id="${id}"] {\n${declarations(darkColors)}\n}\n` : "");
  return { groups, css, html: mapTags(html, tag => {
    const mapping = tag.attributes.find(attr => attr.name === "data-line-matches");
    if (!mapping) return tag.raw;
    const classes = tag.attributes.find(attr => attr.name === "class")?.value.split(/\s+/) || [];
    if (!["code", "pre"].includes(tag.name) && !(tag.name === "div" && classes.includes("sourceCode"))) throw new Error("data-line-matches belongs on a fenced code block, not a surrounding div.");
    const parsed = parseLineMatches(mapping.value);
    const startIndex = tags.findIndex(candidate => candidate.start === tag.start);
    let depth = 1, endIndex = startIndex + 1;
    for (; endIndex < tags.length; endIndex++) {
      if (tags[endIndex].name !== tag.name) continue;
      depth += tags[endIndex].closing ? -1 : 1;
      if (!depth) break;
    }
    const codeIndex = tags.findIndex((candidate, index) => index >= startIndex && index < endIndex && candidate.name === "code" && !candidate.closing);
    const codeEnd = tags.find((candidate, index) => index > codeIndex && index <= endIndex && candidate.name === "code" && candidate.closing);
    if (codeIndex < 0 || !codeEnd) throw new Error("data-line-matches belongs on a fenced code block.");
    const codeHtml = html.slice(tags[codeIndex].end, codeEnd.start);
    let text = "", previous = 0;
    for (const token of htmlTags(codeHtml)) { text += codeHtml.slice(previous, token.start); previous = token.end; }
    text += codeHtml.slice(previous);
    const lineCount = text.replace(/\n$/, "").split("\n").length;
    if (parsed.some(range => range.end > lineCount)) throw new Error(`data-line-matches exceeds the code block's ${lineCount} lines.`);
    const ranges = parsed.map(({ start, end, group }) => `${start}-${end}:${groups.indexOf(group) + 1}`).join("|");
    return tag.raw.replace(/\s*\/?>(?=$)/, ending => ` data-match-ranges="${ranges}"${ending}`);
  }) };
}

export function maximumMatchGroups(html) {
  return Math.max(0, ...htmlTags(html).flatMap(tag => tag.attributes.filter(attr => attr.name === "data-match-groups").map(attr => attr.value.split("|").filter(Boolean).length)));
}

function isPandocId(id) {
  return /^(?:cb\d+(?:-\d+)?|fn(?:ref)?\d+(?::\d+)?|footnotes)$/.test(id);
}

export function namespacePandocIds(html, prefix) {
  const targets = new Set();
  mapTags(html, tag => {
    const id = tag.attributes.find(attribute => attribute.name === "id")?.value;
    if (id && (isPandocId(id) || /^h[1-6]$/.test(tag.name))) targets.add(id);
    return tag.raw;
  });
  return mapTags(html, tag => {
    let raw = tag.raw;
    for (const attribute of [...tag.attributes].reverse()) {
      if (attribute.name !== "id" && attribute.name !== "href") continue;
      const isHref = attribute.name === "href";
      const target = isHref ? (attribute.value.startsWith("#") ? attribute.value.slice(1) : "") : attribute.value;
      if (targets.has(target)) raw = raw.slice(0, attribute.start) + `${isHref ? "#" : ""}${prefix}-${target}` + raw.slice(attribute.end);
    }
    return raw;
  });
}

export function assignSlideIds(slides, parseAttrs) {
  const explicit = new Set();
  for (const slide of slides) {
    const id = parseAttrs(slide.attrText).keyValues.id;
    if (!id) continue;
    if (explicit.has(id)) throw new Error(`Duplicate slide id "${id}". Give each ## slide a unique {#id}.`);
    explicit.add(id);
  }
  const used = new Set(explicit);
  return slides.map((slide, index) => {
    let id = parseAttrs(slide.attrText).keyValues.id;
    if (!id) {
      const base = `slide-${index + 1}`;
      id = base;
      for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`;
      used.add(id);
    }
    return { ...slide, id };
  });
}

export function inlineTitle(html) {
  const trimmed = html.trim();
  const tags = htmlTags(trimmed);
  const first = tags[0];
  const last = tags[tags.length - 1];
  if (first && last && first.start === 0 && last.end === trimmed.length && !first.closing && last.closing && first.name === last.name && /^(?:p|h[1-6])$/.test(first.name)) {
    return trimmed.slice(first.end, last.start);
  }
  return trimmed;
}

function hasClass(tag, className) {
  return (tag.attributes.find(attribute => attribute.name === "class")?.value || "").split(/\s+/).includes(className);
}

function withoutFootnoteReferences(html) {
  const tags = htmlTags(html);
  const ranges = [];
  for (let index = 0; index < tags.length; index++) {
    const tag = tags[index];
    if (tag.name !== "a" || tag.closing || !hasClass(tag, "footnote-ref")) continue;
    let depth = 1;
    for (let next = index + 1; next < tags.length; next++) {
      if (tags[next].name !== "a") continue;
      depth += tags[next].closing ? -1 : 1;
      if (depth === 0) { ranges.push({ start: tag.start, end: tags[next].end }); index = next; break; }
    }
  }
  for (const range of ranges.reverse()) html = html.slice(0, range.start) + html.slice(range.end);
  return html;
}

export function renderTitle(html, prefix) {
  const source = html.trim();
  const rawFootnotes = htmlTags(source).find(tag => !tag.closing && tag.name === "section" && hasClass(tag, "footnotes"));
  // The heading is only a Pandoc inline-parsing context. Remove its synthetic
  // auto-ID before collecting real targets, so authored cross-slide links are
  // never redirected to a heading wrapper that will not appear in the deck.
  const unwrapped = inlineTitle(rawFootnotes ? source.slice(0, rawFootnotes.start) : source);
  const prepared = unwrapped + (rawFootnotes ? "\n" + source.slice(rawFootnotes.start) : "");
  const namespaced = namespacePandocIds(prepared, `${prefix}-title`);
  const footnotes = htmlTags(namespaced).find(tag => !tag.closing && tag.name === "section" && hasClass(tag, "footnotes"));
  const inlineHtml = (footnotes ? namespaced.slice(0, footnotes.start) : namespaced).trim();
  return {
    inlineHtml,
    footnotesHtml: footnotes ? namespaced.slice(footnotes.start) : "",
    plainText: htmlToPlainText(withoutFootnoteReferences(inlineHtml)),
  };
}

export function htmlToPlainText(html) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  for (const tag of htmlTags(html).reverse()) html = html.slice(0, tag.start) + html.slice(tag.end);
  return html.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (raw, entity) => {
    if (/^#x/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return named[entity.toLowerCase()] ?? raw;
  }).replace(/\s+/g, " ").trim();
}

export function unnamespacedPandocIds(html) {
  const ids = [];
  mapTags(html, tag => {
    for (const attribute of tag.attributes) {
      if (attribute.name !== "id" && attribute.name !== "href") continue;
      const id = attribute.name === "href" ? (attribute.value.startsWith("#") ? attribute.value.slice(1) : "") : attribute.value;
      if (isPandocId(id)) ids.push(id);
    }
    return tag.raw;
  });
  return ids;
}
