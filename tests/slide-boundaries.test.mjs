import assert from "node:assert/strict";
import test from "node:test";
import { extractNotes, lintSource, parseSlides, splitFrontMatter } from "../_extensions/htmpres/lib/source.mjs";

const body = `---

Opening without a title.

::: notes
First cue.

---

Second paragraph of the same cue.
:::

## Second

Second body.

---

## Third {#third}

Third body.
`;

test("mixed separators produce exactly three slides, preserving notes and titles", () => {
  const text = "---\npagetitle: Mixed\n---\n\n" + body;
  const slides = parseSlides(splitFrontMatter(text).body);
  assert.deepEqual(slides.map(s => [s.title, s.attrText]), [["", ""], ["Second", ""], ["Third", "{#third}"]]);
  assert.match(slides[0].body, /Opening without a title/);
  assert.match(extractNotes(slides[0].body).notes, /First cue\.\n\n---\n\nSecond paragraph/);
  assert.deepEqual(lintSource(text), []);
});

test("empty attributed headings have no title and leading content forms an implicit slide", () => {
  assert.deepEqual(parseSlides('## {#appendix-data data-kind="appendix"}\nData.').map(s => [s.title, s.attrText]), [["", '{#appendix-data data-kind="appendix"}']]);
  assert.deepEqual(parseSlides('Opening.\n\n##\nBody.\n---\n## Named\nEnd.').map(s => s.title), ["", "", "Named"]);
  assert.equal(parseSlides('---\n## {#data}\nData.').length, 1);
  assert.equal(parseSlides('## Title\nBody.\n---\nTail.').length, 2);
  assert.equal(parseSlides('---\nBody.\n## Later\nLater.').length, 2);
});

test("divs, nested notes, comments and fenced examples cannot introduce boundaries", () => {
  const text = '## Start\n:::: {.panel}\n---\n## Local heading\n::: {.nested}\n---\n:::\n::::\n<!--\n---\n## Comment heading\n-->\n~~~md\n---\n## Example heading\n~~~\n---\nEnd.';
  const slides = parseSlides(text);
  assert.equal(slides.length, 2);
  assert.match(slides[0].body, /## Local heading/);
  assert.deepEqual(lintSource(text), []);
  const notes = extractNotes('::: notes\nFirst.\n::: {.aside}\n---\n## Local\n:::\nLast.\n:::\nVisible.');
  assert.equal(notes.body, 'Visible.');
  assert.match(notes.notes, /Last\./);
  assert.match(notes.notes, /::: \{\.aside\}\n---/);
});

test("empty-slide errors retain original CRLF coordinates; a leading break is not an empty slide", () => {
  const text = '\ufeff---\r\npagetitle: Test\r\n---\r\n\r\n---\r\nBody.\r\n  ---\r\n\r\n---\r\n## Next\r\nBody.\r\n---\r\n';
  assert.deepEqual(lintSource(text, 'slides.qmd').map(d => [d.file, d.line, d.column, d.code, d.severity]), [
    ['slides.qmd', 7, 3, 'empty-slide', 'error'], ['slides.qmd', 12, 1, 'empty-slide', 'error'],
  ]);
  assert.deepEqual(lintSource('---\npagetitle: Test\n---\n\n---\n## Named\nBody.'), []);
  assert.deepEqual(lintSource('## Named\nBody.\n---\nTail.'), []);
});


test("leading comments add no slide and comments starting after prose protect boundaries", () => {
  assert.deepEqual(parseSlides('<!-- author note -->\n\n## First\nText.').map(s => s.title), ['First']);
  assert.equal(parseSlides('<!-- author note -->').length, 0);
  const mixed = parseSlides('<!-- note -->Opening body.\n\n## Next\nNext body.');
  assert.equal(mixed.length, 2);
  assert.match(mixed[0].body, /Opening body/);
  const multiline = parseSlides('<!-- note\n-->Opening body.\n## Next\nNext body.');
  assert.equal(multiline.length, 2);
  assert.match(multiline[0].body, /^<!-- note\n-->Opening body/);
  assert.equal(parseSlides('## First\n<!--\n## Hidden -->Visible body.\n\n## Second\nSecond body.').length, 2);
  assert.equal(parseSlides('## First\nText <!--\n---\n## Hidden\n-->\n---\nNext.').length, 2);
  assert.equal(parseSlides('## First\nText <!--\n--> <!--\n---\n## Hidden\n-->\n---\nNext.').length, 2);
  assert.equal(parseSlides('## First\nAn inline `<!--` example.\n---\nNext.').length, 2);
});
