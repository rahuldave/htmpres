#!/usr/bin/env python3
"""Build each independent identity scaffold using its own native package tooling."""

import argparse
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=ROOT / ".build/packages")
    args = parser.parse_args()
    output = args.out.resolve()
    # Refuse stale artifacts rather than testing whichever previous file glob wins.
    for name in ("python", "r", "javascript"):
        directory = output / name
        directory.mkdir(parents=True, exist_ok=True)
        for artifact in directory.iterdir():
            if artifact.is_file() and artifact.suffix in (".whl", ".gz", ".tgz"):
                artifact.unlink()
    subprocess.run(
        [
            "uv",
            "build",
            "--project",
            str(ROOT / "packages/python"),
            "--out-dir",
            str(output / "python"),
        ],
        check=True,
    )
    subprocess.run(
        [
            "R",
            "CMD",
            "build",
            str(ROOT / "packages/r"),
            "--no-manual",
            "--no-build-vignettes",
        ],
        cwd=output / "r",
        env=os.environ | {"LANG": "C", "LC_ALL": "C"},
        check=True,
    )
    subprocess.run(
        [
            "npm",
            "pack",
            "--ignore-scripts",
            "--pack-destination",
            str(output / "javascript"),
        ],
        cwd=ROOT / "packages/javascript",
        check=True,
    )
    print(f"Built local, unpublished identity scaffolds: {output}")


if __name__ == "__main__":
    main()
