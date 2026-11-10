#!/usr/bin/env python3
"""Validate/stage reviewed static plotting documentation without plotting imports.

Promotion is an explicit maintainer operation against existing reviewed outputs.
Normal site builds only validate and copy a closed committed public asset tree.
"""

from __future__ import annotations

import argparse
import html
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
import shutil

ROOT = Path(__file__).resolve().parents[1]
REVISION = "7b1bff11284ad2960f984f0f8ed772fa09c06d8c"
INTERFACES = ("python", "r-ggplot", "r-base")
FAMILIES = (
    "folio",
    "atelier",
    "nocturne",
    "tufte",
    "zephyr-reading",
    "simplex-reading",
    "pulse-reading",
    "litera-reading",
    "darkly-reading",
)
FINGERPRINT_ROOTS = (
    "packages/spec/data",
    "packages/spec/schema.json",
    "packages/spec/source-lock.json",
    "packages/spec/conformance.json",
    "packages/python/src",
    "packages/python/examples",
    "packages/python/pyproject.toml",
    "packages/python/uv.lock",
    "packages/r/R",
    "packages/r/inst",
    "packages/r/DESCRIPTION",
    "packages/r/NAMESPACE",
    "packages/r/tools/tested-dependencies.json",
    "docs/_plotting-evidence.json",
    "examples/plotting",
    "packages/python/LICENSE",
    "packages/r/LICENSE.md",
)
FORBIDDEN = (
    "/Users/",
    "/tmp/",
    "/var/folders/",
    ".build/",
    "renderLibrary",
    "source_presentations",
    "crbook",
)


def digest(payload: bytes) -> str:
    """Hash exact distributed bytes, without normalization."""
    return hashlib.sha256(payload).hexdigest()


def load_json(path: Path) -> dict:
    """Reject duplicate object keys instead of silently losing destinations."""

    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate JSON key")
            result[key] = value
        return result

    return json.loads(path.read_text(), object_pairs_hook=unique)


def safe(root: Path, relative: str) -> Path:
    """Reject ambiguous/traversing paths and symlinks before any reads."""
    if (
        not isinstance(relative, str)
        or not re.fullmatch(r"[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*", relative)
        or "\\" in relative
        or not relative
        or any(p in ("", ".", "..") for p in relative.split("/"))
        or PurePosixPath(relative).is_absolute()
    ):
        raise ValueError("Unsafe public path")
    current = root
    if current.is_symlink():
        raise ValueError("Symlink root")
    for part in relative.split("/"):
        current = current / part
        if current.is_symlink():
            raise ValueError("Symlink resource")
    if not current.resolve().is_relative_to(root.resolve()):
        raise ValueError("Escaping public path")
    return current


def regular_files(root: Path) -> list[str]:
    """Walk without accepting any symlink or hidden generated cache."""
    if root.is_symlink():
        raise ValueError("Symlink root")
    result = []
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ValueError("Symlink resource")
        if path.is_file():
            result.append(path.relative_to(root).as_posix())
    return sorted(result)


def fingerprints(repo: Path) -> dict[str, str]:
    """Bind runtime/spec/example inputs; never hash local caches or guide prose."""
    result = {}
    for relative in FINGERPRINT_ROOTS:
        base = safe(repo, relative)
        paths = [base] if base.is_file() else [base / p for p in regular_files(base)]
        for path in paths:
            if "__pycache__" in path.parts or path.suffix == ".pyc":
                continue
            result[path.relative_to(repo).as_posix()] = digest(path.read_bytes())
    return dict(sorted(result.items()))


def canonical_sources(repo: Path) -> dict[str, Path]:
    """Bind every public source/notice to its exact canonical reviewed input."""
    mapping = {
        "source/python-gallery.py": repo / "packages/python/examples/gallery.py",
        "source/r-ggplot-gallery.R": repo / "packages/r/inst/examples/gallery.R",
        "source/r-base-gallery.R": repo / "packages/r/inst/examples/gallery.R",
        "source/dataframes.py": repo / "packages/python/examples/dataframes.py",
        "source/quickstart.R": repo / "packages/r/inst/examples/quickstart.R",
        "source/quickstart.qmd.txt": repo / "examples/plotting/r-quickstart.qmd",
        "notices/python-MIT.txt": repo / "packages/python/LICENSE",
        "notices/r-MIT.txt": repo / "packages/r/LICENSE.md",
    }
    for notice in (repo / "packages/spec/data/notices").iterdir():
        mapping["notices/" + notice.name + ".txt"] = notice
    return mapping


def public_index(views: list[dict], notices: list[str]) -> bytes:
    """Build the sole allowed static HTML download index from validated views."""
    rows = []
    for view in views:
        links = " · ".join(
            f'<a href="{html.escape(path)}">{kind.upper()}</a>'
            for kind, path in view["downloads"].items()
        )
        rows.append(
            f'<li>{html.escape(view["interface"]+" · "+view["case"])}: {links} · <a href="{html.escape(view["source"])}">source</a> · <a href="{html.escape(view["report"])}">report</a></li>'
        )
    legal = (
        '<h2 id="notices">Font and code notices</h2><ul>'
        + "".join(
            f'<li><a href="{html.escape(name)}">{html.escape(name.split("/")[-1])}</a></li>'
            for name in sorted(notices)
        )
        + "</ul>"
    )
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Plotfoundry static download index</title><h1>72 configurations · 216 interface views</h1><p>Unreleased native references. Every PNG is available; vector links appear only when staged. These are reviewed static exports, not live plotting runtimes.</p><ul>'
        + "".join(rows)
        + "</ul>"
        + legal
        + "</html>"
    ).encode()


def report_matches(report: dict, view: dict, spec: dict) -> None:
    """Validate the entire closed public report against approved numeric anchors."""
    keys = {
        "case",
        "interface",
        "specVersion",
        "canvasInches",
        "canvasPixels",
        "placedWidthCssPx",
        "tightCrop",
        "devices",
        "fonts",
        "files",
        "verification",
    }
    if set(report) != keys:
        raise ValueError("Unexpected public report fields")
    case = next(c for c in spec["cases"] if c["id"] == view["case"])
    canvas = [8, 8] if view["interface"] == "python" else [8, 9]
    width = case["placement"]["placedWidthCssPx"]
    if (
        report["case"] != view["case"]
        or report["interface"] != view["interface"]
        or report["specVersion"] != "0.1.0"
        or report["canvasInches"] != canvas
        or report["canvasPixels"] != [width, width * canvas[1] / 8]
        or report["placedWidthCssPx"] != width
        or report["tightCrop"] is not False
    ):
        raise ValueError("Invalid case/canvas/placement report")
    expected_fonts = {
        role: {"sha256": key, "weight": spec["fonts"][key]["weight"]}
        for role, key in case["fonts"].items()
    }
    if view["canvasInches"] != canvas or view["placedWidthCssPx"] != width:
        raise ValueError("Invalid view placement")
    if report["fonts"] != expected_fonts:
        raise ValueError("Invalid public font anchors")
    devices = (
        {"Matplotlib": "3.11.2"}
        if view["interface"] == "python"
        else {
            "R": "4.1.1",
            "showtext": "0.9.8",
            "ragg": "1.5.2",
            "svglite": "2.2.2",
            "pdf": "grDevices::pdf 4.1.1",
        }
    )
    if view["interface"] == "r-ggplot":
        devices["ggplot2"] = "4.0.3"
    if report["devices"] != devices:
        raise ValueError("Invalid native version evidence")
    if set(report["files"]) != set(view["downloads"]):
        raise ValueError("Unexpected public export formats")
    for kind, item in report["files"].items():
        if (
            set(item) != {"url", "sha256", "fontPolicy"}
            or item["url"] != view["downloads"][kind]
        ):
            raise ValueError("Invalid public export URL/fields")
        policy = (
            {
                "png": "rasterized glyphs; no font embedding",
                "svg": "glyph outlines; fonts not embedded as editable text",
                "pdf": "TrueType subset requested; FontFile2 present, not full PDF conformance certification",
            }[kind]
            if view["interface"] == "python"
            else (
                "showtext rasterized glyphs"
                if kind == "png"
                else "showtext glyph outlines; no font embedding claim"
            )
        )
        if item["fontPolicy"] != policy:
            raise ValueError("Invalid export policy")
    if (
        report["verification"]
        != "Reviewed native exports; not a universal font, accessibility or dense-layout guarantee."
    ):
        raise ValueError("Unexpected report statement")


def clean_report(report: dict, public_files: dict[str, str], interface: str) -> dict:
    """Publish explicit scalar metadata, never raw paths or host/environment dumps."""
    fonts = report["fonts"]
    if isinstance(fonts, list):
        fonts = {item["role"]: item for item in fonts}
    return {
        "case": report["case"],
        "interface": interface,
        "specVersion": report["specVersion"],
        "canvasInches": report["canvasInches"],
        "canvasPixels": report.get(
            "canvasPixels", report["files"]["png"].get("canvasPixels")
        ),
        "placedWidthCssPx": report["placedWidthCssPx"],
        "tightCrop": False,
        "devices": report.get(
            "devices", {"Matplotlib": report.get("matplotlibVersion")}
        ),
        "fonts": {
            role: {k: face[k] for k in ("sha256", "weight") if k in face}
            for role, face in fonts.items()
        },
        "files": {
            kind: {
                "url": public_files[kind],
                "sha256": item["sha256"],
                "fontPolicy": item["fontPolicy"],
            }
            for kind, item in report["files"].items()
            if kind in public_files
        },
        "verification": "Reviewed native exports; not a universal font, accessibility or dense-layout guarantee.",
    }


def validate(bundle: Path, repo: Path = ROOT) -> dict:
    """Check closure, evidence fingerprints, every payload and public references."""
    manifest = load_json(safe(bundle, "manifest.json"))
    if set(manifest) != {
        "schemaVersion",
        "sourceRevision",
        "specVersion",
        "inputFingerprints",
        "files",
        "views",
        "vectorPolicy",
    }:
        raise ValueError("Unexpected manifest root fields")
    if (
        manifest.get("specVersion") != "0.1.0"
        or manifest.get("vectorPolicy")
        != "Every Python case; one paired-route representative per R family. PNGs cover all 216 interface views."
    ):
        raise ValueError("Unexpected manifest policy")
    if manifest.get("schemaVersion") != 1 or manifest.get("sourceRevision") != REVISION:
        raise ValueError("Unknown publication provenance")
    if manifest["inputFingerprints"] != fingerprints(repo):
        raise ValueError("Stale plotting inputs; reviewed promotion required")
    files = manifest["files"]
    if set(regular_files(bundle)) != set(files) | {"manifest.json"}:
        raise ValueError("Unexpected/missing public assets")
    canonical = canonical_sources(repo)
    if {name for name in files if name.startswith(("source/", "notices/"))} != set(
        canonical
    ):
        raise ValueError("Canonical source/notice closure mismatch")
    for name, path in canonical.items():
        if safe(bundle, name).read_bytes() != path.read_bytes():
            raise ValueError("Canonical source/notice drift")
    spec = json.loads((repo / "packages/spec/data/spec.json").read_text())
    evidence = load_json(repo / "docs/_plotting-evidence.json")
    if sum(item["bytes"] for item in files.values()) > 48 * 1024 * 1024:
        raise ValueError("Public asset budget exceeded")
    for name, entry in files.items():
        if (
            set(entry) != {"sha256", "bytes"}
            or type(entry["bytes"]) is not int
            or entry["bytes"] < 0
            or not isinstance(entry["sha256"], str)
            or not re.fullmatch("[0-9a-f]{64}", entry["sha256"])
        ):
            raise ValueError("Unexpected manifest file entry")
        path = safe(bundle, name)
        if name != "index.html" and path.suffix.lower() not in (
            ".png",
            ".svg",
            ".pdf",
            ".json",
            ".py",
            ".r",
            ".qmd",
            ".txt",
            ".md",
        ):
            raise ValueError("Unexpected public file type")
        payload = path.read_bytes()
        if digest(payload) != entry["sha256"] or len(payload) != entry["bytes"]:
            raise ValueError("Altered public payload")
        if path.suffix == ".json" and any(
            value in payload.decode() for value in FORBIDDEN
        ):
            raise ValueError("Private/local metadata")
    expected = {
        f"{family}/{mode}/{profile}/{surface}"
        for family in FAMILIES
        for mode in ("light", "dark")
        for profile in ("reading", "presentation")
        for surface in ("paper", "panel")
    }
    seen = set()
    for view in manifest["views"]:
        if set(view) != {
            "interface",
            "case",
            "downloads",
            "report",
            "source",
            "canvasInches",
            "placedWidthCssPx",
        }:
            raise ValueError("Unexpected view fields")
        identity = (view["interface"], view["case"])
        if (
            identity in seen
            or identity[0] not in INTERFACES
            or identity[1] not in expected
        ):
            raise ValueError("Duplicate/unknown gallery view")
        seen.add(identity)
        formats = set(view["downloads"])
        if formats not in ({"png"}, {"png", "svg", "pdf"}):
            raise ValueError("Invalid format availability")
        if view["interface"] == "python" and formats != {"png", "svg", "pdf"}:
            raise ValueError("Python vector coverage missing")
        for name in [*view["downloads"].values(), view["report"], view["source"]]:
            safe(bundle, name)
            if name not in files:
                raise ValueError("Missing public reference")
        report = load_json(bundle / view["report"])
        report_matches(report, view, spec)
        if report["case"] != view["case"] or report["interface"] != view["interface"]:
            raise ValueError("Mismatched public report")
        expected_source = (
            "source/"
            + view["interface"]
            + "-gallery"
            + (".py" if view["interface"] == "python" else ".R")
        )
        if view["source"] != expected_source:
            raise ValueError("Wrong canonical gallery source")
        if (
            view["report"]
            != "reports/"
            + view["interface"]
            + "-"
            + view["case"].replace("/", "-")
            + ".json"
        ):
            raise ValueError("Unexpected report destination")
        for kind, name in view["downloads"].items():
            if (
                name
                != "exports/"
                + view["interface"]
                + "/"
                + view["case"].replace("/", "-")
                + "."
                + kind
            ):
                raise ValueError("Unexpected export destination")
            if (
                files[name]["sha256"]
                != evidence["exports"][view["interface"]][view["case"]][kind]
            ):
                raise ValueError("Reviewed export evidence drift")
            if (
                report["files"][kind]["url"] != name
                or report["files"][kind]["sha256"] != files[name]["sha256"]
            ):
                raise ValueError("Mismatched export reference")
    vector_cases = {
        interface: {
            view["case"]
            for view in manifest["views"]
            if view["interface"] == interface and "svg" in view["downloads"]
        }
        for interface in ("r-ggplot", "r-base")
    }
    if (
        vector_cases["r-ggplot"] != vector_cases["r-base"]
        or len(vector_cases["r-base"]) != 9
        or {case.split("/")[0] for case in vector_cases["r-base"]} != set(FAMILIES)
    ):
        raise ValueError("R representative vector coverage missing")
    permitted = set(canonical) | {"index.html"}
    for view in manifest["views"]:
        permitted.update([view["report"], view["source"], *view["downloads"].values()])
    if set(files) != permitted:
        raise ValueError("Unreferenced public resource")
    if seen != {(interface, case) for interface in INTERFACES for case in expected}:
        raise ValueError("Incomplete gallery")
    if safe(bundle, "index.html").read_bytes() != public_index(
        manifest["views"], [name for name in canonical if name.startswith("notices/")]
    ):
        raise ValueError("Static index drift")
    return manifest


def stage(bundle: Path, output: Path, repo: Path = ROOT) -> None:
    """Validate before replacing only the managed plotting output directory."""
    validate(bundle, repo)
    if (
        output.is_symlink()
        or any(parent.is_symlink() for parent in output.parents)
        or any(p.is_symlink() for p in output.rglob("*"))
    ):
        raise ValueError("Unsafe managed output")
    resolved = output.resolve()
    source = bundle.resolve()
    repository = repo.resolve()
    if (
        resolved.is_relative_to(repository)
        and resolved != repository / "docs/_generated/plotting"
    ):
        raise ValueError("Not the managed plotting destination")
    if (
        resolved == source
        or resolved in source.parents
        or resolved == repository
        or resolved in repository.parents
        or resolved.is_relative_to(source)
    ):
        raise ValueError("Managed output overlaps source/repository")
    if output.exists():
        shutil.rmtree(output)
    shutil.copytree(bundle, output)


def promote(bundle: Path, repo: Path = ROOT) -> None:
    """Allowlist exact reviewed images and source examples; no rendering occurs."""
    python = json.loads(
        (repo / ".build/packages/python-gallery/manifest.json").read_text()
    )
    r = json.loads((repo / ".build/packages/r-gallery/gallery.json").read_text())[
        "cases"
    ]
    if len(python) != 72 or len(r) != 72:
        raise ValueError("Reviewed input coverage missing")
    if bundle.exists():
        raise ValueError("Promote into a new path, then review replacement")
    bundle.mkdir(parents=True)
    files = {}
    views = []

    def write(name: str, payload: bytes) -> None:
        target = safe(bundle, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
        files[name] = {"sha256": digest(payload), "bytes": len(payload)}

    sources = {
        "python": "packages/python/examples/gallery.py",
        "r-ggplot": "packages/r/inst/examples/gallery.R",
        "r-base": "packages/r/inst/examples/gallery.R",
    }
    for interface, source in sources.items():
        write(
            f"source/{interface}-gallery" + Path(source).suffix,
            safe(repo, source).read_bytes(),
        )
    for source in (
        "packages/python/examples/dataframes.py",
        "packages/r/inst/examples/quickstart.R",
    ):
        write("source/" + Path(source).name, safe(repo, source).read_bytes())
    write(
        "source/quickstart.qmd.txt",
        safe(repo, "examples/plotting/r-quickstart.qmd").read_bytes(),
    )
    for notice in sorted((repo / "packages/spec/data/notices").iterdir()):
        write("notices/" + notice.name + ".txt", notice.read_bytes())
    for language in ("python", "r"):
        write(
            f"notices/{language}-MIT.txt",
            (
                repo
                / f"packages/{language}"
                / ("LICENSE" if language == "python" else "LICENSE.md")
            ).read_bytes(),
        )
    selected = {
        f'{family}/{"light" if i%2==0 else "dark"}/{"reading" if i%3 else "presentation"}/{"paper" if i%2 else "panel"}'
        for i, family in enumerate(FAMILIES)
    }
    records = [("python", item) for item in python] + [
        (interface, item[key])
        for item in r
        for interface, key in [("r-ggplot", "ggplot"), ("r-base", "base")]
    ]
    for interface, report in records:
        case = report["case"]
        slug = case.replace("/", "-")
        downloads = {}
        for kind, item in report["files"].items():
            path = safe(repo, item["path"])
            payload = path.read_bytes()
            if digest(payload) != item["sha256"]:
                raise ValueError("Unreviewed/altered export")
            if interface != "python" and kind != "png" and case not in selected:
                continue
            name = f"exports/{interface}/{slug}.{kind}"
            write(name, payload)
            downloads[kind] = name
        source = f"source/{interface}-gallery" + (
            ".py" if interface == "python" else ".R"
        )
        name = f"reports/{interface}-{slug}.json"
        public = clean_report(report, downloads, interface)
        approved_fonts = json.loads(
            (repo / "packages/spec/data/spec.json").read_text()
        )["fonts"]
        for face in public["fonts"].values():
            face["weight"] = approved_fonts[face["sha256"]]["weight"]
        write(name, (json.dumps(public, indent=2) + "\n").encode())
        views.append(
            {
                "interface": interface,
                "case": case,
                "downloads": downloads,
                "report": name,
                "source": source,
                "canvasInches": report["canvasInches"],
                "placedWidthCssPx": report["placedWidthCssPx"],
            }
        )
    write(
        "index.html",
        public_index(views, [name for name in files if name.startswith("notices/")]),
    )
    manifest = {
        "schemaVersion": 1,
        "sourceRevision": REVISION,
        "specVersion": "0.1.0",
        "inputFingerprints": fingerprints(repo),
        "files": files,
        "views": views,
        "vectorPolicy": "Every Python case; one paired-route representative per R family. PNGs cover all 216 interface views.",
    }
    (bundle / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    validate(bundle, repo)


def main() -> None:
    """Run an explicit static publication operation."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["validate", "stage", "promote"])
    parser.add_argument("--bundle", type=Path, default=ROOT / "docs/_plotting")
    parser.add_argument(
        "--output", type=Path, default=ROOT / "docs/_generated/plotting"
    )
    args = parser.parse_args()
    if args.operation == "promote":
        promote(args.bundle)
    elif args.operation == "stage":
        stage(args.bundle, args.output)
    else:
        validate(args.bundle)
    print(f"Static plotting {args.operation} passed")


if __name__ == "__main__":
    main()
