#!/usr/bin/env python3
"""Build/install the native R archive outside checkout with copied dependencies.

Python orchestrates this maintainer test only. Cold installed consumers execute
R directly, with no Python/Node/Quarto or checkout in their library/resource path.
"""

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    """Build, check and cold-run one independently installed native archive."""
    library = Path(
        os.environ.get("PLOTFOUNDRY_R_LIBRARY", ROOT / ".build/packages/r-library")
    )
    clean = Path(tempfile.mkdtemp(prefix="plotfoundry-r-installed-"))
    dependencies = clean / "dependencies"
    dependencies.mkdir()
    versions = json.loads(
        (ROOT / "packages/r/tools/tested-dependencies.json").read_text()
    )
    for item in versions:
        shutil.copytree(
            library / item["package"], dependencies / item["package"], symlinks=False
        )
    consumer = clean / "library"
    consumer.mkdir()
    env = os.environ.copy()
    env.update(
        LANG="C",
        LC_ALL="C",
        R_LIBS_USER=str(dependencies),
        R_LIBS_SITE=str(dependencies),
    )
    env.pop("R_LIBS", None)
    env.pop("PYTHONPATH", None)
    artifact_dir = ROOT / ".build/packages/r"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["R", "CMD", "build", ROOT / "packages/r", "--no-manual"],
        cwd=artifact_dir,
        env=env,
        check=True,
    )
    archive = artifact_dir / "plotfoundry_0.0.0.9001.tar.gz"
    copied = clean / archive.name
    shutil.copy2(archive, copied)
    subprocess.run(
        ["R", "CMD", "INSTALL", f"--library={consumer}", copied],
        cwd=clean,
        env=env,
        check=True,
    )
    check = f"""
.libPaths(c({json.dumps(str(consumer))},{json.dumps(str(dependencies))},.Library))
stopifnot(normalizePath(find.package("plotfoundry"))==normalizePath({json.dumps(str(consumer / 'plotfoundry'))}))
stopifnot(!any(c("reticulate","V8","htmpres")%in%loadedNamespaces()))
before<-list(options=options(),devices=dev.list(),palette=palette(),search=search())
ns<-loadNamespace("plotfoundry")
stopifnot(identical(before,list(options=options(),devices=dev.list(),palette=palette(),search=search())))
stopifnot(length(plotfoundry::pf_spec()$cases)==72L)
stopifnot(startsWith(normalizePath(system.file("spec",package="plotfoundry")),normalizePath({json.dumps(str(consumer))})))
for(n in c("download.file","browseURL")) trace(n,where=asNamespace("utils"),tracer=quote(stop("Network forbidden in cold consumer")),print=FALSE)
trace("url",where=baseenv(),tracer=quote(stop("Network forbidden in cold consumer")),print=FALSE)
source(system.file("examples","quickstart.R",package="plotfoundry"))
stopifnot(file.exists("plotfoundry-example.png"),file.exists("plotfoundry-example.svg"),file.exists("plotfoundry-example.pdf"))
"""
    script = clean / "consumer.R"
    script.write_text(check)
    # Native runtime remains independent of development provisioning tools.
    native_bin = clean / "native-bin"
    native_bin.mkdir()
    (native_bin / "rm").symlink_to("/bin/rm")
    native_env = env | {"PATH": str(native_bin)}
    subprocess.run(
        [shutil.which("Rscript"), "--vanilla", script],
        cwd=clean,
        env=native_env,
        check=True,
    )
    subprocess.run(
        ["R", "CMD", "check", "--no-manual", "--no-build-vignettes", copied],
        cwd=clean,
        env=env,
        check=True,
    )
    evidence = {
        "consumer": str(clean),
        "archive": str(archive),
        "nativeRuntime": "R only",
        "dependencies": versions,
    }
    (artifact_dir / "installed-consumer.json").write_text(
        json.dumps(evidence, indent=2) + "\n"
    )
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
