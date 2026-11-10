#!/usr/bin/env python3
"""Run complete tutorial sources against previously installed native artifacts.

This optional maintainer gate executes from a fresh directory outside checkout.
It is never a dependency of Website CI; publication only stages reviewed bytes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--python", type=Path)
    parser.add_argument("--r-library", type=Path)
    parser.add_argument("--r-dependencies", type=Path)
    args = parser.parse_args()
    python_install = json.loads(
        (ROOT / ".build/packages/python-installed.json").read_text()
    )
    r_install = json.loads(
        (ROOT / ".build/packages/r/installed-consumer.json").read_text()
    )
    python = (
        args.python
        or Path(python_install["results"][0]["consumer"]) / "venv/bin/python"
    )
    r_root = Path(r_install["consumer"])
    r_library = args.r_library or r_root / "library"
    r_dependencies = args.r_dependencies or r_root / "dependencies"
    output = (
        args.output or Path(tempfile.mkdtemp(prefix="plotfoundry-tutorials-"))
    ).resolve()
    if output.is_relative_to(ROOT):
        parser.error("Use an output directory outside checkout")
    output.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env.pop("PYTHONPATH", None)
    env.pop("R_LIBS", None)
    env.update(
        MPLBACKEND="Agg",
        LANG="C",
        LC_ALL="C",
        R_LIBS_USER=os.pathsep.join(map(str, (r_library, r_dependencies))),
        R_LIBS_SITE=str(r_dependencies),
    )
    sources = {}
    for source in sorted((ROOT / "examples/plotting-tutorials").iterdir()):
        if source.suffix not in (".py", ".R"):
            continue
        copied = output / source.name
        shutil.copyfile(source, copied)
        command = (
            [str(python), copied.name]
            if source.suffix == ".py"
            else ["Rscript", "--vanilla", copied.name]
        )
        subprocess.run(command, cwd=output, env=env, check=True)
        for suffix in ("png", "svg", "pdf", "report.json"):
            if not (output / (source.stem + "." + suffix)).is_file():
                raise RuntimeError("Missing native export")
        sources[source.name] = hashlib.sha256(copied.read_bytes()).hexdigest()
    evidence = {
        "output": str(output),
        "python": str(python),
        "rLibrary": str(r_library),
        "sources": sources,
        "execution": "Fresh outside-checkout working directory; installed native packages",
    }
    (output / "execution.json").write_text(json.dumps(evidence, indent=2) + "\n")
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
