/** Exact unchanged canonical and checked-in tutorial template blocks only. Arbitrary authored rules are never migrated. */
export const componentDefaults = [
  ["  h2,\n  .hero-title h2 {\n    font-size: 2rem;\n  }", "  h2,\n  .hero-title h2 {\n    font-size: var(--htmpres-h2-size, 2rem);\n  }"],
  [
    ".slide::after {\n  content: attr(data-section);\n  position: absolute;\n  right: 34px;\n  bottom: 28px;\n  color: var(--footer-label);\n  font-size: 0.72rem;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}",
    ".slide::after {\n  content: attr(data-section);\n  position: absolute;\n  right: 34px;\n  bottom: 28px;\n  color: var(--footer-label);\n  font-size: var(--foundation-ui-size, 0.72rem);\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}"
  ],
  [
    ".media-caption h3 {\n  margin: 0 0 10px;\n  font-size: 1.55rem;\n}",
    ".media-caption h3 {\n  margin: 0 0 10px;\n  font-size: var(--htmpres-h3-size, 1.55rem);\n}"
  ],
  [
    ".sample-label {\n  color: var(--muted);\n  font-size: 0.86rem;\n  text-align: center;\n}",
    ".sample-label {\n  color: var(--muted);\n  font-size: var(--foundation-ui-size, 0.86rem);\n  text-align: center;\n}"
  ],
  [
    ".pill {\n  border: 1px solid var(--control-border);\n  border-radius: 999px;\n  background: var(--control-bg);\n  color: var(--ink);\n  padding: 8px 12px;\n  cursor: pointer;\n  font-size: 0.82rem;\n  line-height: 1;\n}",
    ".pill {\n  border: 1px solid var(--control-border);\n  border-radius: var(--radius, 999px);\n  background: var(--control-bg);\n  color: var(--ink);\n  padding: var(--htmpres-ui-padding, 8px 12px);\n  cursor: pointer;\n  font-size: var(--foundation-ui-size, 0.82rem);\n  line-height: var(--foundation-ui-leading, 1);\n}"
  ],
  [
    ".pill:hover,\n.pill:focus-visible {\n  outline: none;\n  border-color: var(--teal);\n  color: var(--teal);\n}",
    ".pill:hover,\n.pill:focus-visible {\n  outline: var(--htmpres-focus-outline, none);\n  border-color: var(--teal);\n  color: var(--teal);\n}"
  ],
  [
    ".pill.active {\n  background: var(--teal);\n  color: var(--paper);\n  border-color: var(--teal);\n}",
    ".pill.active {\n  background: var(--foundation-selected-fill, var(--teal));\n  color: var(--foundation-selected-ink, var(--paper));\n  border-color: var(--teal);\n}"
  ],
  [
    ".control-chip,\n.action-button {\n  border: 1px solid var(--control-border);\n  cursor: pointer;\n  font-size: 0.82rem;\n  line-height: 1;\n}",
    ".control-chip,\n.action-button {\n  border: 1px solid var(--control-border);\n  cursor: pointer;\n  font-size: var(--foundation-ui-size, 0.82rem);\n  line-height: var(--foundation-ui-leading, 1);\n}"
  ],
  [
    ".control-chip {\n  border-radius: 999px;\n  background: var(--control-subtle-bg);\n  color: var(--toc-ink);\n  padding: 8px 11px;\n}",
    ".control-chip {\n  border-radius: var(--radius, 999px);\n  background: var(--control-subtle-bg);\n  color: var(--toc-ink);\n  padding: var(--htmpres-ui-padding, 8px 11px);\n}"
  ],
  [
    ".action-button {\n  border-radius: 6px;\n  background: var(--ink);\n  color: var(--paper);\n  padding: 9px 13px;\n}",
    ".action-button {\n  border-radius: var(--radius, 6px);\n  background: var(--ink);\n  color: var(--paper);\n  padding: var(--htmpres-ui-padding, 9px 13px);\n}"
  ],
  [
    ".control-chip:hover,\n.control-chip:focus-visible,\n.action-button:hover,\n.action-button:focus-visible {\n  outline: none;\n  border-color: var(--teal);\n}",
    ".control-chip:hover,\n.control-chip:focus-visible,\n.action-button:hover,\n.action-button:focus-visible {\n  outline: var(--htmpres-focus-outline, none);\n  border-color: var(--teal);\n}"
  ],
  [
    ".control-chip.active {\n  background: var(--amber);\n  border-color: var(--amber);\n  color: var(--paper);\n}",
    ".control-chip.active {\n  background: var(--foundation-selected-fill, var(--amber));\n  border-color: var(--amber);\n  color: var(--foundation-selected-ink, var(--paper));\n}"
  ],
  [
    ".action-button.active {\n  background: var(--teal);\n  border-color: var(--teal);\n}",
    ".action-button.active {\n  background: var(--foundation-selected-fill, var(--teal));\n  color: var(--foundation-selected-ink, var(--paper));\n  border-color: var(--teal);\n}"
  ],
  [
    ".slide::after {\n  content: attr(data-section);\n  position: absolute;\n  right: 34px;\n  bottom: 28px;\n  z-index: 3;\n  pointer-events: none;\n  color: var(--footer-label);\n  font-size: 0.72rem;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}",
    ".slide::after {\n  content: attr(data-section);\n  position: absolute;\n  right: 34px;\n  bottom: 28px;\n  z-index: 3;\n  pointer-events: none;\n  color: var(--footer-label);\n  font-size: var(--foundation-ui-size, 0.72rem);\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}"
  ],
  [
    "--htmpres-h2-size: 2.35rem;\n  --htmpres-hero-title-size: 3rem;\n  --htmpres-h3-size: 1.18rem;\n  --htmpres-body-size: 1rem;\n  --htmpres-small-size: 0.78rem;\n  --htmpres-code-size: 0.84rem;",
    "--htmpres-h2-size: var(--foundation-default-htmpres-h2-size, 2.35rem);\n  --htmpres-hero-title-size: var(--foundation-default-htmpres-hero-title-size, 3rem);\n  --htmpres-h3-size: var(--foundation-default-htmpres-h3-size, 1.18rem);\n  --htmpres-body-size: var(--foundation-default-htmpres-body-size, 1rem);\n  --htmpres-small-size: var(--foundation-default-htmpres-small-size, 0.78rem);\n  --htmpres-code-size: var(--foundation-default-htmpres-code-size, 0.84rem);"
  ],
  [
    ".slide {\n  position: absolute;\n  inset: 0;\n  display: none;\n  padding: 48px 58px 82px;\n  background: var(--paper);\n  overflow: hidden;\n  scroll-padding-bottom: 82px;\n}",
    ".slide {\n  position: absolute;\n  inset: 0;\n  display: none;\n  padding: var(--htmpres-slide-padding, 48px 58px 82px);\n  background: var(--paper);\n  overflow: hidden;\n  scroll-padding-bottom: 82px;\n}"
  ],
  [
    "h2 {\n  margin: 0;\n  max-width: 920px;\n  font-family: var(--font-display);\n  font-size: var(--htmpres-h2-size);\n  line-height: 1.08;\n  letter-spacing: 0;\n}",
    "h2 {\n  margin: 0;\n  max-width: 920px;\n  font-family: var(--font-display);\n  font-size: var(--htmpres-h2-size);\n  line-height: var(--htmpres-heading-leading, 1.08);\n  letter-spacing: 0;\n}"
  ],
  [
    "h3 {\n  margin: 0 0 12px;\n  font-family: var(--font-display);\n  font-size: var(--htmpres-h3-size);\n  line-height: 1.2;\n  letter-spacing: 0;\n}",
    "h3 {\n  margin: 0 0 12px;\n  font-family: var(--font-display);\n  font-size: var(--htmpres-h3-size);\n  line-height: var(--htmpres-heading-leading, 1.2);\n  letter-spacing: 0;\n}"
  ],
  [
    ".card {\n  border: 1px solid var(--line);\n  border-radius: var(--radius);\n  padding: 18px;\n  background: var(--surface);\n  min-height: 112px;\n}",
    ".card {\n  border: var(--htmpres-card-border, 1px solid var(--line));\n  border-radius: var(--radius);\n  padding: var(--htmpres-card-padding, 18px);\n  background: var(--htmpres-card-bg, var(--surface));\n  min-height: 112px;\n}"
  ],
  [
    ".callout {\n  margin-top: 24px;\n  border-left: 5px solid var(--teal);\n  padding: 12px 18px;\n  background: var(--callout-bg);\n  color: var(--callout-ink);\n  line-height: 1.45;\n  max-width: 900px;\n}",
    ".callout {\n  margin-top: 24px;\n  border-left: var(--htmpres-callout-border, 5px solid var(--teal));\n  padding: var(--htmpres-card-padding, 12px 18px);\n  background: var(--htmpres-callout-bg, var(--callout-bg));\n  color: var(--callout-ink);\n  line-height: var(--htmpres-body-leading, 1.45);\n  max-width: 900px;\n}"
  ],
  [
    ".code-card {\n  --htmpres-code-size: 0.84rem;\n  margin-top: 24px;\n  border: 1px solid var(--htmpres-code-border);\n  border-radius: var(--radius);\n  background: var(--code-card-bg);\n  color: var(--code-card-ink);\n  padding: 18px;\n  font-size: var(--htmpres-code-size);\n  line-height: 1.45;\n  overflow: hidden;\n}",
    ".code-card {\n  --htmpres-code-size: var(--foundation-default-htmpres-code-size, 0.84rem);\n  margin-top: 24px;\n  border: 1px solid var(--htmpres-code-border);\n  border-radius: var(--radius);\n  background: var(--code-card-bg);\n  color: var(--code-card-ink);\n  padding: var(--htmpres-card-padding, 18px);\n  font-size: var(--htmpres-code-size);\n  line-height: var(--htmpres-code-leading, 1.45);\n  overflow: hidden;\n}"
  ],
  [
    ".code-split .code-card {\n  margin-top: 0;\n  min-width: 0;\n  --htmpres-code-size: 0.78rem;\n}",
    ".code-split .code-card {\n  margin-top: 0;\n  min-width: 0;\n  --htmpres-code-size: var(--foundation-default-htmpres-code-size, 0.78rem);\n}"
  ],
  [
    ".transition-demo .code-card {\n  margin-top: 0;\n  min-width: 0;\n  --htmpres-code-size: 0.76rem;\n}",
    ".transition-demo .code-card {\n  margin-top: 0;\n  min-width: 0;\n  --htmpres-code-size: var(--foundation-default-htmpres-code-size, 0.76rem);\n}"
  ],
  [
    ".mixed-code {\n  min-width: 0;\n  --htmpres-code-size: 0.76rem;\n}",
    ".mixed-code {\n  min-width: 0;\n  --htmpres-code-size: var(--foundation-default-htmpres-code-size, 0.76rem);\n}"
  ],
  [
    ".slide {\n  position: absolute;\n  inset: 0;\n  display: none;\n  padding: 48px 58px;\n  background: var(--paper);\n  overflow: hidden;\n}",
    ".slide {\n  position: absolute;\n  inset: 0;\n  display: none;\n  padding: var(--htmpres-slide-padding, 48px 58px);\n  background: var(--paper);\n  overflow: hidden;\n}"
  ],
  [
    "p {\n  color: var(--muted);\n  line-height: 1.5;\n  font-size: var(--htmpres-body-size);\n}",
    "p {\n  color: var(--htmpres-prose-ink, var(--muted));\n  line-height: var(--htmpres-body-leading, 1.5);\n  font-size: var(--htmpres-body-size);\n}"
  ],
  [
    "ul {\n  margin: 0;\n  padding-left: 1.1rem;\n  color: var(--muted);\n  line-height: 1.45;\n}",
    "ul {\n  margin: 0;\n  padding-left: 1.1rem;\n  color: var(--htmpres-prose-ink, var(--muted));\n  line-height: var(--htmpres-body-leading, 1.45);\n}"
  ],
  [
    ".hero-subtitle {\n  margin-top: 22px;\n  max-width: 820px;\n  color: var(--hero-copy);\n  font-size: 1.25rem;\n  line-height: 1.45;\n}",
    ".hero-subtitle {\n  margin-top: var(--htmpres-within-gap, 22px);\n  max-width: 820px;\n  color: var(--htmpres-prose-ink, var(--hero-copy));\n  font-size: var(--htmpres-body-size, 1.25rem);\n  line-height: var(--htmpres-body-leading, 1.45);\n}"
  ],
  [
    ".lead {\n  margin: 22px 0 0;\n  max-width: 840px;\n  color: var(--hero-copy);\n  font-size: 1.16rem;\n  line-height: 1.45;\n}",
    ".lead {\n  margin: var(--htmpres-within-gap, 22px) 0 0;\n  max-width: 840px;\n  color: var(--htmpres-prose-ink, var(--hero-copy));\n  font-size: var(--htmpres-body-size, 1.16rem);\n  line-height: var(--htmpres-body-leading, 1.45);\n}"
  ],
  [
    ".two-col,\n.three-col {\n  display: grid;\n  gap: 18px;\n  margin-top: 28px;\n}",
    ".two-col,\n.three-col {\n  display: grid;\n  gap: var(--htmpres-column-gap, 18px);\n  margin-top: var(--htmpres-group-gap, 28px);\n}"
  ],
  [
    ".card strong {\n  display: block;\n  margin-bottom: 7px;\n  color: var(--ink);\n  font-size: 1rem;\n}",
    ".card strong {\n  display: block;\n  margin-bottom: var(--htmpres-within-gap, 7px);\n  color: var(--htmpres-prose-ink, var(--ink));\n  font-size: var(--htmpres-body-size, 1rem);\n}"
  ],
  [
    ".card p {\n  margin: 0;\n  font-size: 0.9rem;\n}",
    ".card p {\n  margin: 0;\n  font-size: var(--htmpres-body-size, 0.9rem);\n}"
  ],
  [
    ".code-card {\n  margin-top: 24px;\n  border: 1px solid var(--htmpres-code-border);\n  border-radius: var(--radius);\n  background: var(--code-card-bg);\n  color: var(--code-card-ink);\n  padding: 18px;\n  font-size: 0.84rem;\n  line-height: 1.45;\n  overflow: hidden;\n}",
    ".code-card {\n  margin-top: 24px;\n  border: 1px solid var(--htmpres-code-border);\n  border-radius: var(--radius);\n  background: var(--code-card-bg);\n  color: var(--code-card-ink);\n  padding: var(--htmpres-card-padding, 18px);\n  font-size: var(--htmpres-code-size, 0.84rem);\n  line-height: var(--htmpres-code-leading, 1.45);\n  overflow: hidden;\n}"
  ],
  [
    ".code-split .code-card {\n  margin-top: 0;\n  min-width: 0;\n  font-size: 0.78rem;\n}",
    ".code-split .code-card {\n  margin-top: 0;\n  min-width: 0;\n  font-size: var(--htmpres-code-size, 0.78rem);\n}"
  ],
  [
    ".transition-demo .code-card {\n  margin-top: 0;\n  min-width: 0;\n  font-size: 0.76rem;\n}",
    ".transition-demo .code-card {\n  margin-top: 0;\n  min-width: 0;\n  font-size: var(--htmpres-code-size, 0.76rem);\n}"
  ],
  [
    ".slide {\n    padding: 30px 22px var(--htmpres-mobile-slide-bottom-clearance);\n    overflow: auto;\n    overscroll-behavior: contain;\n    scroll-padding-bottom: var(--htmpres-mobile-slide-bottom-clearance);\n    -webkit-overflow-scrolling: touch;\n  }",
    ".slide {\n    padding: var(--htmpres-mobile-slide-padding, 30px 22px var(--htmpres-mobile-slide-bottom-clearance));\n    overflow: auto;\n    overscroll-behavior: contain;\n    scroll-padding-bottom: var(--htmpres-mobile-slide-bottom-clearance);\n    -webkit-overflow-scrolling: touch;\n  }"
  ],
  [
    "--htmpres-h2-size: 2.35rem;\n  --htmpres-hero-title-size: 3rem;\n  --htmpres-h3-size: 1.18rem;\n  --htmpres-body-size: 1rem;\n  --htmpres-small-size: 0.78rem;",
    "--htmpres-h2-size: var(--foundation-default-htmpres-h2-size, 2.35rem);\n  --htmpres-hero-title-size: var(--foundation-default-htmpres-hero-title-size, 3rem);\n  --htmpres-h3-size: var(--foundation-default-htmpres-h3-size, 1.18rem);\n  --htmpres-body-size: var(--foundation-default-htmpres-body-size, 1rem);\n  --htmpres-small-size: var(--foundation-default-htmpres-small-size, 0.78rem);"
  ],
  [
    "--radius: 8px;\n  --htmpres-viewport-height:",
    "--radius: var(--foundation-default-radius, 8px);\n  --htmpres-viewport-height:"
  ],
  [
    ".hero-title h2 {\n  font-size: var(--htmpres-hero-title-size);\n  max-width: 980px;\n  line-height: 1.03;\n  margin-top: 30px;\n}",
    ".hero-title h2 {\n  font-size: var(--htmpres-hero-title-size);\n  max-width: 980px;\n  line-height: var(--htmpres-heading-leading, 1.03);\n  margin-top: var(--htmpres-within-gap, 30px);\n}"
  ]
];
