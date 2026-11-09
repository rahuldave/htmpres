"""Render and verify the actual copyable matched-summary documentation."""
import re
import argparse
import subprocess
import tempfile
from contextlib import nullcontext
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, help='Retain rendered cases for CUA browser verification')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
guide = (root / "docs/semantic-authoring.md").read_text()
section = guide.split("## Finish with matched colors\n", 1)[1].split("## 4.", 1)[0]
examples = re.findall(r"(?ms)^(`{3,})(markdown|css)\n(.*?)^\1[ \t]*$", section)
assert len(examples) == 6, "Keep the executable syntax examples in sync"
code, equation, inline_color, inline_math, heading, css = [body for _, _, body in examples]
jobs = {
    "code": (code, ""),
    "equation": (equation, ""),
    "inline-color": (equation.replace(next(line for line in equation.splitlines() if line.startswith("[The mean")), inline_color.strip()), ""),
    "inline-math": (inline_math, ""),
    "slide-palette": (equation.replace(equation.splitlines()[0], heading.strip()), ""),
    "stylesheet": (equation, css),
}
with nullcontext(args.output) if args.output else tempfile.TemporaryDirectory(prefix="htmpres-match-syntax-") as tmp:
    for name, (source, stylesheet) in jobs.items():
        folder = Path(tmp) / name
        folder.mkdir(parents=True, exist_ok=True)
        qmd = folder / "slides.qmd"
        qmd.write_text('---\npagetitle: "Matched syntax"\ndeck:\n  theme: nocturne\n  color-mode: auto\n---\n\n' + source)
        (folder / "source.css").write_text(stylesheet)
        for command in ["render", "verify"]:
            subprocess.run(["quarto", "run", "scripts/htmpres.ts", command, str(qmd)], cwd=root, check=True, stdout=subprocess.DEVNULL)
        html = (folder / "index.html").read_text()
        assert 'data-step-summary="match"' in html and 'data-match-groups="' in html, name
        assert "--htmpres-match-1:" in html, name
        if name in {"inline-color", "inline-math", "slide-palette", "stylesheet"}:
            assert "--htmpres-match-mean: #245c88;" in html, name
            assert "--htmpres-match-mean: #91c9f0;" in html, name
print("Matched syntax documentation passed: code, equation, direct span/math, slide palette and CSS examples render and verify.")
