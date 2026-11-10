#!/usr/bin/env python3
"""Validate completed native R gallery resources and explicit fixture geometry."""

import hashlib
import json
from pathlib import Path
import re
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    """Check both native routes, every final format, and all 72 resolved cases."""
    directory = Path(
        sys.argv[1] if len(sys.argv) > 1 else ROOT / ".build/packages/r-gallery"
    )
    gallery = json.loads((directory / "gallery.json").read_text())
    expected = {
        case["id"]
        for case in json.loads((ROOT / "packages/spec/data/spec.json").read_text())[
            "cases"
        ]
    }
    assert gallery["count"] == 72
    assert {case["case"] for case in gallery["cases"]} == expected
    assert len(gallery["reportHashes"]) == 144
    for name, expected_hash in gallery["reportHashes"].items():
        assert (
            hashlib.sha256((directory / name).read_bytes()).hexdigest() == expected_hash
        ), name
    count = 0
    for case in gallery["cases"]:
        assert all(case["guards"].values()), case["case"]
        for route in ("ggplot", "base"):
            report = case[route]
            assert report["case"] == case["case"]
            assert report["tightCrop"] is False
            assert set(report["files"]) == {"png", "svg", "pdf"}
            for format, entry in report["files"].items():
                path = Path(entry["path"])
                payload = path.read_bytes()
                assert hashlib.sha256(payload).hexdigest() == entry["sha256"], path
                assert all(
                    report["geometry"][format][key]
                    for key in ("titleLaneClear", "footerLaneClear", "panelTitlesFit")
                ), path
                headings = report["geometry"][format]["panelHeadingBounds"]
                assert len(headings) == 4, path
                for heading in headings:
                    bounds, cell = heading["boundsInches"], heading["cellInches"]
                    assert heading["fits"], path
                    assert all(bounds[i] >= cell[i] - 1e-8 for i in (0, 1)), path
                    assert all(bounds[i] <= cell[i] + 1e-8 for i in (2, 3)), path
                if format == "pdf":
                    assert len(re.findall(rb"/Type\s*/Page\b", payload)) == 1, path
                elif format == "svg":
                    assert b"<text" not in payload
                    assert b"<path" in payload, path
                else:
                    assert (
                        list(struct.unpack(">II", payload[16:24]))
                        == entry["canvasPixels"]
                    ), path
                    assert len(payload) > 10000, path
                count += 1
    print(
        f"R gallery passed: 72 cases, two routes, {count} actual exports; four fixture guards and all one-page PDFs"
    )


if __name__ == "__main__":
    main()
