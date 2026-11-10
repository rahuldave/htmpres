#!/usr/bin/env python3
"""Compatibility entry point for the complete installed tutorial execution gate."""

from pathlib import Path
import runpy

if __name__ == "__main__":
    runpy.run_path(
        str(Path(__file__).with_name("plotting-tutorial-examples.py")),
        run_name="__main__",
    )
