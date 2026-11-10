"""Generated verbatim semantic validators from approved spec; do not edit."""
import hashlib
import json
import itertools
from pathlib import Path
from ._reference import portable_slots

class ContractError(ValueError):
    """An artifact disagrees with its schema, pinned authority or conformance data."""

def require(condition, message):
    if not condition:
        raise ContractError(message)

def digest(payload):
    return hashlib.sha256(payload).hexdigest()

def canonical(value):
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode()

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
