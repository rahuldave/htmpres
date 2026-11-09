#!/usr/bin/env python3
"""Crawl the built public site and validate every generated deck, including unlinked variants."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if attrs.get(key):
                self.links.append(attrs[key])


def crawl(site):
    site = site.resolve()
    errors = []
    pages = {}
    def check_url(source, url, fragments=False):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path and not parts.fragment:
            return
        target = (site / unquote(parts.path.lstrip('/')) if parts.path.startswith('/') else source.parent / unquote(parts.path)).resolve() if parts.path else source
        if not target.is_relative_to(site):
            errors.append(f'{source.relative_to(site)}: escapes site: {url}')
            return
        if target.is_dir():
            target /= 'index.html'
        if not target.exists():
            errors.append(f'{source.relative_to(site)}: missing {url}')
        elif fragments and parts.fragment and not parts.fragment.startswith('/') and target.suffix == '.html':
            if target not in pages:
                parser = Links(); parser.feed(target.read_text()); pages[target] = parser
            if unquote(parts.fragment) not in pages[target].ids:
                errors.append(f'{source.relative_to(site)}: missing anchor {url}')
    for page in site.rglob('*.html'):
        parser = Links(); parser.feed(page.read_text()); pages[page] = parser
    for page, parser in list(pages.items()):
        for url in parser.links:
            check_url(page, url, True)
        for url in re.findall(r'url\(\s*[\"\']?([^\s)\"\']+)', page.read_text()):
            check_url(page, url)
    for css in site.rglob('*.css'):
        for url in re.findall(r'url\(\s*[\"\']?([^\s)\"\']+)', css.read_text()):
            check_url(css, url)
    generated = site / '_generated'
    manifest = json.loads((generated / 'manifest.json').read_text())
    assert len(manifest['themes']) == 38 and len(manifest['slides']) == 12
    assert len(manifest['slideSources']) == len(manifest['slides']), 'Each slide needs its authored source'
    source = (generated / 'source/index.qmd.txt').read_bytes()
    chunks = ''.join(item['markdown'] for item in manifest['slideSources']).encode()
    assert chunks == source[source.index(b'## '):], 'Displayed Markdown must match authored bytes'
    example = (site / 'example.html').read_text()
    for token in ('id="deck-example"', 'id="example-markdown"', 'data-step-action="next"', 'assets/deck-example.mjs'):
        assert token in example, f'Interactive example missing {token}'
    audience_reference = None
    note_reference = None
    count = 0
    for theme in manifest['themes']:
        for mode in theme['modes']:
            for view in ('index', 'presenter'):
                page = generated / 'decks' / theme['name'] / mode / f'{view}.html'
                text = page.read_text()
                # Everything from the first slide through the stage is invariant.
                slides = re.findall(r'<section\b[^>]*class="[^"]*\bslide\b[^>]*>.*?</section>', text, re.S)
                assert len(slides) == 12, f'{page}: slide count'
                for feature in ('id="code-steps"', 'id="equation-steps"', 'data-equation-steps="mean|total|mean,total"', 'id="appendix-data"', 'data-kind="appendix"', 'href="#main-result"', 'id="slide-3-fn1"', 'id="slide-11-fn1"', '<em>source</em>'):
                    assert feature in text, f'{page}: missing main showcase feature {feature}'
                if audience_reference is None: audience_reference = slides
                assert slides == audience_reference, f'{page}: changed slide content'
                notes = re.search(r'<script id="deckNotes" type="application/json">(.*?)</script>', text, re.S)
                if view == 'index':
                    assert notes is None and not re.search(r'Presenter cue \d+\.', text), f'{page}: audience note leak'
                else:
                    assert notes, f'{page}: missing notes'
                    cues = json.loads(notes[1])
                    assert len(cues) == 12 and all(f'Presenter cue {i+1}.' in cue for i, cue in enumerate(cues))
                    if note_reference is None: note_reference = cues
                    assert cues == note_reference, f'{page}: changed notes'
                count += 1
    repo = Path(__file__).resolve().parents[1]
    for filename in ('index.qmd', 'source.css'):
        assert (generated / 'source' / f'{filename}.txt').read_bytes() == (repo / 'decks/example' / filename).read_bytes()
    assert (generated / 'source/two-views.svg').read_bytes() == (repo / 'decks/example/assets/two-views.svg').read_bytes()
    assert (generated / 'source/semantic.qmd.txt').read_bytes() == (repo / 'decks/semantic/index.qmd').read_bytes()
    for view in ('index', 'presenter'):
        text = (generated / 'semantic' / f'{view}.html').read_text()
        assert len(re.findall(r'<section\b[^>]*class="[^"]*\bslide\b', text)) == 8, 'Semantic demo slide count'
        assert 'href="../assets/htmpres-math/katex.min.css"' in text
        assert 'src="../assets/htmpres-math/katex.min.js"' in text
        notes = re.search(r'<script id="deckNotes" type="application/json">(.*?)</script>', text, re.S)
        if view == 'index': assert notes is None, 'Semantic demo audience note leak'
        else: assert notes and len(json.loads(notes[1])) == 8, 'Semantic presenter notes'
    assert not any((site / name).exists() for name in ('showcase-spec.html', 'semantic-authoring-spec.html', 'theme-catalog-spec.html', 'tag_dependency_workflow.html', 'authoring-cli-spec.html'))
    assert (site / 'site_libs/themes/nocturne/nocturne.css').exists(), 'Nocturne site CSS missing'
    notices = list((generated / 'assets/htmpres-themes/licenses').glob('nocturne-*OFL.txt'))
    assert notices, 'Nocturne font OFL notices missing from the clean site'
    assert all('SIL OPEN FONT LICENSE' in file.read_text().upper() for file in notices), 'Font notices truncated'
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Docs crawl passed: {len(pages)} HTML pages, {count} theme views, notes isolation, source parity, local links, fonts and assets.')

if __name__ == '__main__':
    crawl(Path(sys.argv[1] if len(sys.argv) > 1 else 'docs/_site'))
