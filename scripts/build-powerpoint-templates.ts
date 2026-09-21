const root = Deno.cwd();
const powerpointRoot = join(root, "_extensions", "htmpres", "powerpoint");
const assetsRoot = join(powerpointRoot, "assets");
const templatesRoot = join(powerpointRoot, "templates");

type Family = "executive-funding" | "executive" | "technical";

const families: Record<
  Family,
  { titleSize: number; bodySize: number; sectionTitleSize: number }
> = {
  "executive-funding": {
    titleSize: 3000,
    bodySize: 1400,
    sectionTitleSize: 3200,
  },
  executive: { titleSize: 2800, bodySize: 1300, sectionTitleSize: 3000 },
  technical: { titleSize: 2600, bodySize: 1150, sectionTitleSize: 2800 },
};

for (
  const [family, sizes] of Object.entries(families) as Array<
    [Family, typeof families[Family]]
  >
) {
  await buildTemplate(family, sizes);
}

async function buildTemplate(family: Family, sizes: typeof families[Family]) {
  const buildDir = await Deno.makeTempDir({
    prefix: `htmpres-${family}-reference-`,
  });
  const basePath = join(buildDir, "base.pptx");
  const packageDir = join(buildDir, "package");
  const outputPath = join(
    templatesRoot,
    `univ-ai-p32-${family}-reference.pptx`,
  );
  Deno.mkdirSync(templatesRoot, { recursive: true });

  const pandoc = await locatePandoc();
  const base = await runBytes([
    pandoc,
    "--print-default-data-file=reference.pptx",
  ]);
  if (base.code !== 0 || !base.stdout.length) {
    throw new Error(
      `Could not read Pandoc reference.pptx: ${decode(base.stderr)}`,
    );
  }
  Deno.writeFileSync(basePath, base.stdout);
  const unzip = await run(["unzip", "-q", basePath, "-d", packageDir]);
  if (unzip.code !== 0) {
    throw new Error(`Could not unpack Pandoc reference: ${unzip.stderr}`);
  }

  const mediaDir = join(packageDir, "ppt", "media");
  Deno.mkdirSync(mediaDir, { recursive: true });
  Deno.copyFileSync(
    join(assetsRoot, "logos", "univ-ai-logo.png"),
    join(mediaDir, "univ-ai-logo.png"),
  );
  Deno.copyFileSync(
    join(assetsRoot, "logos", "point32health-logo.png"),
    join(mediaDir, "point32health-logo.png"),
  );
  Deno.copyFileSync(
    join(assetsRoot, "backgrounds", "univ-ai-section-background.png"),
    join(mediaDir, "univ-ai-section-background.png"),
  );

  patchTheme(packageDir);
  ensurePngContentType(packageDir);
  patchMaster(packageDir, sizes);
  patchDarkLayout(packageDir, 1, sizes.sectionTitleSize, "Title Slide");
  patchDarkLayout(packageDir, 3, sizes.sectionTitleSize, "Section Header");
  patchContentLayouts(packageDir, sizes);

  if (exists(outputPath)) Deno.removeSync(outputPath);
  const zip = await run(["zip", "-q", "-r", outputPath, "."], packageDir);
  if (zip.code !== 0) {
    throw new Error(`Could not write ${outputPath}: ${zip.stderr}`);
  }
  const test = await run(["unzip", "-tqq", outputPath]);
  if (test.code !== 0) {
    throw new Error(`Template package failed integrity check: ${test.stderr}`);
  }
  console.log(`Built ${relativePath(root, outputPath)}`);
  await Deno.remove(buildDir, { recursive: true });
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

function patchTheme(packageDir: string) {
  const path = join(packageDir, "ppt", "theme", "theme1.xml");
  let xml = Deno.readTextFileSync(path);
  const replacements: Record<string, string> = {
    "1F497D": "17324D",
    "EEECE1": "EDF6FA",
    "4F81BD": "0F7773",
    "C0504D": "BD7B18",
    "9BBB59": "5F8F3B",
    "8064A2": "6159A8",
    "4BACC6": "9B2F5F",
    "F79646": "AD4455",
  };
  for (const [from, to] of Object.entries(replacements)) {
    xml = xml.replaceAll(from, to);
  }
  xml = xml.replace(
    /<a:majorFont>([\s\S]*?)<a:latin typeface="[^"]*"/,
    '<a:majorFont>$1<a:latin typeface="Bitter"',
  );
  xml = xml.replace(
    /<a:minorFont>([\s\S]*?)<a:latin typeface="[^"]*"/,
    '<a:minorFont>$1<a:latin typeface="Source Serif 4"',
  );
  xml = xml.replace(
    /<a:fontScheme name="[^"]*"/,
    '<a:fontScheme name="Univ.AI Point32Health"',
  );
  Deno.writeTextFileSync(path, xml);
}

function patchMaster(
  packageDir: string,
  sizes: { titleSize: number; bodySize: number },
) {
  const masterPath = join(
    packageDir,
    "ppt",
    "slideMasters",
    "slideMaster1.xml",
  );
  const relsPath = join(
    packageDir,
    "ppt",
    "slideMasters",
    "_rels",
    "slideMaster1.xml.rels",
  );
  let xml = Deno.readTextFileSync(masterPath);
  let rels = Deno.readTextFileSync(relsPath);

  xml = xml.replace(/<p:bg>[\s\S]*?<\/p:bg>/, ordinaryBackground());
  xml = xml.replace("</p:spTree>", `${masterLogos()}\n</p:spTree>`);
  xml = xml.replace(
    /<p:titleStyle>([\s\S]*?)<\/p:titleStyle>/,
    (block) => setFirstFontSize(block, sizes.titleSize),
  );
  xml = xml.replace(
    /<p:bodyStyle>([\s\S]*?)<\/p:bodyStyle>/,
    (block) => setFirstFontSize(block, sizes.bodySize),
  );
  rels = rels.replace(
    "</Relationships>",
    '<Relationship Id="rId13" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/univ-ai-logo.png"/>' +
      '<Relationship Id="rId14" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/point32health-logo.png"/>' +
      "</Relationships>",
  );
  Deno.writeTextFileSync(masterPath, xml);
  Deno.writeTextFileSync(relsPath, rels);
}

function patchDarkLayout(
  packageDir: string,
  layoutNumber: number,
  titleSize: number,
  expectedName: string,
) {
  const layoutPath = join(
    packageDir,
    "ppt",
    "slideLayouts",
    `slideLayout${layoutNumber}.xml`,
  );
  const relsPath = join(
    packageDir,
    "ppt",
    "slideLayouts",
    "_rels",
    `slideLayout${layoutNumber}.xml.rels`,
  );
  let xml = Deno.readTextFileSync(layoutPath);
  let rels = Deno.readTextFileSync(relsPath);
  if (!xml.includes(`name="${expectedName}"`)) {
    throw new Error(
      `Unexpected layout ${layoutNumber}; expected ${expectedName}`,
    );
  }

  const insertionPoint = xml.indexOf("<p:sp>");
  if (insertionPoint < 0) {
    throw new Error(`Layout ${layoutNumber} has no shape insertion point.`);
  }
  xml = `${xml.slice(0, insertionPoint)}${darkLayoutArtwork()}${
    xml.slice(insertionPoint)
  }`;
  xml = setFirstFontSize(xml, titleSize);
  xml = colorAllDefaultRuns(xml, "FFFFFF");
  rels = rels.replace(
    "</Relationships>",
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/univ-ai-section-background.png"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/univ-ai-logo.png"/>' +
      '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/point32health-logo.png"/>' +
      "</Relationships>",
  );
  Deno.writeTextFileSync(layoutPath, xml);
  Deno.writeTextFileSync(relsPath, rels);
}

function patchContentLayouts(
  packageDir: string,
  sizes: { titleSize: number; bodySize: number },
) {
  for (const layoutNumber of [2, 4, 5, 6, 7, 8, 9]) {
    const path = join(
      packageDir,
      "ppt",
      "slideLayouts",
      `slideLayout${layoutNumber}.xml`,
    );
    let xml = Deno.readTextFileSync(path);
    xml = xml.replace(
      /<a:defRPr\b([^>]*?)sz="\d+"/g,
      `<a:defRPr$1sz="${sizes.bodySize}"`,
    );
    Deno.writeTextFileSync(path, xml);
  }
}

function ordinaryBackground() {
  return `<p:bg><p:bgPr><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="EAF5FA"/></a:gs><a:gs pos="100000"><a:srgbClr val="FFFFFF"/></a:gs></a:gsLst><a:lin ang="5400000" scaled="1"/></a:gradFill><a:effectLst/></p:bgPr></p:bg>`;
}

function masterLogos() {
  return [
    pictureXml(
      20,
      "Univ.AI background logo",
      "rId13",
      7700000,
      180000,
      1188720,
      269000,
      6000,
    ),
    pictureXml(
      21,
      "Point32Health background logo",
      "rId14",
      274000,
      4786000,
      1280160,
      163000,
      6000,
    ),
  ].join("\n");
}

function darkLayoutArtwork() {
  return [
    pictureXml(
      30,
      "Section background",
      "rId2",
      0,
      0,
      9144000,
      5143500,
      100000,
    ),
    `<p:sp><p:nvSpPr><p:cNvPr id="31" name="Dark blue overlay"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="0F2E46"><a:alpha val="68000"/></a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`,
    pictureXml(
      32,
      "Univ.AI section logo",
      "rId3",
      7700000,
      180000,
      1188720,
      269000,
      14000,
    ),
    pictureXml(
      33,
      "Point32Health section logo",
      "rId4",
      274000,
      4786000,
      1280160,
      163000,
      14000,
    ),
  ].join("\n");
}

function pictureXml(
  id: number,
  name: string,
  relationship: string,
  x: number,
  y: number,
  cx: number,
  cy: number,
  alpha: number,
) {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relationship}"><a:alphaModFix amt="${alpha}"/></a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr></p:pic>`;
}

function setFirstFontSize(xml: string, size: number) {
  return xml.replace(/<a:defRPr\b([^>]*?)sz="\d+"/, `<a:defRPr$1sz="${size}"`);
}

function colorAllDefaultRuns(xml: string, color: string) {
  return xml.replace(
    /<a:defRPr\b([^>]*)\/>/g,
    `<a:defRPr$1><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:defRPr>`,
  )
    .replace(
      /<a:defRPr\b([^>]*)>(?!<a:solidFill>)/g,
      `<a:defRPr$1><a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`,
    );
}

async function locatePandoc() {
  const which = await run(["which", "quarto"]);
  if (which.code !== 0) {
    throw new Error("quarto is required to build PowerPoint templates.");
  }
  const quarto = which.stdout.trim();
  const pandoc = join(dirname(quarto), "tools", "pandoc");
  if (!exists(pandoc)) {
    throw new Error(`Could not locate Quarto's Pandoc at ${pandoc}`);
  }
  return pandoc;
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

async function runBytes(args: string[]) {
  const process = Deno.run({ cmd: args, stdout: "piped", stderr: "piped" });
  const [status, stdout, stderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();
  return { code: status.code, stdout, stderr };
}

function decode(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

function exists(path: string) {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

function join(...parts: string[]) {
  return normalize(parts.filter(Boolean).join("/"));
}

function normalize(path: string) {
  const absolute = path.startsWith("/");
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `${absolute ? "/" : ""}${parts.join("/")}`;
}

function dirname(path: string) {
  const normalized = normalize(path);
  const index = normalized.lastIndexOf("/");
  return index <= 0 ? "/" : normalized.slice(0, index);
}

function relativePath(from: string, to: string) {
  const left = normalize(from).split("/").filter(Boolean);
  const right = normalize(to).split("/").filter(Boolean);
  while (left.length && right.length && left[0] === right[0]) {
    left.shift();
    right.shift();
  }
  return [...left.map(() => ".."), ...right].join("/") || ".";
}
