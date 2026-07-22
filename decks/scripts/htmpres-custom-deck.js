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
let hasRendered = false;
let textFitFrame = 0;
let viewportFrame = 0;
const deckNotes = readDeckNotes();
const slideFragmentStates = new WeakMap();
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

function updateViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  if (!height) return;
  document.documentElement.style.setProperty("--htmpres-viewport-height", `${Math.floor(height)}px`);
  document.documentElement.style.setProperty(
    "--htmpres-mobile-browser-clearance",
    `${mobileBrowserChromeClearance(height)}px`,
  );
}

function mobileBrowserChromeClearance(height) {
  const isMobileTouch = window.matchMedia?.("(max-width: 980px) and (pointer: coarse)")?.matches;
  const isPortrait = window.matchMedia?.("(orientation: portrait)")?.matches;
  const isStandalone = window.navigator.standalone || window.matchMedia?.("(display-mode: standalone)")?.matches;
  const screenHeight = Math.max(window.screen?.height || 0, window.screen?.availHeight || 0);
  if (!isMobileTouch || !isPortrait || isStandalone || !screenHeight) return 0;
  return height >= screenHeight * 0.9 ? 112 : 0;
}

function scheduleViewportLayout() {
  if (viewportFrame) cancelAnimationFrame(viewportFrame);
  viewportFrame = requestAnimationFrame(() => {
    viewportFrame = 0;
    updateViewportHeight();
    scaleDeck();
    scheduleTextFit();
  });
}

function scheduleTextFit() {
  if (textFitFrame) cancelAnimationFrame(textFitFrame);
  textFitFrame = requestAnimationFrame(() => {
    textFitFrame = 0;
    fitSlideText(slides[current]);
  });
}

function fitSlideText(slide) {
  if (!slide) return;
  if (!slideTextFitEnabled(slide)) {
    resetTextFit(slide);
    return;
  }
  if (!slide.classList.contains("active")) return;

  const minScale = textFitMinimum(slide);
  let scale = 1;
  slide.classList.add("htmpres-text-fit-active");
  slide.classList.remove("htmpres-text-fit-overflow");
  slide.style.setProperty("--htmpres-text-fit-scale", "1");

  let overflow = slideOverflowRatio(slide);
  for (let attempt = 0; attempt < 8 && overflow > 1.01 && scale > minScale; attempt += 1) {
    const nextScale = Math.max(minScale, Math.min((scale / overflow) * 0.985, scale - 0.01));
    if (Math.abs(nextScale - scale) < 0.002) break;
    scale = nextScale;
    slide.style.setProperty("--htmpres-text-fit-scale", scale.toFixed(4));
    overflow = slideOverflowRatio(slide);
  }

  slide.dataset.textFitScale = scale.toFixed(3);
  slide.classList.toggle("htmpres-text-fit-overflow", overflow > 1.02 && scale <= minScale + 0.002);
}

function resetTextFit(slide) {
  slide.classList.remove("htmpres-text-fit-active", "htmpres-text-fit-overflow");
  slide.style.removeProperty("--htmpres-text-fit-scale");
  delete slide.dataset.textFitScale;
}

function slideTextFitEnabled(slide) {
  if (truthy(slide.dataset.textFit) || truthy(slide.dataset.autoscale) || slide.classList.contains("autoscale")) return true;
  if (falsy(slide.dataset.textFit) || falsy(slide.dataset.autoscale) || slide.classList.contains("no-autoscale")) return false;
  return truthy(document.documentElement.dataset.textFit) || truthy(document.documentElement.dataset.autoscale);
}

function textFitMinimum(slide) {
  const style = getComputedStyle(slide);
  return clampNumber(
    slide.dataset.textFitMin ||
      slide.dataset.autoscaleMin ||
      document.documentElement.dataset.textFitMin ||
      style.getPropertyValue("--htmpres-text-fit-min"),
    0.45,
    1,
    0.62,
  );
}

function slideOverflowRatio(slide) {
  if (!slide.clientWidth || !slide.clientHeight) return 1;
  return Math.max(slide.scrollWidth / slide.clientWidth, slide.scrollHeight / slide.clientHeight);
}

function truthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function falsy(value) {
  return /^(0|false|no|off)$/i.test(String(value || "").trim());
}

function clampNumber(value, min, max, fallback) {
  const number = Number.parseFloat(String(value || "").trim());
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function goTo(index) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  const direction = !hasRendered || next === current ? "none" : next > current ? "next" : "prev";
  const shouldResetSteps = !hasRendered || next !== current;
  current = next;
  document.documentElement.dataset.slideDirection = direction;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
  Array.from(tocList?.children || []).forEach((btn, i) => btn.classList.toggle("active", i === current));
  Array.from(overviewGrid?.children || []).forEach((card, i) => card.classList.toggle("active", i === current));
  if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  if (progressBar) progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  if (shouldResetSteps) resetSlideSteps(slides[current]);
  updateNotes();
  syncSlideMedia();
  scheduleTextFit();
  hasRendered = true;
  if (location.hash !== `#/${current + 1}`) history.replaceState(null, "", `#/${current + 1}`);
}

function prepareSlideTransitions() {
  slides.forEach((slide) => {
    const transition = sanitizeClassToken(slide.dataset.transition || "");
    if (transition) slide.classList.add(`transition-${transition}`);
  });
}

function prepareFragments() {
  slides.forEach((slide) => {
    const fragments = [];
    const seen = new Set();

    slide.querySelectorAll(".fragment").forEach((fragment) => addFragment(fragments, seen, fragment));
    slide.querySelectorAll(".incremental > li, .incremental > ol > li, .incremental > ul > li, ol.incremental > li, ul.incremental > li").forEach((item) => {
      item.classList.add("fragment");
      const owner = item.closest(".incremental");
      if (owner?.dataset.fragmentEffect && !item.dataset.fragmentEffect) {
        item.dataset.fragmentEffect = owner.dataset.fragmentEffect;
      }
      addFragment(fragments, seen, item);
    });

    if (!fragments.length) return;
    slide.classList.add("has-fragments");
    fragments.sort((a, b) => {
      if (a.element === b.element) return 0;
      return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
    });
    let nextIndex = 1;
    fragments.forEach((fragment) => {
      const explicit = Number(fragment.element.dataset.fragmentIndex);
      if (Number.isFinite(explicit)) {
        fragment.index = Math.max(0, Math.floor(explicit));
        nextIndex = Math.max(nextIndex, fragment.index + 1);
      } else {
        fragment.index = nextIndex;
        nextIndex += 1;
      }
      const effect = sanitizeClassToken(fragment.element.dataset.fragmentEffect || "");
      if (effect) fragment.element.classList.add(`fragment-${effect}`);
    });
    slideFragmentStates.set(slide, {
      fragments,
      maxSteps: Math.max(...fragments.map((fragment) => fragment.index)),
      step: 0,
    });
  });
}

function addFragment(fragments, seen, element) {
  if (seen.has(element)) return;
  seen.add(element);
  fragments.push({ element, index: 0 });
}

function sanitizeClassToken(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function resetSlideSteps(slide) {
  resetFragmentStep(slide);
  resetCodeStep(slide);
}

function resetFragmentStep(slide) {
  const state = slideFragmentStates.get(slide);
  if (!state) return;
  state.step = 0;
  applyFragmentStep(slide);
}

function advanceFragmentStep() {
  const state = slideFragmentStates.get(slides[current]);
  if (!state || state.step >= state.maxSteps) return false;
  state.step += 1;
  applyFragmentStep(slides[current]);
  return true;
}

function retreatFragmentStep() {
  const state = slideFragmentStates.get(slides[current]);
  if (!state || state.step <= 0) return false;
  state.step -= 1;
  applyFragmentStep(slides[current]);
  return true;
}

function applyFragmentStep(slide) {
  const state = slideFragmentStates.get(slide);
  if (!state) return;
  state.fragments.forEach((fragment) => {
    const visible = fragment.index <= state.step;
    const currentFragment = fragment.index === state.step && state.step > 0;
    fragment.element.classList.toggle("fragment-visible", visible);
    fragment.element.classList.toggle("fragment-current", currentFragment);
    fragment.element.classList.toggle("fragment-past", visible && fragment.index < state.step);
    fragment.element.setAttribute("aria-hidden", visible ? "false" : "true");
  });
}

function settleFragmentStep(slide) {
  const state = slideFragmentStates.get(slide);
  if (!state || state.step < state.maxSteps) return;
  state.fragments.forEach((fragment) => {
    fragment.element.classList.remove("fragment-current");
    fragment.element.classList.toggle("fragment-past", fragment.index <= state.step);
  });
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
  if (advanceFragmentStep()) return;
  settleFragmentStep(slides[current]);
  if (advanceCodeStep()) return;
  goTo(current + 1);
}

function prevStepOrSlide() {
  if (retreatCodeStep()) return;
  if (retreatFragmentStep()) return;
  goTo(current - 1);
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

function wireTapNavigation() {
  if (!slideFit) return;

  let touchStart = null;
  let suppressClickUntil = 0;
  const swipeDistance = 48;
  const swipeVerticalTolerance = 0.8;
  const swipeMaxDuration = 800;

  slideFit.addEventListener("click", (event) => {
    if (performance.now() < suppressClickUntil) return;
    if (event.defaultPrevented || ("button" in event && event.button !== 0) || interactiveTapTarget(event.target)) return;
    const rect = slideFit.getBoundingClientRect();
    if (!rect.width) return;
    const x = event.clientX - rect.left;
    if (x < rect.width * 0.28) {
      prevStepOrSlide();
    } else {
      nextStepOrSlide();
    }
  });

  slideFit.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1 || interactiveTapTarget(event.target)) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  }, { passive: true });

  slideFit.addEventListener("touchend", (event) => {
    if (!touchStart || interactiveTapTarget(event.target)) {
      touchStart = null;
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) {
      touchStart = null;
      return;
    }
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const duration = performance.now() - touchStart.time;
    touchStart = null;
    if (Math.abs(dx) < swipeDistance) return;
    if (Math.abs(dy) > Math.abs(dx) * swipeVerticalTolerance) return;
    if (duration > swipeMaxDuration) return;
    suppressClickUntil = performance.now() + 650;
    if (dx < 0) {
      nextStepOrSlide();
    } else {
      prevStepOrSlide();
    }
  }, { passive: true });

  slideFit.addEventListener("touchcancel", () => {
    touchStart = null;
  }, { passive: true });
}

function interactiveTapTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(
    "a, button, input, select, textarea, summary, label, pre, code, video, audio, iframe, object, embed, [contenteditable], [role='button'], .sourceCode, .zoomable, .no-tap-nav, .no-slide-nav, [data-no-tap-nav], [data-no-slide-nav]",
  ));
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
window.addEventListener("resize", scheduleViewportLayout);
window.addEventListener("orientationchange", scheduleViewportLayout);
window.visualViewport?.addEventListener("resize", scheduleViewportLayout);
window.visualViewport?.addEventListener("scroll", scheduleViewportLayout);
window.addEventListener("load", scheduleTextFit);
document.fonts?.ready?.then(scheduleTextFit)?.catch(() => {});
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

updateViewportHeight();
buildNav();
wireZoom();
wireTapNavigation();
wireMediaDirectives();
prepareSlideTransitions();
prepareFragments();
prepareCodeSteppers();
scaleDeck();
goTo(initialSlideFromHash());
