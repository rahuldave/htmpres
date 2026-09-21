const root = Deno.cwd();
const diagramRoot = join(
  root,
  "_extensions",
  "htmpres",
  "powerpoint",
  "assets",
  "diagrams",
);
const diagrams: Array<[string, string, string, number, number]> = [
  ["llm-agent-run.svg", "llm-agent-run.ppt.png", "0 115 1600 785", 1600, 785],
  [
    "ai-application-anatomy.svg",
    "ai-application-anatomy.ppt.png",
    "-32 145 1664 819",
    1664,
    819,
  ],
];

for (const [sourceName, outputName, viewBox, width, height] of diagrams) {
  const sourcePath = join(diagramRoot, sourceName);
  const outputPath = join(diagramRoot, outputName);
  const tempDir = await Deno.makeTempDir({ prefix: "htmpres-pptx-svg-" });
  const sanitizedPath = join(tempDir, sourceName);
  const svg = cropSvg(
    replaceForeignObjects(Deno.readTextFileSync(sourcePath)),
    String(viewBox),
    Number(width),
    Number(height),
  );
  Deno.writeTextFileSync(sanitizedPath, svg);
  const result = await run([
    "rsvg-convert",
    "--width",
    "2400",
    "--keep-aspect-ratio",
    "--format",
    "png",
    "--output",
    outputPath,
    sanitizedPath,
  ]);
  await Deno.remove(tempDir, { recursive: true });
  if (result.code !== 0) {
    throw new Error(`Could not rasterize ${sourceName}: ${result.stderr}`);
  }
  console.log(`Built ${relativePath(root, outputPath)}`);
}

function cropSvg(svg: string, viewBox: string, width: number, height: number) {
  return svg
    .replace(/\bwidth="[^"]*"/, `width="${width}"`)
    .replace(/\bheight="[^"]*"/, `height="${height}"`)
    .replace(/\bviewBox="[^"]*"/, `viewBox="${viewBox}"`);
}

function replaceForeignObjects(svg: string) {
  return svg.replace(
    /<foreignObject\b([^>]*)>([\s\S]*?)<\/foreignObject>/g,
    (_raw, attrs, html) => {
      const x = numberAttr(attrs, "x", 0);
      const y = numberAttr(attrs, "y", 0);
      const width = numberAttr(attrs, "width", 100);
      const height = numberAttr(attrs, "height", 24);
      const styles = [...String(html).matchAll(/style="([^"]*)"/g)].map((
        match,
      ) => match[1]);
      const textStyle =
        [...styles].reverse().find((style) => /font-size:/.test(style)) || "";
      const fontSize = numberStyle(textStyle, "font-size", 18);
      const lineHeight = numberStyle(textStyle, "line-height", fontSize * 1.3);
      const color = colorStyle(textStyle) || colorStyle(styles.join(";")) ||
        "#1d1d1d";
      const paragraphs = [
        ...String(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g),
      ]
        .map((match) => decodeHtml(stripTags(match[1])).trim())
        .filter(Boolean);
      const rawLines = paragraphs.length
        ? paragraphs
        : [decodeHtml(stripTags(html)).trim()];
      const maxChars = Math.max(
        10,
        Math.floor(width / Math.max(6, fontSize * 0.54)),
      );
      const lines = rawLines.flatMap((line) => wrapText(line, maxChars));
      if (!lines.length) return "";
      const blockHeight = lineHeight * lines.length;
      const firstBaseline = y +
        Math.max(fontSize, (height - blockHeight) / 2 + fontSize);
      const textX = x + width / 2;
      const tspans = lines.map((line, index) =>
        `<tspan x="${textX}" y="${firstBaseline + index * lineHeight}">${
          escapeXml(line)
        }</tspan>`
      ).join("");
      return `<text text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}">${tspans}</text>`;
    },
  );
}

function wrapText(value: string, maxChars: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current || `${current} ${word}`.length <= maxChars) {
      current = current ? `${current} ${word}` : word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function numberAttr(attrs: string, name: string, fallback: number) {
  const match = new RegExp(`\\b${name}="([0-9.+-]+)"`).exec(attrs);
  return match ? Number(match[1]) : fallback;
}

function numberStyle(style: string, name: string, fallback: number) {
  const match = new RegExp(`${name}:\\s*([0-9.]+)px`).exec(style);
  return match ? Number(match[1]) : fallback;
}

function colorStyle(style: string) {
  const hex = /(?:^|;)\s*color:\s*(#[0-9a-f]{3,8})/i.exec(style)?.[1];
  if (hex) return hex;
  const rgb = /(?:^|;)\s*color:\s*rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i
    .exec(style);
  if (!rgb) return "";
  return `#${
    [rgb[1], rgb[2], rgb[3]].map((value) =>
      Number(value).toString(16).padStart(2, "0")
    ).join("")
  }`;
}

function stripTags(value: string) {
  return value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(
    /\s+/g,
    " ",
  );
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(
    /&gt;/g,
    ">",
  ).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
    />/g,
    "&gt;",
  ).replace(/"/g, "&quot;");
}

async function run(args: string[]) {
  const process = Deno.run({ cmd: args, stdout: "piped", stderr: "piped" });
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
