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
