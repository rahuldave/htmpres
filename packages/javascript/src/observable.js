/** Optional browser-native Observable Plot adapter. The core entry never imports this module. */
import * as bundledPlot from "../vendor/plot.js";
import {
  assertTheme,
  assertColorScale,
  categories,
  colorScale,
  finite,
  glyphs,
  id,
  missing,
  resource,
  size,
} from "./index.js";
export { bundledPlot as Plot };
const sessions = new WeakMap();
const renderers = new WeakMap();
const svgNS = "http://www.w3.org/2000/svg";
function record(d, key) {
  if (typeof key !== "string" || !key || !Object.hasOwn(d, key))
    throw Error("Field must name an existing own column");
  return d[key];
}
function rows(data, { x = "x", y = "y", category } = {}) {
  if (!Array.isArray(data)) throw Error("Data must be an array of row objects");
  return Array.from(data, (d) => {
    if (!d || typeof d !== "object" || Array.isArray(d))
      throw Error("Each datum must be a row object");
    const a = record(d, x),
      b = record(d, y);
    if (!missing(a)) finite(a, "x");
    if (!missing(b)) finite(b, "y");
    const c = category === undefined ? undefined : record(d, category);
    return {
      ...d,
      __pf_x: missing(a) ? NaN : a,
      __pf_y: missing(b) ? NaN : b,
      __pf_category: c,
    };
  });
}
function markOptions(options, allowed) {
  for (const k of Object.keys(options))
    if (!allowed.includes(k)) throw Error(`Unsupported helper option: ${k}`);
}
function face(s, role) {
  return s.spec.fonts[s.case.fonts[role === "heading" ? "heading" : "ui"]];
}
export function fontAlias(s, role = "label") {
  return "plotfoundry-" + face(s, role).sha256;
}
function text(s, content, role = "label") {
  if (
    typeof content !== "string" ||
    /[^\u0009\u000a\u000d\u0020-\u02ff\u2000-\u206f\u2190-\u21ff\u2212]/u.test(
      content,
    ) ||
    content.includes("$")
  )
    throw Error(
      "Supported text is plain, unshaped text; math/RTL/combining marks are unsupported",
    );
  const allowed = new Set(glyphs(s.spec, face(s, role).sha256));
  for (const ch of content)
    if (ch !== "\n" && ch !== "\u200b" && !allowed.has(ch.codePointAt(0)))
      throw Error(`Missing bundled glyph: ${ch}`);
  return content;
}
/** Add only this session's file-backed faces. dispose removes only faces it owns. */
export async function loadFonts(s, { document = globalThis.document } = {}) {
  assertTheme(s);
  if (!document?.fonts)
    throw Error("A browser Document with FontFace is required");
  let entries = sessions.get(document);
  if (!entries) {
    entries = new Map();
    sessions.set(document, entries);
  }
  const owned = [];
  try {
    for (const role of ["ui", "heading"]) {
      const f = face(s, role),
        alias = fontAlias(s, role);
      let e = entries.get(alias);
      if (!e) {
        if (
          [...document.fonts].some(
            (f) => f.family.replaceAll('"', "") === alias,
          )
        )
          throw Error("Reserved font alias already belongs to caller");
        const Font = document.defaultView.FontFace;
        const ff = new Font(alias, resource(s.spec, "data/" + f.path), {
          weight: String(f.weight),
          style: "normal",
        });
        e = { font: ff, count: 0, promise: null };
        entries.set(alias, e);
        e.promise = Promise.resolve()
          .then(() => ff.load())
          .then(() => {
            document.fonts.add(ff);
            return ff;
          });
      }
      e.count++;
      owned.push(alias);
      await e.promise;
    }
  } catch (error) {
    for (const a of owned) {
      const e = entries.get(a);
      if (e && !--e.count) {
        document.fonts.delete(e.font);
        entries.delete(a);
      }
    }
    throw error;
  }

  let disposed = false;
  return {
    aliases: owned.slice(),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const a of owned) {
        const e = entries.get(a);
        if (e && !--e.count) {
          document.fonts.delete(e.font);
          entries.delete(a);
        }
      }
    },
  };
}
export function options(s, { height = s.width * 0.6, ...overrides } = {}) {
  assertTheme(s);
  finite(height, "height");
  if (height <= 0) throw Error("Height must be positive");
  return {
    width: s.width,
    height,
    marginLeft: size(s, 64),
    marginRight: size(s, 90),
    marginTop: size(s, 32),
    marginBottom: size(s, 64),
    style: {
      background: s.case.roles.background,
      color: s.case.roles.ink,
      fontFamily: fontAlias(s),
      fontSize: `${size(s, s.case.typography.label)}px`,
      fontWeight: face(s, "ui").weight,
      fontSynthesis: "none",
      fontVariantLigatures: "none",
    },
    ...overrides,
    x: { labelArrow: false, tickFormat: String, ...overrides.x },
    y: { labelArrow: false, tickFormat: String, ...overrides.y },
  };
}
function geometry(opts) {
  if (
    opts.projection !== undefined ||
    (opts.curve !== undefined && opts.curve !== "linear")
  )
    throw Error(
      "Helpers support Cartesian linear paths, not projections or alternative curves",
    );
}
function markFont(s) {
  return {
    fontFamily: fontAlias(s),
    fontSize: size(s, s.case.typography.label),
    fontWeight: face(s, "ui").weight,
    fill: s.case.roles.ink,
  };
}
/** Caller supplies a native Plot module; the bundled exact version is the default. */
export function createPlotAdapter(
  Plot = bundledPlot,
  { version = Plot === bundledPlot ? "0.6.19" : undefined } = {},
) {
  if (version !== "0.6.19")
    throw Error("Only explicitly declared Observable Plot0.6.19 is tested");
  for (const name of ["plot", "line", "dot", "text", "rect", "link", "legend"])
    if (typeof Plot?.[name] !== "function")
      throw Error(`Native Plot module lacks ${name}`);
  function categorical(
    s,
    data,
    {
      domain,
      variant = s.spec.categories.default,
      x = "x",
      y = "y",
      category = "category",
      labels = true,
      tip = true,
      fx,
      fy,
      ...extra
    } = {},
    line = true,
  ) {
    assertTheme(s);
    markOptions(extra, []);
    const values = rows(data, { x, y, category });
    categories(
      s,
      domain,
      values.map((d) => d.__pf_category),
      { variant },
    );
    const slots = categories(s, domain, domain, { variant });
    for (const name of [fx, fy])
      if (name !== undefined) {
        if (typeof name !== "string" || !name)
          throw Error("Facet fields must be column names");
        for (const row of values) record(row, name);
      }
    if (typeof labels !== "boolean" || typeof tip !== "boolean")
      throw Error("labels/tip must be boolean");
    const treatment = s.spec.categories.treatment;
    const marks = [];
    for (const slot of slots) {
      const group = values.filter((d) => d.__pf_category === slot.category);
      if (!group.length) continue;
      const shared = { x: "__pf_x", y: "__pf_y", fx, fy, z: null, clip: true };
      const dash = slot.dash.multipliers.map((n) =>
        size(s, n * treatment.foreground_css_px),
      );
      if (line) {
        for (const [kind, width, color] of [
          ["understroke", treatment.understroke_css_px, s.case.roles.ink],
          ["foreground", treatment.foreground_css_px, slot.color],
        ])
          marks.push(
            Plot.line(group, {
              ...shared,
              stroke: color,
              strokeWidth: size(s, width),
              strokeDasharray: dash.length ? dash : undefined,
              strokeDashoffset: 0,
              strokeLinecap: dash.length ? "butt" : "square",
              strokeLinejoin: "round",
              className: "pf-" + kind,
            }),
          );
      }
      const symbol = {
        circle: "circle",
        square: "square",
        "triangle-up": "triangle",
        diamond: "diamond",
        "triangle-down": {
          draw(context, area) {
            const k = Math.sqrt(area / Math.sqrt(3)),
              h = k * Math.sqrt(3);
            context.moveTo(0, (h * 2) / 3);
            context.lineTo(-k, -h / 3);
            context.lineTo(k, -h / 3);
            context.closePath();
          },
        },
      }[slot.shape];
      marks.push(
        Plot.dot(group, {
          ...shared,
          symbol,
          r: size(s, treatment.marker_css_px / 2),
          fill: slot.color,
          stroke: s.case.roles.ink,
          strokeWidth: size(s, treatment.marker_edge_css_px),
          tip,
          title: (d) => `${slot.category}: ${d.__pf_x}, ${d.__pf_y}`,
          className: "pf-category-points",
        }),
      );
      if (labels) {
        const ends = group.filter(
          (d) => !missing(d.__pf_x) && !missing(d.__pf_y),
        );
        const facets = new Map();
        for (const d of ends) {
          const key = JSON.stringify([
            fx ? record(d, fx) : null,
            fy ? record(d, fy) : null,
          ]);
          facets.set(key, d);
        }
        if (ends.length)
          marks.push(
            Plot.text([...facets.values()], {
              ...shared,
              ...markFont(s),
              text: () => text(s, slot.category),
              dx: size(s, 10),
              textAnchor: "start",
              clip: false,
              className: "pf-direct-label",
            }),
          );
      }
    }
    return marks;
  }
  function line(s, data, opts) {
    return categorical(s, data, opts, true);
  }
  function scatter(s, data, opts) {
    return categorical(s, data, opts, false);
  }
  function scatterValues(
    s,
    data,
    { x = "x", y = "y", value = "value", scale, tip = true, ...extra } = {},
  ) {
    assertTheme(s);
    markOptions(extra, []);
    if (!scale || typeof scale.color !== "function")
      throw Error("Use colorScale for explicit limits");
    assertColorScale(s, scale);
    const values = rows(data, { x, y }).map((d) => ({
      ...d,
      __pf_value: record(d, value),
    }));
    for (const d of values) scale.color(d.__pf_value);
    const valid = values.filter(
      (d) => !missing(d.__pf_x) && !missing(d.__pf_y),
    );
    return [
      Plot.dot(valid, {
        x: "__pf_x",
        y: "__pf_y",
        r: size(s, 3.5),
        fill: (d) => scale.color(d.__pf_value),
        stroke: s.case.roles.ink,
        strokeWidth: size(s, 1.5),
        tip,
        title: (d) =>
          missing(d.__pf_value) ? "Missing" : String(d.__pf_value),
        className: "pf-continuous-points",
      }),
      ...crosses(
        s,
        valid.filter((d) => missing(d.__pf_value)),
        false,
      ),
    ];
  }
  function crosses(s, values, cells) {
    if (!cells)
      return [
        Plot.dot(values, {
          x: "__pf_x",
          y: "__pf_y",
          r: size(s, 3.5),
          symbol: {
            draw(c, area) {
              const r = Math.sqrt(area / Math.PI);
              c.moveTo(-r, -r);
              c.lineTo(r, r);
              c.moveTo(-r, r);
              c.lineTo(r, -r);
            },
          },
          fill: "none",
          stroke: s.case.roles.background,
          strokeWidth: size(s, 1.5),
          className: "pf-missing-point-cross",
        }),
      ];
    return [-1, 1].map((direction) =>
      Plot.link(values, {
        x1: (d) => (cells ? d.__pf_x1 : d.__pf_x),
        y1: (d) =>
          cells ? (direction === 1 ? d.__pf_y1 : d.__pf_y2) : d.__pf_y,
        x2: (d) => (cells ? d.__pf_x2 : d.__pf_x),
        y2: (d) =>
          cells ? (direction === 1 ? d.__pf_y2 : d.__pf_y1) : d.__pf_y,
        stroke: s.case.roles.background,
        strokeWidth: size(s, 1.5),
        ...(cells ? {} : { dx: 0, dy: 0 }),
        className: "pf-missing-cross-" + direction,
      }),
    );
  }
  function heatmap(
    s,
    data,
    {
      x1 = "x1",
      x2 = "x2",
      y1 = "y1",
      y2 = "y2",
      value = "value",
      scale,
      tip = true,
      ...extra
    } = {},
  ) {
    assertTheme(s);
    markOptions(extra, []);
    if (!Array.isArray(data) || !scale?.color)
      throw Error("Rows and explicit colorScale required");
    assertColorScale(s, scale);
    const values = Array.from(data, (d) => {
      const a = finite(record(d, x1)),
        b = finite(record(d, x2)),
        c = finite(record(d, y1)),
        e = finite(record(d, y2)),
        v = record(d, value);
      if (!(a < b && c < e)) throw Error("Ordered finite cell bounds required");
      scale.color(v);
      return {
        ...d,
        __pf_x1: a,
        __pf_x2: b,
        __pf_y1: c,
        __pf_y2: e,
        __pf_value: v,
      };
    });
    return [
      Plot.rect(values, {
        x1: "__pf_x1",
        x2: "__pf_x2",
        y1: "__pf_y1",
        y2: "__pf_y2",
        fill: (d) => scale.color(d.__pf_value),
        inset: 0,
        tip,
        title: (d) =>
          missing(d.__pf_value) ? "Missing" : String(d.__pf_value),
        className: "pf-heatmap",
      }),
      ...crosses(
        s,
        values.filter((d) => missing(d.__pf_value)),
        true,
      ),
    ];
  }
  function plot(s, opts = {}) {
    geometry(opts);
    for (const axis of ["x", "y"])
      if (
        opts[axis]?.type !== undefined &&
        ![
          "linear",
          "log",
          "pow",
          "sqrt",
          "symlog",
          "utc",
          "time",
          "point",
          "band",
        ].includes(opts[axis].type)
      )
        throw Error("Unsupported Cartesian scale");
    const result = Plot.plot(options(s, opts));
    if (result && typeof result === "object") {
      const provenance = {
        library: "Observable Plot",
        version,
        authority:
          Plot === bundledPlot ? "bundled lock" : "caller-declared module",
      };
      renderers.set(result, provenance);
      const svg = result.matches?.("svg")
        ? result
        : result.querySelector?.("svg");
      if (svg) renderers.set(svg, provenance);
    }
    return result;
  }
  return Object.freeze({ Plot, line, scatter, scatterValues, heatmap, plot });
}
const native = createPlotAdapter();
export const { line, scatter, scatterValues, heatmap, plot } = native;
/** Bind actual text roles after native rendering. Call again after adding native legends/annotations. */
export function stylePlot(s, node, { resize = false } = {}) {
  assertTheme(s);
  if (!node?.querySelectorAll) throw Error("A rendered DOM plot is required");
  for (const el of node.querySelectorAll(
    "text,figcaption,h2,h3,p,[class*=legend]",
  )) {
    const role =
      el.dataset.pfRole ?? (el.matches("h2,h3") ? "heading" : "label");
    id(role, ["heading", "label", "metadata", "body_annotation"], "text role");
    text(s, el.textContent, role);
    el.style.fontFamily = fontAlias(s, role);
    el.style.fontWeight = String(face(s, role).weight);
    el.style.fontSynthesis = "none";
    el.style.fontVariantLigatures = "none";
    el.style.color = s.case.roles.ink;
    if (el.tagName.toLowerCase() === "text") el.style.fill = s.case.roles.ink;
    if (resize) el.style.fontSize = size(s, s.case.typography[role]) + "px";
  }
  return node;
}
/** Native legend is theme-only. Categorical helpers use direct endpoint labels instead. */
export function legend(
  s,
  {
    scale,
    label = "Value",
    width = s.width * 0.6,
    tickFormat = (value) => Number(value.toPrecision(4)).toString(),
  } = {},
) {
  assertTheme(s);
  finite(width, "legend width");
  if (width <= 0 || !scale)
    throw Error("Positive width and explicit colorScale required");
  assertColorScale(s, scale);
  text(s, label);
  const inverse = (t) =>
    scale.center === undefined
      ? scale.vmin * (1 - t) + scale.vmax * t
      : t <= 0.5
        ? scale.vmin * (1 - 2 * t) + scale.center * 2 * t
        : scale.center * (2 - 2 * t) + scale.vmax * (2 * t - 1);
  const samples = s.spec.maps[scale.map].samples;
  const bins = samples.map((rgb, i) => ({
    x1: i / samples.length,
    x2: (i + 1) / samples.length,
    color: `rgb(${rgb.map((v) => v * 255).join(" ")})`,
  }));
  const node = plot(s, {
    width,
    height: size(s, 96),
    marginLeft: size(s, 40),
    marginRight: size(s, 40),
    marginTop: size(s, 4),
    marginBottom: size(s, 64),
    x: {
      domain: [0, 1],
      ticks: [0, 0.25, 0.5, 0.75, 1],
      tickFormat: (t) => text(s, String(tickFormat(inverse(t)))),
      label,
    },
    y: { domain: [0, 1], axis: null },
    marks: [
      bundledPlot.rect(bins, {
        x1: "x1",
        x2: "x2",
        y1: 0,
        y2: 1,
        fill: (d) => d.color,
        stroke: "none",
        shapeRendering: "crispEdges",
        className: "pf-legend-bins",
      }),
    ],
  });
  node.dataset.pfLegend = "true";
  return stylePlot(s, node, { resize: true });
}

/** Observe only inserted text, including native pointer tips. The caller owns observer disposal. */
export function watchPlot(s, node) {
  stylePlot(s, node);
  const observer = new node.ownerDocument.defaultView.MutationObserver(() =>
    stylePlot(s, node, { resize: true }),
  );
  observer.observe(node, { childList: true, subtree: true });
  return { dispose: () => observer.disconnect() };
}
function domSvg(node) {
  const svg = node.matches?.("svg") ? node : node.querySelector?.("svg");
  if (!svg) throw Error("No rendered SVG");
  return svg;
}
/** Freeze CSS inheritance into a detached clone; caller DOM is never changed. */
function cloneSvg(node) {
  const source = domSvg(node);
  if (node !== source && [...node.children].some((e) => e !== source))
    throw Error(
      "Export a single SVG canvas; surrounding HTML titles/legends must be saved separately",
    );
  if (
    source.querySelector(
      "image,use,foreignObject,filter,script,animate,animateTransform",
    )
  )
    throw Error("SVG external/HTML/filter/animation content is unsupported");
  for (const el of [source, ...source.querySelectorAll("*")])
    for (const a of el.attributes)
      if (
        /url\(\s*(?!#)/.test(a.value) ||
        a.name === "href" ||
        a.name === "xlink:href"
      )
        throw Error("External SVG resources are unsupported");
  const clone = source.cloneNode(true);
  const view = source.ownerDocument.defaultView;
  const a = [source, ...source.querySelectorAll("*")],
    b = [clone, ...clone.querySelectorAll("*")];
  const props = [
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "opacity",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "text-anchor",
    "dominant-baseline",
    "paint-order",
    "color",
    "visibility",
    "display",
  ];
  for (const style of source.querySelectorAll("style"))
    if (/@import|url\(/i.test(style.textContent))
      throw Error("External CSS resources are unsupported");
  a.forEach((el, i) => {
    const style = view.getComputedStyle(el);
    for (const p of props) b[i].style.setProperty(p, style.getPropertyValue(p));
  });
  for (const style of clone.querySelectorAll("style")) style.remove();
  return { source, clone };
}
function length(value, size) {
  if (value === null || value === "") return 0;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) throw Error("Unsupported text positioning");
  return value.endsWith("em") ? n * size : n;
}
/** Static SVG uses native JS font outlines; plain unshaped text only. No font fallback/export webfonts. */
export async function exportSvg(s, node) {
  assertTheme(s);
  const { source, clone } = cloneSvg(node);
  const width = source.viewBox.baseVal.width || source.width.baseVal.value,
    height = source.viewBox.baseVal.height || source.height.baseVal.value;
  finite(width);
  finite(height);
  if (width <= 0 || height <= 0) throw Error("Explicit SVG canvas required");
  const { parse } = await import("../vendor/opentype.js");
  const fonts = new Map();
  for (const role of ["ui", "heading"]) {
    const f = face(s, role),
      b = resource(s.spec, "data/" + f.path);
    fonts.set(
      fontAlias(s, role),
      parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)),
    );
  }
  const originals = [...source.querySelectorAll("text")];
  for (const [index, el] of [...clone.querySelectorAll("text")].entries()) {
    const original = originals[index],
      view = source.ownerDocument.defaultView;
    if (original.querySelector(":scope > :not(tspan)"))
      throw Error("Only plain SVG text/tspan runs are supported");
    const content = original.textContent;
    if (original.getNumberOfChars() !== content.length)
      throw Error("Collapsed or shaped text runs are unsupported");
    const group = source.ownerDocument.createElementNS(svgNS, "g");
    if (el.hasAttribute("transform"))
      group.setAttribute("transform", el.getAttribute("transform"));
    group.dataset.pfOutlined = "true";
    let character = 0;
    const walker = source.ownerDocument.createTreeWalker(original, 4);
    let run;
    while ((run = walker.nextNode())) {
      const owner = run.parentElement,
        style = view.getComputedStyle(owner),
        alias = style.fontFamily.replaceAll('"', "").split(",")[0].trim(),
        font = fonts.get(alias);
      if (!font || !sessions.get(source.ownerDocument)?.has(alias))
        throw Error(
          "Text must use a loaded approved font session; call loadFonts and stylePlot",
        );
      const role = alias === fontAlias(s, "heading") ? "heading" : "label";
      text(s, run.textContent, role);
      if (style.fontStyle !== "normal" || style.writingMode !== "horizontal-tb")
        throw Error("Italic/vertical SVG text export is unsupported");
      const fontSize = parseFloat(style.fontSize);
      finite(fontSize);
      for (const ch of run.textContent) {
        const start = original.getStartPositionOfChar(character),
          rotation = original.getRotationOfChar(character++);
        const path = source.ownerDocument.createElementNS(svgNS, "path");
        path.setAttribute(
          "d",
          font
            .charToGlyph(ch)
            .getPath(start.x, start.y, fontSize)
            .toPathData(5),
        );
        for (const prop of [
          "fill",
          "fill-opacity",
          "stroke",
          "stroke-width",
          "stroke-opacity",
          "paint-order",
          "opacity",
          "visibility",
          "display",
        ])
          path.style.setProperty(prop, style.getPropertyValue(prop));
        if (rotation)
          path.setAttribute(
            "transform",
            `rotate(${rotation} ${start.x} ${start.y})`,
          );
        group.append(path);
      }
    }
    el.replaceWith(group);
  }
  clone.setAttribute("xmlns", svgNS);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const background = source.ownerDocument.createElementNS(svgNS, "rect");
  background.setAttribute("width", String(width));
  background.setAttribute("height", String(height));
  background.setAttribute("fill", s.case.roles.background);
  clone.insertBefore(background, clone.firstChild);
  const xml =
    new source.ownerDocument.defaultView.XMLSerializer().serializeToString(
      clone,
    );
  return {
    blob: new Blob([xml], { type: "image/svg+xml" }),
    report: {
      case: s.case.id,
      canvasCssPx: [width, height],
      placementWidthCssPx: s.width,
      fontPolicy: "outlines via opentype.js1.3.4; plain unshaped text only",
      fontFiles: ["ui", "heading"].map((r) => ({
        sha256: face(s, r).sha256,
        weight: face(s, r).weight,
      })),
      renderer: renderers.get(source) ?? {
        library: "unknown",
        version: null,
        authority: "untracked caller SVG",
      },
      interactive: false,
      tightCrop: false,
      format: "svg",
    },
  };
}
/** PNG rasterizes the outlined SVG at an explicit pixel ratio, independent of placed typography. */
export async function exportPng(s, node, { pixelRatio = 1 } = {}) {
  finite(pixelRatio, "pixel ratio");
  if (pixelRatio <= 0) throw Error("Positive pixel ratio required");
  const svg = await exportSvg(s, node),
    [w, h] = svg.report.canvasCssPx;
  const width = Math.round(w * pixelRatio),
    height = Math.round(h * pixelRatio);
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > 67108864
  )
    throw Error("Raster canvas exceeds supported64Mpixels");
  const doc = node.ownerDocument,
    url = URL.createObjectURL(svg.blob);
  try {
    const image = new doc.defaultView.Image();
    image.src = url;
    await image.decode();
    const canvas = doc.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Canvas2D unavailable");
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error("PNG encoding failed"))),
        "image/png",
      ),
    );
    return {
      blob,
      report: {
        ...svg.report,
        format: "png",
        canvasPixels: [canvas.width, canvas.height],
        pixelRatio,
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
