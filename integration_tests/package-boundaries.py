#!/usr/bin/env python3
"""Install built Plotfoundry artifacts into clean, outside-checkout consumers.

Development orchestration only: the installed packages require their native runtime.
Leaves the JS consumer in a temporary directory for a separate real-browser check.
"""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def run(args, cwd, env=None):
    """Run a native command, failing without hiding its diagnostic output."""
    subprocess.run([str(arg) for arg in args], cwd=cwd, env=env, check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifacts", type=Path, default=ROOT / ".build/packages")
    args = parser.parse_args()
    artifacts = args.artifacts.resolve()
    # Must fail before scaffolding/builds exist: no in-tree import fallback.
    (wheel,) = artifacts.glob("python/*.whl")
    (sdist,) = artifacts.glob("python/*.tar.gz")
    (r_archive,) = artifacts.glob("r/*.tar.gz")
    (npm_archive,) = artifacts.glob("javascript/*.tgz")
    # Distribution contents, not just source-tree presence, define the boundary.
    with zipfile.ZipFile(wheel) as archive:
        members = archive.namelist()
        assert "plotfoundry/__init__.py" in members
        assert any(name.endswith("/licenses/LICENSE") for name in members)
        (metadata_name,) = [name for name in members if name.endswith("/METADATA")]
        assert "# Plotfoundry for Python" in archive.read(metadata_name).decode()
    for artifact, required in (
        (sdist, ["/LICENSE", "/README.md", "/pyproject.toml", "/examples/hello.py"]),
        (
            r_archive,
            [
                "/LICENSE",
                "/LICENSE.md",
                "/README.md",
                "/man/package_info.Rd",
                "/inst/examples/hello.R",
            ],
        ),
        (
            npm_archive,
            ["/LICENSE", "/README.md", "/package.json", "/examples/browser.html"],
        ),
    ):
        with tarfile.open(artifact) as archive:
            names = archive.getnames()
            for ending in required:
                assert any(name.endswith(ending) for name in names), (artifact, ending)
            assert not any(
                "research/" in name or "_extensions/" in name for name in names
            )
    clean = Path(tempfile.mkdtemp(prefix="plotfoundry-consumers-"))
    assert not clean.is_relative_to(ROOT)
    env = os.environ.copy()
    for key in ("PYTHONPATH", "R_LIBS", "R_LIBS_USER", "NODE_PATH"):
        env.pop(key, None)
    env.update({"PIP_NO_INDEX": "1", "UV_OFFLINE": "1", "LANG": "C", "LC_ALL": "C"})
    python_check = (
        "from pathlib import Path; import json,plotfoundry; "
        "from importlib.metadata import metadata; "
        "p=Path(plotfoundry.__file__).resolve(); "
        "assert 'site-packages' in p.parts; "
        "assert not any(x in str(p) for x in ['research', '_extensions']); "
        "assert not metadata('plotfoundry').get_all('Requires-Dist'); "
        "info=plotfoundry.package_info(); "
        "assert info['name']=='plotfoundry' and info['status']=='scaffold'; "
        "assert info['version']==metadata('plotfoundry')['Version']; "
        "info['name']='changed'; assert plotfoundry.package_info()['name']=='plotfoundry'; "
        "print(json.dumps(plotfoundry.package_info(),sort_keys=True))"
    )
    for name, artifact in (("wheel", wheel), ("rebuilt", None)):
        directory = clean / name
        directory.mkdir()
        if artifact is None:
            with tarfile.open(sdist) as archive:
                archive.extractall(directory, filter="data")
            (project,) = [p for p in directory.iterdir() if p.is_dir()]
            # Build backend can come from the developer's cache; runtime is offline.
            run(
                ["uv", "build", "--wheel", "--out-dir", directory / "dist", project],
                clean,
            )
            (artifact,) = (directory / "dist").glob("*.whl")
        run(["uv", "venv", "--python", sys.executable, directory / "venv"], clean)
        python = directory / "venv/bin/python"
        run(
            ["uv", "pip", "install", "--python", python, "--no-index", artifact],
            clean,
            env,
        )
        # Empty PATH proves no R/JS/Quarto/tool executable is used by native Python.
        native_env = env | {"PATH": ""}
        run([python, "-I", "-c", python_check], clean, native_env)
        shutil.copy(ROOT / "packages/python/examples/hello.py", directory)
        run([python, "-I", directory / "hello.py"], clean, native_env)

    library = clean / "r-library"
    library.mkdir()
    run(["R", "CMD", "INSTALL", "--library=" + str(library), r_archive], clean, env)
    r_check = (
        f".libPaths(c({json.dumps(str(library))}, .Library)); "
        "info <- plotfoundry::package_info(); "
        'stopifnot(info$name == "plotfoundry", info$status == "scaffold"); '
        'stopifnot(info$version == as.character(utils::packageVersion("plotfoundry"))); '
        'info$name <- "changed"; stopifnot(plotfoundry::package_info()$name == "plotfoundry"); '
        'stopifnot(!any(c("htmpres", "reticulate", "V8") %in% loadedNamespaces())); '
        "print(info)"
    )
    run(["Rscript", "--vanilla", "-e", r_check], clean, env)
    r_example = clean / "hello.R"
    shutil.copy(library / "plotfoundry/examples/hello.R", r_example)
    run(
        [
            "Rscript",
            "--vanilla",
            "-e",
            f'.libPaths(c({json.dumps(str(library))}, .Library)); source("hello.R")',
        ],
        clean,
        env,
    )

    javascript = clean / "javascript"
    javascript.mkdir()
    (javascript / "package.json").write_text('{"private":true,"type":"module"}\n')
    run(
        [
            "npm",
            "install",
            "--offline",
            "--ignore-scripts",
            "--no-audit",
            "--no-fund",
            npm_archive,
        ],
        javascript,
        env,
    )
    node_check = (
        "import {packageInfo} from 'plotfoundry'; "
        "import {readFileSync} from 'node:fs'; "
        "const metadata=JSON.parse(readFileSync(new URL('../package.json',import.meta.resolve('plotfoundry')))); "
        "const info=packageInfo(); "
        "if(info.name!=='plotfoundry'||info.status!=='scaffold'||info.version!==metadata.version) throw Error('identity'); "
        "info.name='changed'; if(packageInfo().name!=='plotfoundry') throw Error('mutation'); "
        "console.log(JSON.stringify(packageInfo()));"
    )
    node = shutil.which("node")
    run([node, "--input-type=module", "-e", node_check], javascript, env | {"PATH": ""})
    shutil.copy(ROOT / "packages/javascript/examples/hello.mjs", javascript)
    run([node, javascript / "hello.mjs"], javascript, env | {"PATH": ""})
    browser = javascript / "node_modules/plotfoundry/examples/browser.html"
    assert browser.is_file()
    report = {
        "status": "passed",
        "consumer_root": str(clean),
        "browser_root": str(javascript),
        "browser_path": "/node_modules/plotfoundry/examples/browser.html",
    }
    (artifacts / "installed-consumers.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
