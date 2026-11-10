#!/usr/bin/env python3
"""Validate and bundle exact approved scientific data for native R use."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "packages/spec"
TARGET = ROOT / "packages/r/inst/spec"
sys.path.insert(0, str(SPEC / "tools"))
from validate_spec import validate_bundle, safe_path


def snapshot() -> dict[str, bytes]:  # Validated standalone resources.
    """Allowlist approved resources only after full scientific/font validation."""
    validate_bundle(SPEC, verify_fonts=True)
    manifest = json.loads(safe_path(SPEC, "data/manifest.json").read_text())
    paths = [
        "schema.json",
        "source-lock.json",
        "foundations.schema.json",
        "conformance.json",
        "data/manifest.json",
        *["data/" + p for p in manifest["files"]],
    ]
    return {p: safe_path(SPEC, p).read_bytes() for p in paths}


def main() -> None:  # Maintainer-only promotion command.
    """Reject stale bundles; explicit --write promotes reviewed bytes and R pins."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    files = snapshot()
    pins = (
        "## Generated after full approved spec validation; do not edit.\n.pf_pins <- c(\n"
        + ",\n".join(
            "  " + json.dumps(p) + " = " + json.dumps(hashlib.sha256(v).hexdigest())
            for p, v in sorted(files.items())
        )
        + "\n)\n"
    )
    pinfile = ROOT / "packages/r/R/aaa-pins.R"
    if args.write:
        if TARGET.is_symlink() or pinfile.is_symlink():
            raise ValueError("Managed R output cannot be a symlink")
        if TARGET.exists():
            shutil.rmtree(TARGET)
        for relative, payload in files.items():
            target = TARGET / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
        pinfile.write_text(pins)
    if (
        TARGET.is_symlink()
        or pinfile.is_symlink()
        or any(p.is_symlink() for p in TARGET.rglob("*"))
    ):
        raise ValueError("Managed R output cannot be a symlink")
    actual = {
        p.relative_to(TARGET).as_posix(): p.read_bytes()
        for p in TARGET.rglob("*")
        if p.is_file()
    }
    if (
        any(p.is_symlink() for p in TARGET.rglob("*"))
        or actual != files
        or pinfile.read_text() != pins
    ):
        raise ValueError("Stale or unsafe R scientific snapshot")
    print(f"R snapshot verified: {len(files)} resources")


if __name__ == "__main__":
    main()
