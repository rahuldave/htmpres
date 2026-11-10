#!/usr/bin/env python3
"""Build/copy npm artifact and exercise installed native JS outside this checkout."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / ".build/packages/javascript-installed.json",
    )
    args = parser.parse_args()
    work = Path(tempfile.mkdtemp(prefix="plotfoundry-js-installed-"))
    artifact = work / "artifacts"
    artifact.mkdir()
    subprocess.run(
        ["npm", "pack", "--ignore-scripts", "--pack-destination", str(artifact)],
        cwd=ROOT / "packages/javascript",
        check=True,
        stdout=subprocess.DEVNULL,
    )
    (archive,) = artifact.glob("*.tgz")
    allowed = {"package.json", "README.md", "LICENSE"}
    allowed.update(
        "src/" + name
        for name in [
            "index.js",
            "node.js",
            "observable.js",
            "pins.js",
            "vendor-pins.js",
        ]
    )
    for folder in ["resources", "vendor", "examples"]:
        for path in (ROOT / "packages/javascript" / folder).rglob("*"):
            if path.is_symlink():
                raise ValueError("Package source symlink")
            if path.is_file():
                allowed.add(path.relative_to(ROOT / "packages/javascript").as_posix())
    with tarfile.open(archive) as tar:
        entries = {
            m.name.removeprefix("package/"): m
            for m in tar.getmembers()
            if not m.isdir()
        }
        assert set(entries) == allowed, (set(entries) - allowed, allowed - set(entries))
        for name, entry in entries.items():
            assert entry.isfile() and not entry.issym() and not entry.islnk()
            assert (
                tar.extractfile(entry).read()
                == (ROOT / "packages/javascript" / name).read_bytes()
            ), name
    consumer = work / "consumer"
    consumer.mkdir()
    (consumer / "package.json").write_text('{"private":true,"type":"module"}\n')
    subprocess.run(
        [
            "npm",
            "install",
            "--offline",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            str(archive),
        ],
        cwd=consumer,
        check=True,
    )
    for path in (consumer / "node_modules/plotfoundry/examples/standalone").iterdir():
        shutil.copy(path, consumer / path.name)
    node = shutil.which("node")
    code = """import assert from 'node:assert/strict';import {loadSpec} from 'plotfoundry/node';import {readFile,realpath} from 'node:fs/promises';
globalThis.fetch=()=>{throw Error('Unexpected network')};for(const key of ['document','FontFace'])Object.defineProperty(globalThis,key,{get(){throw Error('Import global access '+key)},configurable:true});const {packageInfo}=await import('plotfoundry');const path=await realpath(new URL(import.meta.resolve('plotfoundry')));assert.ok(path.startsWith(process.cwd()+'/node_modules/plotfoundry/'));const spec=await loadSpec();assert.equal(spec.cases.length,72);const meta=JSON.parse(await readFile('./node_modules/plotfoundry/package.json'));assert.equal(packageInfo().version,meta.version);console.log(JSON.stringify({entry:path,cases:spec.cases.length,identity:packageInfo()}));"""
    subprocess.run(
        [
            node,
            "--input-type=module",
            "-e",
            "globalThis.fetch=()=>{throw Error('network')};for(const k of ['document','FontFace'])Object.defineProperty(globalThis,k,{get(){throw Error(k)}});await import('plotfoundry');",
        ],
        cwd=consumer,
        env=os.environ | {"PATH": "", "NODE_PATH": ""},
        check=True,
    )
    result = subprocess.run(
        [node, "--input-type=module", "-e", code],
        cwd=consumer,
        env=os.environ | {"PATH": "", "NODE_PATH": ""},
        check=True,
        capture_output=True,
        text=True,
    )
    # Render the shipped OJS source as a real native Quarto document; no R/Python engine.
    shutil.copy(
        consumer / "node_modules/plotfoundry/examples/quarto.qmd",
        consumer / "quarto.qmd",
    )
    quarto = subprocess.run(
        ["quarto", "--version"], check=True, capture_output=True, text=True
    ).stdout.strip()
    with (work / "quarto-render.log").open("w") as log:
        subprocess.run(
            ["quarto", "render", "quarto.qmd", "--to", "html"],
            cwd=consumer,
            check=True,
            stdout=log,
            stderr=subprocess.STDOUT,
        )
    report = {
        "artifact": str(archive),
        "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "consumer": str(consumer),
        "browserPath": "/node_modules/plotfoundry/examples/browser.html",
        "ojsPath": "/quarto.html",
        "quartoVersion": quarto,
        "nativeNode": json.loads(result.stdout),
        "quartoLog": str(work / "quarto-render.log"),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
