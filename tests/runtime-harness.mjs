import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtime = readFileSync(new URL('../_extensions/htmpres/runtime/htmpres-custom-deck.js', import.meta.url), 'utf8');

/** A small DOM boundary for runtime state tests; browser checks exercise layout. */
export function runtimeHarness(kinds = [''], { notes = false, buttons = false } = {}) {
  const warnings = [];
  const context = vm.createContext({ console: { warn: (...args) => warnings.push(args) }, URL });
  vm.runInContext(`
    let sequence = 0;
    class Element {
      constructor(dataset = {}) {
        this.dataset = dataset;
        this.order = sequence++;
        this.classes = new Set();
        this.attributes = new Map();
        this.queries = new Map();
        this.children = [];
        this.classList = {
          add: (...values) => values.forEach(value => this.classes.add(value)),
          remove: (...values) => values.forEach(value => this.classes.delete(value)),
          toggle: (value, enabled) => { if (enabled) this.classes.add(value); else this.classes.delete(value); },
          contains: value => this.classes.has(value),
        };
        this.properties = new Map();
        this.style = { setProperty: (key, value) => this.properties.set(key, value), removeProperty: key => this.properties.delete(key) };
      }
      querySelectorAll(selector) { return this.queries.get(selector) || []; }
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
      setAttribute(key, value) { this.attributes.set(key, value); }
      hasAttribute(key) { return this.attributes.has(key); }
      closest(selector) {
        if (selector === '.slide') return this.classes.has('slide') ? this : this.parentElement?.closest(selector) || null;
        if (selector === '.incremental[data-fragment-effect]') return this.classes.has('incremental') && this.dataset.fragmentEffect !== undefined ? this : this.parentElement?.closest(selector) || null;
        if (selector === 'a[href]') return this.tagName === 'A' ? this : this.parentElement?.closest(selector) || null;
        return null;
      }
      compareDocumentPosition(other) { return other.order < this.order ? 2 : 4; }
      scrollIntoView(options) { this.scrolled = options; }
      contains(node) { return node === this || this.children.some(child => child.contains(node)); }
      addEventListener() {}
    }
    const fakeElement = dataset => new Element(dataset);
    const fixtureSlides = ${JSON.stringify(kinds)}.map(kind => {
      const slide = fakeElement(kind ? { kind } : {}); slide.classes.add('slide'); return slide;
    });
    const documentEvents = new Map();
    const windowEvents = new Map();
    const document = {
      nodes: new Map(), documentElement: fakeElement(),
      querySelectorAll: selector => selector === '.slide' ? fixtureSlides : [],
      getElementById(id) { return this.nodes.get(id) || null; },
      addEventListener: (name, handler) => documentEvents.set(name, handler),
    };
    const location = { hash: '', href: 'http://localhost/deck/index.html', origin: 'http://localhost', pathname: '/deck/index.html', search: '' };
    const historyCalls = [];
    const history = {
      replaceState: (_, __, hash) => { historyCalls.push(['replace', hash]); location.hash = hash; },
      pushState: (_, __, hash) => { historyCalls.push(['push', hash]); location.hash = hash; },
    };
    const window = {
      addEventListener: (name, handler) => windowEvents.set(name, handler),
      matchMedia: () => ({ matches: false }),
    };
    const Node = { DOCUMENT_POSITION_PRECEDING: 2 };
    const getComputedStyle = () => ({ overflowY: 'hidden' });
    const requestAnimationFrame = () => 1;
    const cancelAnimationFrame = () => {};
  `, context);
  if (notes) vm.runInContext("document.nodes.set('presenterNotes', fakeElement()); document.nodes.set('notesBox', fakeElement());", context);
  if (buttons) vm.runInContext("document.nodes.set('prevBtn', fakeElement()); document.nodes.set('nextBtn', fakeElement());", context);
  vm.runInContext(runtime.slice(0, runtime.indexOf('prevBtn?.addEventListener')), context);
  return { context, warnings, run: code => vm.runInContext(code, context) };
}
