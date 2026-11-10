#!/usr/bin/env python3
"""Bundle the approved spec bytes; native builds never read sibling resources."""
import argparse
import ast
import hashlib
import json
import sys
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "packages/spec"
TARGET = ROOT / "packages/python/src/plotfoundry/_resources"
sys.path.insert(0, str(SPEC / "tools"))
from validate_spec import validate_bundle, safe_path


def snapshot() -> dict[str, bytes]:  # Exact allowlisted product bytes.
    """Select self-contained data, notices and independent source authority."""
    validate_bundle(SPEC, verify_fonts=True)
    files = {
        name: safe_path(SPEC, name).read_bytes()
        for name in (
            "source-lock.json",
            "schema.json",
            "foundations.schema.json",
            "conformance.json",
        )
    }
    manifest = json.loads(safe_path(SPEC, "data/manifest.json").read_text())
    for relative in ["manifest.json", *manifest["files"]]:
        files["data/" + relative] = safe_path(SPEC, "data/" + relative).read_bytes()
    files["_reference.py"] = safe_path(SPEC, "tools/reference.py").read_bytes()
    source = safe_path(SPEC, "tools/validate_spec.py").read_text()
    selected = {
        "ContractError",
        "require",
        "digest",
        "canonical",
        "conversion_record",
        "expected_fonts",
        "expected_provenance",
        "validate_values",
    }
    blocks = [
        ast.get_source_segment(source, node)
        for node in ast.parse(source).body
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in selected
    ]
    prefix = '"""Generated verbatim semantic validators from approved spec; do not edit."""\nimport hashlib\nimport json\nimport itertools\nfrom pathlib import Path\nfrom ._reference import portable_slots\n\n'
    files["_validation.py"] = (prefix + "\n\n".join(blocks) + "\n").encode()
    pins = {
        relative: hashlib.sha256(payload).hexdigest()
        for relative, payload in sorted(files.items())
    }
    files["_contract.py"] = (
        '"""Approved snapshot pins generated after full source validation; do not edit."""\nPINS = '
        + repr(pins)
        + "\n"
    ).encode()
    return files


def main() -> None:  # Maintainer-only command.
    """Check stale snapshots by default; explicit --write performs promotion."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    files = snapshot()
    if args.write:
        if TARGET.is_symlink():
            raise ValueError("Snapshot root cannot be a symlink")
        if TARGET.exists():
            shutil.rmtree(TARGET)
        for relative, payload in files.items():
            target = TARGET / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
    actual = {
        p.relative_to(TARGET).as_posix(): p.read_bytes()
        for p in TARGET.rglob("*")
        if p.is_file() and "__pycache__" not in p.parts
    }
    if actual != files:
        raise ValueError(
            "Stale Python spec snapshot; deliberately promote reviewed spec bytes"
        )
    print(f"Python snapshot verified: {len(files)} files")


if __name__ == "__main__":
    main()
