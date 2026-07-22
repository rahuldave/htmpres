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
  updateNotes();
  syncSlideMedia();
  if (location.hash !== `#/${current + 1}`) history.replaceState(null, "", `#/${current + 1}`);
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

prevBtn?.addEventListener("click", () => goTo(current - 1));
nextBtn?.addEventListener("click", () => goTo(current + 1));
overviewBtn?.addEventListener("click", toggleOverview);
overview?.addEventListener("click", (event) => {
  if (event.target === overview) overview.classList.remove("visible");
});
window.addEventListener("resize", scaleDeck);
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
    event.preventDefault();
    goTo(current + 1);
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goTo(current - 1);
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
scaleDeck();
goTo(initialSlideFromHash());
