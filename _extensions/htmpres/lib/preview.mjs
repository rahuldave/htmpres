/** Local preview only: exported decks never include the reload client. */
export function injectPreview(html, revision) {
  return html.replace('</body>', `<script id="htmpres-preview">
(() => {
  const revision = ${JSON.stringify(revision)};
  let pending = false;
  setInterval(async () => {
    if (pending) return;
    pending = true;
    try {
      const response = await fetch('/_htmpres/preview.json', { cache: 'no-store' });
      if (response.ok && (await response.json()).revision !== revision) {
        location.reload();
        return;
      }
    } catch { /* Keep the last good deck visible while the server reconnects. */ }
    pending = false;
  }, 750);
})();
</script></body>`);
}

/** Coalesce saves without losing edits that arrive during an awaited build. */
export function queueRenders(render, publish, reportError, delay = 120) {
  let dirty = false, running = false, timer;
  const run = async () => {
    running = true;
    dirty = false;
    let success = false;
    try { await render(); publish(); success = true; }
    catch (error) { reportError(error); }
    finally { running = false; if (dirty) schedule(); }
    return success;
  };
  const schedule = () => {
    dirty = true;
    if (running) return;
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  };
  // Start with the watcher already installed and use the same queue for saves.
  schedule.start = () => { clearTimeout(timer); return run(); };
  return schedule;
}

export function shouldWatchPath(relativePath) {
  const path = relativePath.replaceAll('\\', '/');
  if (/^assets\/htmpres-(?:themes|math)(?:\/|$)/.test(path)) return false;
  if (path === 'index.html' || path === 'presenter.html') return false;
  return /\.(?:qmd|css)$/.test(path) || path.startsWith('assets/') || path.startsWith('_extensions/');
}

/** Capture the token before reading: a concurrent build must never label old
 * bytes with its new revision, which would prevent the browser from reloading. */
export async function readPreviewHtml(readHtml, revision) {
  const servedRevision = revision();
  return injectPreview(await readHtml(), servedRevision);
}
