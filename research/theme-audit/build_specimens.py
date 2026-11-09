"""Prepare local browser specimens from the project's existing catalog smoke test."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
from measure import ROOT, HERE, CATALOG, PRIORITY


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scratch", type=Path, help="Reuse an already verified full catalog smoke directory")
    args = parser.parse_args()
    scratch = args.scratch
    if scratch is None:
        result = subprocess.run(["bash", str(ROOT / "tests/theme-catalog-smoke.sh"), "--all"], cwd=ROOT, check=True, capture_output=True, text=True)
        print(result.stdout.strip())
        match = re.search(r"Theme catalog smoke passed \(35 themes\): (.+)", result.stdout)
        if not match:
            raise RuntimeError("Full catalog smoke did not report the expected 35-theme scope")
        scratch = Path(match[1])
    catalog = json.loads(CATALOG.read_text())["themes"]
    ordered = PRIORITY + [name for name in catalog if name not in PRIORITY]
    target = HERE / "specimens"
    target.mkdir(exist_ok=True)
    for name in ordered:
        source = scratch / name
        shutil.copytree(source, target / name, dirs_exist_ok=True)
        html = (source / "index.html").read_text()
        if '"mode":"auto"' not in html:
            raise RuntimeError(f"Missing expected renderer mode config in {name}")
        for mode in ["light", "dark"]:
            # Only fix initial mode in copied renderer output; all CSS/assets remain actual.
            (target / name / f"{mode}.html").write_text(html.replace('"mode":"auto"', f'"mode":"{mode}"'))
    for page in range(9):
        tiles = ""
        for name in ordered[page * 4:page * 4 + 4]:
            for mode in ["light", "dark"]:
                tiles += f'<article><h2>{name} · {mode}</h2><div class="frame"><iframe src="{name}/{mode}.html" title="{name} {mode}"></iframe></div></article>'
        nav = " ".join(f'<a href="contact-{i}.html">{i+1}</a>' for i in range(9))
        (target / f"contact-{page}.html").write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Actual htmpres specimens</title><style>body{font:14px system-ui;background:#dadde1;margin:16px}main{display:grid;grid-template-columns:1fr 1fr;gap:14px}h1{font-size:20px}h2{font-size:14px;margin:0 0 5px}.frame{width:480px;height:300px;overflow:hidden}iframe{width:1280px;height:800px;transform:scale(.375);transform-origin:0 0;border:0}a{margin-right:16px}</style><h1>Same generated deck, both modes</h1>' + nav + '<main>' + tiles + '</main></html>')
    print(f"Prepared 70 mode specimens and nine contact pages in {target}")


if __name__ == "__main__":
    main()
