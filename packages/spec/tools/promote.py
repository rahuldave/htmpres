#!/usr/bin/env python3
"""Promote locked frozen evidence into a neutral, reproducible data artifact.

This is a build-time importer only. It does not run experiments, recover colors
from CSS, use ambient system fonts or import any plotting package.
"""

import argparse
import gzip
import io
import itertools
import json
from pathlib import Path
import shutil
import tarfile
import tempfile

from fontTools.ttLib import TTFont

from reference import portable_slots
from validate_spec import (
    digest,
    expected_fonts,
    expected_provenance,
    load_json,
    require,
    safe_path,
    validate_bundle,
)

SPEC_ROOT = Path(__file__).resolve().parents[1]
SOURCE_RUN = SPEC_ROOT.parents[1] / "research/theme-audit/runs/foundations-2026-11-09"
PRODUCT_FILES = [
    "pyproject.toml",
    "uv.lock",
    "schema.json",
    "source-lock.json",
    "conformance.json",
    "README.md",
    "LICENSE",
    "tools/reference.py",
    "tools/validate_spec.py",
]


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, allow_nan=False) + "\n")


def verify_sources(run, lock):
    evidence_path = safe_path(run, "evidence-manifest.json")
    require(
        digest(evidence_path.read_bytes()) == lock["evidenceManifestSha256"],
        "Final evidence manifest changed",
    )
    evidence = load_json(evidence_path)
    for relative, expected in lock["files"].items():
        actual = digest(safe_path(run, relative).read_bytes())
        require(actual == expected, f"Frozen source bytes changed: {relative}")
        require(
            evidence["artifacts"].get(relative) == expected,
            f"Source not bound by final evidence: {relative}",
        )
    provenance = load_json(safe_path(run, "inputs/provenance.json"))
    require(
        provenance["upstream"] == lock["upstream"],
        "Upstream commit/hash records changed",
    )
    for name, pin in lock["upstream"].items():
        require(
            lock["files"][f"inputs/foundations/{name}.json"] == pin["sha256"],
            f"Raw manifest does not match upstream pin: {name}",
        )


def build_spec(registry, palettes, source_fonts, lock):
    """Resolve approved records; lock checks remain an independent validation gate."""
    maps = {}
    for name in registry["lut"]["approved_ids"]:
        if name in palettes["maps"]:
            entry = palettes["maps"][name]
            maps[name] = {
                "kind": entry["kind"],
                "samples": entry["samples"],
                "centerIndex": 128 if entry["kind"] == "diverging" else None,
            }
    q = registry["encoding"]["qualitative"]
    categories = {
        "default": q["default"],
        "extended": q["extended"],
        "bareCycleSupported": q["bare_cycle_supported"],
        "domainRequired": True,
        "identityScope": "variant-and-explicit-domain-slot",
        "automaticExpansion": False,
        "treatment": q["required_treatment"],
        "dashCueProvenance": lock["dashCueProvenance"],
        "variants": {},
    }
    for name, variant in q["variants"].items():
        categories["variants"][name] = {
            "status": variant["status"],
            "capacity": variant["max_categories"],
            "slots": portable_slots(
                palettes["qualitative"][name], variant, lock["dashCueProvenance"]
            ),
            "limitations": variant.get(
                "limitations",
                "Requires ink under-stroke, edged markers and direct labels; bare cycle unsupported.",
            ),
        }
    themes = {}
    for name, entry in registry["themes"].items():
        themes[name] = {
            "voice": entry["voice"],
            "modes": entry["modes"],
            "profiles": entry["typography_profiles"],
            "fontRoles": {},
        }
        for role, font in source_fonts[name].items():
            themes[name]["fontRoles"][role] = {
                "font": font["sha256"],
                "requestedFamily": font["requested_family"],
                "fallback": font["fallback"],
                "reason": font["reason"],
                "glyphPolicy": font["glyph_policy"],
            }
    placement = {
        "roleUnit": "css-px",
        "pointsFormula": "css_px * 72 * figure_width_inches / placed_width_css_px",
        "millimetersFormula": "points * 25.4 / 72",
        "markerAreaConvention": "diameter_points squared; native symbol geometry remains explicit",
        "dpiPolicy": "raster resolution only; not placed typography",
        "tightCropDefault": False,
        "defaultFigureWidthInches": registry["typography"]["figure_width_inches"],
        "defaultPlacedWidths": registry["typography"]["placed_width_px"],
    }
    cases = []
    for name, mode, profile, surface in itertools.product(
        themes, ("light", "dark"), ("reading", "presentation"), ("paper", "panel")
    ):
        theme = themes[name]
        cases.append(
            {
                "id": "/".join((name, mode, profile, surface)),
                "theme": name,
                "mode": mode,
                "profile": profile,
                "surface": surface,
                "roles": theme["modes"][mode][surface],
                "typography": theme["profiles"][profile],
                "fonts": {
                    role: record["font"] for role, record in theme["fontRoles"].items()
                },
                "placement": {
                    "figureWidthInches": placement["defaultFigureWidthInches"],
                    "placedWidthCssPx": placement["defaultPlacedWidths"][profile],
                },
            }
        )
    return {
        "schemaVersion": 1,
        "specVersion": "0.1.0",
        "status": "approved-contract-no-adapters",
        "themes": themes,
        "cases": cases,
        "maps": maps,
        "mapSelection": {
            kind: registry["encoding"][kind] for kind in ("sequential", "diverging")
        },
        "lut": registry["lut"],
        "categories": categories,
        "normalization": {
            "sequential": {
                "type": "linear",
                "parameters": ["vmin", "vmax"],
                "validOrder": "vmin < vmax",
                "limitsRequired": True,
            },
            "diverging": {
                "type": "piecewise-linear",
                "parameters": ["vmin", "center", "vmax"],
                "validOrder": "vmin < center < vmax",
                "centerOutput": 0.5,
                "limitsRequired": True,
                "automaticSymmetry": False,
            },
            "lookup": {
                "samplePositions": "i/(N-1)",
                "binIndex": "min(N-1,floor(clamp(u,0,1)*N))",
                "binIntervals": "[i/N,(i+1)/N), last includes 1",
                "interpolate": False,
                "automaticModeReversal": False,
                "normalizedValuesAreFloats": True,
            },
            "specialValues": registry["encoding"]["special_values"],
            "missingLine": "gap; no imputation",
            "nonfiniteLimits": "reject",
            "infiniteData": "reject; null/NaN are missing",
        },
        "placement": placement,
        "fontRoleMapping": {
            "label": "ui",
            "heading": "heading",
            "metadata": "ui",
            "body_annotation": "ui",
        },
        "fonts": expected_fonts(lock),
        "provenance": expected_provenance(lock),
        "capabilities": {
            "nativeAdaptersImplemented": False,
            "contractFamilies": [
                "categorical-line",
                "categorical-scatter",
                "continuous-heatmap",
                "continuous-scatter",
                "explicit-missing-cells",
            ],
            "notUniversallySupported": [
                "bars",
                "filled-areas",
                "maps",
                "3d",
                "rasterized-aggregation",
                "arbitrary-third-party-marks",
                "automatic-label-overlap-resolution",
            ],
            "tiers": {
                "core-planned": [
                    "Matplotlib",
                    "Seaborn",
                    "pandas",
                    "ggplot2",
                    "base-R-helpers",
                    "Observable-Plot",
                    "Vega-Lite",
                    "Altair",
                    "Plotly-JS",
                    "Plotly-Python",
                    "Plotly-R-separately-tested",
                ],
                "early-compatibility": ["plotnine"],
                "limited-export": ["full-Vega-config-and-scales"],
                "later": [
                    "hvPlot-through-Bokeh",
                    "HoloViews-through-Bokeh",
                    "direct-Bokeh",
                ],
                "demand-led": ["ECharts", "Chart.js"],
                "utilities": ["D3"],
            },
            "requiresNativeAcceptance": True,
        },
        "limitations": registry["limitations"]
        + [
            "Asset presence does not certify actual rendered font selection or embedding.",
            "Changing categorical variant can recolor slots; no automatic expansion or common-prefix guarantee.",
        ],
    }


def promote(run, output):
    run, output = Path(run), Path(output)
    require(not output.is_symlink(), "Output root cannot be a symlink")
    require(
        not output.resolve().is_relative_to(run.resolve()),
        "Output cannot overwrite the frozen source run",
    )
    safe_path(output, "foundations.schema.json")
    lock = load_json(SPEC_ROOT / "source-lock.json")
    verify_sources(run, lock)
    registry = load_json(safe_path(run, "decision-registry.json"))
    palettes = load_json(safe_path(run, "results/palette-samples.json"))
    fonts = load_json(safe_path(run, "results/font-resolution.json"))
    spec = build_spec(registry, palettes, fonts, lock)
    with tempfile.TemporaryDirectory(prefix="plotfoundry-promotion-") as temporary:
        stage = Path(temporary)
        for relative in PRODUCT_FILES:
            target = stage / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(safe_path(SPEC_ROOT, relative).read_bytes())
        (stage / "foundations.schema.json").write_bytes(
            safe_path(run, "inputs/foundations-contract.schema.json").read_bytes()
        )
        inventory = {}

        def copy_source(source, target):
            payload = safe_path(run, source).read_bytes()
            destination = safe_path(stage / "data", target)
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists():
                require(
                    destination.read_bytes() == payload,
                    f"Conflicting resource basename: {target}",
                )
            destination.write_bytes(payload)
            inventory[target] = {"sha256": digest(payload), "source": source}

        for name in lock["upstream"]:
            copy_source(f"inputs/foundations/{name}.json", f"foundations/{name}.json")
            copy_source(f"inputs/licenses/{name}-LICENSE", f"notices/{name}-LICENSE")
        for entry in spec["fonts"].values():
            copy_source(entry["sourceFile"], entry["path"])
            with TTFont(
                safe_path(run, entry["sourceFile"]), recalcTimestamp=False
            ) as font:
                actual = {
                    "internalFamily": font["name"].getDebugName(1),
                    "weight": font["OS/2"].usWeightClass,
                    "embeddingFlags": font["OS/2"].fsType,
                }
                require(
                    actual == lock["expected"]["fontMetadata"][entry["sha256"]],
                    "Resolved font internals drift",
                )
        for roles in fonts.values():
            for entry in roles.values():
                for notice in entry["notice_paths"]:
                    copy_source(notice, "notices/" + Path(notice).name)
                if "conversion" in entry:
                    copy_source(
                        entry["conversion"]["source"],
                        "conversion-sources/"
                        + Path(entry["conversion"]["source"]).name,
                    )
        write_json(stage / "data/spec.json", spec)
        inventory["spec.json"] = {
            "sha256": digest((stage / "data/spec.json").read_bytes()),
            "generated": True,
        }
        write_json(
            stage / "data/manifest.json",
            {
                "specVersion": spec["specVersion"],
                "files": dict(sorted(inventory.items())),
            },
        )
        report = validate_bundle(stage, verify_fonts=True)
        output.mkdir(parents=True, exist_ok=True)
        require(not (output / "data").is_symlink(), "Output data cannot be a symlink")
        if (output / "data").exists():
            existing = output / "data"
            existing_files = {
                path.relative_to(existing).as_posix()
                for path in existing.rglob("*")
                if path.is_file()
            }
            require(
                not any(path.is_symlink() for path in existing.rglob("*")),
                "Existing data contains symlinks",
            )
            if existing_files:
                prior = load_json(safe_path(existing, "manifest.json"))
                require(
                    existing_files == set(prior["files"]) | {"manifest.json"},
                    "Refusing to erase unmanaged output files",
                )
                for relative in prior["files"]:
                    safe_path(existing, relative)
            # Only the managed data tree is replaced after the complete staged gate.
            shutil.rmtree(output / "data")
        shutil.copytree(stage / "data", output / "data")
        (output / "foundations.schema.json").write_bytes(
            (stage / "foundations.schema.json").read_bytes()
        )
        if output.resolve() != SPEC_ROOT.resolve():
            for relative in PRODUCT_FILES:
                target = safe_path(output, relative)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes((stage / relative).read_bytes())
    return report


def build_archive(root, output):
    root, output = Path(root), Path(output)
    report = validate_bundle(root, verify_fonts=True)
    output.mkdir(parents=True, exist_ok=True)
    target = safe_path(output, f"plotfoundry-spec-{report['specVersion']}.tar.gz")
    paths = sorted(
        PRODUCT_FILES
        + ["foundations.schema.json"]
        + [
            path.relative_to(root).as_posix()
            for path in (root / "data").rglob("*")
            if path.is_file()
        ]
    )
    prefix = f"plotfoundry-spec-{report['specVersion']}"
    with target.open("wb") as stream:
        with gzip.GzipFile(
            filename="", mode="wb", fileobj=stream, mtime=0
        ) as compressed:
            with tarfile.open(
                mode="w", fileobj=compressed, format=tarfile.USTAR_FORMAT
            ) as archive:
                for relative in paths:
                    payload = safe_path(root, relative).read_bytes()
                    info = tarfile.TarInfo(prefix + "/" + relative)
                    info.size, info.mode, info.mtime = len(payload), 0o644, 0
                    info.uid = info.gid = 0
                    info.uname = info.gname = ""
                    archive.addfile(info, io.BytesIO(payload))
    checksum = digest(target.read_bytes())
    safe_path(output, target.name + ".sha256").write_text(
        f"{checksum}  {target.name}\n"
    )
    return {"archive": str(target), "sha256": checksum, **report}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    importing = commands.add_parser("import")
    importing.add_argument("--run", type=Path, default=SOURCE_RUN)
    importing.add_argument("--output", type=Path, default=SPEC_ROOT)
    build = commands.add_parser("build")
    build.add_argument("--root", type=Path, default=SPEC_ROOT)
    build.add_argument(
        "--output", type=Path, default=SPEC_ROOT.parents[1] / ".build/packages/spec"
    )
    args = parser.parse_args()
    report = (
        promote(args.run, args.output)
        if args.command == "import"
        else build_archive(args.root, args.output)
    )
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
