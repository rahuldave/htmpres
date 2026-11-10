import {lintSource,slideSegments,extractNotes} from './source.mjs';
import {imageAltFailures,normalizeImageAlts} from './render.mjs';

// Use the actual Pandoc reader, not a second Markdown grammar. This handles
// reference/linked images, notes, escapes and literal examples exactly as render.
export async function lintDeckSource(text, file, parseMarkdown) {
  const diagnostics = lintSource(text, file);
  for (const [index, slide] of slideSegments(text).entries()) {
    const {body, notes} = extractNotes(slide.body);
    let count = 0;
    // Titles, audience content and notes are separate Pandoc runs in render.
    for (const markdown of [slide.title ? '# '+slide.title : '', body, notes]) {
      if (!/!\[|<img\b/i.test(markdown)) continue;
      const ast = await parseMarkdown(markdown);
      const missing = [], raw = [];
      function walk(value) {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) { value.forEach(walk); return; }
        if (value.t === 'Code' || value.t === 'CodeBlock') return;
        if (value.t === 'Image') {
          const [attrs, description] = value.c;
          if (!attrs[1].includes('decorative') && !inlineText(description).trim()) missing.push(value);
        }
        if ((value.t === 'RawBlock' || value.t === 'RawInline') && value.c[0] === 'html') raw.push(value.c[1]);
        for (const child of Object.values(value)) walk(child);
      }
      function inlineText(nodes) {
        return nodes.map(node => {
          if (node.t === 'Str') return node.c;
          if (['Space','SoftBreak','LineBreak'].includes(node.t)) return ' ';
          if (node.t === 'Code' || node.t === 'Math') return node.c[1];
          if (node.t === 'RawInline') return node.c[1].replace(/<[^>]*>/g,'');
          if (['Span','Link','Image','Quoted','Cite'].includes(node.t)) return inlineText(node.c[1]);
          return Array.isArray(node.c) ? inlineText(node.c) : '';
        }).join('');
      }
      walk(ast);
      count += missing.length + imageAltFailures(normalizeImageAlts(raw.join('\n'))).length;
    }
    const title = slide.title || /data-title=["']([^"']+)/.exec(slide.attrText)?.[1] || `Slide ${index+1}`;
    for (let n=0; n<count; n++) diagnostics.push({file, line:slide.startLine, column:slide.column, code:'image-description', severity:'error', slide:index+1, slideId:/#([^\s}]+)/.exec(slide.attrText)?.[1] || '', message:`Slide ${index+1} (${title}): describe this picture, or mark a purely decorative picture with {.decorative}.`});
  }
  return diagnostics;
}
