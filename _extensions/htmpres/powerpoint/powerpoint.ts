type PowerPointContext = {
  root: string;
  extensionDir: string;
};

type DeckFamily = "executive-funding" | "executive" | "technical";

type SourceSlide = {
  sourceNumber: number;
  title: string;
  attrText: string;
  body: string;
};

type HybridRule = {
  asset: string;
  sourceAsset: string;
  reason: string;
  placement: "diagram" | "cycle";
};

type ConversionEntry = {
  sourceSlideNumber: number;
  title: string;
  template: string;
  layout: string;
  conversionLevel: "native" | "template-assisted" | "hybrid";
  semanticTokens: string[];
  images: Array<{
    source: string;
    output: string;
    cropMode: "contain";
    altText: string;
  }>;
  warnings: string[];
  fallbackReason: string | null;
};

type ParsedOptions = {
  decks: string[];
  family: DeckFamily | null;
  output: string;
  outputDir: string;
  report: string;
  slides: number[];
  keepIntermediate: boolean;
};

const semanticColors: Record<string, string> = {
  profile: "6159A8",
  catalog: "0F7773",
  runtime: "BD7B18",
  evidence: "9B2F5F",
  phi_privacy: "AD4455",
  prompt_runtime_attack: "BD7B18",
  fairness_policy: "6159A8",
  reuse_outcome: "5F8F3B",
  neutral: "5C6B73",
  source: "5C6B73",
};

const sectionSlides: Record<DeckFamily, Set<number>> = {
  executive: new Set([1, 9, 23, 26, 29, 35, 38, 51]),
  technical: new Set([4, 21, 34, 36, 42, 52, 55, 56, 62, 71, 74]),
  "executive-funding": new Set([1, 16, 23, 27]),
};

const appendixStarts: Partial<Record<DeckFamily, number>> = {
  executive: 46,
  technical: 65,
};

const hybridRules: Record<DeckFamily, Record<number, HybridRule>> = {
  executive: {
    7: diagramRule(
      "llm-agent-run.ppt.png",
      "llm-agent-run.svg",
      "authored architecture diagram requires rendered geometry",
    ),
    12: cycleRule("profile-catalog-runtime-evidence.executive.ppt.png"),
    17: diagramRule(
      "catalog-core.png",
      "catalog-core.png",
      "authored architecture diagram requires rendered geometry",
    ),
    22: diagramRule(
      "ai-application-anatomy.ppt.png",
      "ai-application-anatomy.svg",
      "authored architecture diagram requires rendered geometry",
    ),
    31: diagramRule(
      "security-flow.png",
      "security-flow.png",
      "authored architecture diagram requires rendered geometry",
    ),
    46: diagramRule(
      "five-plane-architecture.png",
      "five-plane-architecture.png",
      "authored architecture diagram requires rendered geometry",
    ),
    47: diagramRule(
      "context-resolver.png",
      "context-resolver.png",
      "authored architecture diagram requires rendered geometry",
    ),
    48: diagramRule(
      "identity-layers.png",
      "identity-layers.png",
      "authored architecture diagram requires rendered geometry",
    ),
    50: diagramRule(
      "azure-databricks-implementation.png",
      "azure-databricks-implementation.png",
      "authored architecture diagram requires rendered geometry",
    ),
  },
  technical: {
    5: diagramRule(
      "llm-agent-run.ppt.png",
      "llm-agent-run.svg",
      "authored architecture diagram requires rendered geometry",
    ),
    6: diagramRule(
      "ai-application-anatomy.ppt.png",
      "ai-application-anatomy.svg",
      "authored architecture diagram requires rendered geometry",
    ),
    8: cycleRule("profile-catalog-runtime-evidence.technical.ppt.png"),
    17: diagramRule(
      "five-plane-architecture.png",
      "five-plane-architecture.png",
      "authored architecture diagram requires rendered geometry",
    ),
    28: diagramRule(
      "catalog-core.png",
      "catalog-core.png",
      "authored architecture diagram requires rendered geometry",
    ),
    46: diagramRule(
      "identity-layers.png",
      "identity-layers.png",
      "authored architecture diagram requires rendered geometry",
    ),
    47: diagramRule(
      "security-flow.png",
      "security-flow.png",
      "authored architecture diagram requires rendered geometry",
    ),
    57: diagramRule(
      "context-resolver.png",
      "context-resolver.png",
      "authored architecture diagram requires rendered geometry",
    ),
    65: diagramRule(
      "azure-databricks-implementation.png",
      "azure-databricks-implementation.png",
      "authored architecture diagram requires rendered geometry",
    ),
  },
  "executive-funding": {
    11: cycleRule("profile-catalog-runtime-evidence.executive-funding.ppt.png"),
  },
};

function diagramRule(
  asset: string,
  sourceAsset: string,
  reason: string,
): HybridRule {
  return { asset, sourceAsset, reason, placement: "diagram" };
}

function cycleRule(asset: string): HybridRule {
  return {
    asset,
    sourceAsset: "core-cycle browser geometry",
    reason:
      "CSS-positioned four-part cycle cannot be reproduced reliably by the PowerPoint writer",
    placement: "cycle",
  };
}

export async function powerpointCommand(
  args: string[],
  context: PowerPointContext,
) {
  if (!args.length || args.includes("--help") || args.includes("-h")) {
    powerpointUsage();
    return;
  }

  const options = parseOptions(args);
  if (!options.decks.length) {
    throw new Error("powerpoint requires at least one deck QMD path.");
  }
  if (options.output && options.decks.length !== 1) {
    throw new Error("--output can be used only when converting one deck.");
  }
  if (options.report && options.decks.length !== 1) {
    throw new Error("--report can be used only when converting one deck.");
  }

  for (const deckArg of options.decks) {
    await convertPowerPointDeck(deckArg, options, context);
  }
}

function powerpointUsage() {
  console.log(`Usage:
  quarto run _extensions/htmpres/htmpres.ts powerpoint <deck/index.qmd> [...]

Options:
  --template <executive-funding|executive|technical>
  --slides <comma-separated-source-slide-numbers>
  --output <deck.pptx>
  --output-dir <directory>
  --report <conversion-report.json>
  --keep-intermediate

The command creates editable PowerPoint content with Quarto's PPTX writer,
uses the matching htmpres reference template, and emits a per-slide conversion
report next to the deck.`);
}

async function convertPowerPointDeck(
  deckArg: string,
  options: ParsedOptions,
  context: PowerPointContext,
) {
  const qmdPath = resolveDeckPath(deckArg, context.root);
  const qmd = Deno.readTextFileSync(qmdPath);
  const slides = parseSlides(splitFrontMatter(qmd).body);
  if (!slides.length) throw new Error(`No level-2 slides found in ${deckArg}`);

  const family = options.family || inferFamily(qmdPath);
  const selected = options.slides.length
    ? options.slides.map((number) => requireSlide(slides, number, qmdPath))
    : slides;
  const templateName = `univ-ai-p32-${family}-reference.pptx`;
  const templatePath = join(
    context.extensionDir,
    "powerpoint",
    "templates",
    templateName,
  );
  if (!exists(templatePath)) {
    throw new Error(`Missing PowerPoint reference template: ${templatePath}`);
  }

  const outputPath = powerPointOutputPath(
    qmdPath,
    family,
    options,
    context.root,
  );
  const reportPath = options.report
    ? resolvePath(context.root, options.report)
    : outputPath.replace(/\.pptx$/i, ".conversion.json");
  ensureParent(outputPath);
  ensureParent(reportPath);

  const buildDir = await Deno.makeTempDir({
    prefix: `htmpres-${family}-pptx-`,
  });
  const normalizedPath = join(buildDir, `${family}.powerpoint.qmd`);
  const draftPath = join(buildDir, `${family}.draft.pptx`);
  const reportEntries: ConversionEntry[] = [];
  const normalizedSlides = selected.map((slide) =>
    normalizeSlide(
      slide,
      family,
      context.extensionDir,
      templateName,
      reportEntries,
    )
  );
  const normalized = `${powerPointFrontMatter()}\n\n${
    normalizedSlides.join("\n\n")
  }\n`;
  Deno.writeTextFileSync(normalizedPath, normalized);

  const result = await runProcess(
    [
      "quarto",
      "pandoc",
      normalizedPath,
      "--from=markdown+fenced_divs+native_divs+native_spans+pipe_tables+raw_attribute",
      "--to=pptx",
      "--slide-level=2",
      `--reference-doc=${templatePath}`,
      `--output=${draftPath}`,
    ],
    "",
    context.root,
  );
  if (result.code !== 0) {
    throw new Error(
      `Quarto PPTX export failed for ${deckArg}:\n${
        result.stderr || result.stdout
      }`,
    );
  }

  await postprocessPowerPoint(
    draftPath,
    outputPath,
    reportEntries,
    buildDir,
    context.extensionDir,
  );
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: qmdPath,
    output: outputPath,
    template: templateName,
    family,
    sourceSlideCount: slides.length,
    outputSlideCount: selected.length,
    selectedSourceSlides: selected.map((slide) => slide.sourceNumber),
    hybridAllowlistCount: Object.keys(hybridRules[family]).length,
    slides: reportEntries,
  };
  Deno.writeTextFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (options.keepIntermediate) {
    const intermediateDir = outputPath.replace(/\.pptx$/i, ".intermediate");
    copyRecursive(buildDir, intermediateDir);
  } else {
    await Deno.remove(buildDir, { recursive: true });
  }

  console.log(
    `Rendered ${relativePath(context.root, qmdPath)} -> ${
      relativePath(context.root, outputPath)
    } ` +
      `(${selected.length} slides, ${
        reportEntries.filter((entry) => entry.conversionLevel === "hybrid")
          .length
      } hybrid); ` +
      `report ${relativePath(context.root, reportPath)}`,
  );
}

function powerPointFrontMatter() {
  return `---
slide-level: 2
aspectratio: 169
lang: en-US
---`;
}

function normalizeSlide(
  slide: SourceSlide,
  family: DeckFamily,
  extensionDir: string,
  templateName: string,
  reportEntries: ConversionEntry[],
) {
  const attrs = parsePandocAttrs(slide.attrText);
  const notes = extractNotes(slide.body);
  const hybrid = hybridRules[family][slide.sourceNumber] || null;
  const isSection = attrs.classes.includes("section-divider") ||
    sectionSlides[family].has(slide.sourceNumber);
  const isTitleSlide = slide.sourceNumber === 1;
  const isAppendix = attrs.keyValues["data-kind"] === "appendix" ||
    attrs.classes.includes("appendix") ||
    (appendixStarts[family] != null &&
      slide.sourceNumber >= Number(appendixStarts[family]));
  const semanticTokens = detectSemanticTokens(slide.body, slide.title);
  const warnings = contentWarnings(slide.body, isAppendix);
  const images: ConversionEntry["images"] = [];
  let body: string;
  let layout = isTitleSlide
    ? "Title Slide"
    : isSection
    ? "Section Header"
    : suggestedLayout(slide.body, hybrid);
  let conversionLevel: ConversionEntry["conversionLevel"] = isSection
    ? "template-assisted"
    : "native";

  if (isSection) {
    body = "";
  } else if (hybrid) {
    conversionLevel = "hybrid";
    layout = "Content with Caption";
    const assetPath = join(
      extensionDir,
      "powerpoint",
      "assets",
      "diagrams",
      hybrid.asset,
    );
    if (!exists(assetPath)) {
      throw new Error(`Missing hybrid PowerPoint asset: ${assetPath}`);
    }
    const alt = imageAltText(slide.body) || cycleAltText(family) ||
      `${slide.title} diagram`;
    images.push({
      source: hybrid.sourceAsset,
      output: assetPath,
      cropMode: "contain",
      altText: alt,
    });
    body = hybrid.placement === "cycle"
      ? normalizeCycleSlide(notes.body, assetPath, alt)
      : normalizeDiagramSlide(notes.body, assetPath, alt);
  } else {
    body = normalizeEditableBody(notes.body, family, slide.sourceNumber);
    if (isSplitNativeSlide(family, slide.sourceNumber)) layout = "Two Content";
    const remainingImages = markdownImages(body);
    if (remainingImages.length) {
      warnings.push(
        "non-allowlisted image removed to preserve the hybrid-slide allowlist",
      );
      body = body.replace(/!\[[^\]]*\]\([^\n)]+\)(?:\{[^}]*\})?/g, "");
    }
  }

  if (isAppendix && !/\bAppendix\b/i.test(body)) {
    body = `[[HTMPRES:neutral]] **Appendix**\n\n${body}`.trim();
  }
  if (notes.notes.trim()) {
    body = `${body.trim()}\n\n::: notes\n${normalizeNotes(notes.notes)}\n:::`
      .trim();
  }

  reportEntries.push({
    sourceSlideNumber: slide.sourceNumber,
    title: slide.title,
    template: templateName,
    layout,
    conversionLevel,
    semanticTokens,
    images,
    warnings,
    fallbackReason: hybrid?.reason || null,
  });

  return `## ${escapeHeading(slide.title)}\n\n${body.trim()}`.trim();
}

function normalizeEditableBody(
  body: string,
  family: DeckFamily,
  sourceSlideNumber: number,
) {
  if (family === "executive-funding" && sourceSlideNumber === 20) {
    return normalizeFourCardTable(body);
  }
  if (family === "executive-funding" && sourceSlideNumber === 28) {
    return normalizeSixCardColumns(body);
  }
  if (family === "technical" && sourceSlideNumber === 15) {
    return normalizeCodeSplit(body);
  }
  if (family === "technical" && sourceSlideNumber === 33) {
    return normalizeTableSplit(body);
  }
  if (/<table\b/i.test(body)) return normalizeMixedTableBody(body);
  return normalizeNativeBody(body);
}

function normalizeSixCardColumns(body: string) {
  const cards = extractFencedBlockObjects(body, "card");
  if (cards.length !== 6) return normalizeNativeBody(body);
  const eyebrow = /^\s*(\[[^\n]+\]\{\.eyebrow\})/m.exec(body)?.[1] || "";
  const normalized = cards.map((card) => {
    let content = normalizeNativeBody(card.body);
    const token = semanticTokenFromText(`${card.attrs}\n${card.body}`);
    if (token && !/^\[\[HTMPRES:/.test(content)) {
      content = `[[HTMPRES:${token}]] ${content}`;
    }
    return content;
  });
  return `:::: {.columns}
::: {.column width="50%"}
${
    [normalizeNativeBody(eyebrow), ...normalized.slice(0, 3)].filter(Boolean)
      .join("\n\n")
  }
:::
::: {.column width="50%"}
${normalized.slice(3).join("\n\n")}
:::
::::`;
}

function isSplitNativeSlide(family: DeckFamily, sourceSlideNumber: number) {
  return family === "technical" && sourceSlideNumber === 15;
}

function normalizeFourCardTable(body: string) {
  const cards = extractFencedBlocksByClass(body, "card").map(
    normalizeNativeBody,
  );
  if (cards.length !== 4) return normalizeNativeBody(body);
  const lead = extractFencedBlocksByClass(body, "lead").map(normalizeNativeBody)
    .join("\n\n");
  const callout = extractFencedBlocksByClass(body, "callout").map(
    normalizeNativeBody,
  ).join("\n\n");
  const rows = cards.map((card) => {
    const title = /^(\[\[HTMPRES:[a-z_]+\]\]\s*)?\*\*([^*]+)\*\*/.exec(card);
    const marker = title?.[1] || "";
    const label = title?.[2]?.trim() || "Audit check";
    const detail = card.replace(
      /^(\[\[HTMPRES:[a-z_]+\]\]\s*)?\*\*[^*]+\*\*\s*/,
      "",
    ).replace(/\n+/g, " ").trim();
    return `| ${marker}**${label}** | ${detail} |`;
  });
  const introduction = [
    lead,
    callout ? `**Why it matters.** ${callout.replace(/\n+/g, " ")}` : "",
  ].filter(Boolean).join("\n\n");
  const table = [
    "| Audit check | What it tests |",
    "| --- | --- |",
    ...rows,
  ].join("\n");
  return `${introduction}\n\n${table}`;
}

function normalizeCodeSplit(body: string) {
  const codeMatch = /:{3,}\s+(?:\{?\.?code-card[^\n]*\}?)\s*\n([\s\S]*?)\n:{3,}/
    .exec(body);
  if (!codeMatch) return normalizeNativeBody(body);
  const prose = normalizeNativeBody(body.replace(codeMatch[0], ""));
  const code = normalizeCodeCards(codeMatch[0]);
  return `:::: {.columns}
::: {.column width="48%"}
${prose}
:::
::: {.column width="52%"}
${code}
:::
::::`;
}

function normalizeTableSplit(body: string) {
  const tableMatch = /<table\b[^>]*>[\s\S]*?<\/table>/i.exec(body);
  const aside = extractFencedBlocksByClass(body, "aside-panel")[0] || "";
  if (!tableMatch || !aside) return normalizeNativeBody(body);
  const table = convertHtmlTables(tableMatch[0]);
  const asideLines = normalizeNativeBody(aside).split(/\n+/).map((line) =>
    line.trim()
  ).filter(Boolean);
  const asideMatch = /^(\[\[HTMPRES:[a-z_]+\]\]\s*)?#{1,6}\s+(.+)$/.exec(
    asideLines[0] || "",
  );
  const marker = asideMatch?.[1] || "";
  const label = asideMatch?.[2]?.trim() || "Why relational first";
  const detail = asideLines.slice(1).join(" ");
  return `${table}\n| ${marker}**${label}** | ${detail} |`;
}

function normalizeMixedTableBody(body: string) {
  const tableMatch = /<table\b[^>]*>[\s\S]*?<\/table>/i.exec(body);
  if (!tableMatch) return normalizeNativeBody(body);
  const prefix = normalizeNativeBody(body.slice(0, tableMatch.index));
  const table = convertHtmlTables(tableMatch[0]);
  const suffix = normalizeNativeBody(
    body.slice(tableMatch.index + tableMatch[0].length),
  )
    .replace(/\n+/g, " ")
    .trim();
  if (!suffix) return [prefix, table].filter(Boolean).join("\n\n");
  const header = table.split(/\r?\n/, 1)[0];
  const columns = Math.max(2, (header.match(/\|/g) || []).length - 1);
  const label = /^\[\[HTMPRES:source\]\]/.test(suffix)
    ? "Source"
    : "Additional context";
  const cleaned = suffix.replace(/^\[\[HTMPRES:source\]\]\s*/, "");
  const row = `| **${label}** | ${cleaned} |${
    " |".repeat(Math.max(0, columns - 2))
  }`;
  return [prefix, `${table}\n${row}`].filter(Boolean).join("\n\n");
}

function extractFencedBlocksByClass(body: string, className: string) {
  const escaped = escapeRegExp(className);
  const pattern = new RegExp(
    `^(:{3,})\\s+[^\\n]*\\b${escaped}\\b[^\\n]*\\n([\\s\\S]*?)^\\1\\s*$`,
    "gim",
  );
  return [...body.matchAll(pattern)].map((match) => match[2].trim());
}

function extractFencedBlockObjects(body: string, className: string) {
  const escaped = escapeRegExp(className);
  const pattern = new RegExp(
    `^(:{3,})\\s+([^\\n]*\\b${escaped}\\b[^\\n]*)\\n([\\s\\S]*?)^\\1\\s*$`,
    "gim",
  );
  return [...body.matchAll(pattern)].map((match) => ({
    attrs: match[2].trim(),
    body: match[3].trim(),
  }));
}

function normalizeDiagramSlide(body: string, assetPath: string, alt: string) {
  const withoutImages = body.replace(
    /!\[[^\]]*\]\([^\n)]+\)(?:\{[^}]*\})?/g,
    "",
  );
  const editable = normalizeNativeBody(withoutImages);
  const image = `![${escapeAlt(alt)}](${markdownPath(assetPath)}){width=92%}`;
  if (!editable) return image;
  return `:::: {.columns}
::: {.column width="40%"}
${editable}
:::
::: {.column width="60%"}
${image}
:::
::::`;
}

function normalizeCycleSlide(body: string, assetPath: string, alt: string) {
  const aside = extractHtmlDivByClass(body, "aside-panel");
  const withoutCycle = removeHtmlDivByClass(body, "core-cycle-layout");
  const editable = normalizeNativeBody(`${withoutCycle}\n\n${aside}`);
  const image = `![${escapeAlt(alt)}](${markdownPath(assetPath)}){width=100%}`;
  return `:::: {.columns}
::: {.column width="62%"}
${image}
:::
::: {.column width="38%"}
${editable}
:::
::::`;
}

function normalizeNativeBody(body: string) {
  let text = convertHtmlTables(body);
  text = normalizeCodeCards(text);
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/&rarr;|&#8594;/gi, "→");
  text = text.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(
    /&gt;/gi,
    ">",
  );
  const lines = text.split(/\r?\n/);
  const stack: Array<
    { fence: number; token: string; source: boolean; suppress: boolean }
  > = [];
  const output: string[] = [];

  for (const original of lines) {
    const trimmed = original.trim();
    const opening = /^(:{3,})\s*(.*)$/.exec(trimmed);
    if (opening) {
      const fence = opening[1].length;
      const tail = opening[2].trim();
      if (!tail) {
        closeFence(stack, fence);
      } else {
        stack.push({
          fence,
          token: semanticTokenFromText(tail),
          source: /\bsource-line\b/.test(tail),
          suppress: /\b(?:chip-row|pill-row)\b/.test(tail),
        });
      }
      continue;
    }

    if (stack.some((entry) => entry.suppress)) continue;
    let line = original
      .replace(
        /<\/?(?:div|span|section|aside|button|p|strong|b|em|i|small|label)[^>]*>/gi,
        (tag) => {
          if (/^<\/?(?:strong|b)>$/i.test(tag)) return "**";
          if (/^<\/?(?:em|i)>$/i.test(tag)) return "*";
          return "";
        },
      )
      .replace(/<[^>]+>/g, "")
      .replace(/\{\.[^}]+\}\s*$/g, "")
      .trimEnd();
    const activeToken = [...stack].reverse().find((entry) =>
      entry.token
    )?.token || semanticTokenFromText(line);
    const source = [...stack].reverse().some((entry) => entry.source);
    if (source && line.trim()) line = `[[HTMPRES:source]] ${line.trim()}`;
    else if (activeToken && /^\s*(?:\*\*|###?\s)/.test(line)) {
      line = `[[HTMPRES:${activeToken}]] ${line.trim()}`;
    }
    output.push(line);
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeCodeCards(body: string) {
  return body.replace(
    /:{3,}\s+(?:\{?\.?code-card[^\n]*\}?)\s*\n([\s\S]*?)\n:{3,}/g,
    (_raw, content) => {
      if (/^\s*(`{3,}|~{3,})/m.test(content)) return content;
      const lines = String(content).split(/\r?\n/);
      const nonBlank = lines.filter((line) => line.trim());
      const indent = nonBlank.length
        ? Math.min(
          ...nonBlank.map((line) => line.match(/^\s*/)?.[0].length || 0),
        )
        : 0;
      const code = lines.map((line) =>
        line.slice(Math.min(indent, line.length))
      ).join("\n").trim();
      return `\`\`\`text\n${code}\n\`\`\``;
    },
  );
}

function convertHtmlTables(body: string) {
  return body.replace(
    /<table\b[^>]*>([\s\S]*?)<\/table>/gi,
    (_table, inner) => {
      const rows = [...String(inner).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
        .map((row) =>
          [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((
            cell,
          ) => plainInline(cell[1]))
        ).filter((row) => row.length);
      if (!rows.length) return "";
      const width = Math.max(...rows.map((row) => row.length));
      const padded = rows.map((
        row,
      ) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
      const header = padded[0];
      return [
        `| ${header.join(" | ")} |`,
        `| ${header.map(() => "---").join(" | ")} |`,
        ...padded.slice(1).map((row) => `| ${row.join(" | ")} |`),
      ].join("\n");
    },
  );
}

function plainInline(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNotes(notes: string) {
  return notes
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectSemanticTokens(body: string, title: string) {
  const haystack = `${title}\n${body}`.toLowerCase();
  const tokens = new Set<string>();
  if (/theme-profile|\bprofile\b|--violet/.test(haystack)) {
    tokens.add("profile");
  }
  if (/theme-catalog|\bcatalog\b|--teal/.test(haystack)) tokens.add("catalog");
  if (/theme-runtime|\bruntime\b/.test(haystack)) tokens.add("runtime");
  if (/theme-evidence|\bevidence\b/.test(haystack)) tokens.add("evidence");
  if (/\bphi\b|privacy|--rose/.test(haystack)) tokens.add("phi_privacy");
  if (/prompt[- ]?(?:exfiltration|injection)|runtime attack/.test(haystack)) {
    tokens.add("prompt_runtime_attack");
  }
  if (/fairness|responsible ai|responsible-ai|policy review/.test(haystack)) {
    tokens.add("fairness_policy");
  }
  if (/\breuse\b|measured outcome|--green/.test(haystack)) {
    tokens.add("reuse_outcome");
  }
  return [...tokens];
}

function semanticTokenFromText(value: string) {
  const text = value.toLowerCase();
  if (/theme-profile|\bprofile\b|--violet/.test(text)) return "profile";
  if (/theme-catalog|\bcatalog\b|--teal/.test(text)) return "catalog";
  if (/theme-runtime|\bruntime\b/.test(text)) return "runtime";
  if (/theme-evidence|\bevidence\b/.test(text)) return "evidence";
  if (/\bphi\b|privacy|--rose/.test(text)) return "phi_privacy";
  if (/prompt[- ]?(?:exfiltration|injection)/.test(text)) {
    return "prompt_runtime_attack";
  }
  if (/fairness|policy review/.test(text)) return "fairness_policy";
  if (/\breuse\b|outcome|--green/.test(text)) return "reuse_outcome";
  return "";
}

function contentWarnings(body: string, isAppendix: boolean) {
  const warnings: string[] = [];
  const plain = body.replace(/<[^>]+>/g, "").replace(/:{3,}[^\n]*/g, "");
  if (plain.length > 1800) {
    warnings.push("dense editable content may require manual font-size review");
  }
  const tableRows = (body.match(/<tr\b|^\|/gim) || []).length;
  if (tableRows > 9) {
    warnings.push("dense native table may require manual row-height review");
  }
  const codeLines = fencedCodeLineCount(body);
  if (codeLines > 18) {
    warnings.push(
      "long editable code block may require manual font-size review",
    );
  }
  if (isAppendix) warnings.push("appendix density treatment applied");
  return warnings;
}

function fencedCodeLineCount(body: string) {
  let max = 0;
  for (
    const match of body.matchAll(
      /(?:^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1(?=\n|$)/g,
    )
  ) {
    max = Math.max(max, match[2].split(/\r?\n/).length);
  }
  return max;
}

function suggestedLayout(body: string, hybrid: HybridRule | null) {
  if (hybrid) return "Content with Caption";
  if (/<table\b|^\|.+\|$/m.test(body)) return "Title and Content";
  if (/\b(?:two-col|split|columns)\b/.test(body)) return "Two Content";
  return "Title and Content";
}

async function postprocessPowerPoint(
  draftPath: string,
  outputPath: string,
  entries: ConversionEntry[],
  buildDir: string,
  extensionDir: string,
) {
  const packageDir = join(buildDir, "package");
  Deno.mkdirSync(packageDir, { recursive: true });
  const unzipResult = await runProcess([
    "unzip",
    "-q",
    draftPath,
    "-d",
    packageDir,
  ]);
  if (unzipResult.code !== 0) {
    throw new Error(`Could not unpack generated PPTX: ${unzipResult.stderr}`);
  }

  const generatedSlides = [
    ...Deno.readDirSync(join(packageDir, "ppt", "slides")),
  ].filter((file) => /^slide\d+\.xml$/.test(file.name));
  if (generatedSlides.length !== entries.length) {
    throw new Error(
      `Quarto generated ${generatedSlides.length} PowerPoint slides for ${entries.length} selected source slides. ` +
        "Revise the normalized layout so every source slide maps to exactly one PowerPoint slide.",
    );
  }

  copyMasterMedia(packageDir, extensionDir);
  ensurePngContentType(packageDir);

  const slideDir = join(packageDir, "ppt", "slides");
  for (const file of Deno.readDirSync(slideDir)) {
    if (!/^slide\d+\.xml$/.test(file.name)) continue;
    const path = join(slideDir, file.name);
    const original = Deno.readTextFileSync(path);
    const slideNumber = Number(/\d+/.exec(file.name)?.[0] || 0);
    const entry = entries[slideNumber - 1];
    const defaultColored = entry && entry.layout !== "Title Slide" &&
        entry.layout !== "Section Header"
      ? forceSlideTextColor(original, "17324D")
      : original;
    const semantic = colorSemanticMarkers(defaultColored);
    const branded = entry &&
        (entry.layout === "Title Slide" || entry.layout === "Section Header")
      ? forceSlideTextColor(semantic, "FFFFFF")
      : semantic;
    const fitted = enableTextAutofit(branded);
    const patched = entry ? applySlideAltText(fitted, entry) : fitted;
    Deno.writeTextFileSync(path, patched);
  }

  patchSlideLayouts(packageDir, entries);
  recordActualSlideLayouts(packageDir, entries);

  const markerCount = countPackageMarkers(slideDir);
  if (markerCount) {
    throw new Error(
      `${markerCount} semantic marker(s) could not be converted to native PowerPoint color.`,
    );
  }

  if (exists(outputPath)) await Deno.remove(outputPath);
  const zipResult = await runProcess(
    ["zip", "-q", "-r", outputPath, "."],
    "",
    packageDir,
  );
  if (zipResult.code !== 0) {
    throw new Error(`Could not package generated PPTX: ${zipResult.stderr}`);
  }
  const testResult = await runProcess(["unzip", "-tqq", outputPath]);
  if (testResult.code !== 0) {
    throw new Error(
      `Generated PPTX package failed integrity check: ${testResult.stderr}`,
    );
  }
}

function enableTextAutofit(xml: string) {
  return xml
    .replace(
      /<a:bodyPr\b([^>]*)\/>/g,
      "<a:bodyPr$1><a:normAutofit/></a:bodyPr>",
    )
    .replace(
      /<a:bodyPr\b([^>]*)>([\s\S]*?)<\/a:bodyPr>/g,
      (_raw, attrs, children) => {
        if (/<a:(?:normAutofit|spAutoFit|noAutofit)\b/.test(children)) {
          return `<a:bodyPr${attrs}>${children}</a:bodyPr>`;
        }
        return `<a:bodyPr${attrs}><a:normAutofit/>${children}</a:bodyPr>`;
      },
    );
}

function applySlideAltText(xml: string, entry: ConversionEntry) {
  let imageIndex = 0;
  const patched = xml.replace(
    /(<p:pic>[\s\S]*?<p:cNvPr\b)([^>]*)(\/>)/g,
    (_raw, opening, attrs, close) => {
      const image = entry.images[imageIndex++];
      if (!image) return `${opening}${attrs}${close}`;
      const cleaned = String(attrs).replace(/\sdescr="[^"]*"/g, "");
      return `${opening}${cleaned} descr="${
        escapeXmlAttribute(image.altText)
      }"${close}`;
    },
  );
  if (imageIndex < entry.images.length) {
    throw new Error(
      `Slide ${entry.sourceSlideNumber} generated ${imageIndex} image object(s), but its report requires ${entry.images.length}.`,
    );
  }
  return patched;
}

function recordActualSlideLayouts(
  packageDir: string,
  entries: ConversionEntry[],
) {
  const names: Record<number, string> = {
    1: "Title Slide",
    2: "Title and Content",
    3: "Section Header",
    4: "Two Content",
    5: "Comparison",
    6: "Title Only",
    7: "Blank",
    8: "Content with Caption",
    9: "Picture with Caption",
    10: "Title and Vertical Text",
    11: "Vertical Title and Text",
  };
  const relsDir = join(packageDir, "ppt", "slides", "_rels");
  entries.forEach((entry, index) => {
    const relsPath = join(relsDir, `slide${index + 1}.xml.rels`);
    if (!exists(relsPath)) return;
    const xml = Deno.readTextFileSync(relsPath);
    const number = Number(/slideLayout(\d+)\.xml/.exec(xml)?.[1] || 0);
    if (names[number]) entry.layout = names[number];
  });
}

function forceSlideTextColor(xml: string, color: string) {
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
    )
    .replace(
      /<a:endParaRPr\b([^>]*)>([\s\S]*?)<\/a:endParaRPr>/g,
      (_raw, attrs, inner) => {
        const cleaned = String(inner).replace(
          /<a:solidFill>[\s\S]*?<\/a:solidFill>/g,
          "",
        );
        return `<a:endParaRPr${attrs}>${fill}${cleaned}</a:endParaRPr>`;
      },
    );
}

function patchSlideLayouts(packageDir: string, entries: ConversionEntry[]) {
  const relsDir = join(packageDir, "ppt", "slides", "_rels");
  entries.forEach((entry, index) => {
    const layoutNumber = entry.layout === "Title Slide"
      ? 1
      : entry.layout === "Section Header"
      ? 3
      : null;
    if (!layoutNumber) return;
    const relsPath = join(relsDir, `slide${index + 1}.xml.rels`);
    if (!exists(relsPath)) return;
    const xml = Deno.readTextFileSync(relsPath).replace(
      /Target="\.\.\/slideLayouts\/slideLayout\d+\.xml"/,
      `Target="../slideLayouts/slideLayout${layoutNumber}.xml"`,
    );
    Deno.writeTextFileSync(relsPath, xml);
  });
}

function copyMasterMedia(packageDir: string, extensionDir: string) {
  const mediaDir = join(packageDir, "ppt", "media");
  Deno.mkdirSync(mediaDir, { recursive: true });
  const masterAssets = [
    ["logos", "univ-ai-logo.png"],
    ["logos", "point32health-logo.png"],
    ["backgrounds", "univ-ai-section-background.png"],
  ];
  for (const [directory, name] of masterAssets) {
    Deno.copyFileSync(
      join(extensionDir, "powerpoint", "assets", directory, name),
      join(mediaDir, name),
    );
  }
}

function ensurePngContentType(packageDir: string) {
  const contentTypesPath = join(packageDir, "[Content_Types].xml");
  let xml = Deno.readTextFileSync(contentTypesPath);
  if (!/<Default\b[^>]*Extension="png"/i.test(xml)) {
    xml = xml.replace(
      "</Types>",
      '<Default Extension="png" ContentType="image/png"/></Types>',
    );
    Deno.writeTextFileSync(contentTypesPath, xml);
  }
}

function colorSemanticMarkers(xml: string) {
  return xml.replace(
    /<a:p>[\s\S]*?<\/a:p>/g,
    (paragraph) => colorParagraphMarkers(paragraph),
  );
}

function colorParagraphMarkers(input: string) {
  let paragraph = input;
  let marker = /\[\[HTMPRES:([a-z_]+)\]\]\s*/.exec(paragraph);
  while (marker) {
    const color = semanticColors[marker[1]] || semanticColors.neutral;
    const markerStart = marker.index;
    const markerEnd = markerStart + marker[0].length;
    const currentRunStart = paragraph.lastIndexOf("<a:r", markerStart);
    const currentRunEnd = paragraph.indexOf("</a:r>", markerEnd);
    const trailingText = currentRunEnd >= 0
      ? paragraph.slice(markerEnd, currentRunEnd).replace(/<[^>]+>/g, "").trim()
      : "";

    paragraph = `${paragraph.slice(0, markerStart)}${
      paragraph.slice(markerEnd)
    }`;
    const removedLength = markerEnd - markerStart;
    const adjustedRunEnd = currentRunEnd >= 0
      ? currentRunEnd - removedLength
      : -1;
    let targetStart = trailingText
      ? currentRunStart
      : paragraph.indexOf("<a:r", adjustedRunEnd + 1);
    if (targetStart >= 0) {
      const targetEnd = paragraph.indexOf("</a:r>", targetStart);
      if (targetEnd >= 0) {
        const end = targetEnd + "</a:r>".length;
        const colored = applyRunColor(paragraph.slice(targetStart, end), color);
        paragraph = `${paragraph.slice(0, targetStart)}${colored}${
          paragraph.slice(end)
        }`;
      }
    }
    marker = /\[\[HTMPRES:([a-z_]+)\]\]\s*/.exec(paragraph);
  }
  return paragraph;
}

function applyRunColor(run: string, color: string) {
  const fill = `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;
  if (/<a:rPr\b[^>]*\/>/.test(run)) {
    return run.replace(/<a:rPr\b([^>]*)\/>/, `<a:rPr$1>${fill}</a:rPr>`);
  }
  if (/<a:rPr\b[^>]*>/.test(run)) {
    return run.replace(
      /<a:rPr\b([^>]*)>([\s\S]*?)<\/a:rPr>/,
      (_raw, attrs, inner) => {
        const cleaned = String(inner).replace(
          /<a:solidFill>[\s\S]*?<\/a:solidFill>/g,
          "",
        );
        return `<a:rPr${attrs}>${fill}${cleaned}</a:rPr>`;
      },
    );
  }
  return run.replace(/<a:t>/, `<a:rPr lang="en-US">${fill}</a:rPr><a:t>`);
}

function countPackageMarkers(slideDir: string) {
  let count = 0;
  for (const file of Deno.readDirSync(slideDir)) {
    if (!/^slide\d+\.xml$/.test(file.name)) continue;
    const xml = Deno.readTextFileSync(join(slideDir, file.name));
    count += (xml.match(/\[\[HTMPRES:/g) || []).length;
  }
  return count;
}

function parseOptions(args: string[]): ParsedOptions {
  const decks: string[] = [];
  let family: DeckFamily | null = null;
  let output = "";
  let outputDir = "";
  let report = "";
  let slides: number[] = [];
  let keepIntermediate = false;
  const valueOptions = new Set([
    "--template",
    "--output",
    "--output-dir",
    "--report",
    "--slides",
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--keep-intermediate") {
      keepIntermediate = true;
      continue;
    }
    if (valueOptions.has(arg)) {
      const value = args[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      index += 1;
      if (arg === "--template") family = requireFamily(value);
      if (arg === "--output") output = value;
      if (arg === "--output-dir") outputDir = value;
      if (arg === "--report") report = value;
      if (arg === "--slides") slides = parseSlideSelection(value);
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown powerpoint option: ${arg}`);
    }
    decks.push(arg);
  }
  return { decks, family, output, outputDir, report, slides, keepIntermediate };
}

function parseSlideSelection(value: string) {
  const numbers = value.split(",").map((item) => Number(item.trim()));
  if (
    !numbers.length ||
    numbers.some((number) => !Number.isInteger(number) || number < 1)
  ) {
    throw new Error("--slides requires comma-separated positive integers.");
  }
  return [...new Set(numbers)];
}

function requireFamily(value: string): DeckFamily {
  if (
    value === "executive-funding" || value === "executive" ||
    value === "technical"
  ) {
    return value;
  }
  throw new Error(`Unknown PowerPoint template family: ${value}`);
}

function inferFamily(qmdPath: string): DeckFamily {
  const parent = basename(dirname(qmdPath)).toLowerCase();
  if (parent.includes("funding") || parent.includes("investment")) {
    return "executive-funding";
  }
  if (
    parent.includes("technical") || parent.includes("architecture") ||
    parent === "tech"
  ) {
    return "technical";
  }
  if (parent.includes("executive") || parent === "exec") return "executive";
  throw new Error(
    `Cannot infer PowerPoint template family from ${qmdPath}; pass --template.`,
  );
}

function powerPointOutputPath(
  qmdPath: string,
  family: DeckFamily,
  options: ParsedOptions,
  root: string,
) {
  if (options.output) return resolvePath(root, options.output);
  const name = options.slides.length
    ? `${family}-representative.pptx`
    : `${family}.pptx`;
  const dir = options.outputDir
    ? resolvePath(root, options.outputDir)
    : dirname(qmdPath);
  return join(dir, name);
}

function parseSlides(body: string): SourceSlide[] {
  const lines = body.split(/\r?\n/);
  const slides: SourceSlide[] = [];
  let current: SourceSlide | null = null;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;
  for (const line of lines) {
    const fence = /^(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceLen) {
        inFence = false;
      }
    }
    const heading = !inFence
      ? /^##\s+(.+?)(?:\s+(\{.*\}))?\s*$/.exec(line)
      : null;
    if (heading) {
      if (current) slides.push(current);
      current = {
        sourceNumber: slides.length + 1,
        title: unescapeHeading(heading[1].trim()),
        attrText: heading[2] || "",
        body: "",
      };
    } else if (current) {
      current.body += `${current.body ? "\n" : ""}${line}`;
    }
  }
  if (current) slides.push(current);
  return slides.map((slide) => ({ ...slide, body: slide.body.trim() }));
}

function extractNotes(body: string) {
  const lines = body.split(/\r?\n/);
  const bodyLines: string[] = [];
  const notes: string[] = [];
  let noteFence = 0;
  let current: string[] = [];
  for (const line of lines) {
    const opening = /^(:{3,})\s+(?:notes|\{\s*\.notes\s*\})\s*$/.exec(
      line.trim(),
    );
    if (!noteFence && opening) {
      noteFence = opening[1].length;
      current = [];
      continue;
    }
    if (
      noteFence && /^:+\s*$/.test(line.trim()) &&
      line.trim().length >= noteFence
    ) {
      notes.push(current.join("\n").trim());
      noteFence = 0;
      current = [];
      continue;
    }
    if (noteFence) current.push(line);
    else bodyLines.push(line);
  }
  if (noteFence) bodyLines.push(`${":".repeat(noteFence)} notes`, ...current);
  return {
    body: bodyLines.join("\n").trim(),
    notes: notes.filter(Boolean).join("\n\n"),
  };
}

function imageAltText(body: string) {
  return /!\[([^\]]+)\]\(/.exec(body)?.[1]?.trim() || "";
}

function cycleAltText(family: DeckFamily) {
  const suffix = family === "technical"
    ? "with the next controlled turn"
    : family === "executive"
    ? "showing how intent becomes shared, enforced, and evidenced"
    : "for managed AI work";
  return `Profile, catalog, runtime, and evidence cycle ${suffix}`;
}

function markdownImages(body: string) {
  return [...body.matchAll(/!\[([^\]]*)\]\(([^\n)]+)\)/g)].map((match) => ({
    alt: match[1],
    source: match[2],
  }));
}

function extractHtmlDivByClass(html: string, className: string) {
  const range = htmlDivRange(html, className);
  if (!range) return "";
  const openingEnd = html.indexOf(">", range.start) + 1;
  return html.slice(openingEnd, range.end).replace(/<\/div>\s*$/, "").trim();
}

function removeHtmlDivByClass(html: string, className: string) {
  const range = htmlDivRange(html, className);
  return range ? `${html.slice(0, range.start)}${html.slice(range.end)}` : html;
}

function htmlDivRange(html: string, className: string) {
  const openRe = new RegExp(
    `<div\\b[^>]*\\bclass=(?:"[^"]*\\b${
      escapeRegExp(className)
    }\\b[^"]*"|'[^']*\\b${escapeRegExp(className)}\\b[^']*')[^>]*>`,
    "i",
  );
  const opening = openRe.exec(html);
  if (!opening) return null;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = opening.index;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    if (match[0][1] === "/") {
      depth -= 1;
      if (depth === 0) return { start: opening.index, end: tagRe.lastIndex };
    } else {
      depth += 1;
    }
  }
  return null;
}

function closeFence(
  stack: Array<{
    fence: number;
    token: string;
    source: boolean;
    suppress: boolean;
  }>,
  fence: number,
) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].fence === fence) {
      stack.splice(index, 1);
      return;
    }
  }
  stack.pop();
}

function parsePandocAttrs(attrText = "") {
  const classes: string[] = [];
  const keyValues: Record<string, string> = {};
  const inner = attrText.trim().replace(/^\{|\}$/g, "");
  const tokenRe =
    /(?:^|\s)(#[^\s.{}]+|\.[^\s.{}]+|[A-Za-z_:][-A-Za-z0-9_:.]*=(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(inner))) {
    const token = match[1];
    if (token.startsWith(".")) classes.push(token.slice(1));
    else if (token.startsWith("#")) keyValues.id = token.slice(1);
    else {
      const eq = token.indexOf("=");
      const key = token.slice(0, eq);
      let value = token.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      keyValues[key] = value;
    }
  }
  return { classes, keyValues };
}

function splitFrontMatter(text: string) {
  if (!text.startsWith("---\n")) return { yaml: "", body: text };
  const end = text.indexOf("\n---", 4);
  if (end < 0) return { yaml: "", body: text };
  return {
    yaml: text.slice(4, end),
    body: text.slice(end + 4).replace(/^\s*\n/, ""),
  };
}

function requireSlide(slides: SourceSlide[], number: number, path: string) {
  const slide = slides[number - 1];
  if (!slide) {
    throw new Error(
      `Slide ${number} is outside 1..${slides.length} in ${path}`,
    );
  }
  return slide;
}

function resolveDeckPath(value: string, root: string) {
  const path = resolvePath(root, value);
  return basename(path).endsWith(".qmd") ? path : join(path, "index.qmd");
}

function resolvePath(root: string, path: string) {
  if (path.startsWith("/")) return normalizePath(path);
  return normalizePath(join(root, path));
}

function markdownPath(path: string) {
  return path.replace(/\\/g, "/").replace(/ /g, "%20");
}

function ensureParent(path: string) {
  Deno.mkdirSync(dirname(path), { recursive: true });
}

function exists(path: string) {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

async function runProcess(args: string[], input = "", cwd?: string) {
  const deno = Deno as unknown as {
    Command?: new (
      command: string,
      options: {
        args?: string[];
        cwd?: string;
        stdin?: "piped";
        stdout?: "piped";
        stderr?: "piped";
      },
    ) => {
      spawn: () => {
        stdin: WritableStream<Uint8Array>;
        output: () => Promise<
          { code: number; stdout: Uint8Array; stderr: Uint8Array }
        >;
      };
    };
    run?: (options: {
      cmd: string[];
      cwd?: string;
      stdin: "piped";
      stdout: "piped";
      stderr: "piped";
    }) => {
      stdin: {
        write: (bytes: Uint8Array) => Promise<number>;
        close: () => void;
      };
      status: () => Promise<{ code: number }>;
      output: () => Promise<Uint8Array>;
      stderrOutput: () => Promise<Uint8Array>;
      close: () => void;
    };
  };
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (typeof deno.Command === "function") {
    const command = new deno.Command(args[0], {
      args: args.slice(1),
      cwd,
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const child = command.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(input));
    await writer.close();
    const result = await child.output();
    return {
      code: result.code,
      stdout: decoder.decode(result.stdout),
      stderr: decoder.decode(result.stderr),
    };
  }

  if (typeof deno.run !== "function") {
    throw new Error(
      "This Quarto Deno runtime exposes neither Deno.run nor Deno.Command.",
    );
  }
  const process = deno.run({
    cmd: args,
    cwd,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  await process.stdin.write(encoder.encode(input));
  process.stdin.close();
  const [status, stdout, stderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();
  return {
    code: status.code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
}

function copyRecursive(source: string, destination: string) {
  const stat = Deno.statSync(source);
  if (stat.isDirectory) {
    Deno.mkdirSync(destination, { recursive: true });
    for (const entry of Deno.readDirSync(source)) {
      copyRecursive(join(source, entry.name), join(destination, entry.name));
    }
  } else {
    ensureParent(destination);
    Deno.copyFileSync(source, destination);
  }
}

function normalizePath(path: string) {
  const absolute = path.startsWith("/");
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return `${absolute ? "/" : ""}${parts.join("/")}` || (absolute ? "/" : ".");
}

function join(...parts: string[]) {
  return normalizePath(parts.filter(Boolean).join("/"));
}

function dirname(path: string) {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf("/");
  if (index <= 0) return index === 0 ? "/" : ".";
  return normalized.slice(0, index);
}

function basename(path: string) {
  return normalizePath(path).split("/").pop() || "";
}

function relativePath(from: string, to: string) {
  const fromParts = normalizePath(from).split("/").filter(Boolean);
  const toParts = normalizePath(to).split("/").filter(Boolean);
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  return [...fromParts.map(() => ".."), ...toParts].join("/") || ".";
}

function escapeHeading(value: string) {
  return value.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function unescapeHeading(value: string) {
  return value.replace(/\\([{}])/g, "$1");
}

function escapeAlt(value: string) {
  return value.replace(/\]/g, "\\]").replace(/\n/g, " ");
}

function escapeXmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(
    /</g,
    "&lt;",
  ).replace(/>/g, "&gt;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
