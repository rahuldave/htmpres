#!/usr/bin/env python3
"""Stage only the reviewed browser package closure. No npm/native plotting runtime."""

import hashlib
import json
from pathlib import Path
import shutil
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "packages/javascript"
OUTPUT = ROOT / "docs/_generated/javascript"


def snapshot(source=SOURCE):
    manifest = json.loads((source / "browser-manifest.json").read_text())
    if set(manifest) != {"schemaVersion", "files"} or manifest["schemaVersion"] != 1:
        raise ValueError("Invalid browser manifest")
    expected = {
        "src/index.js",
        "src/pins.js",
        "src/vendor-pins.js",
        "src/observable.js",
        "examples/browser.html",
        "examples/browser.js",
        "examples/data.js",
        "examples/quarto.qmd",
        "README.md",
        "LICENSE",
    }
    expected.update(
        "examples/standalone/" + name + ".js"
        for name in ["deliveries", "energy", "changes", "native"]
    )
    if source.is_symlink():
        raise ValueError("Browser source root symlink")
    for prefix, pin_source in [
        ("resources", "src/pins.js"),
        ("vendor", "src/vendor-pins.js"),
    ]:
        directory = source / prefix
        if directory.is_symlink():
            raise ValueError("Browser resource root symlink")
        match = re.search(
            r"Object\.freeze\((\{.*\})\);", (source / pin_source).read_text(), re.S
        )
        if not match:
            raise ValueError("Invalid compiled browser pins")
        pins = json.loads(match.group(1))
        actual = set()
        for path in directory.rglob("*"):
            if path.is_symlink():
                raise ValueError("Browser source symlink")
            if path.is_file():
                actual.add(path.relative_to(directory).as_posix())
        if actual != set(pins):
            raise ValueError("Compiled browser closure mismatch")
        for name, sha in pins.items():
            if Path(name).is_absolute() or ".." in Path(name).parts:
                raise ValueError("Unsafe pinned path")
            if hashlib.sha256((directory / name).read_bytes()).hexdigest() != sha:
                raise ValueError("Compiled browser hash mismatch")
            expected.add(prefix + "/" + name)
    if set(manifest["files"]) != expected:
        raise ValueError("Browser closure mismatch")
    result = {}
    for name, sha in manifest["files"].items():
        if (
            not isinstance(name, str)
            or Path(name).is_absolute()
            or ".." in Path(name).parts
        ):
            raise ValueError("Unsafe browser path")
        path = source / name
        for parent in [path, *path.parents]:
            if parent.is_symlink():
                raise ValueError("Browser file symlink")
            if parent == source:
                break
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != sha:
            raise ValueError("Stale browser input: " + name)
        destination = name + ".txt" if name.endswith((".qmd", ".md")) else name
        result[destination] = raw
    public_manifest = {
        "schemaVersion": 1,
        "files": {
            name: hashlib.sha256(raw).hexdigest()
            for name, raw in sorted(result.items())
        },
    }
    result["browser-manifest.json"] = (
        json.dumps(public_manifest, indent=2) + "\n"
    ).encode()
    return result


def stage():
    files = snapshot()
    for parent in [OUTPUT, *OUTPUT.parents]:
        if parent.is_symlink():
            raise ValueError("Managed stage symlink")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    for name, raw in files.items():
        path = OUTPUT / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    print(f"Staged native browser package: {len(files)} files")


if __name__ == "__main__":
    stage()
