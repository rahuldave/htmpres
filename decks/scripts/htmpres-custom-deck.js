const slides = Array.from(document.querySelectorAll(".slide"));
const tocList = document.getElementById("tocList");
const overview = document.getElementById("overview");
const overviewGrid = document.getElementById("overviewGrid");
const notesBox = document.getElementById("notesBox");
const presenterNotes = document.getElementById("presenterNotes");
const counter = document.getElementById("counter");
const progressBar = document.getElementById("progressBar");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const overviewBtn = document.getElementById("overviewBtn");
const slideFit = document.getElementById("slideFit");
const zoom = document.getElementById("zoom");
const zoomImg = document.getElementById("zoomImg");
const zoomClose = document.getElementById("zoomClose");
let current = 0;
const deckNotes = readDeckNotes();
const slideCodeStates = new WeakMap();

function buildNav() {
  slides.forEach((slide, index) => {
    const title = slide.dataset.title || slide.querySelector("h2")?.textContent || `Slide ${index + 1}`;
    const section = slide.dataset.section || "";
    const nav = document.createElement("button");
    nav.textContent = `${index + 1}. ${title}`;
    nav.addEventListener("click", () => goTo(index));
    tocList?.appendChild(nav);

    const card = document.createElement("button");
    card.className = "overview-card";
    card.innerHTML = `<small>${index + 1} / ${slides.length}${section ? ` - ${section}` : ""}</small><strong>${title}</strong>`;
    card.addEventListener("click", () => {
      overview?.classList.remove("visible");
      goTo(index);
    });
    overviewGrid?.appendChild(card);
  });
}

function scaleDeck() {
  if (!slideFit) return;
  const stage = slideFit.parentElement;
  if (!stage) return;
  const width = 1280;
  const height = 720;
  const rect = stage.getBoundingClientRect();
  const scale = Math.min(rect.width / width, rect.height / height, 1);
  document.documentElement.style.setProperty("--deck-scale", scale.toString());
  slideFit.style.width = `${width * scale}px`;
  slideFit.style.height = `${height * scale}px`;
}

function goTo(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
  Array.from(tocList?.children || []).forEach((btn, i) => btn.classList.toggle("active", i === current));
  Array.from(overviewGrid?.children || []).forEach((card, i) => card.classList.toggle("active", i === current));
  if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  if (progressBar) progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  resetCodeStep(slides[current]);
  updateNotes();
  syncSlideMedia();
  if (location.hash !== `#/${current + 1}`) history.replaceState(null, "", `#/${current + 1}`);
}

function prepareCodeSteppers() {
  slides.forEach((slide) => {
    const blocks = [];
    slide.querySelectorAll("div.sourceCode, pre, code").forEach((root) => {
      if (!hasCodeDirective(root)) return;
      if (root.matches("pre, code") && root.closest("div.sourceCode[data-highlight], div.sourceCode[data-steps], div.sourceCode[data-highlight-steps]")) return;

      const code = root.matches("code") ? root : root.querySelector("code");
      if (!code) return;

      const lines = codeLineNodes(code);
      if (!lines.length) return;

      const highlight = getCodeData(root, code, "highlight");
      const steps = getCodeData(root, code, "steps") || getCodeData(root, code, "highlightSteps");
      const staticLines = parseLineSelection(highlight, lines.length);
      const stepLines = parseStepSelections(steps, lines.length);
      if (!staticLines.size && !stepLines.length) return;

      root.classList.add("code-stepper");
      blocks.push({ root, lines, staticLines, stepLines });
    });

    if (!blocks.length) return;
    slideCodeStates.set(slide, {
      blocks,
      maxSteps: Math.max(...blocks.map((block) => block.stepLines.length)),
      step: 0,
    });
  });
}

function hasCodeDirective(root) {
  return Boolean(root.dataset.highlight || root.dataset.steps || root.dataset.highlightSteps);
}

function getCodeData(root, code, key) {
  const pre = code.closest("pre");
  return root.dataset[key] || pre?.dataset[key] || code.dataset[key] || "";
}

function codeLineNodes(code) {
  const pandocLines = Array.from(code.children).filter((child) => {
    if (child.tagName !== "SPAN") return false;
    return Boolean(child.dataset.line || /-\d+$/.test(child.id || ""));
  });

  const lines = pandocLines.length ? pandocLines : wrapPlainCodeLines(code);
  lines.forEach((line, index) => {
    line.classList.add("code-line");
    line.dataset.line = String(lineNumber(line, index));
  });
  return lines;
}

function wrapPlainCodeLines(code) {
  const text = code.textContent || "";
  const hadTrailingNewline = /\n$/.test(text);
  const parts = text.replace(/\n$/, "").split("\n");
  code.textContent = "";
  const lines = parts.map((part, index) => {
    const line = document.createElement("span");
    line.textContent = part || "\u200b";
    code.appendChild(line);
    if (index < parts.length - 1 || hadTrailingNewline) code.appendChild(document.createTextNode("\n"));
    return line;
  });
  return lines;
}

function lineNumber(line, index) {
  const dataLine = Number(line.dataset.line);
  if (Number.isFinite(dataLine) && dataLine > 0) return dataLine;
  const match = /-(\d+)$/.exec(line.id || "");
  return match ? Number(match[1]) : index + 1;
}

function parseStepSelections(value, lineCount) {
  if (!value) return [];
  return value.split("|").map((part) => parseLineSelection(part, lineCount));
}

function parseLineSelection(value, lineCount) {
  const selected = new Set();
  const raw = (value || "").trim().toLowerCase();
  if (!raw || raw === "none") return selected;
  if (raw === "all") {
    for (let line = 1; line <= lineCount; line += 1) selected.add(line);
    return selected;
  }

  raw.split(/[,\s]+/).forEach((part) => {
    if (!part) return;
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (range) {
      const start = Math.max(1, Math.min(Number(range[1]), Number(range[2])));
      const end = Math.min(lineCount, Math.max(Number(range[1]), Number(range[2])));
      for (let line = start; line <= end; line += 1) selected.add(line);
      return;
    }
    const line = Number(part);
    if (Number.isInteger(line) && line >= 1 && line <= lineCount) selected.add(line);
  });
  return selected;
}

function resetCodeStep(slide) {
  const state = slideCodeStates.get(slide);
  if (!state) return;
  state.step = 0;
  applyCodeStep(slide);
}

function advanceCodeStep() {
  const state = slideCodeStates.get(slides[current]);
  if (!state || state.maxSteps < 2 || state.step >= state.maxSteps - 1) return false;
  state.step += 1;
  applyCodeStep(slides[current]);
  return true;
}

function retreatCodeStep() {
  const state = slideCodeStates.get(slides[current]);
  if (!state || state.step <= 0) return false;
  state.step -= 1;
  applyCodeStep(slides[current]);
  return true;
}

function applyCodeStep(slide) {
  const state = slideCodeStates.get(slide);
  if (!state) return;

  state.blocks.forEach((block) => {
    const stepSet = block.stepLines.length ? block.stepLines[Math.min(state.step, block.stepLines.length - 1)] : null;
    const activeLines = new Set(block.staticLines);
    if (stepSet) stepSet.forEach((line) => activeLines.add(line));
    const shouldDim = Boolean(stepSet && activeLines.size);

    block.lines.forEach((line) => {
      const active = activeLines.has(Number(line.dataset.line));
      line.classList.toggle("code-line-highlight", active);
      line.classList.toggle("code-line-dim", shouldDim && !active);
    });

    block.root.classList.toggle("code-step-active", Boolean(block.stepLines.length));
    if (block.stepLines.length) {
      block.root.dataset.activeStep = String(Math.min(state.step + 1, block.stepLines.length));
    } else {
      delete block.root.dataset.activeStep;
    }
  });
}

function nextStepOrSlide() {
  if (!advanceCodeStep()) goTo(current + 1);
}

function prevStepOrSlide() {
  if (!retreatCodeStep()) goTo(current - 1);
}

function updateNotes() {
  const noteHtml = deckNotes[current] || "";
  if (presenterNotes) {
    presenterNotes.innerHTML = noteHtml || '<p class="presenter-note-empty">No presenter notes for this slide.</p>';
  }
  if (!notesBox) return;
  const note = slides[current]?.querySelector(".notes");
  notesBox.innerHTML = noteHtml || (note ? note.innerHTML : "No speaker notes for this slide.");
}

function toggleNotes() {
  if (!notesBox) return;
  notesBox?.classList.toggle("visible");
}

function toggleOverview() {
  overview?.classList.toggle("visible");
}

function closeOverlays() {
  overview?.classList.remove("visible");
  zoom?.classList.remove("visible");
  notesBox?.classList.remove("visible");
}

function wireZoom() {
  document.querySelectorAll(".zoomable").forEach((image) => {
    image.addEventListener("click", () => {
      if (!zoom || !zoomImg) return;
      zoomImg.src = image.currentSrc || image.src;
      zoomImg.alt = image.alt || "Zoomed diagram";
      zoom.classList.add("visible");
    });
  });
  zoomClose?.addEventListener("click", () => zoom?.classList.remove("visible"));
  zoom?.addEventListener("click", (event) => {
    if (event.target === zoom) zoom.classList.remove("visible");
  });
}

function wireMediaDirectives() {
  document.querySelectorAll("video, audio").forEach((media) => {
    if (media.classList.contains("ds-controls")) media.setAttribute("controls", "");
    if (media.classList.contains("ds-autoplay")) media.setAttribute("autoplay", "");
    if (media.classList.contains("ds-loop")) media.setAttribute("loop", "");
    if (media.classList.contains("ds-muted")) {
      media.muted = true;
      media.setAttribute("muted", "");
    }
    if (media.classList.contains("ds-hide")) media.setAttribute("aria-hidden", "true");
    if (media.classList.contains("ds-autoadvance")) {
      media.addEventListener("ended", () => {
        if (slides[current]?.contains(media)) goTo(current + 1);
      });
    }
  });
}

function syncSlideMedia() {
  slides.forEach((slide, index) => {
    slide.querySelectorAll("video, audio").forEach((media) => {
      if (index === current) {
        if (media.classList.contains("ds-autoplay")) media.play?.().catch(() => {});
        return;
      }
      media.pause?.();
      if (!media.classList.contains("ds-keep-time")) {
        try {
          media.currentTime = 0;
        } catch {
          // Some streaming sources do not allow seeking until metadata loads.
        }
      }
    });
  });
}

function readDeckNotes() {
  const node = document.getElementById("deckNotes");
  if (!node) return [];
  try {
    const parsed = JSON.parse(node.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initialSlideFromHash() {
  const match = /^#\/(\d+)/.exec(location.hash);
  if (!match) return 0;
  return Number(match[1]) - 1;
}

prevBtn?.addEventListener("click", prevStepOrSlide);
nextBtn?.addEventListener("click", nextStepOrSlide);
overviewBtn?.addEventListener("click", toggleOverview);
overview?.addEventListener("click", (event) => {
  if (event.target === overview) overview.classList.remove("visible");
});
window.addEventListener("resize", scaleDeck);
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
    event.preventDefault();
    nextStepOrSlide();
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    prevStepOrSlide();
  }
  if (event.key === "Home") goTo(0);
  if (event.key === "End") goTo(slides.length - 1);
  if (event.key.toLowerCase() === "o") toggleOverview();
  if (event.key.toLowerCase() === "n") toggleNotes();
  if (event.key === "Escape") closeOverlays();
  if (event.key.toLowerCase() === "f" && document.fullscreenEnabled) {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
});

buildNav();
wireZoom();
wireMediaDirectives();
prepareCodeSteppers();
scaleDeck();
goTo(initialSlideFromHash());
