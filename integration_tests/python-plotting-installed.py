#!/usr/bin/env python3
"""Exercise wheel/sdist-rebuilt wheel outside the checkout with cached dependencies."""
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
import tomllib

ROOT = Path(__file__).resolve().parents[1]


def run(
    args: list[str | Path],  # Native tool arguments, never shell interpolation.
    cwd: Path,  # Outside-checkout consumer directory.
    env: dict[str, str] | None = None,  # Explicit offline/native process environment.
) -> None:  # Raise on a failed artifact check.
    """Run actual installed consumers with visible failures."""
    subprocess.run([str(arg) for arg in args], cwd=cwd, env=env, check=True)


def main() -> None:  # Development integration entry point.
    """Rebuild from source archive and run both installed plotting artifacts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--artifacts", type=Path, default=ROOT / ".build/packages/python"
    )
    args = parser.parse_args()
    version = tomllib.loads((ROOT / "packages/python/pyproject.toml").read_text())[
        "project"
    ]["version"]
    (wheel,) = args.artifacts.glob(f"plotfoundry-{version}-*.whl")
    (sdist,) = args.artifacts.glob(f"plotfoundry-{version}.tar.gz")
    clean = Path(tempfile.mkdtemp(prefix="plotfoundry-python-installed-"))
    requirements = subprocess.check_output(
        [
            "uv",
            "export",
            "--project",
            str(ROOT / "packages/python"),
            "--only-group",
            "verification",
            "--no-emit-project",
            "--format",
            "requirements-txt",
            "--no-hashes",
        ],
        text=True,
    )
    (clean / "requirements.txt").write_text(requirements)
    results = []
    for label in ("wheel", "rebuilt"):
        consumer = clean / label
        consumer.mkdir()
        artifact = wheel
        if label == "rebuilt":
            with tarfile.open(sdist) as archive:
                archive.extractall(consumer, filter="data")
            (project,) = [p for p in consumer.iterdir() if p.is_dir()]
            run(
                ["uv", "build", "--wheel", "--out-dir", consumer / "dist", project],
                consumer,
            )
            (artifact,) = (consumer / "dist").glob("*.whl")
        with zipfile.ZipFile(artifact) as archive:
            names = archive.namelist()
            assert sum(name.endswith(".ttf") for name in names) == 12
            assert sum("/data/notices/" in name for name in names) == 16
            assert not any(
                "/research/" in name or "/_extensions/" in name for name in names
            )
            for name in ["gallery.py", "dataframes.py"]:
                (consumer / name).write_bytes(
                    archive.read("plotfoundry/examples/" + name)
                )
        run(["uv", "venv", "--python", sys.executable, consumer / "venv"], consumer)
        python = consumer / "venv/bin/python"
        run(
            [
                "uv",
                "pip",
                "install",
                "--python",
                python,
                "--offline",
                "--no-deps",
                artifact,
            ],
            consumer,
        )
        env = {
            **os.environ,
            "PYTHONPATH": "",
            "MPLBACKEND": "Agg",
            "PYTHONDONTWRITEBYTECODE": "1",
            "MPLCONFIGDIR": str(consumer / "mplconfig"),
            "UV_OFFLINE": "1",
        }
        # Core resources work before plotting dependencies are present.
        run(
            [
                python,
                "-B",
                "-c",
                "import sys,plotfoundry; assert len(plotfoundry.load_spec()['cases'])==72; assert 'matplotlib' not in sys.modules",
            ],
            consumer,
            env,
        )
        tooling = consumer / "tooling"
        tooling.mkdir()
        with tarfile.open(sdist) as archive:
            for name in ["pyproject.toml", "uv.lock", "README.md", "LICENSE"]:
                (member,) = [
                    m
                    for m in archive.getmembers()
                    if m.name.endswith("/" + name) and m.name.count("/") == 1
                ]
                (tooling / name).write_bytes(archive.extractfile(member).read())
        run(
            [
                "uv",
                "sync",
                "--project",
                tooling,
                "--locked",
                "--offline",
                "--no-install-project",
                "--group",
                "verification",
                "--python",
                sys.executable,
            ],
            consumer,
            {**env, "UV_PROJECT_ENVIRONMENT": str(consumer / "venv")},
        )
        # uv sync deliberately excludes the project; reinstall the actual wheel
        # afterwards rather than permitting an editable development project.
        run(
            [
                "uv",
                "pip",
                "install",
                "--python",
                python,
                "--offline",
                "--no-deps",
                artifact,
            ],
            consumer,
            env,
        )
        native = {**env, "PATH": ""}
        # Exercise every case's native maps/placed fonts in the installed wheel.
        check = """from pathlib import Path
import plotfoundry
import json
from importlib.metadata import distribution
import plotfoundry.core as core
assert core._root().is_relative_to(Path(plotfoundry.__file__).parent)
record=json.loads(distribution('plotfoundry').read_text('direct_url.json'))
assert 'archive_info' in record and not record.get('dir_info',{}).get('editable',False)
assert 'site-packages' in Path(plotfoundry.__file__).parts
import sys; assert Path(plotfoundry.__file__).resolve().is_relative_to(Path(sys.prefix).resolve())
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from plotfoundry import load_spec,theme
from plotfoundry.matplotlib import context,colorscale,style_axes,export
for case in load_spec()['cases']:
 c=theme(case['theme'],mode=case['mode'],profile=case['profile'],surface=case['surface'])
 with context(c):
  fig,ax=plt.subplots(figsize=(8,4)); ax.set(title='Heading',xlabel='Value')
  style_axes(ax,c); assert Path(ax.title.get_fontproperties().get_file()).is_file()
  cmap,norm=colorscale(c,kind='diverging',vmin=-2,vmax=1,center=0)
  assert cmap(norm(0))[:3]==tuple(c.spec['maps']['BrBG']['samples'][128])
  plt.close(fig)
print('72 installed cases passed')
"""
        run([python, "-B", "-c", check], consumer, native)
        run(
            [
                python,
                "-B",
                "gallery.py",
                "--output",
                "renders",
                "--case",
                "tufte/dark/presentation/panel",
            ],
            consumer,
            native,
        )
        run([python, "-B", "dataframes.py"], consumer, native)
        results.append(
            {"artifact": label, "consumer": str(consumer), "status": "passed"}
        )
    report = {"status": "passed", "consumerRoot": str(clean), "results": results}
    (ROOT / ".build/packages/python-installed.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
