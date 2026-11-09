import { componentDefaults } from "./component-defaults.mjs";
/** Presentation-only jobs from validated upstream contracts; no palette guessing. */
export function foundationTokens(entry, mode) {
  const f = entry.foundation;
  if (!f) return {};
  const m = f.modes[mode], roles = Object.fromEntries(Object.entries(m.roles).map(([key, ref]) => [key, m.swatches[ref]]));
  const t = f.typography, p = t.profiles.presentation, s = f.spacing.profiles.presentation;
  const emphasis = Math.max(...t.availableWeights.body);
  const values = {
    ...Object.fromEntries(Object.entries(roles).map(([key, value]) => [`foundation-${key}`, value])),
    ...Object.fromEntries(Object.entries(m.states).flatMap(([state, triple]) => ['fill', 'ink', 'boundary'].map(key => [`foundation-${state}-${key}`, triple[key]]))),
    'foundation-emphasis-weight': emphasis, 'htmpres-code-emphasis-weight': Math.max(...t.availableWeights.code), 'htmpres-focus-outline':'2px solid var(--foundation-focus)', 'htmpres-ui-padding':'8px 16px', 'foundation-ui-size': `${p.ui}px`, 'foundation-ui-leading': t.lineHeights.ui, 'font-body': t.fonts.body, 'font-heading': t.fonts.heading, 'font-display': t.fonts.heading,
    'font-editorial-display': t.fonts.display, 'font-ui': t.fonts.ui, 'font-mono': t.fonts.code,
    'htmpres-body-size': `${p.body}px`, 'htmpres-h2-size': `${p.heading}px`, 'htmpres-h3-size': `${p.heading}px`,
    'htmpres-hero-title-size': `${p.title}px`, 'htmpres-small-size': `${p.label}px`, 'htmpres-code-size': `${p.code}px`,
    'htmpres-prose-ink': roles.ink, 'htmpres-slide-padding': `${s.outer}px`,
    'htmpres-card-padding': `${s.panel}px`, 'htmpres-column-gap': `${s.columns}px`,
    'htmpres-paragraph-gap': `${s.paragraph}px`, 'htmpres-group-gap': `${s.group}px`,
    'htmpres-within-gap': `${s.withinGroup}px`, 'htmpres-reading-body-size': `${t.profiles.reading.body / 16}rem`,
    'htmpres-body-leading': t.lineHeights.presentation, 'htmpres-code-leading': t.lineHeights.code, 'htmpres-code-pad': `${s.panel}px`, 'htmpres-code-radius': `${f.shape.radius}px`,
    'htmpres-heading-leading': t.lineHeights.heading, 'htmpres-heading-weight': 400,
    'htmpres-card-bg': f.theme === 'tufte' ? 'transparent' : roles.panel, 'htmpres-card-border': f.theme === 'tufte' ? '0' : '1px solid var(--line)', 'htmpres-callout-bg': f.theme === 'tufte' ? 'transparent' : roles.panel, 'htmpres-callout-border': f.theme === 'tufte' ? '0' : '2px solid var(--foundation-control-boundary)', 'htmpres-code-shell-border': f.theme === 'tufte' ? '0' : '1px solid var(--foundation-control-boundary)', radius: `${f.shape.radius}px`, shadow: f.shape.restingShadow, 'caption-shadow': 'none',
    'control-border': roles['control-boundary'], 'htmpres-code-border': roles['control-boundary'],
    'htmpres-code-bg': f.theme === 'tufte' ? 'transparent' : roles.code, 'code-card-bg': f.theme === 'tufte' ? 'transparent' : roles.code, 'htmpres-code-ink': roles['code-ink'], 'code-card-ink': roles['code-ink'], 'bs-link-color': roles['accent-text'],
  };
  [24, 24, p.body, 36, 48].forEach((size, level) => {
    values[`htmpres-importance-${level}-scale`] = size / p.body;
    values[`htmpres-importance-${level}-weight`] = level < 3 ? 400 : emphasis;
    values[`htmpres-importance-${level}-ink`] = level < 2 ? roles.muted : roles.ink;
  });
  for (const key of defaultJobs) {
    values[`foundation-default-${key}`] = values[key];
    delete values[key];
  }
  return values;
}

const defaultJobs = ['htmpres-body-size','htmpres-h2-size','htmpres-h3-size','htmpres-hero-title-size','htmpres-small-size','htmpres-code-size','htmpres-slide-padding','htmpres-card-padding','htmpres-column-gap','htmpres-paragraph-gap','htmpres-group-gap','htmpres-within-gap','htmpres-body-leading','htmpres-code-leading','htmpres-heading-leading','htmpres-code-pad','htmpres-code-radius','htmpres-code-shell-border','radius'];

export function upgradeOwnedCss(css, plan, catalog, context = css) {
  if (!plan) return css;
  const clone = [...context.matchAll(/\/\* htmpres-foundation-seed: ([a-z0-9-]+) <- ([a-z0-9-]+) \*\//g)].some(([,alias,source]) => [plan.light,plan.dark].includes(alias) && catalog.themes[source]?.foundation);
  if (!clone && ![plan.light,plan.dark].some(name => catalog.themes[name]?.foundation)) return css;
  return componentDefaults.reduce((text, [before, after]) => text.replaceAll(before.trim(), after.trim()), css);
}

/** :where scope adds no specificity; later authored component rules still win. */
export function foundationStyles(selector, entry) {
  if (!entry.foundation) return '';
  const root = `:where(${selector})`, slide = `${root} :where(.slide)`;
  const defaults = foundationTokens(entry, 'light');
  const rules = [`${root} { ${defaultJobs.map(key => `--${key}:${defaults[`foundation-default-${key}`]};`).join(' ')} }`,
    `${root} body { font-synthesis:none; }`,
    `${slide} :is(strong,b) { font-weight:var(--foundation-emphasis-weight); }`,
    `${root} .hero-title h2 :is(strong,b) { font-weight:400; }`,
    `${slide} { padding:var(--htmpres-slide-padding); }`,
    `${["p","ul","ol","li",".lead",".card",".callout"].map(key => `${slide} ${key}`).join(",")} { color:var(--ink); font-size:var(--htmpres-body-size); line-height:var(--htmpres-body-leading); }`,
    `${slide} p { margin-top:0; margin-bottom:var(--htmpres-paragraph-gap); }`,
    `${slide} :is(h2,h3) { font-family:var(--font-heading); color:var(--ink); font-weight:400; font-style:normal; line-height:var(--htmpres-heading-leading); }`,
    `${root} .hero-title h2 { font-family:var(--font-editorial-display); font-size:var(--htmpres-hero-title-size); font-weight:400; }`,
    `${slide} :is(.source-line,.eyebrow,figcaption,.caption,.axis-label) { font-family:var(--font-ui); font-size:var(--htmpres-small-size); color:var(--muted); }`,
    `${slide} :is(.card,.callout,.code-card) { padding:var(--htmpres-card-padding); border-radius:var(--radius); box-shadow:none; }`,
    `${slide} :is(.card p,.card strong) { font-size:var(--htmpres-body-size); color:var(--ink); }`,
    `${slide} :is(.two-col,.three-col,.flow) { gap:var(--htmpres-column-gap); }`,
    `${slide} :is(pre,pre code,pre code span) { font-family:var(--font-mono); font-size:var(--htmpres-code-size); line-height:var(--htmpres-code-leading); }`,
    `${slide} :not(pre)>code { font-family:var(--font-mono); font-size:var(--htmpres-code-size); color:var(--htmpres-code-ink); }`,
    `${slide} :is(pre,pre code) { padding:0; color:var(--htmpres-code-ink); }`,
    `${slide} :is(a,button,input,select,textarea,[tabindex]):focus-visible { outline:2px solid var(--foundation-focus); outline-offset:4px; box-shadow:none; }`,
    `${slide} a { color:var(--foundation-accent-text); text-decoration:underline; }`,
    `${slide} a:hover { color:var(--foundation-link-hover); }`,
    `${slide} :is(.btn,.form-control,.form-select,label) { font-family:var(--font-ui); font-size:var(--foundation-ui-size); line-height:var(--foundation-ui-leading); }`,
    `${slide} :is(.btn,.form-control,.form-select) { padding:8px 16px; color:var(--ink); border:1px solid var(--foundation-control-boundary); border-radius:var(--radius); background:var(--paper); background-image:none; }`,
    `${slide} .btn-primary { color:var(--foundation-button-ink); background:var(--foundation-primary-fill); }`,
    `${slide} .btn-primary:hover,${slide} .btn-primary:active { color:var(--foundation-primary-hover-ink); background:var(--foundation-primary-hover-fill); }`,
    `${slide} .btn-secondary { color:var(--foundation-secondary-action); background:var(--surface); }`,
    `${slide} [aria-selected=true],${slide} [aria-pressed=true] { color:var(--foundation-selected-ink); background:var(--foundation-selected-fill); text-decoration:underline; }`,
    `${slide} :is(.callout-body,.callout-body p,.callout-body-container) { background:var(--paper); color:var(--ink); }`,
    `${slide} [aria-invalid=true] { border:2px solid var(--foundation-danger-boundary); }`,
    `${slide} .invalid-feedback { color:var(--foundation-danger-ink); background:var(--foundation-danger-fill); font-family:var(--font-ui); font-size:var(--foundation-ui-size); }`,
    `${root} :is(.toc,.footer-controls,.presenter-note-body) { font-family:var(--font-ui); }`,
  ];
  for (const [state, callouts] of Object.entries({success:['tip'], warning:['warning'], danger:['important','caution'], info:['note']})) {
    const action = `${slide} :is(.btn-${state},.btn-outline-${state})`;
    rules.push(`${action} { color:var(--foundation-${state}-ink); background:var(--foundation-${state}-fill); border-color:var(--foundation-control-boundary); }`);
    rules.push(`${slide} .btn-outline-${state} { background:transparent; }`);
    rules.push(`${action}:hover,${action}:active { color:var(--foundation-${state}-fill); background:var(--foundation-${state}-ink); }`);
    rules.push(`${slide} .alert-${state} { color:var(--foundation-${state}-ink); background:var(--foundation-${state}-fill); border:1px solid var(--foundation-${state}-boundary); }`);
    for (const callout of callouts) rules.push(`${slide} .callout-${callout} .callout-header { color:var(--foundation-${state}-ink); background:var(--foundation-${state}-fill); font-family:var(--font-ui); font-size:var(--foundation-ui-size); }`);
  }
  rules.push(`${slide} :is(.btn[aria-selected=true],.btn[aria-pressed=true]) { color:var(--foundation-selected-ink); background:var(--foundation-selected-fill); text-decoration:underline; }`);
  rules.push(`${slide} :is(button:disabled,.btn.disabled,.btn[aria-disabled=true],input:disabled,select:disabled) { color:var(--foundation-disabled-ink); background:var(--foundation-disabled-fill); border-color:var(--foundation-control-boundary); opacity:1; text-decoration:none; }`);
  if (entry.foundation.theme === 'tufte') {
    rules.push(`${slide} :is(.card,.ds-pane,.callout) { background:transparent; border:0; border-radius:0; box-shadow:none; padding:0; }`);
    rules.push(`${slide} a { text-decoration:underline; }`);
  }
  const reading = entry.foundation.typography.profiles.reading;
  rules.push(`@media(max-width:980px) {
${selector} { --foundation-ui-size:${reading.ui/16}rem; --foundation-default-htmpres-code-size:${reading.code/16}rem; --foundation-default-htmpres-body-size:${reading.body/16}rem; --foundation-default-htmpres-h2-size:${reading.heading/16}rem; --foundation-default-htmpres-h3-size:1.5rem; --foundation-default-htmpres-small-size:${reading.metadata/16}rem; }
${root} { --htmpres-body-leading:${entry.foundation.typography.lineHeights.reading}; --htmpres-card-padding:${entry.foundation.spacing.profiles.reading.panel/16}rem; --htmpres-code-pad:${entry.foundation.spacing.profiles.reading.panel/16}rem; --htmpres-paragraph-gap:${entry.foundation.spacing.profiles.reading.paragraph/16}rem; --htmpres-code-size:${reading.code/16}rem; --htmpres-mobile-slide-padding:16px 16px var(--htmpres-mobile-slide-bottom-clearance); }
${slide} { padding:var(--htmpres-mobile-slide-padding); }
}`);
  return rules.join('\n');
}
