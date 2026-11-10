/** Standalone, inert ESM core. No DOM, plotting library or network access on import. */
import { pins } from "./pins.js";
const loaded = new WeakMap();
const configurations = new WeakSet();
const scales = new WeakMap();
const freeze = (x) => {
  if (x && typeof x === "object") {
    Object.values(x).forEach(freeze);
    Object.freeze(x);
  }
  return x;
};
export function packageInfo() {
  return {
    name: "plotfoundry",
    version: "0.1.0-dev.1",
    status: "observable-reference",
  };
}
export function finite(x, label = "value") {
  if (typeof x !== "number" || !Number.isFinite(x))
    throw new TypeError(`${label} must be a finite number`);
  return x;
}
export function id(x, choices, label = "ID") {
  if (typeof x !== "string" || !choices.includes(x))
    throw new TypeError(`Unknown ${label}: ${String(x)}`);
  return x;
}
export function missing(x) {
  return (
    x === null || x === undefined || (typeof x === "number" && Number.isNaN(x))
  );
}
export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
/** Verify every pinned byte before parsing any scientific metadata. Caller code/pins are the trust root. */
export async function loadSpec({
  readResource = async (p) => {
    const r = await fetch(new URL("../resources/" + p, import.meta.url));
    if (!r.ok) throw Error(`Resource ${p}: ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  },
} = {}) {
  const bytes = new Map();
  for (const [path, hash] of Object.entries(pins)) {
    const input = await readResource(path);
    if (
      !(input instanceof Uint8Array) ||
      (typeof SharedArrayBuffer !== "undefined" &&
        input.buffer instanceof SharedArrayBuffer)
    )
      throw Error("Reader must return nonshared Uint8Array bytes");
    const b = new Uint8Array(input);
    if ((await sha256(b)) !== hash)
      throw Error(`Approved resource mismatch: ${path}`);
    bytes.set(path, b);
  }
  const spec = freeze(
    JSON.parse(new TextDecoder().decode(bytes.get("data/spec.json"))),
  );
  loaded.set(spec, {
    bytes,
    glyphs: JSON.parse(new TextDecoder().decode(bytes.get("glyphs.json"))),
  });
  return spec;
}
export function resource(spec, path) {
  const b = loaded.get(spec)?.bytes.get(path);
  if (!b) throw Error("Unknown approved resource");
  return b.slice();
}
export function glyphs(spec, font) {
  const c = loaded.get(spec)?.glyphs[font];
  if (!c) throw Error("Unknown font");
  return c.slice();
}
export function theme(
  spec,
  family,
  { mode = "light", profile = "reading", surface = "paper", width } = {},
) {
  if (!loaded.has(spec)) throw Error("Use loadSpec before selecting a theme");
  id(family, Object.keys(spec.themes), "theme");
  id(mode, ["light", "dark"], "mode");
  id(profile, ["reading", "presentation"], "profile");
  id(surface, ["paper", "panel"], "surface");
  const c = spec.cases.find(
    (c) => c.id === `${family}/${mode}/${profile}/${surface}`,
  );
  width ??= c.placement.placedWidthCssPx;
  finite(width, "placed width");
  if (
    width <= 0 ||
    !Number.isFinite(width / c.placement.placedWidthCssPx) ||
    width / c.placement.placedWidthCssPx === 0
  )
    throw Error("Placed width must be representable and positive");
  const s = freeze({
    spec,
    case: c,
    width,
    scale: width / c.placement.placedWidthCssPx,
  });
  configurations.add(s);
  return s;
}
export function assertTheme(s) {
  if (!configurations.has(s))
    throw Error("Use theme() to select an approved case");
  return s;
}
/** SVG units at the declared placement. Resizing the finished SVG scales these lengths. */
export function size(s, cssPx) {
  assertTheme(s);
  finite(cssPx);
  if (cssPx <= 0) throw Error("Size must be positive");
  const result = cssPx * s.scale;
  if (!Number.isFinite(result) || result <= 0)
    throw Error("Derived SVG size is unrepresentable");
  return result;
}
function ratio(v, a, b) {
  if (v === a) return 0;
  if (v === b) return 1;
  return Number.isFinite(b - a)
    ? (v - a) / (b - a)
    : (v * 0.5 - a * 0.5) / (b * 0.5 - a * 0.5);
}
export function normalize(value, vmin, vmax, { center } = {}) {
  finite(vmin, "vmin");
  finite(vmax, "vmax");
  if (!(vmin < vmax)) throw Error("vmin < vmax required");
  if (center !== undefined) {
    finite(center, "center");
    if (!(vmin < center && center < vmax))
      throw Error("vmin < center < vmax required");
  }
  if (missing(value)) return null;
  value = Math.min(vmax, Math.max(vmin, finite(value)));
  return center === undefined
    ? ratio(value, vmin, vmax)
    : value <= center
      ? 0.5 * ratio(value, vmin, center)
      : 0.5 + 0.5 * ratio(value, center, vmax);
}
export function lookup(s, u, { map = "cividis" } = {}) {
  assertTheme(s);
  id(map, Object.keys(s.spec.maps), "map");
  if (missing(u)) return null;
  u = Math.max(0, Math.min(1, finite(u)));
  const a = s.spec.maps[map].samples;
  return a[Math.min(a.length - 1, Math.floor(u * a.length))].slice();
}
export function cssColor(rgb) {
  if (rgb === null) return null;
  return `rgb(${rgb.map((v) => v * 255).join(" ")})`;
}
/** Variant scope is explicit. Five slots are never an automatic extension of three. */
export function categories(
  s,
  domain,
  observed = [],
  { variant = s.spec.categories.default } = {},
) {
  assertTheme(s);
  id(variant, Object.keys(s.spec.categories.variants), "variant");
  const v = s.spec.categories.variants[variant];
  if (
    !Array.isArray(domain) ||
    [...domain].some((x) => typeof x !== "string" || !x) ||
    new Set(domain).size !== domain.length ||
    domain.length > v.capacity
  )
    throw Error(
      "Explicit unique string domain within variant capacity required",
    );
  if (
    !Array.isArray(observed) ||
    [...observed].some((x) => typeof x !== "string" || !domain.includes(x))
  )
    throw Error("Observed category outside explicit domain");
  return observed.map((x) => ({ ...v.slots[domain.indexOf(x)], category: x }));
}
export function colorScale(
  s,
  { kind = "sequential", vmin, vmax, center, map } = {},
) {
  assertTheme(s);
  id(kind, ["sequential", "diverging"], "scale kind");
  if (kind === "diverging" && center === undefined)
    throw Error("Diverging center required");
  if (kind === "sequential" && center !== undefined)
    throw Error("Sequential center unsupported");
  map ??= kind === "sequential" ? "cividis" : "BrBG";
  id(map, Object.keys(s.spec.maps), "map");
  if (s.spec.maps[map].kind !== kind) throw Error("Map kind mismatch");
  normalize(null, vmin, vmax, { center });
  const scale = Object.freeze({
    kind,
    vmin,
    vmax,
    center,
    map,
    normalize: (v) => normalize(v, vmin, vmax, { center }),
    rgb: (v) => lookup(s, normalize(v, vmin, vmax, { center }), { map }),
    color: (v) =>
      missing(v)
        ? s.case.roles.muted
        : cssColor(lookup(s, normalize(v, vmin, vmax, { center }), { map })),
  });
  scales.set(scale, s);
  return scale;
}

export function assertColorScale(s, scale) {
  assertTheme(s);
  if (scales.get(scale) !== s)
    throw Error("Use colorScale from this theme configuration");
  return scale;
}
