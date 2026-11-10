#!/usr/bin/env python3
"""Bundle validated approved resources and exact-font glyph coverage for native ESM."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "packages/spec"
TARGET = ROOT / "packages/javascript/resources"
sys.path.insert(0, str(SPEC / "tools"))
from validate_spec import validate_bundle, safe_path
from fontTools.ttLib import TTFont


def snapshot():
    validate_bundle(SPEC, verify_fonts=True)
    inventory = json.loads(safe_path(SPEC, "data/manifest.json").read_text())
    paths = [
        "source-lock.json",
        "schema.json",
        "foundations.schema.json",
        "conformance.json",
        "data/manifest.json",
    ]
    paths += ["data/" + p for p in inventory["files"]]
    files = {p: safe_path(SPEC, p).read_bytes() for p in paths}
    spec = json.loads(files["data/spec.json"])
    coverage = {}
    for key, face in spec["fonts"].items():
        with TTFont(safe_path(SPEC, "data/" + face["path"])) as font:
            coverage[key] = sorted(font.getBestCmap())
    files["glyphs.json"] = (json.dumps(coverage, separators=(",", ":")) + "\n").encode()
    pins = {p: hashlib.sha256(b).hexdigest() for p, b in sorted(files.items())}
    module = (
        "// Generated only after full scientific source validation. Code is the trust root, not a signature.\nexport const pins = Object.freeze("
        + json.dumps(pins, indent=2)
        + ");\n"
    )
    return files, module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    files, module = snapshot()
    for managed in (TARGET, TARGET.parent / "src/pins.js"):
        for candidate in (managed, *managed.parents):
            if candidate.is_symlink():
                raise ValueError("Managed resource output cannot traverse a symlink")
    if TARGET.exists() and any(path.is_symlink() for path in TARGET.rglob("*")):
        raise ValueError("Managed resource descendant symlink")
    if args.write:
        if TARGET.exists():
            shutil.rmtree(TARGET)
        for name, data in files.items():
            path = TARGET / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        (TARGET.parent / "src/pins.js").write_text(module)
    actual = {}
    for path in TARGET.rglob("*"):
        if path.is_symlink():
            raise ValueError("Resource symlink")
        if path.is_file():
            actual[path.relative_to(TARGET).as_posix()] = path.read_bytes()
    if actual != files or (TARGET.parent / "src/pins.js").read_text() != module:
        raise ValueError("JavaScript snapshot is stale; run explicit promotion")
    print(f"JavaScript approved resource closure: {len(files)} files")


if __name__ == "__main__":
    main()
