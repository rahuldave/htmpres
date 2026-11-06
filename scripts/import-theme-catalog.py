#!/usr/bin/env python3
"""Extract public SmallDocs/Elegant palettes and local fonts, without page CSS.

Run with --smalldocs and --elegant pointing to local source checkouts. Runtime
rendering consumes the checked-in result and never reads those checkouts.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_extensions/htmpres/themes"
READING = ("zephyr", "simplex", "pulse", "litera", "darkly")


def revision(folder):
    return subprocess.check_output(["git", "-C", str(folder), "rev-parse", "HEAD"], text=True).strip()


def asset_bytes(file):
    data = file.read_bytes()
    if file.suffix == ".txt" or "LICENSE" in file.name:
        # Preserve notice text, while making upstream CRLF/trailing spaces diff-clean.
        return ("\n".join(line.rstrip() for line in data.decode().splitlines()) + "\n").encode()
    return data


def color(value, paper="#ffffff"):
    rgba = re.fullmatch(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)", value)
    if rgba:
        foreground = "#" + "".join(f"{int(c):02x}" for c in rgba.groups()[:3])
        return mix(foreground, paper, float(rgba.group(4)))
    if re.fullmatch(r"#[0-9a-fA-F]{3}", value):
        return "#" + "".join(c * 2 for c in value[1:])
    return value


def rgb(value):
    value = color(value)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError(f"Expected solid hex color, got {value}")
    return [int(value[i:i + 2], 16) for i in (1, 3, 5)]


def luminance(value):
    channels = [c / 255 for c in rgb(value)]
    linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
    return sum(c * w for c, w in zip(linear, (.2126, .7152, .0722)))


def mix(a, b, weight):
    return "#" + "".join(f"{round(x * weight + y * (1 - weight)):02x}" for x, y in zip(rgb(a), rgb(b)))


def readable(ink, paper):
    """Retain the hue while ensuring text accents meet 4.5:1 contrast."""
    target = "#ffffff" if luminance(paper) < .3 else "#111111"
    for step in range(21):
        candidate = mix(target, ink, step / 20)
        a, b = sorted((luminance(candidate), luminance(paper)))
        if (b + .05) / (a + .05) >= 4.5:
            return candidate
    return target


def variables(css):
    """Read only top-level Bootstrap root/mode declarations, not components."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    modes = {"light": {}, "dark": {}}
    for selector, block in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        selectors = [s.strip().replace('"', '').replace("'", '') for s in selector.split(',')]
        values = dict(re.findall(r"(--bs-[\w-]+)\s*:\s*([^;{}]+)", block))
        if ":root" in selectors or "[data-bs-theme=light]" in selectors:
            modes["light"].update(values)
        if "[data-bs-theme=dark]" in selectors:
            modes["dark"].update(values)
    modes["dark"] = modes["light"] | modes["dark"]
    if "--bs-body-bg" not in modes["light"]:
        raise ValueError("Missing Bootstrap root palette")
    return modes


def palette(tokens):
    paper = color(tokens["--bs-body-bg"])
    ink = color(tokens["--bs-body-color"])
    panel = color(tokens.get("--bs-tertiary-bg", mix(ink, paper, .05)))
    # Some stock dark themes inherit a light tertiary background.
    if (luminance(panel) < .3) != (luminance(paper) < .3):
        panel = mix(ink, paper, .07)
    return dict(paper=paper, ink=ink, panel=panel, line=color(tokens.get("--bs-border-color", mix(ink, paper, .25)), paper),
                muted=color(tokens.get("--bs-secondary-color", mix(ink, paper, .8)), paper), accent=color(tokens["--bs-link-color"], paper),
                secondary=readable(color(tokens.get("--bs-secondary", "#6c757d"), paper), paper), code=panel)


def counterpart(p, mode):
    paper = mix(p["accent"], "#161b22" if mode == "dark" else "#fafbfc", .08 if mode == "dark" else .025)
    ink = "#e8edf2" if mode == "dark" else "#212529"
    return dict(paper=paper, ink=ink, muted=mix(ink, paper, .8), panel=mix(ink, paper, .06),
                line=mix(ink, paper, .26), accent=readable(p["accent"], paper),
                secondary=readable(p["secondary"], paper), code=mix(ink, paper, .06))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smalldocs", type=Path, required=True)
    parser.add_argument("--elegant", type=Path, required=True)
    parser.add_argument("--tufte", type=Path, required=True)
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "fonts").mkdir(exist_ok=True)
    (DEST / "licenses").mkdir(exist_ok=True)
    catalog = {"version": 1, "themes": {}, "fonts": {}, "sources": {}}
    vendor = args.smalldocs / "src/smalldocs/assets/vendor"
    source_files = {"bootstrap": vendor / "bootstrap/bootstrap.min.css"}
    source_files.update({p.name.removesuffix(".min.css"): p for p in sorted((vendor / "bootswatch").glob("*.min.css"))})
    for name, file in source_files.items():
        css = file.read_text()
        modes = variables(css)
        native = "dark" if luminance(color(modes["light"]["--bs-body-bg"])) < .3 else "light"
        native_palette = palette(modes["light"])
        palettes = ({"light": native_palette, "dark": palette(modes["dark"])} if native == "light"
                    else {"dark": native_palette, "light": counterpart(native_palette, "light")})
        fonts = modes["light"]["--bs-font-sans-serif"]
        heading, heading_weight = fonts, "500"
        for selector, block in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
            if not all(re.search(r"(?:^|,)h" + str(n) + r"(?:,|$)", selector) for n in range(1, 7)):
                continue
            family = re.search(r"(?:^|;)font-family:([^;]+)", block)
            weight = re.search(r"(?:^|;)font-weight:([^;]+)", block)
            if family:
                heading = family.group(1)
            if weight:
                heading_weight = weight.group(1)
        body = 'Georgia, "Times New Roman", serif' if name == "litera" else fonts
        catalog["themes"][name] = dict(title=name.title(), family="bootstrap" if name == "bootstrap" else "bootswatch",
            body=body, heading=heading, headingWeight=heading_weight, mono=modes["light"]["--bs-font-monospace"], palettes=palettes,
            native=native, complementary="Bootstrap 5.3 dark variables" if native == "light" else "htmpres light adaptation",
            fontCss="", assets=[], bootstrap=modes)
        catalog["sources"][name] = dict(repository="https://github.com/rahuldave/smalldocs", commit=revision(args.smalldocs),
            file=str(file.relative_to(args.smalldocs)), sha256=hashlib.sha256(file.read_bytes()).hexdigest())
    for name in ("folio", "atelier", "nocturne", *(n + "-reading" for n in READING)):
        repo = args.elegant / ("smalldocs-" + name)
        file = repo / "src/theme.json"
        info = json.loads(file.read_text())
        if name.endswith("-reading"):
            base = catalog["themes"][name.removesuffix("-reading")]
            p = info["palette"]
            native = "dark" if name == "darkly-reading" else "light"
            original = dict(paper=p["paper"], ink=p["ink"], muted=p["muted"], panel=p["panel"], line=p["line"],
                            accent=p["link"], secondary=p["button"], code=p["panel"])
            palettes = {native: original, "light" if native == "dark" else "dark": counterpart(original, "light" if native == "dark" else "dark")}
            body, heading = base["body"], base["heading"]
            design = (repo / "src/design.css").read_text()
            font_override = re.search(r"--bs-font-sans-serif:\s*([^;]+)", design)
            if font_override:
                body = heading = font_override.group(1)
        else:
            palettes = {mode: info[mode] for mode in ("light", "dark")}
            native, body, heading = "light", info["body"], info["heading"]
        font_css = (repo / "src/fonts.css").read_text()
        assets = []
        for font in sorted((repo / "_extensions" / name / "fonts").iterdir()):
            if font.is_file():
                target = DEST / "fonts" / font.name
                if target.exists() and asset_bytes(target) != asset_bytes(font):
                    raise ValueError(f"Conflicting font asset: {font.name}")
                target.write_bytes(asset_bytes(font))
                assets.append("fonts/" + font.name)
        for family, rule in re.findall(r"(@font-face\s*\{\s*font-family:\s*[^;]+;)([^}]+)\}", font_css):
            filename = re.search(r"url\(fonts/([^\)]+)\)", rule).group(1)
            catalog["fonts"][filename] = family + rule.replace("url(fonts/", "url(assets/htmpres-themes/fonts/") + "}"
        for license_file in (repo / "LICENSE",):
            if license_file.exists():
                target = f"licenses/{name}-LICENSE"
                (DEST / target).write_bytes(asset_bytes(license_file))
                assets.append(target)
        catalog["themes"][name] = dict(title=info["title"], family="reading" if name.endswith("-reading") else "elegant",
            body=body, heading=heading, mono='"IBM Plex Mono", ui-monospace, monospace', palettes=palettes,
            native=native, complementary="htmpres complementary adaptation" if name.endswith("-reading") else "designed pair",
            fontCss=font_css.replace("url(fonts/", "url(assets/htmpres-themes/fonts/"), assets=assets)
        catalog["sources"][name] = dict(repository=f"https://github.com/rahuldave/smalldocs-{name}", commit=revision(repo),
            file="src/theme.json", sha256=hashlib.sha256(file.read_bytes()).hexdigest())
    repo = args.tufte
    light_css = (repo / "src/light-root.css").read_text() + (repo / "src/common.css").read_text()
    light = variables(light_css)["light"]
    dark = light | variables((repo / "src/dark.css").read_text())["light"]
    font_css = (repo / "src/fonts.css").read_text()
    assets = ["licenses/tufte-LICENSE"]
    for font in sorted((repo / "_extensions/tufte/et-book").rglob("*.woff")):
        shutil.copyfile(font, DEST / "fonts" / font.name)
        font_css = re.sub(r'url\("et-book/[^\"]*/' + re.escape(font.name) + r'"\)',
                          f'url(assets/htmpres-themes/fonts/{font.name})', font_css)
        assets.append("fonts/" + font.name)
    (DEST / "licenses/tufte-LICENSE").write_bytes(asset_bytes(repo / "LICENSE"))
    catalog["themes"]["tufte"] = dict(title="Tufte", family="tufte", body=light["--bs-font-sans-serif"],
        heading=light["--bs-font-sans-serif"], mono=light["--bs-font-monospace"],
        palettes={"light": palette(light), "dark": palette(dark)}, native="light", complementary="designed pair",
        fontCss=font_css, assets=assets)
    catalog["sources"]["tufte"] = dict(repository="https://github.com/rahuldave/smalldocs-tufte", commit=revision(repo),
        file="src/light-root.css + src/dark.css", sha256=hashlib.sha256(light_css.encode() + (repo / "src/dark.css").read_bytes()).hexdigest())
    # Reuse already bundled font faces for stock themes where the family matches.
    for entry in catalog["themes"].values():
        if entry["family"] not in ("bootstrap", "bootswatch"):
            continue
        for filename, rule in catalog["fonts"].items():
            family = re.search(r"font-family:\s*['\"]([^'\"]+)", rule).group(1)
            if family in entry["body"] or family in entry["heading"]:
                entry["fontCss"] += rule + "\n"
                entry["assets"].append("fonts/" + filename)
                entry["assets"].extend("fonts/" + p.name for p in (DEST / "fonts").glob("*OFL.txt"))
        entry["assets"] = sorted(set(entry["assets"]))
    for name in ("bootstrap", "bootswatch"):
        (DEST / "licenses" / (name + "-LICENSE")).write_bytes(asset_bytes(vendor / name / "LICENSE"))
    (DEST / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Imported {len(catalog['themes'])} themes into {DEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
