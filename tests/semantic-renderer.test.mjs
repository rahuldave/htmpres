import "./picture-slides.test.mjs";
import "./picture-renderer.test.mjs";
import "./talk-hooks.test.mjs";
import "./counter-policy.test.mjs";
// The serve/watch preview is part of the renderer CLI contract.
import "./preview.test.mjs";
import "./slide-boundaries.test.mjs";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import { extractNotes, lintSource, maskCodeAndMetadata, parseSlides, splitFrontMatter } from "../_extensions/htmpres/lib/source.mjs";
import { assignSlideIds, htmlToPlainText, inlineTitle, namespacePandocIds, unnamespacedPandocIds } from "../_extensions/htmpres/lib/render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "scripts/htmpres.ts");
const nodeRenderer = path.join(root, "scripts/qmd-to-html.mjs");
const scratch = mkdtempSync(path.join(tmpdir(), "htmpres-semantic-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

test('matched summary compilation and direct colors agree across Deno and Node renderers', () => {
  const dir = path.join(scratch, 'matching'); mkdirSync(dir);
  const file = path.join(dir, 'slides.qmd');
  const source = `---
pagetitle: "Matched parity"
deck:
  theme: nocturne
  color-mode: light
---
## Compute {#compute data-step-summary="match" data-match-colors="mean=#245c88" data-match-colors-dark="mean=#91c9f0"}

\`\`\`{.python .numberLines data-steps="1|2" data-step-indices="1|3" data-line-matches="1:total|2:mean"}
total = 12
mean = total / 3
\`\`\`

[The total.]{.fragment data-fragment-index="1" data-match="total" data-match-color="#765013" data-match-color-dark="#edc37d"}

[The mean.]{.fragment data-fragment-index="3" data-match="mean"}

::: {.equation-steps data-equation-steps="total|mean" data-step-indices="1|3"}
$$\\htmlClass{mean}{x} = \\htmlClass{total}{y}/3$$
:::
`;
  writeFileSync(file, source);
  runDeno(['render', file]);
  const deno = readFileSync(path.join(dir, 'index.html'), 'utf8');
  execFileSync('node', [nodeRenderer, file], { cwd: root });
  const node = readFileSync(path.join(dir, 'index.html'), 'utf8');
  const installed = path.join(dir, 'installed');
  runDeno(['workspace', 'init', installed]);
  writeFileSync(path.join(installed, 'slides.qmd'), source);
  execFileSync('quarto', ['run', path.join(installed, '_extensions/htmpres/htmpres.ts'), 'render', path.join(installed, 'slides.qmd')], { cwd: installed });
  const packaged = readFileSync(path.join(installed, 'index.html'), 'utf8');
  for (const html of [deno, node, packaged]) {
    assert.match(html, /data-match-groups="total\|mean"/);
    assert.match(html, /data-match-ranges="1-1:1\|2-2:2"/);
    assert.match(html, /--htmpres-match-mean: #245c88;/);
    assert.match(html, /--htmpres-match-total: #edc37d;/);
    assert.match(html, /--htmpres-match-2:/);
    assert.doesNotMatch(html, /--htmpres-match-3:/);
    assert.match(html, /html\[data-color-mode="dark"\] \.slide\[id="compute"\]/);
  }
  // Integration with horizontal-rule boundaries: settings on an empty heading
  // retain matching behavior without inventing a visible slide title.
  writeFileSync(file, source.replace('## Compute {', '---\n## {'));
  runDeno(['render', file]);
  const untitledDeno = readFileSync(path.join(dir, 'index.html'), 'utf8');
  execFileSync('node', [nodeRenderer, file], { cwd: root });
  const untitledNode = readFileSync(path.join(dir, 'index.html'), 'utf8');
  for (const html of [untitledDeno, untitledNode]) {
    const body = /<section class="slide[\s\S]*?<\/section>/.exec(html)[0];
    assert.match(body, /data-title="Slide 1"/);
    assert.match(body, /data-match-groups="total\|mean"/);
    assert.doesNotMatch(body, /<h2/);
  }
  for (const invalid of ['data-line-matches="1:unknown|2:mean"', 'data-line-matches="1:total|3:mean"']) {
    writeFileSync(file, source.replace('data-line-matches="1:total|2:mean"', invalid));
    const result = spawnSync('quarto', ['run', cli, 'render', file], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /Slide 1 \(Compute\)/);
  }
});

function runDeno(args, cwd = root) {
  return execFileSync("quarto", ["run", cli, ...args], { cwd, encoding: "utf8" });
}
function attrs(text) { return { keyValues: { id: /#([^ }]+)/.exec(text)?.[1] || "" } }; }
function snapshot(dir, prefix = "") {
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const key = prefix + entry.name;
    return entry.isDirectory() ? Object.entries(snapshot(path.join(dir, entry.name), key + "/")) : [[key, createHash("sha256").update(readFileSync(path.join(dir, entry.name))).digest("hex")]];
  }));
}

test("the shared source scanner exempts initial CRLF YAML, real fences and indented code, retaining diagnostic positions", () => {
  const text = ["---", "title: Example", "---", "", "## One", "", "````markdown", "---", "```", "---", "`````", "", "  ~~~text", "---", "  ~~~", "", "    ---", "<pre>", "---", "</pre>", "", "---", "## Two", "  ---"].join("\r\n");
  assert.deepEqual(lintSource(text, "deck.qmd").map(d => [d.line, d.column, d.code]), [[24, 3, "empty-slide"]]);
  const { yaml, body } = splitFrontMatter(text);
  assert.equal(yaml.trim(), "title: Example");
  assert.equal(parseSlides(body).length, 3);
  assert.equal(maskCodeAndMetadata(text).split("\n").length, 24);
});

test("code fences require a matching closing character, at least the opener length and no trailing language", () => {
  const text = "## One\n\n~~~text\n---\n```\n## Not a slide\n~~~ wrong\n---\n~~~~\n\n## Two\n";
  assert.deepEqual(parseSlides(text).map(s => s.title), ["One", "Two"]);
  assert.deepEqual(lintSource(text), []);
  assert.equal(parseSlides("## One\n```js\n## Not a slide\n").length, 1);
});

test("notes retain fenced examples of notes, including tilde fences and CRLF", () => {
  const markdown = "~~~markdown\r\n::: notes\r\nvisible example\r\n:::\r\n~~~\r\n::: notes\r\nActual cue $x$.\r\n:::\r\n";
  const result = extractNotes(markdown);
  assert.match(result.body, /visible example/);
  assert.equal(result.notes, "Actual cue $x$.");
});

test("generated IDs are unique without changing explicit IDs, including forward fallback collisions", () => {
  const slides = ["", "{#slide-1}", "", "{#custom}", "{#slide-3}"].map(attrText => ({ attrText }));
  assert.deepEqual(assignSlideIds(slides, attrs).map(s => s.id), ["slide-1-2", "slide-1", "slide-3-2", "custom", "slide-3"]);
  assert.throws(() => assignSlideIds([{ attrText: "{#same}" }, { attrText: "{#same}" }], attrs), /Duplicate slide id "same"/);
});

test("namespacing rewrites actual code, heading and footnote attributes while preserving literal code text and cross-slide targets", () => {
  const html = '<h3 id="more">More</h3><a href="#more">detail</a><span id="cb1-1"></span><a id="fnref1" href="#fn1">1</a><section id="footnotes"><li id="fn1"><a href="#fnref1">back</a></li></section><a href="#appendix-data">data</a><code>id="cb1" and href="#fn1"</code><script>const sample=\'<b id="cb1">\';</script>';
  const output = namespacePandocIds(html, "slide-2");
  assert.match(output, /<h3 id="slide-2-more">/);
  assert.match(output, /href="#slide-2-more"/);
  assert.match(output, /id="slide-2-cb1-1"/);
  assert.match(output, /id="slide-2-footnotes"/);
  assert.match(output, /href="#slide-2-fnref1"/);
  assert.match(output, /href="#appendix-data"/);
  assert.match(output, /<code>id="cb1" and href="#fn1"<\/code>/);
  assert.deepEqual(unnamespacedPandocIds(output), []);
  assert.equal(namespacePandocIds('<span data-id="fn1" data-href="#fn1">text</span>', "slide-1"), '<span data-id="fn1" data-href="#fn1">text</span>');
  assert.deepEqual(unnamespacedPandocIds('<a href="#fn1">1</a>'), ["fn1"]);
});

test("namespacing and verification ignore quoted attribute payloads and handle > inside quotes", () => {
  const literal = `<a href="#fn1" title="show id='fn1' and > href='#fn1'">demo</a>`;
  assert.equal(namespacePandocIds(literal, "slide-2"), literal, "quoted tooltip text is not a real ID target");
  assert.deepEqual(unnamespacedPandocIds(`<span title="show id='fn1' and > href='#cb1'">demo</span>`), []);
  const actual = `<a title="show > id='fn1'" href="#fn1">demo</a><li title="greater > value" id='fn1'>Note</li>`;
  assert.equal(namespacePandocIds(actual, "slide-2"), `<a title="show > id='fn1'" href="#slide-2-fn1">demo</a><li title="greater > value" id='slide-2-fn1'>Note</li>`);
  assert.deepEqual(unnamespacedPandocIds(namespacePandocIds(actual, "slide-2")), []);
});

test("inline title helpers keep markup for the slide and plain text for navigation", () => {
  const title = inlineTitle('<p>Why <em>structure</em> and <span class="key">terms</span> <strong>matter</strong> &amp; &#x41;</p>\n');
  assert.equal(title, 'Why <em>structure</em> and <span class="key">terms</span> <strong>matter</strong> &amp; &#x41;');
  assert.equal(htmlToPlainText(title), "Why structure and terms matter & A");
});

test("vendored KaTeX assets match their recorded SHA-256 hashes and every CSS font URL exists locally", () => {
  const dir = path.join(root, "_extensions/htmpres/vendor/katex");
  const provenance = JSON.parse(readFileSync(path.join(dir, "provenance.json"), "utf8"));
  assert.equal(provenance.version, "0.19.1");
  assert.match(provenance.integrity, /^sha512-/);
  for (const [file, hash] of Object.entries(provenance.files)) {
    assert.equal(createHash("sha256").update(readFileSync(path.join(dir, file))).digest("hex"), hash, file);
  }
  const css = readFileSync(path.join(dir, "katex.min.css"), "utf8");
  for (const match of css.matchAll(/url\(([^)]+)\)/g)) assert.ok(existsSync(path.join(dir, match[1].replace(/['"]/g, ""))), match[1]);
});

test("math bootstrap renders classed terms and accessible MathML, denies style/URL extensions, and can typeset added notes", () => {
  const katexContext = vm.createContext({ console });
  vm.runInContext(readFileSync(path.join(root, "_extensions/htmpres/vendor/katex/katex.min.js"), "utf8"), katexContext);
  const calls = [];
  function mathNode(tex, display = false) {
    return { dataset: {}, textContent: tex, html: "", matches: selector => selector === ".math", querySelectorAll: () => [], closest: () => null, classList: { contains: name => name === "display" && display } };
  }
  const first = mathNode("\\htmlClass{term-a}{x} + \\frac{1}{2}", true);
  const document = { querySelectorAll: () => [first] };
  const window = { katex: { render(tex, node, options) {
    calls.push(options);
    node.html = katexContext.katex.renderToString(tex, options);
  } } };
  vm.runInNewContext(readFileSync(path.join(root, "_extensions/htmpres/runtime/htmpres-math.js"), "utf8"), { window, document });
  assert.equal(calls.length, 1);
  assert.match(first.html, /class="enclosing term-a"/);
  assert.match(first.html, /<math /);
  assert.match(first.html, /application\/x-tex/);
  assert.equal(calls[0].trust({ command: "\\htmlClass", class: "term-a key" }), true);
  for (const command of ["\\htmlStyle", "\\href", "\\url", "\\htmlData", "\\htmlId", "\\includegraphics"]) assert.equal(calls[0].trust({ command, class: "term-a" }), false);
  assert.equal(calls[0].trust({ command: "\\htmlClass", class: 'term-a" onclick="evil' }), false);
  const note = mathNode("x^2");
  window.htmpresRenderMath(note);
  assert.match(note.html, /katex/);
  window.htmpresRenderMath(note);
  assert.equal(calls.length, 2, "rendering is idempotent");
  const blocked = mathNode("\\htmlStyle{color:red}{x} + \\href{https://example.com}{x}");
  window.htmpresRenderMath(blocked);
  assert.doesNotMatch(blocked.html, /style="color:red"|href="https:\/\/example.com"/);
});

const specimen = `---
pagetitle: Semantic rendering
deck:
  theme: nocturne
---

## Why *structure* and [terms]{.key} **matter** {#main}

Inline $x^2$ and a footnote.[^1]

$$\\htmlClass{term-a}{x} + \\frac{1}{2} = 2$$

[^1]: First slide footnote.

### Details

[Local detail](#details) and [extra data](#appendix-data).

\`\`\`{.python .numberLines}
x = 1
# id="cb1" and href="#fn1" are literal code.
\`\`\`

::: notes
Presenter cue $x^2$ and a note footnote.[^n]

[^n]: Note footnote.
:::

## More **data** {#appendix-data data-kind="appendix"}

Second footnote.[^1]

[^1]: Second slide footnote.

### Details

[Back](#main).

\`\`\`{.python .numberLines}
x = 2
\`\`\`
`;

test("Deno, Node and packaged extension preserve semantic rendering, offline math and unique references", () => {
  const dir = path.join(scratch, "deck");
  mkdirSync(dir);
  const source = path.join(dir, "index.qmd");
  writeFileSync(source, specimen.replace(/\n/g, "\r\n"));
  runDeno(["render", source]);
  const deno = readFileSync(path.join(dir, "index.html"), "utf8");
  const presenter = readFileSync(path.join(dir, "presenter.html"), "utf8");
  assert.match(deno, /<h2>Why <em>structure<\/em> and <span class="key">terms<\/span> <strong>matter<\/strong><\/h2>/);
  assert.match(deno, /data-title="Why structure and terms matter"/);
  assert.match(deno, /<section[^>]*id="main"/);
  assert.match(deno, /<section[^>]*id="appendix-data"[^>]*data-kind="appendix"|<section[^>]*data-kind="appendix"[^>]*id="appendix-data"/);
  assert.match(deno, /id="slide-1-fn1"/);
  assert.match(deno, /id="slide-2-fn1"/);
  assert.match(deno, /id="slide-1-details"/);
  assert.match(deno, /href="#slide-1-details"/);
  assert.match(deno, /href="#appendix-data"/);
  assert.match(deno, /class="math display">\\htmlClass\{term-a\}\{x\}/);
  assert.match(deno, /href="assets\/htmpres-math\/katex.min.css"/);
  assert.match(deno, /src="assets\/htmpres-math\/katex.min.js"/);
  assert.ok(deno.indexOf("installHtmpresMath") < deno.indexOf("const slides ="));
  assert.doesNotMatch(deno, /Presenter cue/);
  assert.match(presenter, /notes-1-fn1/);
  assert.match(presenter, /Presenter cue/);
  assert.deepEqual(unnamespacedPandocIds(deno), []);
  const slides = html => html.match(/<section\b[^>]*class="slide[\s\S]*?(?=\n          <\/div>)/)?.[0];
  const denoMath = snapshot(path.join(dir, "assets/htmpres-math"));
  rmSync(path.join(dir, "assets/htmpres-math"), { recursive: true });
  execFileSync(process.execPath, [nodeRenderer, source], { cwd: root });
  const node = readFileSync(path.join(dir, "index.html"), "utf8");
  assert.equal(slides(node), slides(deno));
  assert.deepEqual(snapshot(path.join(dir, "assets/htmpres-math")), denoMath);

  const workspace = path.join(scratch, "workspace");
  runDeno(["workspace", "init", workspace]);
  const packedCli = path.join(workspace, "_extensions/htmpres/htmpres.ts");
  const packedSource = path.join(workspace, "decks", "test", "index.qmd");
  mkdirSync(path.dirname(packedSource), { recursive: true });
  writeFileSync(packedSource, specimen);
  execFileSync("quarto", ["run", packedCli, "render", packedSource], { cwd: workspace });
  const packed = readFileSync(path.join(path.dirname(packedSource), "index.html"), "utf8");
  assert.equal(slides(packed), slides(deno));
  assert.deepEqual(snapshot(path.join(path.dirname(packedSource), "assets/htmpres-math")), denoMath);
  // Both verifier entry points share the rule, even when the deck HTML was
  // already generated before a manual source edit introduced an empty trailing slide.
  writeFileSync(packedSource, specimen + "\n---\n");
  for (const [command, args] of [["quarto", ["run", packedCli, "verify"]], [process.execPath, [path.join(root, "scripts/verify-roundtrip.mjs")]]]) {
    const result = spawnSync(command, args, { cwd: workspace, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /empty-slide/);
  }
});

test("numbered and quoted titles remain inline headings with exact plain navigation labels in both engines", () => {
  const dir = path.join(scratch, "inline-block-like-titles");
  mkdirSync(dir);
  const file = path.join(dir, "slides.qmd");
  writeFileSync(file, "## 1. Introduction\n\nA point.\n\n## > The *key* result\n\nAnother point.\n");
  for (const [command, args] of [["quarto", ["run", cli, "render"]], [process.execPath, [nodeRenderer]]]) {
    execFileSync(command, [...args, file], { cwd: root });
    const audience = readFileSync(path.join(dir, "index.html"), "utf8");
    assert.match(audience, /<h2>1\. Introduction<\/h2>/);
    assert.match(audience, /<h2>&gt; The <em>key<\/em> result<\/h2>/);
    assert.match(audience, /data-title="1\. Introduction"/);
    assert.match(audience, /data-title="&gt; The key result"/);
  }
});

test("linked titles keep authored slide targets after synthetic heading removal, including titles with footnotes", () => {
  const dir = path.join(scratch, "linked-title");
  mkdirSync(dir);
  const file = path.join(dir, "slides.qmd");
  writeFileSync(file, "## [Appendix data](#appendix-data) {#main}\n\nA point.\n\n## [More data](#appendix-data)^[Title cue.] {#more}\n\nAnother point.\n\n## Data {#appendix-data data-kind=\"appendix\"}\n\nThe data.\n");
  for (const [command, args] of [["quarto", ["run", cli, "render"]], [process.execPath, [nodeRenderer]]]) {
    execFileSync(command, [...args, file], { cwd: root });
    const audience = readFileSync(path.join(dir, "index.html"), "utf8");
    assert.match(audience, /<h2><a href="#appendix-data">Appendix data<\/a><\/h2>/);
    assert.match(audience, /<h2><a href="#appendix-data">More data<\/a><a href="#slide-2-title-fn1"/);
    assert.match(audience, /id="slide-2-title-fn1"/);
    assert.match(audience, /data-title="Appendix data"/);
    assert.match(audience, /data-title="More data"/);
    assert.doesNotMatch(audience, /href="#slide-1-title-appendix-data"/);
  }
});

test("title footnotes stay outside headings and have unique references across titles, bodies and notes in both engines", () => {
  const workspace = path.join(scratch, "title-footnotes");
  const deck = path.join(workspace, "decks", "footnotes");
  mkdirSync(deck, { recursive: true });
  const file = path.join(deck, "index.qmd");
  const text = ["One", "Two"].map((name, index) => `## ${name} *claim*^[Title note ${index + 1}.] {#title-${index + 1}}\n\nBody note.[^1]\n\n[^1]: Body note ${index + 1}.\n\n::: notes\nPresenter cue.[^1]\n\n[^1]: Presenter note ${index + 1}.\n:::\n`).join("\n");
  writeFileSync(file, text);
  let denoSlides;
  for (const [engine, command, args] of [["deno", "quarto", ["run", cli, "render"]], ["node", process.execPath, [nodeRenderer]]]) {
    execFileSync(command, [...args, file], { cwd: workspace });
    const audience = readFileSync(path.join(deck, "index.html"), "utf8");
    const presenter = readFileSync(path.join(deck, "presenter.html"), "utf8");
    const headings = [...audience.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(match => match[1]);
    assert.equal(headings.length, 2);
    for (const heading of headings) {
      assert.doesNotMatch(heading, /<p>|<section|Title note/);
      assert.match(heading, /class="footnote-ref"/);
    }
    assert.match(audience, /data-title="One claim"/);
    assert.match(audience, /data-title="Two claim"/);
    assert.match(audience, /id="slide-1-title-fn1"/);
    assert.match(audience, /href="#slide-1-title-fn1"/);
    assert.match(audience, /id="slide-2-title-fn1"/);
    assert.match(audience, /id="slide-1-fn1"/);
    assert.match(audience, /id="slide-2-fn1"/);
    const notes = JSON.parse(presenter.match(/<script id="deckNotes"[^>]*>([\s\S]*?)<\/script>/)[1]);
    assert.match(notes[0], /id="notes-1-fn1"/);
    assert.match(notes[1], /id="notes-2-fn1"/);
    const slideHtml = audience.slice(audience.indexOf('<section class="slide'), audience.indexOf('          <div class="scroll-cue"') > 0 ? audience.indexOf('          <div class="scroll-cue"') : audience.indexOf('          </div>'));
    const ids = [...(slideHtml + notes.join("\n")).matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, "title/body/note namespaces do not collide");
    assert.deepEqual(unnamespacedPandocIds(audience), []);
    // Each writer's verifier must accept the generated title footnotes too.
    execFileSync(engine === "deno" ? "quarto" : process.execPath, engine === "deno" ? ["run", cli, "verify"] : [path.join(root, "scripts/verify-roundtrip.mjs")], { cwd: workspace });
    const slideSections = audience.match(/<section class="slide[\s\S]*?(?=\n          <\/div>)/)?.[0];
    if (engine === "deno") denoSlides = slideSections;
    else assert.equal(slideSections, denoSlides);
  }
});

test("both renderer entry points reject duplicate slide IDs and empty slides before writing output", () => {
  for (const [label, source, pattern] of [
    ["duplicate", "## A {#same}\n\n## B {#same}\n", /Duplicate slide id/],
    ["break", "## A\n\n---\n\n---\n## B\n", /empty-slide/],
  ]) {
    for (const [engine, command, args] of [["deno", "quarto", ["run", cli, "render"]], ["node", process.execPath, [nodeRenderer]]]) {
      const dir = path.join(scratch, `${label}-${engine}`);
      mkdirSync(dir);
      const file = path.join(dir, "index.qmd");
      writeFileSync(file, source);
      const result = spawnSync(command, [...args, file], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, pattern);
      assert.equal(existsSync(path.join(dir, "index.html")), false);
      assert.equal(existsSync(path.join(dir, "assets")), false);
    }
  }
});

test("explicit verify checks slides.qmd outside default discovery, including multiple files and missing or broken outputs", () => {
  const workspace = path.join(scratch, "explicit-verify");
  const first = path.join(workspace, "talk");
  const second = path.join(workspace, "other-talk");
  mkdirSync(first, { recursive: true });
  mkdirSync(second, { recursive: true });
  const files = [first, second].map(dir => path.join(dir, "slides.qmd"));
  const source = "## A talk\n\nA point.\n\n::: notes\nA cue.\n:::\n";
  for (const file of files) writeFileSync(file, source);
  for (const [engine, command, prefix] of [["deno", "quarto", ["run", cli]], ["node", process.execPath, [nodeRenderer]]]) {
    execFileSync(command, [...prefix, ...(engine === "deno" ? ["render"] : []), ...files], { cwd: workspace });
    const verifyPrefix = engine === "deno" ? ["run", cli, "verify"] : [path.join(root, "scripts/verify-roundtrip.mjs")];
    const verify = (selected = files) => spawnSync(command, [...verifyPrefix, ...selected], { cwd: workspace, encoding: "utf8" });
    let result = verify();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /talk: qmd-only slides 1\/1\/1/);
    assert.match(result.stdout, /other-talk: qmd-only slides 1\/1\/1/);
    result = verify([path.relative(workspace, files[0])]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /talk: qmd-only slides 1\/1\/1/);
    writeFileSync(files[0], source + "\n---\n");
    result = verify();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /empty-slide/);
    writeFileSync(files[0], source);
    const presenterFile = path.join(first, "presenter.html");
    const presenter = readFileSync(presenterFile, "utf8");
    rmSync(presenterFile);
    result = verify();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing generated file/);
    assert.match(result.stderr, /talk[/\\]presenter.html/);
    writeFileSync(presenterFile, presenter);
    const audienceFile = path.join(first, "index.html");
    const audience = readFileSync(audienceFile, "utf8");
    writeFileSync(audienceFile, "<!doctype html><p>Broken output</p>");
    result = verify();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /audienceSlides 0 did not match expected 1/);
    writeFileSync(audienceFile, audience);
    result = verify([path.join(workspace, "missing-slides.qmd")]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing.*source/i);
    assert.match(result.stderr, /missing-slides.qmd/);
  }
});

test("lint CLI reports stable JSON and failure status in both entry points", () => {
  const valid = path.join(scratch, "valid.qmd");
  const invalid = path.join(scratch, "invalid.qmd");
  writeFileSync(valid, "---\r\npagetitle: Example\r\n---\r\n## A\r\n~~~md\r\n---\r\n~~~\r\n");
  writeFileSync(invalid, "## A\r\n\r\n---\r\n---\r\n## B\r\n");
  const reports = [];
  for (const [command, args] of [["quarto", ["run", cli]], [process.execPath, [nodeRenderer]]]) {
    let result = spawnSync(command, [...args, "lint", valid, "--json"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { version: 1, ok: true, diagnostics: [] });
    result = spawnSync(command, [...args, "lint", valid, invalid, "--json"], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 1);
    reports.push(JSON.parse(result.stdout));
    assert.equal(reports.at(-1).diagnostics[0].file, invalid);
    assert.equal(reports.at(-1).diagnostics[0].line, 3);
    assert.equal(reports.at(-1).diagnostics[0].column, 1);
    assert.equal(reports.at(-1).diagnostics[0].severity, "error");
  }
  assert.deepEqual(reports[0], reports[1]);
});


test("mixed boundaries preserve three slides, untitled labels, notes and appendix settings in all engines", () => {
  const specimen = readFileSync(path.join(root, "decks/slide-breaks/index.qmd"), "utf8").replace(/\n/g, "\r\n");
  const workspace = path.join(scratch, "mixed-workspace");
  runDeno(["workspace", "init", workspace]);
  const packedCli = path.join(workspace, "_extensions/htmpres/htmpres.ts");
  const file = path.join(workspace, "slides.qmd");
  writeFileSync(file, specimen);
  let baseline;
  for (const [command, args, verify] of [
    ["quarto", ["run", cli, "render"], ["run", cli, "verify"]],
    [process.execPath, [nodeRenderer], [path.join(root, "scripts/verify-roundtrip.mjs")]],
    ["quarto", ["run", packedCli, "render"], ["run", packedCli, "verify"]],
  ]) {
    execFileSync(command, [...args, file], { cwd: workspace });
    execFileSync(command, [...verify, file], { cwd: workspace });
    const audience = readFileSync(path.join(workspace, "index.html"), "utf8");
    const presenter = readFileSync(path.join(workspace, "presenter.html"), "utf8");
    const sections = (audience.match(/<section class="slide[\s\S]*?<\/section>/g) || []).join("\n");
    assert.ok(sections);
    assert.equal((sections.match(/<section class="slide/g) || []).length, 3);
    assert.equal((sections.match(/<h2/g) || []).length, 1, "untitled slides have no rendered heading");
    assert.match(sections, /data-title="Slide 1"/);
    assert.match(sections, /data-title="Backup data"/);
    assert.match(sections, /id="appendix-data"/);
    assert.match(sections, /data-kind="appendix"/);
    assert.doesNotMatch(audience, /First cue|Second slide cue|Third slide cue/);
    const notes = JSON.parse(/<script[^>]*id="deckNotes"[^>]*>([\s\S]*?)<\/script>/.exec(presenter)[1]);
    assert.equal(notes.length, 3);
    assert.match(notes[0], /First cue[\s\S]*<hr \/>[\s\S]*Still the first/);
    assert.match(notes[1], /Second slide cue/);
    assert.match(notes[2], /Third slide cue/);
    if (baseline) assert.equal(sections, baseline); else baseline = sections;
  }
});

test("slide list/show/insert/replace share mixed boundaries and preserve source slices", () => {
  const dir = path.join(scratch, "mixed-edit");
  mkdirSync(dir);
  const file = path.join(dir, "slides.qmd");
  const source = readFileSync(path.join(root, "decks/slide-breaks/index.qmd"), "utf8").replace(/\n/g, "\r\n");
  writeFileSync(file, source);
  const list = () => JSON.parse(runDeno(["slide", "list", file, "--json"]));
  let report = list();
  assert.equal(report.slideCount, 3);
  assert.deepEqual(report.slides.map(s => [s.title, s.dataTitle]), [["", "Slide 1"], ["A heading starts slide two", "A heading starts slide two"], ["", "Backup data"]]);
  const third = JSON.parse(runDeno(["slide", "show", file, "3", "--json"])).slide;
  assert.match(third.source, /^---\r\n\r\n## \{#appendix-data/);
  const replacement = path.join(dir, "replacement.qmd");
  writeFileSync(replacement, "Replacement without heading.\n");
  runDeno(["slide", "replace", file, "2", "--from", replacement]);
  assert.equal(list().slideCount, 3);
  const lastAfterReplace = JSON.parse(runDeno(["slide", "show", file, "3", "--json"])).slide.source;
  assert.equal(lastAfterReplace, third.source);
  runDeno(["slide", "insert", file, "--before", "3", "--kind", "text", "--title", "Inserted"]);
  report = list();
  assert.equal(report.slideCount, 4);
  assert.equal(report.slides[2].title, "Inserted");
  assert.equal(report.slides[3].attrs.id, "appendix-data");
  runDeno(["render", file]);
  runDeno(["verify", file]);
});


test("inserting before an implicit opening slide keeps the original body on its own slide", () => {
  const dir = path.join(scratch, "implicit-edit");
  mkdirSync(dir);
  const file = path.join(dir, "slides.qmd");
  writeFileSync(file, "---\npagetitle: Test\n---\n\nOriginal opening.\n\n## Second\nSecond body.");
  runDeno(["slide", "insert", file, "--before", "1", "--kind", "text", "--title", "Inserted"]);
  const report = JSON.parse(runDeno(["slide", "list", file, "--json"]));
  assert.equal(report.slideCount, 3);
  assert.deepEqual(report.slides.map(s => s.title), ["Inserted", "", "Second"]);
  assert.match(JSON.parse(runDeno(["slide", "show", file, "2", "--json"])).slide.source, /^---\n+Original opening/);
});

test('counter policy is identical in both engines and verification rejects stale visibility', () => {
  const base = value => `---\npagetitle: Counter policy\n${value===undefined?'':`deck:\n  counter: ${value}\n`}---\n## One\nMain.\n## Two\nMain.\n## Data {data-kind="appendix"}\nBackup.\n## Detail\nMore.\n`;
  for(const value of [undefined,'true','false','presenter']) {
    const dir=path.join(scratch,`counter-${value}`);mkdirSync(dir);
    const file=path.join(dir,'slides.qmd');writeFileSync(file,base(value));
    const check=()=>{
      for(const [view,mode] of [['index','audience'],['presenter','presenter']]) {
        const html=readFileSync(path.join(dir,`${view}.html`),'utf8');
        assert.match(html,new RegExp(`data-counter="${value||'true'}"`));
        const tag=html.match(/<div class="counter" id="counter"[^>]*>/)[0];
        assert.equal(tag.includes(' hidden'),value==='false'||(value==='presenter'&&mode==='audience'));
      }
    };
    runDeno(['render',file]);check();runDeno(['verify',file]);
    execFileSync('node',[nodeRenderer,file],{cwd:root});check();
    execFileSync('node',[path.join(root,'scripts/verify-roundtrip.mjs'),file],{cwd:root});
    if(value==='true') {
      writeFileSync(file,base('presenter'));
      for(const [cmd,args] of [['quarto',['run',cli,'verify',file]],['node',[path.join(root,'scripts/verify-roundtrip.mjs'),file]]]) {
        const result=spawnSync(cmd,args,{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/Counter (policy|visibility)/);
      }
    }
    if(value==='presenter') {
      const installed=path.join(dir,'installed');runDeno(['workspace','init',installed]);writeFileSync(path.join(installed,'slides.qmd'),base(value));
      execFileSync('quarto',['run',path.join(installed,'_extensions/htmpres/htmpres.ts'),'render',path.join(installed,'slides.qmd')],{cwd:installed});
      assert.match(readFileSync(path.join(installed,'index.html'),'utf8'),/id="counter" hidden/);
      assert.doesNotMatch(readFileSync(path.join(installed,'presenter.html'),'utf8'),/id="counter" hidden/);
    }
  }
  const file=path.join(scratch,'invalid-counter.qmd');writeFileSync(file,base('audience'));
  for(const [cmd,args] of [['quarto',['run',cli,'lint',file,'--json']],['node',[nodeRenderer,'lint',file,'--json']]]) {
    const result=spawnSync(cmd,args,{cwd:root,encoding:'utf8'});assert.equal(result.status,1);const report=JSON.parse(result.stdout);assert.equal(report.diagnostics[0].code,'deck-counter');assert.equal(report.diagnostics[0].line,4);
  }
});

test('statement, credit lane and quote source agree in actual Deno and Node output', () => {
  const dir=path.join(scratch,'talk-hooks');mkdirSync(dir);
  const file=path.join(dir,'slides.qmd');writeFileSync(file,readFileSync(path.join(root,'decks/authoring-hooks/index.qmd'),'utf8'));
  const sections=html=>html.match(/<section\b[^>]*class="[^"]*\bslide\b[^>]*>[\s\S]*?<\/section>/g);
  runDeno(['render',file]);const deno=readFileSync(path.join(dir,'index.html'),'utf8');
  execFileSync('node',[nodeRenderer,file],{cwd:root});const node=readFileSync(path.join(dir,'index.html'),'utf8');
  assert.deepEqual(sections(node),sections(deno));
  for(const html of [node,deno]) {
    assert.match(html,/class="slide-credits" aria-label="Picture credits"/);
    assert.match(html,/<div class="statement">/);
    assert.match(html,/<blockquote>[\s\S]*class="source"/);
    assert.match(html,/id="counter" hidden/);
    assert.match(html, /@media \(min-width: 981px\) \{\s*body\.presenter-mode \.slides \{\s*width: 1280px;\s*height: 720px;\s*max-height: none;\s*transform: scale\(var\(--deck-scale, 1\)\);\s*transform-origin: top left;/);
    assert.match(html, /justify-content: safe center;/);
  }
});
