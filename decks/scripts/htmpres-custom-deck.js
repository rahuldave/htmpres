const slides = Array.from(document.querySelectorAll(".slide"));
const tocList = document.getElementById("tocList");
const overview = document.getElementById("overview");
const overviewGrid = document.getElementById("overviewGrid");
const slidesViewport = document.getElementById("slides");
const scrollCue = document.getElementById("scrollCue");
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
const slideEquationStates = new WeakMap();
const slideStepStates = new WeakMap();
const firstAppendixIndex = slides.findIndex((slide) => slide.dataset.kind === "appendix");
const mainSlideCount = firstAppendixIndex < 0 ? slides.length : firstAppendixIndex;
const lastMainSlide = Math.max(0, mainSlideCount - 1);
const mobileDeckFlowQuery = "(max-width: 980px)";

function buildNav() {
  slides.forEach((slide, index) => {
    const title = slide.dataset.title || slide.querySelector("h2")?.textContent || `Slide ${index + 1}`;
    const section = slide.dataset.section || "";
    const nav = document.createElement("button");
    nav.textContent = `${slidePosition(index).label}. ${title}`;
    nav.addEventListener("click", () => goTo(index));
    tocList?.appendChild(nav);

    const card = document.createElement("button");
    card.className = "overview-card";
    const label = document.createElement("small");
    label.textContent = `${slidePosition(index).counter}${section ? ` - ${section}` : ""}`;
    const heading = document.createElement("strong");
    heading.textContent = title;
    card.append(label, heading);
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
  if (mobileDeckFlowActive()) {
    document.documentElement.style.setProperty("--deck-scale", "1");
    slideFit.style.removeProperty("width");
    slideFit.style.removeProperty("height");
    return;
  }
  const width = 1280;
  const height = 720;
  const rect = stage.getBoundingClientRect();
  const stageStyle = getComputedStyle(stage);
  const availableWidth = Math.max(0, rect.width - cssPixels(stageStyle.paddingLeft) - cssPixels(stageStyle.paddingRight));
  const availableHeight = Math.max(0, rect.height - cssPixels(stageStyle.paddingTop) - cssPixels(stageStyle.paddingBottom));
  const scale = Math.min(availableWidth / width, availableHeight / height, 1);
  document.documentElement.style.setProperty("--deck-scale", scale.toString());
  slideFit.style.width = `${width * scale}px`;
  slideFit.style.height = `${height * scale}px`;
}

function mobileDeckFlowActive() {
  return window.matchMedia?.(mobileDeckFlowQuery)?.matches || false;
}

function cssPixels(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  if (!slide) {
    updateScrollCue();
    return;
  }
  slide.classList.remove("htmpres-text-fit-overflow");
  if (!slideTextFitEnabled(slide)) {
    resetTextFit(slide);
    updateScrollCue();
    return;
  }
  if (!slide.classList.contains("active")) {
    updateScrollCue();
    return;
  }

  const minScale = textFitMinimum(slide);
  let scale = 1;
  slide.classList.add("htmpres-text-fit-active");
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
  updateScrollCue();
}

function resetTextFit(slide) {
  slide.classList.remove("htmpres-text-fit-active", "htmpres-text-fit-overflow");
  slide.style.removeProperty("--htmpres-text-fit-scale");
  delete slide.dataset.textFitScale;
}

function slideTextFitEnabled(slide) {
  if (truthy(slide.dataset.textFit) || truthy(slide.dataset.autoscale) || slide.classList.contains("autoscale")) return true;
  if (falsy(slide.dataset.textFit) || falsy(slide.dataset.autoscale) || slide.classList.contains("no-autoscale")) return false;
  if (fitOverflowPolicy(slide)) return true;
  return truthy(document.documentElement.dataset.textFit) || truthy(document.documentElement.dataset.autoscale);
}

function fitOverflowPolicy(slide) {
  const mode = String(slide.dataset.overflow || document.documentElement.dataset.overflow || "").trim().toLowerCase();
  return mode === "fit" || mode === "fit-scroll";
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

function wireScrollCue() {
  slides.forEach((slide) => slide.addEventListener("scroll", updateScrollCue, { passive: true }));
}

function updateScrollCue() {
  const slide = slides[current];
  if (!slidesViewport || !scrollCue || !slide) return;
  const overflowY = getComputedStyle(slide).overflowY;
  const scrollOverflow = slide.scrollHeight - slide.clientHeight;
  const canScroll = /(auto|scroll)/.test(overflowY) && scrollOverflow > 12;
  const atEnd = !canScroll || slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 12;
  slide.classList.toggle("htmpres-slide-scrollable", canScroll);
  slide.classList.toggle("htmpres-slide-scrolled-end", atEnd);
  slidesViewport.classList.toggle("scroll-cue-visible", canScroll && !atEnd);
  scrollCue.hidden = !(canScroll && !atEnd);
}

function resetInactiveScrollState(activeSlide) {
  slides.forEach((slide) => {
    if (slide === activeSlide) return;
    slide.classList.remove("htmpres-slide-scrollable", "htmpres-slide-scrolled-end");
  });
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

function slidePosition(index) {
  const inAppendix = firstAppendixIndex >= 0 && index >= firstAppendixIndex;
  const position = inAppendix ? index - firstAppendixIndex + 1 : index + 1;
  const total = inAppendix ? slides.length - firstAppendixIndex : mainSlideCount;
  return {
    label: inAppendix ? `A${position}` : String(position),
    counter: `${inAppendix ? "Appendix " : ""}${position} / ${total}`,
    progress: total ? position / total : 0,
  };
}

function goTo(index, options = {}) {
  if (!slides.length) return;
  const next = Math.max(0, Math.min(slides.length - 1, index));
  const direction = !hasRendered || next === current ? "none" : next > current ? "next" : "prev";
  const shouldResetSteps = !hasRendered || next !== current;
  current = next;
  document.documentElement.dataset.slideDirection = direction;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
  if (shouldResetSteps) {
    slides[current].scrollTop = 0;
    slides[current].scrollLeft = 0;
  }
  resetInactiveScrollState(slides[current]);
  updateScrollCue();
  Array.from(tocList?.children || []).forEach((btn, i) => btn.classList.toggle("active", i === current));
  Array.from(overviewGrid?.children || []).forEach((card, i) => card.classList.toggle("active", i === current));
  const position = slidePosition(current);
  if (counter) counter.textContent = position.counter;
  if (progressBar) progressBar.style.width = `${position.progress * 100}%`;
  if (shouldResetSteps) resetSlideSteps(slides[current]);
  updateNotes();
  syncSlideMedia();
  scheduleTextFit();
  hasRendered = true;
  updateNavigationButtons();
  const hash = options.hash || `#/${current + 1}`;
  if (options.history !== "none" && location.hash !== hash) {
    const method = options.history === "push" ? "pushState" : "replaceState";
    history[method](null, "", hash);
  }
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
      addFragment(fragments, seen, item);
    });
    if (!fragments.length) return;
    slide.classList.add("has-fragments");
    fragments.sort((a, b) => documentOrder(a.element, b.element));
    fragments.forEach((fragment) => {
      const value = fragment.element.dataset.fragmentIndex;
      const explicit = value === undefined ? NaN : Number(value);
      fragment.explicitIndex = Number.isInteger(explicit) && explicit >= 0 ? explicit : null;
      // An explicit span inherits its nearest incremental container too. It
      // must not require a list wrapper to receive the author's dim effect.
      const owner = fragment.element.closest(".incremental[data-fragment-effect]");
      const effect = sanitizeClassToken(fragment.element.dataset.fragmentEffect || owner?.dataset.fragmentEffect || "");
      if (effect) fragment.element.classList.add(`fragment-${effect}`);
    });
    slideFragmentStates.set(slide, { fragments, step: 0 });
  });
}

function documentOrder(a, b) {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
}

function addFragment(fragments, seen, element) {
  if (seen.has(element)) return;
  seen.add(element);
  fragments.push({ element, index: 0 });
}

function sanitizeClassToken(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// Collapse shared and sparse author indices into real frames. Every event in
// a frame takes effect together, so no empty indices consume a keypress.
function compileStepGraph(events) {
  let nextIndex = 1;
  const assigned = events.map((event) => {
    const index = event.explicitIndex === null ? nextIndex : event.explicitIndex;
    nextIndex = Math.max(nextIndex, index + 1);
    return { ...event, index };
  });
  return { events: assigned, frames: [...new Set(assigned.map((event) => event.index).filter((index) => index > 0))].sort((a, b) => a - b), cursor: 0 };
}

function prepareStepGraphs() {
  slides.forEach((slide) => {
    const fragments = slideFragmentStates.get(slide)?.fragments || [];
    const codeBlocks = slideCodeStates.get(slide)?.blocks || [];
    const equationBlocks = slideEquationStates.get(slide)?.blocks || [];
    const legacyCodeOnly = !fragments.length && !equationBlocks.length && codeBlocks.every((block) => !block.stepIndices);
    const events = fragments.map((fragment) => ({ type: "fragment", target: fragment, element: fragment.element, explicitIndex: fragment.explicitIndex, snapshot: 0 }));
    for (const [type, blocks] of [["code", codeBlocks], ["equation", equationBlocks]]) {
      blocks.forEach((block) => {
        const snapshots = type === "code" ? block.stepLines : block.stepTerms;
        // Only legacy code-only decks expose snapshot 1 before advancing.
        // Mixed lanes include their first snapshot in source order.
        block.baseline = legacyCodeOnly ? 0 : -1;
        snapshots.forEach((_, snapshot) => {
          if (legacyCodeOnly && snapshot === 0) return;
          events.push({
            type, target: block, element: block.root, snapshot,
            explicitIndex: block.stepIndices?.[snapshot] ?? (legacyCodeOnly ? snapshot : null),
          });
        });
      });
    }
    events.sort((a, b) => documentOrder(a.element, b.element) || a.snapshot - b.snapshot);
    const state = compileStepGraph(events);
    state.events.forEach((event) => {
      if (event.type === "fragment") event.target.index = event.index;
    });
    slideStepStates.set(slide, state);
  });
}

function resetSlideSteps(slide) {
  const state = slideStepStates.get(slide);
  if (state) state.cursor = 0;
  applySlideStep(slide);
}

function changeSlideStep(delta) {
  const slide = slides[current];
  const state = slideStepStates.get(slide);
  if (!state || state.cursor + delta < 0 || state.cursor + delta > state.frames.length) return false;
  state.cursor += delta;
  applySlideStep(slide);
  updateNavigationButtons();
  scheduleTextFit();
  return true;
}

function applySlideStep(slide) {
  const state = slideStepStates.get(slide);
  if (!state) return;
  const frame = state.cursor ? state.frames[state.cursor - 1] : 0;
  const fragmentState = slideFragmentStates.get(slide);
  if (fragmentState) {
    fragmentState.step = frame;
    applyFragmentStep(slide);
  }
  for (const [type, blocks] of [["code", slideCodeStates.get(slide)?.blocks || []], ["equation", slideEquationStates.get(slide)?.blocks || []]]) {
    blocks.forEach((block) => {
      block.activeSnapshot = block.baseline;
      state.events.forEach((event) => {
        if (event.type === type && event.target === block && event.index <= frame) block.activeSnapshot = event.snapshot;
      });
    });
  }
  applyCodeStep(slide);
  applyEquationStep(slide);
  slide.dataset.activeFrame = String(frame);
}

function applyFragmentStep(slide) {
  const state = slideFragmentStates.get(slide);
  if (!state) return;
  const revealed = state.fragments.filter((fragment) => fragment.index <= state.step);
  const latest = Math.max(0, ...revealed.map((fragment) => fragment.index));
  state.fragments.forEach((fragment) => {
    const visible = fragment.index <= state.step;
    // A text point stays current while another lane advances. Only a later
    // text point makes it past; code must not dim every explanation at once.
    const currentFragment = visible && fragment.index === latest && latest > 0;
    fragment.element.classList.toggle("fragment-visible", visible);
    fragment.element.classList.toggle("fragment-current", currentFragment);
    fragment.element.classList.toggle("fragment-past", visible && fragment.index < latest);
    fragment.element.setAttribute("aria-hidden", visible ? "false" : "true");
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
      const stepIndices = parseStepIndices(getCodeData(root, code, "stepIndices"), stepLines.length, root);
      blocks.push({ root, lines, staticLines, stepLines, stepIndices });
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

function parseStepIndices(value, count, root) {
  if (!value) return null;
  const parts = value.split("|").map((part) => part.trim());
  const indices = parts.map(Number);
  if (indices.length === count && parts.every((part) => /^\d+$/.test(part)) && indices.every((index, offset) => Number.isSafeInteger(index) && index > 0 && (offset === 0 || index > indices[offset - 1]))) return indices;
  if (root) root.dataset.stepError = "invalid-step-indices";
  console.warn("htmpres: data-step-indices must contain one strictly increasing positive integer per snapshot; using implicit source order.", root);
  return null;
}

function prepareEquationSteppers() {
  slides.forEach((slide) => {
    const blocks = [];
    slide.querySelectorAll(".equation-steps[data-equation-steps]").forEach((root) => {
      const stepTerms = root.dataset.equationSteps.split("|").map((part) => new Set(part.split(/[,\s]+/).filter((term) => /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(term))));
      if (!stepTerms.length) return;
      const termNames = [...new Set(stepTerms.flatMap((terms) => [...terms]))];
      const stepIndices = parseStepIndices(root.dataset.stepIndices, stepTerms.length, root);
      blocks.push({ root, stepTerms, termNames, stepIndices });
    });
    if (blocks.length) slideEquationStates.set(slide, { blocks });
  });
}

function applyEquationStep(slide) {
  const state = slideEquationStates.get(slide);
  if (!state) return;
  state.blocks.forEach((block) => {
    const active = block.activeSnapshot >= 0 ? block.stepTerms[block.activeSnapshot] : null;
    const selector = block.termNames.map((term) => `.${term}`).join(", ");
    if (selector) block.root.querySelectorAll(selector).forEach((term) => {
      const selected = active && [...active].some((name) => term.classList.contains(name));
      term.classList.add("equation-term");
      term.classList.toggle("equation-term-highlight", Boolean(selected));
      term.classList.toggle("equation-term-dim", Boolean(active && active.size && !selected));
    });
    block.root.classList.toggle("equation-step-active", Boolean(active));
    if (active) block.root.dataset.activeStep = String(block.activeSnapshot + 1);
    else delete block.root.dataset.activeStep;
  });
}

function applyCodeStep(slide) {
  const state = slideCodeStates.get(slide);
  if (!state) return;

  state.blocks.forEach((block) => {
    const snapshot = block.activeSnapshot ?? Math.min(state.step, block.stepLines.length - 1);
    const stepSet = snapshot >= 0 && block.stepLines.length ? block.stepLines[snapshot] : null;
    const activeLines = new Set(block.staticLines);
    if (stepSet) stepSet.forEach((line) => activeLines.add(line));
    const shouldDim = Boolean(stepSet && activeLines.size);

    block.lines.forEach((line) => {
      const active = activeLines.has(Number(line.dataset.line));
      line.classList.toggle("code-line-highlight", active);
      line.classList.toggle("code-line-dim", shouldDim && !active);
    });

    block.root.classList.toggle("code-step-active", Boolean(stepSet));
    if (stepSet) {
      block.root.dataset.activeStep = String(snapshot + 1);
    } else {
      delete block.root.dataset.activeStep;
    }
  });
}

function canAdvanceSlide() {
  return current < slides.length - 1 && !(mainSlideCount > 0 && current === lastMainSlide);
}

function advanceSlide() {
  if (canAdvanceSlide()) goTo(current + 1);
}

function updateNavigationButtons() {
  const state = slideStepStates.get(slides[current]);
  if (prevBtn) prevBtn.disabled = current === 0 && !state?.cursor;
  if (nextBtn) nextBtn.disabled = !canAdvanceSlide() && (!state || state.cursor >= state.frames.length);
}

function nextStepOrSlide() {
  if (changeSlideStep(1)) return;
  advanceSlide();
}

function prevStepOrSlide() {
  if (changeSlideStep(-1)) return;
  goTo(current - 1);
}

function updateNotes() {
  const noteHtml = deckNotes[current] || "";
  if (presenterNotes) {
    presenterNotes.innerHTML = noteHtml || '<p class="presenter-note-empty">No presenter notes for this slide.</p>';
    window.htmpresRenderMath?.(presenterNotes);
  }
  if (!notesBox) return;
  const note = slides[current]?.querySelector(".notes");
  notesBox.innerHTML = noteHtml || (note ? note.innerHTML : "No speaker notes for this slide.");
  window.htmpresRenderMath?.(notesBox);
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
        if (slides[current]?.contains(media)) advanceSlide();
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

function slideTargetFromHash(hash) {
  const numeric = /^#\/(\d+)$/.exec(hash);
  if (numeric) {
    const index = Number(numeric[1]) - 1;
    return index >= 0 && index < slides.length ? { index, target: null } : null;
  }
  let id;
  try { id = decodeURIComponent(hash.replace(/^#/, "")); } catch { return null; }
  if (!id) return null;
  const target = document.getElementById(id);
  const slide = target?.closest(".slide");
  const index = slides.indexOf(slide);
  return index >= 0 ? { index, target: target === slide ? null : target } : null;
}

function navigateToHash(hash, historyMode = "none") {
  const destination = slideTargetFromHash(hash);
  if (!destination) return false;
  goTo(destination.index, { history: historyMode, hash });
  destination.target?.scrollIntoView?.({ block: "nearest" });
  return true;
}

function wireHashNavigation() {
  window.addEventListener("hashchange", () => navigateToHash(location.hash));
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    if (!slideTargetFromHash(url.hash)) return;
    event.preventDefault();
    navigateToHash(url.hash, "push");
  });
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
  if (event.key === "End") goTo(lastMainSlide);
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
wireScrollCue();
wireTapNavigation();
wireMediaDirectives();
wireHashNavigation();
prepareSlideTransitions();
prepareFragments();
prepareCodeSteppers();
prepareEquationSteppers();
prepareStepGraphs();
scaleDeck();
if (!navigateToHash(location.hash)) goTo(0);
