import { selection, initialSlide } from './theme-comparison.mjs';

export function exampleCanvas(view) {
  return { width: 1280, height: view === 'presenter' ? 930 : 720 };
}

export function stepAction(cursor, total, action) {
  return Math.max(0, Math.min(total, action === 'restart' ? 0 : cursor + (action === 'next' ? 1 : action === 'previous' ? -1 : 0)));
}
export function exampleKeyboardAction(event, interactive) {
  if (interactive || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return null;
  if (event.key === 'Home') return 'restart';
  if (event.key === 'ArrowLeft' || event.key === 'PageUp' || event.key === ' ' && event.shiftKey) return 'previous';
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') return 'next';
  return null;
}

export function startExample(root, manifest) {
  const select = root.querySelector('#example-slide');
  const view = root.querySelector('#example-view');
  const mode = root.querySelector('#example-mode');
  const frame = root.querySelector('iframe');
  const source = root.querySelector('#example-markdown');
  const status = root.querySelector('#example-step-status');
  const buttons = [...root.querySelectorAll('[data-step-action]')];
  const resize = () => {
    const canvas = exampleCanvas(view.value);
    frame.style.width = `${canvas.width}px`; frame.style.height = `${canvas.height}px`;
    frame.parentElement.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    frame.style.transform = `scale(${frame.parentElement.clientWidth / canvas.width})`;
  };
  new ResizeObserver(resize).observe(frame.parentElement); resize();
  let slide = initialSlide(location.search, manifest), cursor = 0, total = 0;
  let bridge = null, observer = null, childDocument = null, loadNumber = 0;
  manifest.slides.forEach((title, index) => select.add(new Option(`${index + 1}. ${title}`, String(index + 1))));
  if (manifest.slideSources?.length !== manifest.slides.length) throw new Error('Example source is missing; rebuild the site');

  function displaySource() {
    select.value = String(slide);
    root.querySelector('#example-copy-status').textContent = '';
    source.textContent = manifest.slideSources[slide - 1].markdown;
    root.querySelector('#example-source-location').textContent = `index.qmd · line ${manifest.slideSources[slide - 1].line}`;
    const links = selection('nocturne', mode.value, view.value, slide, manifest);
    root.querySelector('#example-open').href = links.open;
    root.querySelector('#example-theme').textContent = links.config;
    const url = new URL(location.href); url.searchParams.set('slide', String(slide));
    history.replaceState(null, '', url);
  }
  function refresh() {
    if (bridge) {
      const state = bridge.getState();
      const changed = slide !== state.slide;
      slide = state.slide; cursor = state.cursor; total = state.total;
      if (changed) displaySource();
      status.textContent = total ? `Step ${cursor} of ${total}${state.frame === 'summary' ? ' · matched summary' : cursor === 0 ? ' · before reveals' : ''}` : 'This slide has no reveal steps';
    }
    buttons.forEach(button => {
      const action = button.dataset.stepAction;
      button.disabled = !bridge || (action === 'next' ? cursor >= total : cursor <= 0);
    });
  }
  function act(action) {
    if (!bridge) return;
    const target = stepAction(cursor, total, action);
    bridge.setState(slide, target); refresh();
  }
  function keyboard(event) {
    const interactive = Boolean(event.target?.closest?.('input, select, textarea, button, a, pre, video, audio, iframe, object, embed, summary, [contenteditable]:not([contenteditable="false"])'));
    // Keep native editing/activation, but block the deck's broad keyboard
    // listener from consuming keys aimed at an interactive element.
    if (interactive && event.currentTarget === childDocument && exampleKeyboardAction(event, false)) {
      event.stopImmediatePropagation(); return;
    }
    const action = exampleKeyboardAction(event, interactive);
    if (!action || !bridge) return;
    event.preventDefault(); event.stopImmediatePropagation(); act(action);
  }
  function load() {
    observer?.disconnect();
    childDocument?.removeEventListener('keydown', keyboard, true);
    bridge = null; resize(); refresh(); displaySource();
    status.textContent = 'Loading example…';
    const links = selection('nocturne', mode.value, view.value, slide, manifest);
    frame.src = links.preview.replace('compare-slide=', 'example-slide=').replace('#', `&example-load=${++loadNumber}#`);
    frame.title = `${manifest.slides[slide - 1]} — ${view.value === 'presenter' ? 'presenter with notes' : 'audience'} example`;
  }
  frame.addEventListener('load', () => {
    try {
      if (frame.contentWindow.location.href.split('#')[0] !== frame.src.split('#')[0]) return;
      const api = frame.contentWindow.htmpresExample;
      if (!api) throw new Error('Example controls are unavailable');
      bridge = api;
      bridge.setState(slide, cursor);
      childDocument = frame.contentDocument;
      childDocument.addEventListener('keydown', keyboard, true);
      observer = new MutationObserver(refresh);
      observer.observe(childDocument.querySelector('#slides'), { subtree: true, attributes: true, attributeFilter: ['class', 'data-active-frame'] });
      refresh();
    } catch (error) { bridge = null; refresh(); status.textContent = `${error.message}. Try opening the full view.`; }
  });
  buttons.forEach(button => button.addEventListener('click', () => act(button.dataset.stepAction)));
  select.addEventListener('change', () => { slide = Number(select.value); cursor = 0; load(); });
  for (const control of [view, mode]) control.addEventListener('change', load);
  document.addEventListener('keydown', keyboard, true);
  root.querySelector('#example-copy').addEventListener('click', async () => {
    const copied = root.querySelector('#example-copy-status');
    try { await navigator.clipboard.writeText(source.textContent); copied.textContent = 'Markdown copied'; }
    catch { copied.textContent = 'Select the Markdown below and copy it'; }
  });
  load();
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('#deck-example');
  if (root) fetch(root.dataset.manifest || '_generated/manifest.json').then(response => {
    if (!response.ok) throw new Error(`Example request failed (${response.status})`);
    return response.json();
  }).then(manifest => startExample(root, manifest)).catch(error => {
    root.querySelector('#example-step-status').textContent = `Example unavailable. ${error.message}`;
  });
}
