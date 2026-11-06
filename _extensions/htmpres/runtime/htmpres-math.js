// Pandoc's --katex fragment writer preserves TeX in .math elements. Render only
// those nodes, not code samples or arbitrary dollar-delimited prose.
(function installHtmpresMath() {
  function renderMath(root) {
    if (!root || !window.katex) return;
    const nodes = [...(root.matches?.(".math") ? [root] : []), ...root.querySelectorAll(".math")];
    for (const node of nodes) {
      if (node.dataset.htmpresMathRendered === "true" || node.closest("pre, code")) continue;
      const tex = node.textContent;
      window.katex.render(tex, node, {
        displayMode: node.classList.contains("display"),
        output: "htmlAndMathml",
        throwOnError: false,
        maxSize: 20,
        maxExpand: 1000,
        // Permit semantic term classes, never HTML styles, ids, data or URLs.
        trust: context => context.command === "\\htmlClass" && /^[A-Za-z_][A-Za-z0-9_-]*(?:\s+[A-Za-z_][A-Za-z0-9_-]*)*$/.test(context.class || ""),
        strict: (code) => code === "htmlExtension" ? "ignore" : "warn",
      });
      node.dataset.htmpresMathRendered = "true";
    }
  }
  window.htmpresRenderMath = renderMath;
  // The shell loads this synchronously after the document and before the deck
  // runtime, so term classes exist when its unified step graph is constructed.
  renderMath(document);
})();
