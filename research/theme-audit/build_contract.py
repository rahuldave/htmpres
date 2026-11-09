"""Freeze approved research candidates into independently adoptable v1 seeds."""

import json
from typing import Any

from jsonschema import Draft202012Validator
from foundations import ratio, repair, blend
from measure import HERE, CATALOG, PRIORITY

REQUIRED_ROLES = "paper panel code ink muted accent-text secondary-text primary-fill button-ink primary-hover-fill primary-hover-ink link-hover secondary-action focus control-boundary decorative-line code-ink selected-fill selected-ink disabled-fill disabled-ink".split()


def build_mode(m: dict[str, Any], states: dict[str, Any]) -> dict[str, Any]:
    """Add paired interaction tokens while retaining every reviewed swatch/role."""
    mode = m["mode"]
    sw = dict(m["swatches"])
    roles = dict(m["roles"])

    def add(role: str, value: str) -> None:
        """Add one color and its role reference without touching anchors."""
        sw["candidate-" + role] = value
        roles[role] = "candidate-" + role

    endpoint = "#000000" if mode == "light" else "#ffffff"
    hover = blend(sw[roles["primary-fill"]], endpoint, 0.08)
    add("primary-hover-fill", hover)
    add("primary-hover-ink", repair(sw[roles["button-ink"]], [hover], 4.5))
    add(
        "link-hover",
        repair(
            blend(sw[roles["accent-text"]], endpoint, 0.08),
            [sw[roles[r]] for r in ["paper", "panel", "code"]],
            5,
        ),
    )
    roles.update(
        {
            "decorative-line": "anchor-line",
            "code-ink": roles["ink"],
            "selected-fill": roles["primary-fill"],
            "selected-ink": roles["button-ink"],
            "disabled-fill": roles["panel"],
            "disabled-ink": roles["muted"],
        }
    )
    return dict(
        swatches=sw,
        roles=roles,
        states={
            k: dict(
                fill=v["bg"],
                ink=v["ink"],
                boundary=v["border"],
                provenance=(
                    "new-candidate" if k == "info" else "reading-source-repaired"
                ),
            )
            for k, v in states[mode].items()
        },
    )


def available_weights(theme: str, fonts: dict[str, str]) -> dict[str, list[int]]:
    """Freeze fresh upstream font declarations; platform families remain conditional."""
    weights = {r: [400, 600, 700] for r in fonts}
    weights["code"] = [400, 500] if theme != "tufte" else [400, 700]
    if theme in ["folio", "nocturne"]:
        for role in ["body", "heading"]:
            weights[role] = [400, 600]
        weights["ui"] = [400, 500, 600, 700]
        weights["display"] = [400] if theme == "folio" else [400, 600]
    if theme == "atelier":
        for role in ["body", "heading", "ui", "display"]:
            weights[role] = [400, 500, 600, 700]
    if theme in ["darkly-reading", "tufte"]:
        for role in ["body", "heading", "ui", "display"]:
            weights[role] = [400, 700]
    return weights


def contracts() -> dict[str, dict[str, Any]]:
    """Preserve reviewed evidence while adding explicit consumer profiles/states."""
    evidence = json.loads((HERE / "results/foundations.json").read_text())
    cat = json.loads(CATALOG.read_text())["themes"]
    out = {}
    for theme in PRIORITY:
        source = [m for m in evidence["modes"] if m["theme"] == theme]
        modes = {}
        for m in source:
            modes[m["mode"]] = build_mode(m, evidence["states"])
        weights = available_weights(theme, source[0]["fonts"])
        out[theme] = dict(
            schemaVersion=1,
            theme=theme,
            nativeMode=cat[theme]["native"],
            provenance=dict(
                source="research/theme-audit/results/foundations.json",
                status="approved-candidate",
                validation="Opaque sRGB pairs only; browser behavior and projection require upstream QA.",
            ),
            modes=modes,
            typography=dict(
                fonts=source[0]["fonts"],
                availableWeights=weights,
                weightAvailability="Bundled normal-face weights from fresh upstream src/fonts.css; system/Georgia/Consolas availability is platform-dependent. Never synthesize missing faces.",
                scale=evidence["sizes"],
                lineHeights=dict(
                    display=1.1,
                    heading=1.2,
                    presentation=1.35,
                    ui=1.5,
                    code=1.5,
                    reading=1.6,
                ),
                profiles=dict(
                    reading=dict(
                        body=source[0]["body_size"],
                        ui=16,
                        metadata=14,
                        heading=30,
                        title=36,
                        display=48,
                        code=16,
                        label=16,
                    ),
                    presentation=dict(
                        body=30,
                        ui=24,
                        metadata=24,
                        heading=36,
                        title=48,
                        code=30,
                        label=24,
                    ),
                ),
            ),
            spacing=dict(
                scale=evidence["spacing"],
                profiles=dict(
                    reading=dict(
                        outer=24,
                        narrowOuter=16,
                        paragraph=16,
                        group=48,
                        withinGroup=16,
                        columns=32,
                        panel=0 if theme == "tufte" else 24,
                    ),
                    presentation=dict(
                        outer=64,
                        paragraph=24,
                        group=48,
                        withinGroup=16,
                        columns=48,
                        panel=0 if theme == "tufte" else 32,
                    ),
                ),
            ),
            shape=dict(
                radius=source[0]["radius"],
                restingShadow="none",
                grouping="unboxed" if theme == "tufte" else "space-first",
            ),
            semantics=dict(
                selected="Paired primary fill/ink plus aria-selected/current and non-color cue.",
                disabled="Opaque panel/muted ink plus native disabled or aria-disabled behavior; do not fade via opacity.",
                error="states.danger plus words, icon and programmatic association; brand is not validation.",
                decorativeLine="Decoration only; control-boundary is meaningful boundary.",
                info="New candidate state.",
                fontUnits="Pixel reference at 16px root; emit reading rem and honor zoom.",
                primaryHover="Primary hue family blend with separately tested ink.",
            ),
        )
    return out


def validate(d: dict[str, Any]) -> dict[str, Any]:
    """Validate schema/references and research contrast targets, not browser UX."""
    schema = json.loads((HERE / "foundations-contract.schema.json").read_text())
    Draft202012Validator(schema).validate(d)
    assert d["schemaVersion"] == 1 and set(d["modes"]) == {"light", "dark"}
    for m in d["modes"].values():
        sw, r = m["swatches"], m["roles"]
        assert set(REQUIRED_ROLES) <= set(r)
        assert all(v in sw for v in r.values())

        def c(role: str) -> str:
            return sw[r[role]]

        for role in [
            "ink",
            "muted",
            "accent-text",
            "secondary-text",
            "link-hover",
            "code-ink",
            "focus",
            "control-boundary",
        ]:
            for bg in ["paper", "panel", "code"]:
                assert ratio(c(role), c(bg)) >= (
                    3 if role in ["focus", "control-boundary"] else 5
                )
        for ink, fill, n in [
            ("button-ink", "primary-fill", 4.5),
            ("primary-hover-ink", "primary-hover-fill", 4.5),
            ("selected-ink", "selected-fill", 4.5),
            ("disabled-ink", "disabled-fill", 5),
        ]:
            assert ratio(c(ink), c(fill)) >= n
        for s in m["states"].values():
            assert (
                ratio(s["ink"], s["fill"]) >= 5 and ratio(s["boundary"], s["fill"]) >= 3
            )
    return d


def main() -> None:
    """Write nine validated, deterministic seeds for independent adoption."""
    target = HERE / "foundation-seeds"
    target.mkdir(exist_ok=True)
    for theme, d in contracts().items():
        validate(d)
        (target / (theme + ".json")).write_text(json.dumps(d, indent=2) + "\n")
    print("9 v1 contracts; 18 modes validated")


if __name__ == "__main__":
    main()
