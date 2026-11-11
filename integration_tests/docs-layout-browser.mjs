/** Read-only geometry assertions, run from CUA on the example or patterns page. */
export async function checkDocsLayout(tab) {
  const layout = await tab.playwright.evaluate(() => {
    const box = selector => {
      const node = document.querySelector(selector), rect = node.getBoundingClientRect(), css = getComputedStyle(node);
      return { width: rect.width, height: rect.height, x: rect.x, y: rect.y,
        font: Number(css.fontSize.replace('px', '')), line: Number(css.lineHeight.replace('px', '')), maxWidth: css.maxWidth };
    };
    return { viewport: innerWidth, overflow: document.documentElement.scrollWidth - innerWidth,
      main: box('main.content'), workspace: box('.example-workspace'), preview: box('.example-preview'),
      output: box('.example-output'), source: box('.example-source'), heading: box('#example-source-title'),
      pre: box('.example-source pre'), code: box('#example-markdown'),
      view: document.querySelector('#example-view').value };
  });
  const assert = (value, message) => { if (!value) throw new Error(`${message}: ${JSON.stringify(layout)}`); };
  assert(layout.overflow <= 1, 'No document horizontal overflow');
  assert(layout.heading.font <= 24 && layout.code.font >= 14 && layout.code.font <= 17,
    'Teaching controls keep readable compact typography');
  assert(Math.abs(layout.pre.font - layout.code.font) < 1, 'Code inherits the source font size');
  if (layout.viewport >= 1100) {
    assert(layout.main.width >= Math.min(1000, layout.viewport - 100), 'Interactive page escapes the prose width cap');
    assert(layout.preview.width >= 900, 'Preview has useful desktop width');
  }
  assert(layout.source.y >= layout.output.y + layout.output.height, 'Markdown sits below the slide');
  assert(Math.abs(layout.pre.x - layout.preview.x) <= 1 && Math.abs(layout.pre.width - layout.preview.width) <= 1,
    'Slide and Markdown boxes use the same horizontal position and width');
  const ratio = layout.preview.width / layout.preview.height;
  const expected = layout.view === 'presenter' ? 1280 / 930 : 16 / 9;
  assert(Math.abs(ratio - expected) < .02, 'Preview reserves the slide and optional notes without a blank strip');
  return layout;
}
