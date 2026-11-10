"""Dependency-free resource loading and explicit scientific placement."""

from dataclasses import dataclass
import copy
import hashlib
from importlib.resources import files
import json
from pathlib import Path, PurePosixPath
from typing import Any

from ._resources._reference import points
from ._resources._validation import validate_values
from ._resources._contract import PINS


def _root() -> Path:  # Installed resource directory.
    """Resolve installed package resources without sibling/research lookups."""
    return Path(str(files("plotfoundry").joinpath("_resources")))


def _resource(
    relative: str,  # Portable bundle-relative path.
) -> Path:  # Validated installed path.
    """Reject traversal and symlinks before reading packaged resources."""
    pure = PurePosixPath(relative)
    if (
        pure.is_absolute()
        or str(pure) != relative
        or any(p in (".", "..") for p in pure.parts)
        or "\\" in relative
    ):
        raise ValueError("Invalid resource path")
    root = _root()
    current = root
    if root.is_symlink():
        raise ValueError("Symlink resource root")
    for part in pure.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError("Symlink resource")
    return current


def load_spec() -> dict[str, Any]:  # Fresh validated scientific data.
    """Validate installed resource closure and independent source pins on every load."""
    root = _root()
    if root.is_symlink() or any(path.is_symlink() for path in root.rglob("*")):
        raise ValueError("Symlink in approved snapshot")
    actual_files = {
        p.relative_to(root).as_posix()
        for p in root.rglob("*")
        if p.is_file() and "__pycache__" not in p.parts
    }
    if actual_files != set(PINS) | {"_contract.py"}:
        raise ValueError("Approved snapshot closure mismatch")
    for relative, approved in PINS.items():
        if hashlib.sha256(_resource(relative).read_bytes()).hexdigest() != approved:
            raise ValueError("Approved snapshot drift: " + relative)
    manifest = json.loads(_resource("data/manifest.json").read_text())
    lock = json.loads(_resource("source-lock.json").read_text())
    data = json.loads(_resource("data/spec.json").read_text())
    if data["schemaVersion"] != 1 or data["specVersion"] != "0.1.0":
        raise ValueError("Unsupported scientific contract version")
    if any(path.is_symlink() for path in (root / "data").rglob("*")):
        raise ValueError("Symlink in resource tree")
    actual = {
        p.relative_to(root / "data").as_posix()
        for p in (root / "data").rglob("*")
        if p.is_file()
    }
    if actual != set(manifest["files"]) | {"manifest.json"}:
        raise ValueError("Resource inventory mismatch")
    for relative, record in manifest["files"].items():
        digest = hashlib.sha256(_resource("data/" + relative).read_bytes()).hexdigest()
        if digest != record["sha256"]:
            raise ValueError("Resource hash mismatch: " + relative)
        if "source" in record and lock["files"].get(record["source"]) != digest:
            raise ValueError("Pinned source drift")
    for name, pin in lock["upstream"].items():
        if (
            manifest["files"]["foundations/" + name + ".json"]["sha256"]
            != pin["sha256"]
        ):
            raise ValueError("Upstream pin drift")
    foundations = {
        name: json.loads(_resource("data/foundations/" + name + ".json").read_text())
        for name in lock["upstream"]
    }
    validate_values(data, lock, foundations)
    schema = json.loads(_resource("schema.json").read_text())
    for key, rule in schema["properties"].items():
        if "const" in rule and data[key] != rule["const"]:
            raise ValueError("Fixed contract protocol drift: " + key)
    for key, face in data["fonts"].items():
        if (
            hashlib.sha256(_resource("data/" + face["path"]).read_bytes()).hexdigest()
            != key
        ):
            raise ValueError("Font file identity drift")
        for notice in face["noticePaths"]:
            _resource("data/" + notice).read_bytes()
    required = {"spec.json"} | {f"foundations/{name}.json" for name in lock["upstream"]}
    required |= {
        "notices/" + Path(path).name
        for path in lock["files"]
        if path.startswith("inputs/licenses/") and path.endswith("-LICENSE")
    }
    for face in data["fonts"].values():
        required.add(face["path"])
        required.update(face["noticePaths"])
        if "conversion" in face:
            required.add(face["conversion"]["sourcePath"])
    if set(manifest["files"]) != required:
        raise ValueError("Unreferenced or omitted resource")
    return data


@dataclass(frozen=True)
class Theme:
    """Explicit theme/mode/profile/surface plus actual placed figure geometry."""

    case: dict[str, Any]  # Resolved selected case.
    spec: dict[str, Any]  # Validated bundled data snapshot.
    figure_width_inches: float  # Exact canvas width in native inches.
    placed_width_css_px: float  # Intended final CSS width.

    def points(
        self,
        css_px: float,  # Desired placed CSS length.
    ) -> float:  # Native point length independent of export DPI.
        """Use the shared contract's placement arithmetic verbatim."""
        return points(css_px, self.figure_width_inches, self.placed_width_css_px)

    def font_path(
        self,
        role: str = "ui",  # ui or heading resolved face.
    ) -> Path:  # Exact installed font file.
        """Return a file-bound face, never a system family search."""
        font = self.spec["fonts"][self.case["fonts"][role]]
        return _resource("data/" + font["path"])


def theme(
    name: str,  # One of the nine authoritative family IDs.
    *,
    mode: str = "light",  # Explicit light or dark.
    profile: str = "reading",  # reading or presentation.
    surface: str = "paper",  # paper or panel furniture.
    figure_width_inches: float = 8,  # Actual intended native canvas width.
    placed_width_css_px: float | None = None,  # Defaults to contract profile placement.
) -> Theme:  # Independent immutable selection wrapper.
    """Select one of 72 cases; reject unknown IDs and invalid dimensions."""
    spec = load_spec()
    case = next(
        (
            c
            for c in spec["cases"]
            if c["id"] == "/".join((name, mode, profile, surface))
        ),
        None,
    )
    if case is None:
        raise ValueError("Unknown theme/mode/profile/surface")
    width = (
        case["placement"]["placedWidthCssPx"]
        if placed_width_css_px is None
        else placed_width_css_px
    )
    points(1, figure_width_inches, width)
    return Theme(copy.deepcopy(case), spec, float(figure_width_inches), float(width))
