#!/usr/bin/env python3
"""Execute actual native guide quickstarts; setup recipes are independently checked.

Optional maintainer test only: website CI uses committed reviewed static exports.
Python orchestrates separate native processes; installed plotting packages never
invoke another language runtime.
"""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--python", type=Path, default=ROOT / "packages/python/.venv/bin/python"
    )
    parser.add_argument(
        "--r-library", type=Path, default=ROOT / ".build/packages/r-library"
    )
    args = parser.parse_args()
    work = Path(tempfile.mkdtemp(prefix="plotfoundry-guide-snippets-"))
    python_blocks = re.findall(
        r"```python\n(.*?)\n```", (ROOT / "docs/plotting-python.qmd").read_text(), re.S
    )
    for i, block in enumerate(python_blocks):
        source = work / f"python-{i}.py"
        source.write_text(block)
        subprocess.run(
            [args.python, source],
            cwd=work,
            env=os.environ | {"MPLBACKEND": "Agg"},
            check=True,
        )
    r_blocks = re.findall(
        r"```r\n(.*?)\n```", (ROOT / "docs/plotting-r.qmd").read_text(), re.S
    )
    runnable = [
        block
        for block in r_blocks
        if "install.packages" not in block and "download.file" not in block
    ]
    source = work / "r-guide.R"
    source.write_text("\n".join(runnable))
    env = os.environ | {"LANG": "C", "LC_ALL": "C", "R_LIBS_USER": str(args.r_library)}
    subprocess.run(["Rscript", "--vanilla", source], cwd=work, env=env, check=True)
    qmd = (ROOT / "examples/plotting/r-quickstart.qmd").read_text()
    source = work / "qmd-quickstart.R"
    source.write_text("\n".join(re.findall(r"```\{r\}\n(.*?)\n```", qmd, re.S)))
    subprocess.run(["Rscript", "--vanilla", source], cwd=work, env=env, check=True)
    for stem in ("results", "observations", "base-observations"):
        for extension in ("png", "svg", "pdf", "report.json"):
            assert (work / f"{stem}.{extension}").is_file()
    print(
        json.dumps(
            {
                "outputs": str(work),
                "pythonCodeBlocks": len(python_blocks),
                "rQuickstartBlocks": len(runnable),
                "quartoRChunk": True,
                "setupRecipes": "Exact pinned installations independently reviewed; dependency provisioning is setup, not this offline test.",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
