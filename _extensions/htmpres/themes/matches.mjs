/** Build-time matching accents. Keys/steps belong to source; colors belong here. */
export const legacyMatchPalettes = {
  sage: { paper: '#ffffff', panel: '#eef7f5', accent: '#117c78' },
  'mono-grid': { paper: '#fbfcfd', panel: '#e8f0ff', accent: '#2563eb' },
  blank: { paper: '#ffffff', panel: '#eef7f5', accent: '#117c78' },
};

function rgb(hex) { return hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255); }
function luminance(hex) {
  return rgb(hex).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
}
export function contrastRatio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

/** Mid-tone themes need an opaque backing to retain several readable hues. */
export function matchSurface(palette) {
  const extremes = ['#000000', '#ffffff'].map(ink => Math.min(...[palette.paper, palette.panel].map(bg => contrastRatio(ink, bg))));
  if (Math.max(...extremes) >= 7) return null;
  const toward = luminance(palette.paper) < .4 ? 0 : 1;
  return '#' + rgb(palette.paper).map(channel => Math.round(255 * (channel * .25 + toward * .75)).toString(16).padStart(2, '0')).join('');
}
function hueSaturation(hex) {
  const [r, g, b] = rgb(hex), hi = Math.max(r,g,b), lo = Math.min(r,g,b), delta = hi - lo;
  if (!delta) return [210, .55];
  const hue = (hi === r ? (g-b)/delta : hi === g ? (b-r)/delta + 2 : (r-g)/delta + 4) * 60;
  return [(hue + 360) % 360, delta / (1 - Math.abs(hi + lo - 1))];
}
function hslHex(hue, saturation, lightness) {
  const a = saturation * Math.min(lightness, 1-lightness);
  return '#' + [0,8,4].map(n => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (lightness - a * Math.max(-1, Math.min(k-3, 9-k, 1)))).toString(16).padStart(2, '0');
  }).join('');
}

/** Golden-angle spacing keeps existing slots stable when an author adds a key. */
export function matchPalette(palette, count) {
  const [baseHue, rawSaturation] = hueSaturation(palette.accent);
  const saturation = Math.max(.45, Math.min(.7, rawSaturation));
  const surface = matchSurface(palette);
  const backgrounds = surface ? [surface] : [palette.paper, palette.panel];
  const desired = luminance(backgrounds[0]) > .4 ? .34 : .76;
  return Array.from({ length: count }, (_, index) => {
    const hue = (baseHue + index * 137.507764) % 360;
    const candidates = Array.from({ length: 101 }, (_, n) => n / 100).sort((a,b) => Math.abs(a-desired) - Math.abs(b-desired));
    for (const lightness of candidates) {
      const color = hslHex(hue, saturation, lightness);
      if (backgrounds.every(bg => contrastRatio(color, bg) >= 4.8)) return color;
    }
    throw new Error('Theme backgrounds cannot support matching text with sufficient contrast.');
  });
}

export function matchThemeStyles(plan, catalog, count, theme = '') {
  if (!count) return '';
  const declarations = palette => [
    `  --htmpres-summary-surface: ${matchSurface(palette) || 'transparent'};`,
    `  --htmpres-summary-number-bg: ${matchSurface(palette) || palette.paper};`,
    ...matchPalette(palette, count).map((color, i) => `  --htmpres-match-${i+1}: ${color};`),
  ].join('\n');
  const rules = [];
  if (plan) {
    for (const mode of ['light', 'dark']) {
      const entry = catalog.themes[plan[mode]];
      if (entry) rules.push(`html[data-theme="${plan[mode]}"]:where([data-color-mode="${mode}"]) {\n${declarations(entry.palettes[mode])}\n}`);
    }
  } else if (legacyMatchPalettes[theme || 'sage']) rules.push(`:root {\n${declarations(legacyMatchPalettes[theme || 'sage'])}\n}`);
  // Custom theme authors provide these tokens; foreground is a readable fallback.
  rules.push(...Array.from({ length: count }, (_, i) => `.slide [data-match-slot="${i+1}"] { --_htmpres-match-ink: var(--htmpres-match-${i+1}, var(--ink)); }`));
  return `\n/* Theme matching palette: ${count} semantic groups. */\n${rules.join('\n')}\n`;
}
