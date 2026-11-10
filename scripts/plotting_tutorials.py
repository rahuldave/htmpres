#!/usr/bin/env python3
"""Publish a closed, reviewed tutorial bundle without native plotting dependencies.

The explicit promote command captures already-rendered native files. Website CI
only validates and stages committed bytes. It never executes Python/R plots.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "examples/plotting-tutorials"
BUNDLE = "docs/_plotting-tutorials"
OUTPUT = "docs/_generated/plotting-tutorials"
IDS = (
    "python-electricity",
    "python-reservoir",
    "python-occupancy",
    "python-temperature",
    "r-yield",
    "r-nitrate",
    "r-temperature",
    "r-base-yield",
    "python-electricity-presentation",
    "r-yield-presentation",
)
CASES = {
    "python-electricity": "folio/light/reading/paper",
    "python-electricity-presentation": "folio/light/presentation/paper",
    "python-reservoir": "atelier/light/reading/paper",
    "python-occupancy": "nocturne/dark/reading/paper",
    "python-temperature": "litera-reading/light/reading/paper",
    "r-yield": "folio/light/reading/paper",
    "r-yield-presentation": "folio/light/presentation/paper",
    "r-nitrate": "atelier/light/reading/paper",
    "r-temperature": "litera-reading/light/reading/paper",
    "r-base-yield": "tufte/light/reading/paper",
}
INPUTS = (
    "packages/python/src/plotfoundry",
    "packages/r/R",
    "packages/spec/data/manifest.json",
)
FORBIDDEN = ("/Users/", "/tmp/", "/var/folders/", ".build/", "renderLibrary")


def digest(data: bytes) -> str:
    """Hash exact bytes, including native vector output."""
    return hashlib.sha256(data).hexdigest()


def safe(root: Path, relative: str) -> Path:
    """Reject traversal and symlinks on every path component."""
    if not re.fullmatch(r"[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*", relative):
        raise ValueError("Unsafe tutorial path")
    if any(part in (".", "..") for part in relative.split("/")):
        raise ValueError("Unsafe tutorial path")
    current = root
    if current.is_symlink():
        raise ValueError("Symlink root")
    for part in relative.split("/"):
        current = current / part
        if current.is_symlink():
            raise ValueError("Symlink tutorial input")
    return current


def inventory(root: Path) -> dict[str, str]:
    """Inventory regular files only; reject hidden filesystem redirection."""
    if root.is_symlink():
        raise ValueError("Symlink directory")
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError("Symlink input")
        if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc":
            result[path.relative_to(root).as_posix()] = digest(path.read_bytes())
    return result


def fingerprints(repo: Path) -> dict[str, str]:
    """Bind source programs and the approved native implementations they use."""
    result = {}
    for relative in (SOURCE, *INPUTS):
        path = safe(repo, relative)
        if path.is_file():
            result[relative] = digest(path.read_bytes())
        else:
            result.update(
                {
                    relative + "/" + name: value
                    for name, value in inventory(path).items()
                }
            )
    return result


def extension(stem: str) -> str:
    return "py" if stem.startswith("python-") else "R"


def load_json(path: Path) -> dict:
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate manifest key")
            result[key] = value
        return result

    return json.loads(path.read_text(), object_pairs_hook=unique)


def anchor(stem: str) -> dict:
    """Task identity and placement are editorial constants, not report inputs."""
    width = 1152 if stem.endswith("-presentation") else 640
    height_inches = 5 if stem in ("python-occupancy", "r-nitrate") else 4.8
    return {
        "id": stem,
        "themeCase": CASES[stem],
        "placedWidthCssPx": width,
        "canvasPixels": [width, int(height_inches * width / 8)],
    }


def font_records(repo: Path, stem: str) -> list[dict]:
    """Resolve exact public font metadata from the unchanged scientific spec."""
    spec = load_json(safe(repo, "packages/spec/data/spec.json"))
    case = next(case for case in spec["cases"] if case["id"] == CASES[stem])
    return [
        {
            "role": role,
            "sha256": spec["fonts"][case["fonts"][role]]["sha256"],
            "file": spec["fonts"][case["fonts"][role]]["path"],
            "weight": spec["fonts"][case["fonts"][role]]["weight"],
        }
        for role in ("ui", "heading")
    ]


def normalize_report(raw: dict, stem: str, repo: Path) -> dict:
    """Select public evidence fields; do not publish arbitrary native metadata."""
    target = anchor(stem)
    if (
        raw["case"] != target["themeCase"]
        or raw["placedWidthCssPx"] != target["placedWidthCssPx"]
    ):
        raise ValueError("Native report does not match the tutorial task")
    expected_fonts = font_records(repo, stem)
    for expected in expected_fonts:
        original = (
            raw["fonts"][expected["role"]]
            if isinstance(raw["fonts"], dict)
            else next(f for f in raw["fonts"] if f["role"] == expected["role"])
        )
        if any(original[k] != expected[k] for k in ("file", "sha256")):
            raise ValueError("Native font does not match the approved case")
    devices = (
        {"matplotlib": raw["matplotlibVersion"]}
        if stem.startswith("python-")
        else raw["devices"]
    )
    return {
        "case": raw["case"],
        "specVersion": raw["specVersion"],
        "canvasInches": raw["canvasInches"],
        "canvasPixels": target["canvasPixels"],
        "placedWidthCssPx": raw["placedWidthCssPx"],
        "tightCrop": raw["tightCrop"],
        "fonts": expected_fonts,
        "devices": devices,
        "files": {
            kind: {
                key: raw["files"][kind][key] for key in ("path", "sha256", "fontPolicy")
            }
            for kind in ("png", "svg", "pdf")
        },
    }


def validate_report(report: dict, stem: str, files: dict, repo: Path) -> None:
    """Closed schema plus independent task/font anchors reject coherent metadata edits."""
    expected = anchor(stem)
    if set(report) != {
        "case",
        "specVersion",
        "canvasInches",
        "canvasPixels",
        "placedWidthCssPx",
        "tightCrop",
        "fonts",
        "devices",
        "files",
    }:
        raise ValueError("Unexpected public report field")
    if (
        report["case"] != expected["themeCase"]
        or report["specVersion"] != "0.1.0"
        or report["canvasPixels"] != expected["canvasPixels"]
        or report["placedWidthCssPx"] != expected["placedWidthCssPx"]
        or report["canvasInches"]
        != [8, 5 if stem in ("python-occupancy", "r-nitrate") else 4.8]
        or report["tightCrop"] is not False
        or report["fonts"] != font_records(repo, stem)
    ):
        raise ValueError("Report does not match the approved task/font anchors")
    devices = report["devices"]
    allowed = (
        {"matplotlib"}
        if stem.startswith("python-")
        else {"R", "showtext", "ragg", "svglite", "pdf", "ggplot2"}
    )
    if stem == "r-base-yield":
        allowed.remove("ggplot2")
    if (
        not isinstance(devices, dict)
        or set(devices) != allowed
        or any(
            not isinstance(v, str) or not re.fullmatch(r"[A-Za-z0-9.: -]{1,64}", v)
            for v in devices.values()
        )
    ):
        raise ValueError("Unexpected native device evidence")
    if set(report["files"]) != {"png", "svg", "pdf"}:
        raise ValueError("Unexpected export kind")
    policies = {
        "python": {
            "png": "rasterized glyphs; no font embedding",
            "svg": "glyph outlines; fonts not embedded as editable text",
            "pdf": "TrueType subset requested; FontFile2 present, not full PDF conformance certification",
        },
        "r": {
            "png": "showtext rasterized glyphs",
            "svg": "showtext glyph outlines; no font embedding claim",
            "pdf": "showtext glyph outlines; no font embedding claim",
        },
    }
    for kind, record in report["files"].items():
        if (
            set(record) != {"path", "sha256", "fontPolicy"}
            or record["path"] != stem + "." + kind
            or record["sha256"] != files[stem + "." + kind]
            or record["fontPolicy"]
            != policies["python" if stem.startswith("python-") else "r"][kind]
        ):
            raise ValueError("Export/report evidence mismatch")


def validate(bundle: Path, repo: Path = ROOT) -> dict:
    """Reject stale sources, extra files, changed exports and false pairing."""
    manifest = load_json(safe(bundle, "manifest.json"))
    if (
        set(manifest) != {"schemaVersion", "inputs", "artifacts", "cases", "files"}
        or manifest["schemaVersion"] != 1
    ):
        raise ValueError("Unknown tutorial manifest")
    if manifest["inputs"] != fingerprints(repo):
        raise ValueError("Stale tutorial source/runtime")
    if manifest["cases"] != [anchor(stem) for stem in IDS]:
        raise ValueError("Unexpected tutorial cases")
    if set(manifest["artifacts"]) != {"python", "r"} or any(
        not re.fullmatch(r"[0-9a-f]{64}", value)
        for value in manifest["artifacts"].values()
    ):
        raise ValueError("Invalid native artifact provenance")
    files = inventory(bundle)
    files.pop("manifest.json", None)
    if files != manifest["files"]:
        raise ValueError("Tutorial files differ from reviewed inventory")
    expected = set()
    for case in manifest["cases"]:
        stem = case["id"]
        names = {
            f"{stem}.{suffix}"
            for suffix in (extension(stem), "png", "svg", "pdf", "report.json")
        }
        expected.update(names)
        canonical = safe(repo, f"{SOURCE}/{stem}.{extension(stem)}").read_bytes()
        if safe(bundle, f"{stem}.{extension(stem)}").read_bytes() != canonical:
            raise ValueError("Downloaded source differs from executed canonical source")
        png = safe(bundle, stem + ".png").read_bytes()
        if png[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("Not a PNG")
        width, height = struct.unpack(">II", png[16:24])
        if [width, height] != case["canvasPixels"] or width != case["placedWidthCssPx"]:
            raise ValueError("Unexpected native canvas/placement")
        report = load_json(safe(bundle, stem + ".report.json"))
        validate_report(report, stem, files, repo)
        for suffix in (extension(stem), "svg", "report.json"):
            text = safe(bundle, stem + "." + suffix).read_text()
            if any(word in text for word in FORBIDDEN):
                raise ValueError("Private runtime path in public tutorial")
    if expected != set(files):
        raise ValueError("Unexpected public resource")
    # Each complete displayed program must remain byte-exact with its download.
    for language, fence in (("python", "python"), ("r", "r")):
        guide = safe(repo, f"docs/plotting-{language}.qmd").read_text()
        blocks = re.findall(r"```" + fence + r"\n(.*?)\n```", guide, re.S)
        for stem in IDS:
            if stem.startswith(language + "-") and not stem.endswith("-presentation"):
                source = (
                    safe(repo, f"{SOURCE}/{stem}.{extension(stem)}")
                    .read_text()
                    .rstrip()
                )
                if blocks.count(source) != 1:
                    raise ValueError(
                        "Inline code and downloadable source differ: " + stem
                    )
    return manifest


def replace_managed(candidate: Path, destination: Path) -> None:
    """Publish a fully validated directory, restoring the old tree on failure."""
    if destination.is_symlink():
        raise ValueError("Symlink managed destination")
    if destination.exists():
        inventory(
            destination
        )  # Reject every existing nested symlink before touching files.
    backup = Path(tempfile.mkdtemp(prefix=".tutorial-backup-", dir=destination.parent))
    backup.rmdir()
    had_old = destination.exists()
    committed = False
    try:
        if had_old:
            destination.rename(backup)
        try:
            candidate.rename(destination)
            committed = True
        except BaseException:
            if had_old:
                try:
                    backup.rename(destination)
                except BaseException as error:
                    raise RuntimeError(
                        "Restore failed; old bundle retained at " + str(backup)
                    ) from error
            raise
    finally:
        if committed and backup.exists():
            shutil.rmtree(backup)


def promote(outputs: Path, repo: Path, artifacts: dict[str, str]) -> None:
    """Prepare/validate all captured bytes before replacing a managed bundle."""
    execution = load_json(safe(outputs, "execution.json"))
    expected_sources = {
        f"{stem}.{extension(stem)}": digest(
            safe(repo, f"{SOURCE}/{stem}.{extension(stem)}").read_bytes()
        )
        for stem in IDS
    }
    if execution["sources"] != expected_sources:
        raise ValueError("Executed sources differ from promotion inputs")
    bundle = safe(repo, BUNDLE)
    if bundle.exists():
        inventory(bundle)
    temporary = Path(tempfile.mkdtemp(prefix=".tutorial-candidate-", dir=bundle.parent))
    try:
        for stem in IDS:
            for suffix in ("png", "svg", "pdf"):
                source = safe(outputs, stem + "." + suffix)
                shutil.copyfile(source, temporary / source.name)
            canonical = safe(repo, f"{SOURCE}/{stem}.{extension(stem)}")
            shutil.copyfile(canonical, temporary / canonical.name)
            raw = load_json(safe(outputs, stem + ".report.json"))
            public = normalize_report(raw, stem, repo)
            (temporary / (stem + ".report.json")).write_text(
                json.dumps(public, indent=2) + "\n"
            )
        manifest = {
            "schemaVersion": 1,
            "inputs": fingerprints(repo),
            "artifacts": artifacts,
            "cases": [anchor(stem) for stem in IDS],
            "files": inventory(temporary),
        }
        (temporary / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        validate(temporary, repo)
        replace_managed(temporary, bundle)
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)


def stage(repo: Path = ROOT) -> None:
    """Copy only a validated inventory into the managed public directory."""
    source = safe(repo, BUNDLE)
    manifest = validate(source, repo)
    destination = safe(repo, OUTPUT)
    if destination.exists():
        inventory(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    candidate = Path(
        tempfile.mkdtemp(prefix=".tutorial-stage-", dir=destination.parent)
    )
    try:
        for name in ("manifest.json", *manifest["files"]):
            shutil.copyfile(safe(source, name), safe(candidate, name))
        replace_managed(candidate, destination)
    finally:
        if candidate.exists():
            shutil.rmtree(candidate)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("validate", "stage", "promote"))
    parser.add_argument("--outputs", type=Path)
    parser.add_argument("--python-artifact", type=Path)
    parser.add_argument("--r-artifact", type=Path)
    args = parser.parse_args()
    if args.operation == "promote":
        if not all((args.outputs, args.python_artifact, args.r_artifact)):
            parser.error(
                "Promotion needs executed outputs and both installed artifacts"
            )
        promote(
            args.outputs,
            ROOT,
            {
                "python": digest(args.python_artifact.read_bytes()),
                "r": digest(args.r_artifact.read_bytes()),
            },
        )
    elif args.operation == "stage":
        stage()
    else:
        validate(safe(ROOT, BUNDLE))
    print("Tutorial " + args.operation + " passed")


if __name__ == "__main__":
    main()
