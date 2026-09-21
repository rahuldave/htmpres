const root = Deno.cwd();
const powerpointRoot = join(root, "_extensions", "htmpres", "powerpoint");
const templateRoot = join(powerpointRoot, "templates");
const previewRoot = join(powerpointRoot, "previews");
const assetRoot = join(powerpointRoot, "assets");

const families = ["executive-funding", "executive", "technical"];
const layouts = [
  [1, "title-slide"],
  [2, "title-and-content"],
  [3, "section-header"],
  [4, "two-content"],
  [5, "comparison"],
  [8, "content-with-caption"],
  [7, "blank"],
] as const;

Deno.mkdirSync(previewRoot, { recursive: true });

for (const family of families) {
  await buildFamilyPreviews(family);
}

async function buildFamilyPreviews(family: string) {
  const work = await Deno.makeTempDir({
    prefix: `htmpres-${family}-previews-`,
  });
  const qmdPath = join(work, "layouts.qmd");
  const draftPath = join(work, "layouts.draft.pptx");
  const packageDir = join(work, "package");
  const outputPath = join(work, `${family}-layouts.pptx`);
  const renderedDir = join(work, "rendered");
  const familyPreviewDir = join(previewRoot, family);
  const templatePath = join(
    templateRoot,
    `univ-ai-p32-${family}-reference.pptx`,
  );

  Deno.mkdirSync(familyPreviewDir, { recursive: true });
  Deno.mkdirSync(renderedDir, { recursive: true });
  Deno.writeTextFileSync(qmdPath, previewSource(family));

  const render = await run([
    "quarto",
    "pandoc",
    qmdPath,
    "--from=markdown+fenced_divs+native_divs+native_spans+pipe_tables",
    "--to=pptx",
    "--slide-level=2",
    `--reference-doc=${templatePath}`,
    `--output=${draftPath}`,
  ], root);
  if (render.code !== 0) {
    throw new Error(
      `Could not build ${family} layout sampler: ${render.stderr}`,
    );
  }

  const unpack = await run(["unzip", "-q", draftPath, "-d", packageDir]);
  if (unpack.code !== 0) {
    throw new Error(
      `Could not unpack ${family} layout sampler: ${unpack.stderr}`,
    );
  }

  layouts.forEach(([layoutNumber], index) => {
    const slideNumber = index + 1;
    const relsPath = join(
      packageDir,
      "ppt",
      "slides",
      "_rels",
      `slide${slideNumber}.xml.rels`,
    );
    const slidePath = join(
      packageDir,
      "ppt",
      "slides",
      `slide${slideNumber}.xml`,
    );
    const rels = Deno.readTextFileSync(relsPath).replace(
      /Target="\.\.\/slideLayouts\/slideLayout\d+\.xml"/,
      `Target="../slideLayouts/slideLayout${layoutNumber}.xml"`,
    );
    let slide = Deno.readTextFileSync(slidePath);
    if (layoutNumber === 1 || layoutNumber === 3) {
      slide = forceTextColor(slide, "FFFFFF");
    }
    if (layoutNumber === 7) slide = removeSlideObjects(slide);
    Deno.writeTextFileSync(relsPath, rels);
    Deno.writeTextFileSync(slidePath, slide);
  });

  const mediaDir = join(packageDir, "ppt", "media");
  Deno.mkdirSync(mediaDir, { recursive: true });
  for (
    const [directory, name] of [
      ["logos", "univ-ai-logo.png"],
      ["logos", "point32health-logo.png"],
      ["backgrounds", "univ-ai-section-background.png"],
    ]
  ) {
    Deno.copyFileSync(join(assetRoot, directory, name), join(mediaDir, name));
  }
  ensurePngContentType(packageDir);

  const zip = await run(["zip", "-q", "-r", outputPath, "."], packageDir);
  if (zip.code !== 0) {
    throw new Error(
      `Could not package ${family} layout sampler: ${zip.stderr}`,
    );
  }
  const office = await run([
    "soffice",
    "--headless",
    "--convert-to",
    "pdf",
    "--outdir",
    renderedDir,
    outputPath,
  ]);
  if (office.code !== 0) {
    throw new Error(
      `Could not render ${family} layout sampler: ${office.stderr}`,
    );
  }
  const pdfPath = join(renderedDir, `${family}-layouts.pdf`);
  const raster = await run([
    "pdftoppm",
    "-png",
    "-r",
    "120",
    pdfPath,
    join(renderedDir, "layout"),
  ]);
  if (raster.code !== 0) {
    throw new Error(
      `Could not rasterize ${family} layout sampler: ${raster.stderr}`,
    );
  }

  for (let index = 0; index < layouts.length; index += 1) {
    const source = join(renderedDir, `layout-${index + 1}.png`);
    const destination = join(
      familyPreviewDir,
      `${String(index + 1).padStart(2, "0")}-${layouts[index][1]}.png`,
    );
    Deno.copyFileSync(source, destination);
  }

  console.log(
    `Built ${
      relativePath(root, familyPreviewDir)
    } (${layouts.length} layout previews)`,
  );
  await Deno.remove(work, { recursive: true });
}

function previewSource(family: string) {
  return `---
slide-level: 2
aspectratio: 169
---

## Title Slide

${family} reference template

## Title and Content

- Editable text
- Editable list
- Master branding

## Section Header

Section label

## Two Content

:::: {.columns}
::: {.column width="50%"}
### Left

Editable content
:::
::: {.column width="50%"}
### Right

Editable content
:::
::::

## Comparison

:::: {.columns}
::: {.column width="50%"}
### Current

Editable comparison
:::
::: {.column width="50%"}
### Future

Editable comparison
:::
::::

## Content with Caption

Editable explanation and image-caption region.

## Blank
`;
}

function forceTextColor(xml: string, color: string) {
  const fill = `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;
  return xml
    .replace(/<a:rPr\b([^>]*)\/>/g, `<a:rPr$1>${fill}</a:rPr>`)
    .replace(/<a:rPr\b([^>]*)>([\s\S]*?)<\/a:rPr>/g, (_raw, attrs, inner) => {
      const cleaned = String(inner).replace(
        /<a:solidFill>[\s\S]*?<\/a:solidFill>/g,
        "",
      );
      return `<a:rPr${attrs}>${fill}${cleaned}</a:rPr>`;
    })
    .replace(
      /<a:endParaRPr\b([^>]*)\/>/g,
      `<a:endParaRPr$1>${fill}</a:endParaRPr>`,
    );
}

function removeSlideObjects(xml: string) {
  return xml
    .replace(/<p:sp>[\s\S]*?<\/p:sp>/g, "")
    .replace(/<p:pic>[\s\S]*?<\/p:pic>/g, "")
    .replace(/<p:graphicFrame>[\s\S]*?<\/p:graphicFrame>/g, "");
}

function ensurePngContentType(packageDir: string) {
  const path = join(packageDir, "[Content_Types].xml");
  let xml = Deno.readTextFileSync(path);
  if (!/<Default\b[^>]*Extension="png"/i.test(xml)) {
    xml = xml.replace(
      "</Types>",
      '<Default Extension="png" ContentType="image/png"/></Types>',
    );
    Deno.writeTextFileSync(path, xml);
  }
}

async function run(args: string[], cwd?: string) {
  const process = Deno.run({
    cmd: args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const [status, stdout, stderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();
  return { code: status.code, stdout: decode(stdout), stderr: decode(stderr) };
}

function decode(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

function join(...parts: string[]) {
  return parts.join("/").replace(/\/+/g, "/");
}

function relativePath(from: string, to: string) {
  const left = from.split("/").filter(Boolean);
  const right = to.split("/").filter(Boolean);
  while (left.length && right.length && left[0] === right[0]) {
    left.shift();
    right.shift();
  }
  return [...left.map(() => ".."), ...right].join("/") || ".";
}
