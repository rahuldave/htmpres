import { deckCounter } from './source.mjs';

/** Both verifiers compare the source policy with each actual output view. */
export function counterPolicyFailures(source, html, mode) {
  const policy = deckCounter(source).value;
  const tags = htmlTags(html);
  const root = tags.find(tag => tag.name === 'html' && !tag.closing);
  const counter = tags.find(tag => !tag.closing && tag.attributes.some(attr => attr.name === 'id' && attr.value === 'counter'));
  const failures = [];
  if (root?.attributes.find(attr => attr.name === 'data-counter')?.value !== policy) failures.push('Counter policy is stale or missing; render the source again.');
  const hidden = policy === 'false' || (policy === 'presenter' && mode === 'audience');
  if (!counter || counter.attributes.some(attr => attr.name === 'hidden') !== hidden) failures.push(`Counter visibility does not match deck.counter=${policy} in ${mode} output.`);
  return failures;
}

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
    if (tag[index] !== "=") { attributes.push({ name, value: "", start: index, end: index }); continue; }
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

/** Ensure every real image has an alt attribute; decoration is explicit. */
export function normalizeImageAlts(html) {
  return mapTags(html, tag => {
    if (tag.name !== 'img') return tag.raw;
    const alt = tag.attributes.find(attr => attr.name === 'alt');
    const decorative = tag.attributes.find(attr => attr.name === 'class')?.value.split(/\s+/).includes('decorative');
    if (decorative && alt?.value) {
      const quoted = ['\"', "'"].includes(tag.raw[alt.start - 1]);
      return tag.raw.slice(0, alt.start) + (quoted ? '' : '""') + tag.raw.slice(alt.end);
    }
    if (alt) return tag.raw;
    return tag.raw.replace(/\s*\/?>$/, ending => ` alt=""${ending}`);
  });
}

/** Verify exported DOM, including raw HTML; generated backgrounds are hidden. */
export function imageAltFailures(html) {
  const stack = [], failures = [];
  for (const tag of htmlTags(html)) {
    if (tag.skip) continue;
    if (tag.closing) {
      const index = stack.map(node => node.name).lastIndexOf(tag.name);
      if (index >= 0) stack.length = index;
      continue;
    }
    const attr = name => tag.attributes.find(attr => attr.name === name)?.value;
    const hidden = attr('aria-hidden') === 'true' || stack.some(node => node.hidden);
    if (tag.name === 'img') {
      const alt = attr('alt');
      if (alt === undefined) failures.push('Image is missing its alt attribute; render the source again.');
      else if (!alt.replace(/&#(x[0-9a-f]+|[0-9]+);?|&(nbsp|Tab|NewLine);/gi, (raw, numeric, named) => {
        if (named) return {nbsp:' ',Tab:'\t',NewLine:'\n'}[named] ?? raw;
        const value = numeric[0].toLowerCase() === 'x' ? parseInt(numeric.slice(1),16) : Number(numeric);
        return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : '\ufffd';
      }).trim() && !hidden && !attr('class')?.split(/\s+/).includes('decorative')) failures.push('Image has an empty description without {.decorative}.');
    }
    if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag.name)) stack.push({name: tag.name, hidden});
  }
  return failures;
}

/** Classify canonical picture layouts without interpreting code examples as media. */
export function slideMediaClasses(html, hasBackground = false) {
  const top = [], stack = [];
  let full = hasBackground;
  for (const tag of htmlTags(html)) {
    if (tag.skip) continue;
    if (tag.closing) {
      const index = stack.map(node => node.name).lastIndexOf(tag.name);
      if (index < 0) continue;
      const node = stack[index];
      node.end = tag.end;
      stack.length = index;
      continue;
    }
    const classes = tag.attributes.find(attr => attr.name === 'class')?.value.split(/\s+/) || [];
    const node = { name: tag.name, classes, start: tag.start, end: tag.end, images: tag.name === 'img' ? 1 : 0, children: [] };
    const inCode = stack.some(parent => /^(pre|code)$/.test(parent.name));
    if (!inCode) {
      if (classes.includes('ds-full')) full = true;
      if (node.images) stack.forEach(parent => { parent.images++; });
    }
    if (!stack.length) top.push(node);
    else stack.at(-1).children.push(node);
    if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag.name)) stack.push(node);
  }
  if (full) return ['htmpres-full-media'];
  const content = top.filter(node => !node.classes.includes('slide-credits'));
  function picture(node) {
    if (node.images !== 1) return false;
    if (node.name === 'img') return true;
    if (node.name === 'figure') return node.children.every(child => ['img','a','figcaption'].includes(child.name));
    if (node.classes.includes('ds-media')) return node.children.length === 1 && picture(node.children[0]);
    if (node.name !== 'p') return false;
    const source = html.slice(node.start,node.end);
    let cursor = 0, text = '';
    for (const tag of htmlTags(source)) { text += source.slice(cursor,tag.start); cursor = tag.end; }
    return !(text + source.slice(cursor)).trim();
  }
  if (content.length === 2 && content.reduce((count,node) => count + node.images,0) === 1 && content.some(node => picture(node) && node.classes.some(role => ['ds-left','ds-right'].includes(role)))) return ['htmpres-split-media'];
  if (content.length === 1 && picture(content[0]) && content[0].name !== 'img') return ['htmpres-picture-slide'];
  return [];
}

/** Collect picture attribution in a single slide lane; preserve source lines and code examples. */
export function arrangeSlideCredits(html) {
  const stack = [], credits = [];
  for (const tag of htmlTags(html)) {
    if (tag.skip) continue;
    if (tag.closing) {
      const index = stack.map(node => node.name).lastIndexOf(tag.name);
      if (index < 0) continue;
      const node = stack[index];
      node.closeStart = tag.start; node.end = tag.end;
      if (node.credit) credits.push({ start: node.start, end: tag.end, node });
      stack.length = index;
      continue;
    }
    const classes = tag.attributes.find(attr => attr.name === 'class')?.value.split(/\s+/) || [];
    const credit = classes.includes('credit') && !stack.some(node => node.credit || /^(pre|code)$/.test(node.name));
    if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag.name)) stack.push({ name: tag.name, start: tag.start, openEnd: tag.end, credit, parent: stack.at(-1) });
  }
  if (!credits.length) return html;
  for (const range of credits) {
    let parent = range.node.parent;
    while (parent && /^(p|a|span|em|strong|b|i|small)$/.test(parent.name) && parent.end &&
      !html.slice(parent.openEnd, range.start).trim() && !html.slice(range.end, parent.closeStart).trim()) {
      range.start = parent.start; range.end = parent.end; parent = parent.parent;
    }
  }
  credits.sort((a, b) => a.start - b.start);
  const lane = credits.map(range => html.slice(range.start, range.end)).join('\n');
  let body = html;
  for (const range of [...credits].reverse()) body = body.slice(0, range.start) + body.slice(range.end);
  body = body.replace(/<p>\s*<\/p>/g, '').trimEnd();
  return `${body}\n<div class="slide-credits" aria-label="Picture credits">${lane}</div>`;
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
