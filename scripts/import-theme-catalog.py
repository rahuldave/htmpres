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
    return subprocess.check_output(
        ["git", "-C", str(folder), "rev-parse", "HEAD"], text=True
    ).strip()


def asset_bytes(file):
    data = file.read_bytes()
    if file.suffix == ".txt" or "LICENSE" in file.name:
        # Preserve notice text, while making upstream CRLF/trailing spaces diff-clean.
        return (
            "\n".join(line.rstrip() for line in data.decode().splitlines()) + "\n"
        ).encode()
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
    return [int(value[i : i + 2], 16) for i in (1, 3, 5)]


def luminance(value):
    channels = [c / 255 for c in rgb(value)]
    linear = [
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels
    ]
    return sum(c * w for c, w in zip(linear, (0.2126, 0.7152, 0.0722)))


def mix(a, b, weight):
    return "#" + "".join(
        f"{round(x * weight + y * (1 - weight)):02x}" for x, y in zip(rgb(a), rgb(b))
    )


def readable(ink, paper):
    """Retain the hue while ensuring text accents meet 4.5:1 contrast."""
    target = "#ffffff" if luminance(paper) < 0.3 else "#111111"
    for step in range(21):
        candidate = mix(target, ink, step / 20)
        a, b = sorted((luminance(candidate), luminance(paper)))
        if (b + 0.05) / (a + 0.05) >= 4.5:
            return candidate
    return target


def variables(css):
    """Read only top-level Bootstrap root/mode declarations, not components."""
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    modes = {"light": {}, "dark": {}}
    for selector, block in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        selectors = [
            s.strip().replace('"', "").replace("'", "") for s in selector.split(",")
        ]
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
    panel = color(tokens.get("--bs-tertiary-bg", mix(ink, paper, 0.05)))
    # Some stock dark themes inherit a light tertiary background.
    if (luminance(panel) < 0.3) != (luminance(paper) < 0.3):
        panel = mix(ink, paper, 0.07)
    return dict(
        paper=paper,
        ink=ink,
        panel=panel,
        line=color(tokens.get("--bs-border-color", mix(ink, paper, 0.25)), paper),
        muted=color(tokens.get("--bs-secondary-color", mix(ink, paper, 0.8)), paper),
        accent=color(tokens["--bs-link-color"], paper),
        secondary=readable(
            color(tokens.get("--bs-secondary", "#6c757d"), paper), paper
        ),
        code=panel,
    )


def counterpart(p, mode):
    paper = mix(
        p["accent"],
        "#161b22" if mode == "dark" else "#fafbfc",
        0.08 if mode == "dark" else 0.025,
    )
    ink = "#e8edf2" if mode == "dark" else "#212529"
    return dict(
        paper=paper,
        ink=ink,
        muted=mix(ink, paper, 0.8),
        panel=mix(ink, paper, 0.06),
        line=mix(ink, paper, 0.26),
        accent=readable(p["accent"], paper),
        secondary=readable(p["secondary"], paper),
        code=mix(ink, paper, 0.06),
    )


def validate_foundation(data, schema=None, location="foundation"):
    """Validate every keyword in the frozen v1 schema with no runtime package."""
    if schema is None:
        schema = json.loads((DEST / "foundations-contract.schema.json").read_text())
    types = {
        "object": dict,
        "array": list,
        "string": str,
        "integer": int,
        "number": (int, float),
    }
    if "type" in schema and (
        not isinstance(data, types[schema["type"]]) or isinstance(data, bool)
    ):
        raise ValueError(f"{location}: expected {schema['type']}")
    if "const" in schema and data != schema["const"]:
        raise ValueError(f"{location}: unsupported constant")
    if "enum" in schema and data not in schema["enum"]:
        raise ValueError(f"{location}: invalid enum")
    if isinstance(data, dict):
        if not set(schema.get("required", [])) <= data.keys():
            raise ValueError(f"{location}: missing required fields")
        if len(data) < schema.get("minProperties", 0):
            raise ValueError(f"{location}: empty map")
        for key, value in data.items():
            child = schema.get("properties", {}).get(
                key, schema.get("additionalProperties", {})
            )
            if child is False:
                raise ValueError(f"{location}: unknown field {key}")
            if isinstance(child, dict):
                validate_foundation(value, child, f"{location}.{key}")
    if isinstance(data, list):
        if len(data) < schema.get("minItems", 0) or (
            schema.get("uniqueItems")
            and len({json.dumps(x, sort_keys=True) for x in data}) != len(data)
        ):
            raise ValueError(f"{location}: invalid array")
        for value in data:
            validate_foundation(value, schema.get("items", {}), location + "[]")
    if isinstance(data, str) and (
        len(data) < schema.get("minLength", 0)
        or ("pattern" in schema and not re.fullmatch(schema["pattern"], data))
    ):
        raise ValueError(f"{location}: invalid string")
    if location == "foundation":
        for mode in data["modes"].values():
            if not all(ref in mode["swatches"] for ref in mode["roles"].values()):
                raise ValueError("Foundation role references an absent swatch")


def committed_bytes(repo, file, commit):
    """Reject working-copy drift instead of misattributing assets to a commit."""
    relative = file.relative_to(repo).as_posix()
    committed = subprocess.check_output(
        ["git", "-C", str(repo), "show", f"{commit}:{relative}"]
    )
    if file.read_bytes() != committed:
        raise ValueError(f"Uncommitted import asset: {relative}")
    return committed


def import_owned(catalog, name, repo, expected=None):
    """Import the published contract verbatim, retaining public compatibility aliases."""
    extension = repo / "_extensions" / name
    file = extension / "foundations.json"
    raw = file.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    commit = revision(repo)
    if expected and (
        commit != expected["commit"] or digest != expected["manifest_sha256"]
    ):
        raise ValueError(f"{name}: merged source ledger does not match checkout")
    committed_bytes(repo, file, commit)
    foundation = json.loads(raw)
    validate_foundation(foundation)
    if foundation["theme"] != name:
        raise ValueError(f"Mismatched foundation: {name}")
    fonts = foundation["typography"]["fonts"]
    palettes = {}
    for mode, values in foundation["modes"].items():
        roles = {key: values["swatches"][ref] for key, ref in values["roles"].items()}
        palettes[mode] = {
            key: roles[key] for key in ["paper", "ink", "muted", "panel", "code"]
        }
        palettes[mode].update(
            line=roles["decorative-line"],
            accent=roles["accent-text"],
            secondary=roles["secondary-text"],
        )
    assets = []
    font_css = committed_bytes(repo, repo / "src/fonts.css", commit).decode()

    def copy_font(match):
        ref = match.group(1).strip("\"'")
        origin = extension / ref
        target = DEST / "fonts" / origin.name
        if target.exists() and asset_bytes(target) != asset_bytes(origin):
            raise ValueError(f"Conflicting font asset: {origin.name}")
        committed_bytes(repo, origin, commit)
        target.write_bytes(asset_bytes(origin))
        assets.append("fonts/" + origin.name)
        return "url(assets/htmpres-themes/fonts/" + origin.name + ")"

    font_css = re.sub(r"url\(([^)]+)\)", copy_font, font_css)
    for license_file in extension.rglob("*"):
        if license_file.is_file() and (
            "OFL" in license_file.name or "LICENSE" in license_file.name
        ):
            target = "licenses/" + name + "-" + license_file.name
            committed_bytes(repo, license_file, commit)
            (DEST / target).write_bytes(asset_bytes(license_file))
            assets.append(target)
    committed_bytes(repo, repo / "LICENSE", commit)
    notice = "licenses/" + name + "-LICENSE"
    (DEST / notice).write_bytes(asset_bytes(repo / "LICENSE"))
    assets.append(notice)
    for rule in re.findall(r"@font-face\s*\{[^}]+\}", font_css):
        match = re.search(r"url\(assets/htmpres-themes/fonts/([^)]+)\)", rule)
        if match:
            catalog["fonts"].setdefault(match[1], rule)
    manifest = "foundations/" + name + ".json"
    (DEST / "foundations").mkdir(exist_ok=True)
    (DEST / manifest).write_bytes(raw)
    assets.append(manifest)
    old = catalog["themes"].get(name, {})
    catalog["themes"][name] = dict(
        title=old.get("title", name.title()),
        family=(
            "tufte"
            if name == "tufte"
            else "reading" if name.endswith("-reading") else "elegant"
        ),
        body=fonts["body"],
        heading=fonts["heading"],
        mono=fonts["code"],
        palettes=palettes,
        native=foundation["nativeMode"],
        complementary="authored upstream pair",
        fontCss=font_css,
        assets=sorted(set(assets)),
        foundation=foundation,
    )
    catalog["sources"][name] = dict(
        repository=f"https://github.com/rahuldave/smalldocs-{name}",
        commit=commit,
        file=f"_extensions/{name}/foundations.json",
        sha256=digest,
    )


def refresh_owned(ledger, refresh_docs=False):
    """Keep every stock entry/source byte-equivalent in an owned-only refresh."""
    owned = {
        "folio",
        "atelier",
        "nocturne",
        "tufte",
        *(name + "-reading" for name in READING),
    }
    if len(ledger) != len(owned) or {item["theme"] for item in ledger} != owned:
        raise ValueError("Owned ledger must contain exactly the nine supported themes")
    catalog = json.loads((DEST / "catalog.json").read_text())
    for source in ledger:
        import_owned(catalog, source["theme"], Path(source["path"]), source)
    (DEST / "catalog.json").write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n"
    )
    if refresh_docs:
        source = next(item for item in ledger if item["theme"] == "nocturne")
        folder = Path(source["path"]) / "_extensions/nocturne"
        target = ROOT / "docs/_extensions/nocturne"
        files = [
            "nocturne.css",
            "nocturne-dark.css",
            "foundations.json",
            "smalldocs.yml",
            "BOOTSTRAP-LICENSE",
            "logo.svg",
        ]
        hashes = {}
        for filename in files:
            committed_bytes(Path(source["path"]), folder / filename, source["commit"])
            shutil.copy2(folder / filename, target / filename)
            hashes[filename] = hashlib.sha256(
                (target / filename).read_bytes()
            ).hexdigest()
        for asset in catalog["themes"]["nocturne"]["assets"]:
            if asset.startswith("licenses/"):
                (target / "licenses").mkdir(exist_ok=True)
                shutil.copy2(DEST / asset, target / asset)
                hashes[asset] = hashlib.sha256(
                    (target / asset).read_bytes()
                ).hexdigest()
        shutil.copy2(Path(source["path"]) / "LICENSE", target / "LICENSE")
        (target / "provenance.json").write_text(
            json.dumps(
                dict(
                    source="https://github.com/rahuldave/smalldocs-nocturne",
                    source_commit=source["commit"],
                    files=hashes,
                    fonts="Staged from _extensions/htmpres/themes/fonts by just theme-gallery; OFL notices preserved.",
                ),
                indent=2,
            )
            + "\n"
        )
    print("Imported nine merged owned foundations; stock catalog unchanged")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smalldocs", type=Path)
    parser.add_argument("--owned-ledger", type=Path)
    parser.add_argument("--refresh-docs", action="store_true")
    parser.add_argument("--elegant", type=Path)
    parser.add_argument("--tufte", type=Path)
    args = parser.parse_args()
    if args.owned_ledger:
        refresh_owned(json.loads(args.owned_ledger.read_text()), args.refresh_docs)
        return
    if not all([args.smalldocs, args.elegant, args.tufte]):
        parser.error(
            "Full imports require --smalldocs, --elegant and --tufte; use --owned-ledger to preserve stock entries"
        )
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "fonts").mkdir(exist_ok=True)
    (DEST / "licenses").mkdir(exist_ok=True)
    catalog = {"version": 1, "themes": {}, "fonts": {}, "sources": {}}
    vendor = args.smalldocs / "src/smalldocs/assets/vendor"
    source_files = {"bootstrap": vendor / "bootstrap/bootstrap.min.css"}
    source_files.update(
        {
            p.name.removesuffix(".min.css"): p
            for p in sorted((vendor / "bootswatch").glob("*.min.css"))
        }
    )
    for name, file in source_files.items():
        css = file.read_text()
        modes = variables(css)
        native = (
            "dark"
            if luminance(color(modes["light"]["--bs-body-bg"])) < 0.3
            else "light"
        )
        native_palette = palette(modes["light"])
        palettes = (
            {"light": native_palette, "dark": palette(modes["dark"])}
            if native == "light"
            else {"dark": native_palette, "light": counterpart(native_palette, "light")}
        )
        fonts = modes["light"]["--bs-font-sans-serif"]
        heading, heading_weight = fonts, "500"
        for selector, block in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
            if not all(
                re.search(r"(?:^|,)h" + str(n) + r"(?:,|$)", selector)
                for n in range(1, 7)
            ):
                continue
            family = re.search(r"(?:^|;)font-family:([^;]+)", block)
            weight = re.search(r"(?:^|;)font-weight:([^;]+)", block)
            if family:
                heading = family.group(1)
            if weight:
                heading_weight = weight.group(1)
        body = 'Georgia, "Times New Roman", serif' if name == "litera" else fonts
        catalog["themes"][name] = dict(
            title=name.title(),
            family="bootstrap" if name == "bootstrap" else "bootswatch",
            body=body,
            heading=heading,
            headingWeight=heading_weight,
            mono=modes["light"]["--bs-font-monospace"],
            palettes=palettes,
            native=native,
            complementary=(
                "Bootstrap 5.3 dark variables"
                if native == "light"
                else "htmpres light adaptation"
            ),
            fontCss="",
            assets=[],
            bootstrap=modes,
        )
        catalog["sources"][name] = dict(
            repository="https://github.com/rahuldave/smalldocs",
            commit=revision(args.smalldocs),
            file=str(file.relative_to(args.smalldocs)),
            sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
        )
    for name in ("folio", "atelier", "nocturne", *(n + "-reading" for n in READING)):
        import_owned(catalog, name, args.elegant / ("smalldocs-" + name))
    import_owned(catalog, "tufte", args.tufte)
    # Reuse already bundled font faces for stock themes where the family matches.
    for entry in catalog["themes"].values():
        if entry["family"] not in ("bootstrap", "bootswatch"):
            continue
        for filename, rule in catalog["fonts"].items():
            family = re.search(r"font-family:\s*['\"]([^'\"]+)", rule).group(1)
            if family in entry["body"] or family in entry["heading"]:
                entry["fontCss"] += rule + "\n"
                entry["assets"].append("fonts/" + filename)
                entry["assets"].extend(
                    "fonts/" + p.name for p in (DEST / "fonts").glob("*OFL.txt")
                )
        entry["assets"] = sorted(set(entry["assets"]))
    for name in ("bootstrap", "bootswatch"):
        (DEST / "licenses" / (name + "-LICENSE")).write_bytes(
            asset_bytes(vendor / name / "LICENSE")
        )
    (DEST / "catalog.json").write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n"
    )
    print(f"Imported {len(catalog['themes'])} themes into {DEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
