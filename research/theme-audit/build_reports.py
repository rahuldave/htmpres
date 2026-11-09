"""Build portable, self-contained HTML shells around the three research reports."""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import markdown

HERE = Path(__file__).resolve().parent
REPORTS = ["01-design-language", "02-presentation-color", "03-scientific-palettes"]
LABELS = ["1 · Design language", "2 · Presentation color", "3 · Scientific palettes"]
CSS = """
:root{color-scheme:light;--ink:#233b38;--paper:#faf8f2;--accent:#246665}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.65 system-ui,sans-serif}
a{color:var(--accent);text-underline-offset:3px}header{padding:22px max(5vw,20px);background:#e9efea;border-bottom:1px solid #cbd8d1}
nav{display:flex;flex-wrap:wrap;gap:12px 28px;max-width:1180px;margin:auto}nav a[aria-current]{font-weight:750}
main{max-width:1180px;padding:42px 28px 80px;margin:auto}h1{font:650 clamp(30px,4vw,46px)/1.16 Georgia,serif;max-width:1000px;letter-spacing:-.025em}
h2{font:650 29px/1.25 Georgia,serif;margin:64px 0 20px;padding-top:18px;border-top:1px solid #cbd8d1}h3{font-size:23px;margin-top:40px}
p,ul,ol{max-width:83ch}li{margin:8px 0}strong{font-weight:700}img{display:block;max-width:100%;height:auto;margin:25px 0;border:1px solid #d4ddd7;border-radius:5px}
.table-wrap{overflow:auto;margin:26px 0;border:1px solid #ccd7d0;border-radius:5px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;min-width:650px}th,td{text-align:left;vertical-align:top;padding:13px 15px;border-bottom:1px solid #dce3dd}th{background:#e6ede7;font-weight:750}tr:nth-child(even){background:#f0f3ee}tr:last-child td{border-bottom:0}
pre{overflow:auto;background:#e9eeea;padding:22px;border-radius:6px;line-height:1.5;font-size:14px}code{font-family:ui-monospace,monospace;font-size:.9em}p code,li code{background:#e9eeea;padding:2px 4px;border-radius:3px}
details{background:#eef2ec;padding:14px 22px;border:1px solid #d4ddd4;border-radius:5px;margin:30px 0}summary{cursor:pointer;font-weight:700}.toc ul{list-style:none;padding-left:18px;font-size:15px}.toc>ul{padding:0}footer{border-top:1px solid #ccd7d0;margin-top:60px;padding-top:20px;font-size:14px}
@media(max-width:680px){main{padding:25px 18px}body{font-size:16px}h2{font-size:25px}nav{gap:8px 16px}table{font-size:13px}}
@media print{header,details{display:none}body{background:white;font-size:10pt}main{padding:0}h2{break-after:avoid}img{break-inside:avoid}table{font-size:8pt;min-width:0}.table-wrap{overflow:visible}a{color:inherit}}
"""


class Links(HTMLParser):
    """Collect local targets and IDs without requiring a browser or remote fetches."""
    def __init__(self):
        super().__init__()
        self.targets = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag in {"a", "img"}:
            value = attrs.get("href" if tag == "a" else "src")
            if value:
                self.targets.append(value)


def check_links(path: Path) -> None:
    """Validate report images, cross-report links and local fragment targets."""
    parsed = Links()
    parsed.feed(path.read_text())
    for target in parsed.targets:
        url = urlsplit(target)
        if url.scheme or url.netloc:
            continue
        dest = path.parent / unquote(url.path) if url.path else path
        if not dest.exists():
            raise ValueError(f"{path.name}: missing {target}")
        if url.fragment and dest.suffix == ".html":
            other = Links()
            other.feed(dest.read_text())
            if unquote(url.fragment) not in other.ids:
                raise ValueError(f"{path.name}: missing fragment {target}")


def main() -> None:
    for slug in REPORTS:
        source = (HERE / f"{slug}.md").read_text()
        converter = markdown.Markdown(extensions=["tables", "fenced_code", "toc"],
                                      extension_configs={"toc": {"toc_depth": "2-3"}})
        body = converter.convert(source)
        body = re.sub(r'href="(0[123]-[^"#]+)\.md([#"][^"]*)', r'href="\1.html\2', body)
        body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
        nav = "".join(f'<a href="{s}.html"' + (' aria-current="page"' if s == slug else '') + f'>{label}</a>' for s, label in zip(REPORTS, LABELS))
        title = escape(source.splitlines()[0].removeprefix("# "))
        # Keep the introduction before the collapsible section navigator.
        first_section = body.find("<h2")
        toc = f'<details><summary>In this review</summary>{converter.toc}</details>'
        body = body[:first_section] + toc + body[first_section:]
        html = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>{CSS}</style></head><body><header><nav aria-label="Three dependent reviews">{nav}</nav></header><main>{body}<footer>Decision draft · 9 November 2026 · <a href="{slug}.md">Markdown source</a> · Synthetic data; production themes unchanged.</footer></main></body></html>\n'
        (HERE / f"{slug}.html").write_text(html)
    for slug in REPORTS:
        check_links(HERE / f"{slug}.html")
    print("Built and checked all three reports.")


if __name__ == "__main__":
    main()
