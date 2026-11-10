#!/usr/bin/env python3
"""Validate a Plotfoundry data artifact; no research checkout or plotting imports.

jsonschema is a verification-tool dependency, not a data-consumption dependency.
Run from the specification tree or the extracted standalone archive.
"""

import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path, PurePosixPath

from jsonschema import Draft202012Validator

from reference import (
    category_slots,
    lookup_index,
    marker_area_points2,
    normalize,
    points,
    portable_slots,
)


class ContractError(ValueError):
    """An artifact disagrees with its schema, pinned authority or conformance data."""


def require(condition, message):
    if not condition:
        raise ContractError(message)


def safe_path(root, relative):
    """Allow only regular bundle-relative paths, without traversal or symlinks."""
    require(isinstance(relative, str) and relative, "Empty/non-string resource path")
    pure = PurePosixPath(relative)
    require(
        not pure.is_absolute() and "\\" not in relative and ":" not in relative,
        f"Absolute or non-portable path: {relative}",
    )
    require(
        str(pure) == relative
        and all(part not in ("", ".", "..") for part in pure.parts),
        f"Noncanonical/traversal path: {relative}",
    )
    root = Path(root)
    require(not root.is_symlink(), "Bundle/source root cannot be a symlink")
    current = root
    for part in pure.parts:
        current = current / part
        require(not current.is_symlink(), f"Symlink resource: {relative}")
    require(
        current.resolve().is_relative_to(root.resolve()),
        f"Resource escaped root: {relative}",
    )
    return current


def digest(payload):
    return hashlib.sha256(payload).hexdigest()


def canonical(value):
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode()


def load_json(path):
    def invalid(token):
        raise ContractError(f"Nonfinite JSON constant: {token}")

    try:
        return json.loads(Path(path).read_text(), parse_constant=invalid)
    except (json.JSONDecodeError, OSError) as error:
        raise ContractError(f"Cannot read JSON {path}: {error}") from error


def finite_tree(value):
    if isinstance(value, float):
        require(math.isfinite(value), "Nonfinite contract number")
    elif isinstance(value, dict):
        for child in value.values():
            finite_tree(child)
    elif isinstance(value, list):
        for child in value:
            finite_tree(child)


def validate_schema(spec, schema):
    finite_tree(spec)
    errors = sorted(
        Draft202012Validator(schema).iter_errors(spec),
        key=lambda error: str(error.path),
    )
    require(not errors, f"Schema: {errors[0].message if errors else ''}")


def conversion_record(entry):
    record = entry["conversion"]
    return {
        "sourcePath": "conversion-sources/" + Path(record["source"]).name,
        "sourceSha256": record["source_sha256"],
        "outputSha256": record["output_sha256"],
        "tool": record["tool"],
        "operation": record["operation"],
        "recalcTimestamp": False,
        "reorderTables": False,
        "outputFlavor": None,
        "preloadedTables": ["name", "OS/2"],
        "embeddingFlags": record["embedding_flags"],
    }


def expected_fonts(lock):
    """Derive resource references from separately pinned source-font records."""
    result = {}
    for roles in lock["expected"]["fonts"].values():
        for entry in roles.values():
            key = entry["sha256"]
            notices = ["notices/" + Path(path).name for path in entry["notice_paths"]]
            if key not in result:
                metadata = lock["expected"]["fontMetadata"][key]
                result[key] = {
                    "path": "fonts/" + Path(entry["file"]).name,
                    "sha256": key,
                    **metadata,
                    "noticePaths": [],
                    "sourceFile": entry["file"],
                    "packageSource": entry["package_source"],
                }
                if "conversion" in entry:
                    result[key]["conversion"] = conversion_record(entry)
            result[key]["noticePaths"] = sorted(
                set(result[key]["noticePaths"] + notices)
            )
    return result


def expected_provenance(lock):
    return {
        key: lock[key]
        for key in (
            "run",
            "researchRepository",
            "researchCommit",
            "evidenceManifestSha256",
        )
    } | {"sourceFiles": lock["files"], "upstream": lock["upstream"]}


def validate_values(spec, lock, foundations):
    """Semantic checks are independent of the generated inventory checksums."""
    require(spec["provenance"] == expected_provenance(lock), "Source provenance drift")
    require(
        spec["fonts"] == expected_fonts(lock),
        "Font metadata, path, role or notice drift",
    )
    require(
        set(spec["maps"]) == set(lock["expected"]["maps"]), "Unsupported/missing maps"
    )
    for name, pin in lock["expected"]["maps"].items():
        entry = spec["maps"][name]
        require(entry["kind"] == pin["kind"], f"Map kind changed: {name}")
        require(
            digest(canonical(entry["samples"])) == pin["samplesSha256"],
            f"Frozen samples changed: {name}",
        )
        require(len(entry["samples"]) == pin["count"], f"Map length changed: {name}")
        require(
            entry["centerIndex"] == (128 if pin["kind"] == "diverging" else None),
            f"LUT center changed: {name}",
        )
    require(
        spec["mapSelection"]
        == {
            kind: lock["expected"]["registryEncoding"][kind]
            for kind in ("sequential", "diverging")
        },
        "Map selection/default drift",
    )
    require(
        spec["lut"] == lock["expected"]["lut"], "LUT color-space/interpretation drift"
    )
    categories = spec["categories"]
    for name, pin in lock["expected"]["categories"].items():
        entry = categories["variants"][name]
        source = pin["variant"]
        require(
            entry["capacity"] == source["max_categories"],
            f"Category capacity drift: {name}",
        )
        require(entry["status"] == source["status"], f"Category status drift: {name}")
        require(
            entry["slots"]
            == portable_slots(pin["definition"], source, lock["dashCueProvenance"]),
            f"Category color/cue/slot drift: {name}",
        )
        require(
            len({slot["id"] for slot in entry["slots"]}) == entry["capacity"],
            "Duplicate category slots",
        )
        require(
            len({slot["color"] for slot in entry["slots"]}) == entry["capacity"],
            "Duplicate category colors",
        )
    placement = spec["placement"]
    authority = lock["expected"]["placement"]
    require(
        placement["defaultFigureWidthInches"] == authority["figure_width_inches"],
        "Figure-width default drift",
    )
    require(
        placement["defaultPlacedWidths"] == authority["placed_width_px"],
        "Placed-width default drift",
    )
    expected_cases = {}
    for name, foundation in foundations.items():
        theme = spec["themes"][name]
        require(
            theme["profiles"] == lock["expected"]["themeProfiles"][name],
            f"Numeric profile drift: {name}",
        )
        for profile in ("reading", "presentation"):
            source = foundation["typography"]["profiles"][profile]
            expected = {key: source[key] for key in ("label", "heading", "metadata")}
            expected["body_annotation"] = source["body"]
            require(
                theme["profiles"][profile] == expected,
                f"Profiles disagree with upstream: {name}",
            )
        for role, entry in lock["expected"]["fonts"][name].items():
            expected = {
                "font": entry["sha256"],
                "requestedFamily": entry["requested_family"],
                "fallback": entry["fallback"],
                "reason": entry["reason"],
                "glyphPolicy": entry["glyph_policy"],
            }
            require(
                theme["fontRoles"][role] == expected,
                f"Resolved font role drift: {name}/{role}",
            )
        for mode, profile, surface in itertools.product(
            ("light", "dark"), ("reading", "presentation"), ("paper", "panel")
        ):
            palette = foundation["modes"][mode]
            refs = palette["roles"]
            require(
                all(ref in palette["swatches"] for ref in refs.values()),
                f"Invalid upstream swatch reference: {name}",
            )
            furniture = {
                role: palette["swatches"][refs[role]]
                for role in (
                    "ink",
                    "muted",
                    "accent-text",
                    "secondary-text",
                    "control-boundary",
                )
            }
            furniture["background"] = palette["swatches"][refs[surface]]
            require(
                theme["modes"][mode][surface] == furniture,
                f"Furniture drift: {name}/{mode}/{surface}",
            )
            key = "/".join((name, mode, profile, surface))
            expected_cases[key] = {
                "id": key,
                "theme": name,
                "mode": mode,
                "profile": profile,
                "surface": surface,
                "roles": furniture,
                "typography": theme["profiles"][profile],
                "fonts": {
                    role: entry["font"] for role, entry in theme["fontRoles"].items()
                },
                "placement": {
                    "figureWidthInches": placement["defaultFigureWidthInches"],
                    "placedWidthCssPx": placement["defaultPlacedWidths"][profile],
                },
            }
    actual_cases = {case["id"]: case for case in spec["cases"]}
    require(
        len(spec["cases"]) == len(actual_cases) == 72, "Missing/duplicate resolved case"
    )
    require(
        actual_cases == expected_cases, "Resolved case drift or incomplete coverage"
    )


def check_conformance(root, spec):
    fixtures = load_json(safe_path(root, "conformance.json"))
    for row in fixtures["sequential"] + fixtures["diverging"]:
        result = normalize(row["value"], row["vmin"], row["vmax"], row.get("center"))
        require(result == row["expected"], "Normalization golden mismatch")
    for row in fixtures["lookup"]:
        require(
            lookup_index(row["u"], row["size"]) == row["expected"],
            "Lookup/bin golden mismatch",
        )
    for row in fixtures["placement"]:
        arguments = (
            row["css_px"],
            row["figure_width_inches"],
            row["placed_width_css_px"],
        )
        require(
            math.isclose(points(*arguments), row["points"], rel_tol=1e-14),
            "Placement golden mismatch",
        )
        if "area_points2" in row:
            require(
                marker_area_points2(*arguments) == row["area_points2"],
                "Marker area golden mismatch",
            )
    for row in fixtures["categories"]:
        slots = category_slots(
            row["domain"],
            row["observed"],
            spec["categories"]["variants"][row["variant"]],
        )
        require(
            [slot["id"] for slot in slots] == row["slots"],
            "Category assignment golden mismatch",
        )
    width = spec["categories"]["treatment"]["foreground_css_px"]
    cues = spec["categories"]["dashCueProvenance"]["namedPatterns"]
    for name, expected in fixtures["default_dash_css_px"].items():
        multipliers = [5, 1, 1, 1] if name == "custom" else cues[name]
        require(
            [value * width for value in multipliers] == expected,
            "Shared-layer dash geometry drift",
        )


def verify_conversions(root, spec):
    """Optional build audit using the exact pinned FontTools, never a renderer."""
    import io
    from importlib.metadata import version
    from fontTools.ttLib import TTFont

    require(
        version("fonttools") == "4.68.0",
        "FontTools 4.68.0 required for conversion reproduction",
    )
    for entry in spec["fonts"].values():
        if "conversion" not in entry:
            continue
        record = entry["conversion"]
        with TTFont(
            safe_path(root / "data", record["sourcePath"]), recalcTimestamp=False
        ) as font:
            # The frozen method reads name/OS2 metadata before saving; table
            # decompilation affects byte serialization even without visual changes.
            font["name"].getDebugName(1)
            font["OS/2"].usWeightClass
            font["OS/2"].fsType
            font.flavor = None
            output = io.BytesIO()
            font.save(output, reorderTables=False)
            require(
                digest(output.getvalue()) == entry["sha256"],
                "ET Book conversion output drift",
            )


def validate_bundle(root, verify_fonts=False):
    root = Path(root)
    lock = load_json(safe_path(root, "source-lock.json"))
    schema = load_json(safe_path(root, "schema.json"))
    spec = load_json(safe_path(root, "data/spec.json"))
    validate_schema(spec, schema)
    manifest = load_json(safe_path(root, "data/manifest.json"))
    data = root / "data"
    require(manifest["specVersion"] == spec["specVersion"], "Inventory version drift")
    for path in data.rglob("*"):
        require(not path.is_symlink(), f"Symlink in artifact: {path.name}")
    actual = {
        path.relative_to(data).as_posix() for path in data.rglob("*") if path.is_file()
    }
    require(
        actual == set(manifest["files"]) | {"manifest.json"},
        "Inventory missing/extra files",
    )
    for relative, record in manifest["files"].items():
        payload = safe_path(data, relative).read_bytes()
        require(
            digest(payload) == record["sha256"], f"Resource bytes changed: {relative}"
        )
        if "source" in record:
            require(
                record["source"] in lock["files"],
                f"Unapproved source resource: {relative}",
            )
            require(
                record["sha256"] == lock["files"][record["source"]],
                f"Source-resource provenance drift: {relative}",
            )
        else:
            require(
                relative == "spec.json" and record.get("generated") is True,
                "Unexpected generated payload",
            )
    require(
        digest(safe_path(root, "foundations.schema.json").read_bytes())
        == lock["files"]["inputs/foundations-contract.schema.json"],
        "Foundation schema drift",
    )
    foundation_schema = load_json(safe_path(root, "foundations.schema.json"))
    foundations = {}
    for name, pin in lock["upstream"].items():
        relative = f"foundations/{name}.json"
        require(
            manifest["files"][relative]
            == {"sha256": pin["sha256"], "source": f"inputs/foundations/{name}.json"},
            f"Upstream manifest pin drift: {name}",
        )
        foundations[name] = load_json(safe_path(data, relative))
        Draft202012Validator(foundation_schema).validate(foundations[name])
    validate_values(spec, lock, foundations)
    required = {"spec.json"} | {f"foundations/{name}.json" for name in lock["upstream"]}
    required |= {
        "notices/" + Path(path).name
        for path in lock["files"]
        if path.startswith("inputs/licenses/") and path.endswith("-LICENSE")
    }
    for font in spec["fonts"].values():
        required.add(font["path"])
        required.update(font["noticePaths"])
        if "conversion" in font:
            required.add(font["conversion"]["sourcePath"])
    require(
        set(manifest["files"]) == required, "Unreferenced or omitted artifact resource"
    )
    check_conformance(root, spec)
    if verify_fonts:
        verify_conversions(root, spec)
    return {
        "specVersion": spec["specVersion"],
        "cases": len(spec["cases"]),
        "maps": len(spec["maps"]),
        "fontFiles": len(spec["fonts"]),
        "resources": len(required),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root", type=Path, nargs="?", default=Path(__file__).resolve().parents[1]
    )
    parser.add_argument("--verify-font-conversions", action="store_true")
    args = parser.parse_args()
    print(
        json.dumps(
            validate_bundle(args.root, args.verify_font_conversions), sort_keys=True
        )
    )


if __name__ == "__main__":
    main()
