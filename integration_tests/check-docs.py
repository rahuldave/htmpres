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
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
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
        target = (
            (
                site / unquote(parts.path.lstrip("/"))
                if parts.path.startswith("/")
                else source.parent / unquote(parts.path)
            ).resolve()
            if parts.path
            else source
        )
        if not target.is_relative_to(site):
            errors.append(f"{source.relative_to(site)}: escapes site: {url}")
            return
        if target.is_dir():
            target /= "index.html"
        if not target.exists():
            errors.append(f"{source.relative_to(site)}: missing {url}")
        elif (
            fragments
            and parts.fragment
            and not parts.fragment.startswith("/")
            and target.suffix == ".html"
        ):
            if target not in pages:
                parser = Links()
                parser.feed(target.read_text())
                pages[target] = parser
            if unquote(parts.fragment) not in pages[target].ids:
                errors.append(f"{source.relative_to(site)}: missing anchor {url}")

    for page in site.rglob("*.html"):
        parser = Links()
        parser.feed(page.read_text())
        pages[page] = parser
    for page, parser in list(pages.items()):
        for url in parser.links:
            check_url(page, url, True)
        for url in re.findall(r"url\(\s*[\"\']?([^\s)\"\']+)", page.read_text()):
            check_url(page, url)
    for css in site.rglob("*.css"):
        for url in re.findall(r"url\(\s*[\"\']?([^\s)\"\']+)", css.read_text()):
            check_url(css, url)
    # Static plotting CI consumes reviewed bytes only, never native plot runtimes.
    import importlib.util

    repo = Path(__file__).resolve().parents[1]
    loader = importlib.util.spec_from_file_location(
        "plotting_docs_check", repo / "scripts/plotting_docs.py"
    )
    plotting = importlib.util.module_from_spec(loader)
    loader.loader.exec_module(plotting)
    public = site / "_generated/plotting"
    plotting.validate(public, repo)
    canonical = repo / "docs/_plotting"
    assert plotting.regular_files(public) == plotting.regular_files(canonical)
    for name in plotting.regular_files(canonical):
        assert (public / name).read_bytes() == (
            canonical / name
        ).read_bytes(), f"Plotting asset copy drift: {name}"
    assert (
        not (site / "_plotting").exists()
        and not (site / "_plotting-evidence.json").exists()
    ), "Raw review source leaked"
    for name in (
        "plotting-packages.html",
        "plotting-python.html",
        "plotting-r.html",
        "plotting-gallery.html",
    ):
        assert (site / name).is_file(), f"Missing plotting guide: {name}"
    js_loader = importlib.util.spec_from_file_location(
        "js_docs", repo / "scripts/stage-javascript-docs.py"
    )
    js_docs = importlib.util.module_from_spec(js_loader)
    js_loader.loader.exec_module(js_docs)
    expected_js = js_docs.snapshot(repo / "packages/javascript")
    js_public = site / "_generated/javascript"
    assert plotting.regular_files(js_public) == sorted(
        expected_js
    ), "JavaScript public closure drift"
    for name, payload in expected_js.items():
        assert (
            js_public / name
        ).read_bytes() == payload, f"JavaScript published byte drift: {name}"
    assert (site / "plotting-javascript.html").is_file()
    generated = site / "_generated"
    manifest = json.loads((generated / "manifest.json").read_text())
    assert len(manifest["themes"]) == 38 and len(manifest["slides"]) == 12
    assert len(manifest["slideSources"]) == len(
        manifest["slides"]
    ), "Each slide needs its authored source"
    source = (generated / "source/index.qmd.txt").read_bytes()
    chunks = "".join(item["markdown"] for item in manifest["slideSources"]).encode()
    assert (
        chunks == source[source.index(b"## ") :]
    ), "Displayed Markdown must match authored bytes"
    example = (site / "example.html").read_text()
    for token in (
        'id="deck-example"',
        'id="example-markdown"',
        'data-step-action="next"',
        "assets/deck-example.mjs",
    ):
        assert token in example, f"Interactive example missing {token}"
    patterns = json.loads((generated / "patterns-manifest.json").read_text())
    assert patterns["deckSet"] == "patterns" and len(patterns["slides"]) == 11
    pattern_source = (repo / "decks/patterns/index.qmd").read_bytes()
    assert (generated / "source/patterns.qmd.txt").read_bytes() == pattern_source
    for asset in ("two-views.svg", "texture.svg"):
        assert (generated / "source" / asset).read_bytes() == (repo / "decks/patterns/assets" / asset).read_bytes(), f"Pattern download drift: {asset}"
    assert "".join(s["markdown"] for s in patterns["slideSources"]).encode() == pattern_source[pattern_source.index(b"## "):]
    assert 'data-manifest="_generated/patterns-manifest.json"' in (site / "patterns.html").read_text()
    for mode in ("light", "dark"):
        for view in ("index", "presenter"):
            pattern_page = generated / "patterns/nocturne" / mode / f"{view}.html"
            text = pattern_page.read_text()
            assert len(re.findall(r'<section\b[^>]*class="[^"]*\bslide\b', text)) == 11
            for token in ('id="statement"', 'id="full"', 'id="left"', 'id="right"', 'id="background"', 'class="source"', 'class="slide-credits"'):
                assert token in text, f"Missing normal-use pattern: {token}"
            assert ('id="counter" hidden' in text) == (view == "index")
            assert ('id="deckNotes"' in text) == (view == "presenter"), "Pattern notes isolation"
        for asset in ("two-views.svg", "texture.svg"):
            assert (generated / "patterns/nocturne" / mode / "assets" / asset).read_bytes() == (repo / "decks/patterns/assets" / asset).read_bytes()
    syntax = json.loads((generated / "syntax-manifest.json").read_text())
    assert syntax["deckSet"] == "syntax" and len(syntax["slides"]) == 35
    syntax_source = (repo / "decks/syntax/index.qmd").read_bytes()
    assert (generated / "source/syntax.qmd.txt").read_bytes() == syntax_source
    assert (generated / "source/syntax.css.txt").read_bytes() == (repo / "decks/syntax/source.css").read_bytes()
    assert "".join(item["markdown"] for item in syntax["slideSources"]).encode() == syntax_source[syntax_source.index(b"## "):]
    assert 'data-manifest="_generated/syntax-manifest.json"' in (site / "syntax-examples.html").read_text()
    syntax_assets = ("texture.svg", "two-views.svg", "transparent-rings.svg", "motion.mp4", "motion.vtt", "tone.wav", "embedded.html")
    for asset in syntax_assets:
        assert (generated / "source/syntax-assets" / asset).read_bytes() == (repo / "decks/syntax/assets" / asset).read_bytes()
    required_ids = ("half-left", "half-right", "transparent", "opacity", "opacity-css", "background-opacity", "fit-fill", "filter-presets", "theme-filter", "custom-filter", "vignettes", "inline-images", "flowing-split", "cards", "panel-controls", "item-filters", "fragment-effects", "video", "audio", "media-advance", "embedded-page", "section-divider", "containers", "text-fit", "navigation-guard", "scroll-overflow", "global-background", "omit-background", "match-overrides", "labels", "transition-slide", "transition-zoom", "transition-none", "source-links", "source-record")
    for index, slide_id in enumerate(required_ids):
        assert f"#{slide_id}" in syntax["slideSources"][index]["markdown"], f"Syntax destination drift: {slide_id}"
    for mode in ("light", "dark"):
        for view in ("index", "presenter"):
            text = (generated / "syntax/nocturne" / mode / f"{view}.html").read_text()
            assert len(re.findall(r'<section\b[^>]*class="[^\"]*\bslide\b', text)) == len(required_ids)
            for slide_id in required_ids:
                assert f'id="{slide_id}"' in text, f"Missing syntax demonstration: {slide_id}"
            for token in ('class="ds-controls ds-keep-time"', 'class="ds-hide"', 'data-background-opacity="0.18"', 'data-fragment-index="0"', 'data-match-color="#245c88"', 'data-match-colors="total=#765013"'):
                assert token in text, f"Missing authored behavior: {token}"
            assert ('id="counter" hidden' in text) == (view == "index")
            assert ('id="deckNotes"' in text) == (view == "presenter"), "Syntax notes isolation"
        for asset in syntax_assets:
            assert (generated / "syntax/nocturne" / mode / "assets" / asset).read_bytes() == (repo / "decks/syntax/assets" / asset).read_bytes()
    audience_reference = None
    note_reference = None
    count = 0
    for theme in manifest["themes"]:
        for mode in theme["modes"]:
            for view in ("index", "presenter"):
                page = generated / "decks" / theme["name"] / mode / f"{view}.html"
                text = page.read_text()
                # Everything from the first slide through the stage is invariant.
                slides = re.findall(
                    r'<section\b[^>]*class="[^"]*\bslide\b[^>]*>.*?</section>',
                    text,
                    re.S,
                )
                assert len(slides) == 12, f"{page}: slide count"
                for feature in (
                    'id="code-steps"',
                    'id="equation-steps"',
                    'data-equation-steps="mean|total|count"',
                    'data-match="count"',
                    'id="appendix-data"',
                    'data-kind="appendix"',
                    'href="#main-result"',
                    'id="slide-3-fn1"',
                    'id="slide-11-fn1"',
                    "<em>source</em>",
                ):
                    assert (
                        feature in text
                    ), f"{page}: missing main showcase feature {feature}"
                if audience_reference is None:
                    audience_reference = slides
                assert slides == audience_reference, f"{page}: changed slide content"
                notes = re.search(
                    r'<script id="deckNotes" type="application/json">(.*?)</script>',
                    text,
                    re.S,
                )
                if view == "index":
                    assert notes is None and not re.search(
                        r"Presenter cue \d+\.", text
                    ), f"{page}: audience note leak"
                else:
                    assert notes, f"{page}: missing notes"
                    cues = json.loads(notes[1])
                    assert len(cues) == 12 and all(
                        f"Presenter cue {i+1}." in cue for i, cue in enumerate(cues)
                    )
                    if note_reference is None:
                        note_reference = cues
                    assert cues == note_reference, f"{page}: changed notes"
                count += 1
    repo = Path(__file__).resolve().parents[1]
    for filename in ("index.qmd", "source.css"):
        assert (generated / "source" / f"{filename}.txt").read_bytes() == (
            repo / "decks/example" / filename
        ).read_bytes()
    assert (generated / "source/two-views.svg").read_bytes() == (
        repo / "decks/example/assets/two-views.svg"
    ).read_bytes()
    assert (generated / "source/semantic.qmd.txt").read_bytes() == (
        repo / "decks/semantic/index.qmd"
    ).read_bytes()
    for view in ("index", "presenter"):
        text = (generated / "semantic" / f"{view}.html").read_text()
        assert (
            len(re.findall(r'<section\b[^>]*class="[^"]*\bslide\b', text)) == 8
        ), "Semantic demo slide count"
        assert 'href="../assets/htmpres-math/katex.min.css"' in text
        assert 'src="../assets/htmpres-math/katex.min.js"' in text
        notes = re.search(
            r'<script id="deckNotes" type="application/json">(.*?)</script>', text, re.S
        )
        if view == "index":
            assert notes is None, "Semantic demo audience note leak"
        else:
            assert notes and len(json.loads(notes[1])) == 8, "Semantic presenter notes"
    assert (generated / "source/authoring-hooks.qmd.txt").read_bytes() == (
        repo / "decks/authoring-hooks/index.qmd"
    ).read_bytes()
    for view in ("index", "presenter"):
        text = (generated / "authoring-hooks" / f"{view}.html").read_text()
        assert 'data-counter="presenter"' in text
        assert ('id="counter" hidden' in text) == (view == "index")
        assert 'class="slide-credits"' in text and 'class="statement"' in text
        assert "<blockquote>" in text and 'class="source"' in text
    assert not any(
        (site / name).exists()
        for name in (
            "showcase-spec.html",
            "documentation-audit.html",
            "semantic-authoring-spec.html",
            "theme-catalog-spec.html",
            "tag_dependency_workflow.html",
            "authoring-cli-spec.html",
        )
    )
    assert (
        site / "site_libs/themes/nocturne/nocturne.css"
    ).exists(), "Nocturne site CSS missing"
    notices = list(
        (generated / "assets/htmpres-themes/licenses").glob("nocturne-*OFL.txt")
    )
    assert notices, "Nocturne font OFL notices missing from the clean site"
    assert all(
        "SIL OPEN FONT LICENSE" in file.read_text().upper() for file in notices
    ), "Font notices truncated"
    if errors:
        raise SystemExit("\n".join(errors))
    print(
        f"Docs crawl passed: {len(pages)} HTML pages, {count} theme views, notes isolation, source parity, local links, fonts and assets."
    )


if __name__ == "__main__":
    crawl(Path(sys.argv[1] if len(sys.argv) > 1 else "docs/_site"))
