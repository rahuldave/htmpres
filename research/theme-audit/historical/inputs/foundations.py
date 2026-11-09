"""Research-only foundations; no production theme writes."""

import csv
import json
from html import escape
import numpy as np
from colorspacious import cspace_convert
from matplotlib.colors import to_rgb, to_hex
from measure import HERE, CATALOG, PRIORITY, contrast

SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]
SPACING = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]


def ratio(a: str, b: str) -> float:
    """Measure two opaque, rounded sRGB colors."""
    return float(contrast(np.array(to_rgb(a)), np.array(to_rgb(b))))


def blend(a: str, b: str, t: float) -> str:
    """Interpolate in Lab, clip gamut, then round to an sRGB hex color."""
    lab = (1 - t) * cspace_convert(to_rgb(a), "sRGB1", "CIELab") + t * cspace_convert(
        to_rgb(b), "sRGB1", "CIELab"
    )
    return to_hex(np.clip(cspace_convert(lab, "CIELab", "sRGB1"), 0, 1))


def repair(c: str, bgs: list[str], n: float) -> str:
    """Retain an anchor when possible; otherwise find the first passing step."""
    if min(ratio(c, b) for b in bgs) >= n:
        return c
    end = max(["#000000", "#ffffff"], key=lambda x: min(ratio(x, b) for b in bgs))
    for t in np.linspace(0.001, 1, 1000):
        x = blend(c, end, t)
        if min(ratio(x, b) for b in bgs) >= n:
            return x
    raise ValueError(c)


def ramp(c: str) -> dict[str, str]:
    """Build a finite shade family through one exact source anchor."""
    return {
        str(i): (
            blend("#ffffff", c, i / 500)
            if i <= 500
            else blend(c, "#000000", (i - 500) / 500)
        )
        for i in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    }


def generate_mode(name: str, mode: str, e: dict) -> tuple[dict, list[dict]]:
    """Preserve one mode's anchors, derive named roles, and measure every pair."""
    checks = []
    p = e["palettes"][mode]
    sw = {f"anchor-{k}": v for k, v in p.items()}
    roles = {k: f"anchor-{k}" for k in p}
    bgs = [p[k] for k in ["paper", "panel", "code"]]
    fam = {
        "neutral": ramp(e["palettes"]["light"]["ink"]),
        "primary": ramp(e["palettes"]["light"]["accent"]),
    }
    if name in ["folio", "atelier", "nocturne"]:
        fam["secondary"] = ramp(e["palettes"]["light"]["secondary"])
    for f, vals in fam.items():
        sw.update({f"{f}-{k}": v for k, v in vals.items()})
    for role, src, minimum in [
        ("ink", "ink", 5),
        ("muted", "muted", 5),
        ("accent-text", "accent", 5),
        ("secondary-text", "secondary", 5),
        ("focus", "accent", 3),
        ("control-boundary", "line", 3),
    ]:
        orig = p[src]
        base = (
            p["muted"]
            if name
            in [
                "tufte",
                "zephyr-reading",
                "simplex-reading",
                "pulse-reading",
                "litera-reading",
            ]
            and role == "secondary-text"
            else orig
        )
        sw["candidate-" + role] = repair(base, bgs, minimum)
        roles[role] = "candidate-" + role
        for bg in ["paper", "panel", "code"]:
            checks.append(
                dict(
                    theme=name,
                    mode=mode,
                    role=role,
                    background=bg,
                    before=ratio(orig, p[bg]),
                    after=ratio(sw[roles[role]], p[bg]),
                    minimum=minimum,
                    color=sw[roles[role]],
                    repaired=orig.lower() != sw[roles[role]].lower(),
                )
            )
    roles["primary-fill"] = (
        "anchor-secondary"
        if name == "darkly-reading" and mode == "dark"
        else "anchor-accent"
    )
    fill = sw[roles["primary-fill"]]
    native_reading = name.endswith("-reading") and mode == e["native"]
    preferences = ["#ffffff"] if native_reading else [p["paper"]]
    preferences += [p["ink"], "#ffffff", "#000000"]
    sw["button-ink"] = next(c for c in preferences if ratio(c, fill) >= 4.5)
    roles["button-ink"] = "button-ink"
    roles["secondary-action"] = "candidate-ink"
    checks.append(
        dict(
            theme=name,
            mode=mode,
            role="button-ink",
            background="primary-fill",
            before="",
            after=ratio(sw["button-ink"], fill),
            minimum=4.5,
            color=sw["button-ink"],
            repaired=False,
        )
    )
    if name == "tufte":
        sw["optional-highlight-fill"] = "#dceaf4" if mode == "light" else "#233b4b"
        sw["optional-highlight-ink"] = repair(
            p["ink"], [sw["optional-highlight-fill"]], 5
        )
        roles["optional-highlight-fill"] = "optional-highlight-fill"
        roles["optional-highlight-ink"] = "optional-highlight-ink"
    ui = (
        '"DM Sans",system-ui,sans-serif'
        if name in ["folio", "atelier", "nocturne"]
        else e["heading"]
    )
    result = dict(
        theme=name,
        mode=mode,
        swatches=sw,
        roles=roles,
        families=fam,
        fonts=dict(
            body=e["body"],
            heading=(
                '"Source Serif 4",Georgia,serif' if name == "folio" else e["heading"]
            ),
            ui=ui,
            display=e["heading"],
            code=e["mono"],
        ),
        radius=dict(zip(PRIORITY, [2, 0, 4, 0, 8, 2, 4, 2, 4]))[name],
        body_size=(
            20 if name in ["folio", "nocturne", "tufte", "litera-reading"] else 18
        ),
    )
    return result, checks


def generate() -> tuple[dict, list[dict], dict]:
    """Build eighteen mode proposals and auditable before/after role pairs."""
    cat = json.loads(CATALOG.read_text())["themes"]
    modes = []
    checks = []
    for name in PRIORITY:
        e = cat[name]
        for mode in ["light", "dark"]:
            result, mode_checks = generate_mode(name, mode, e)
            modes.append(result)
            checks.extend(mode_checks)
    states = generate_states()
    return (
        dict(
            method="CIELAB straight segments through white / original light anchor / black, sRGB channel clipping and 8-bit rounding. Not perceptually uniform or scientific colormaps. Repairs take first 0.001 Lab step toward best black/white endpoint meeting every intended surface. Original named anchors retained.",
            sizes=SIZES,
            spacing=SPACING,
            modes=modes,
            states=states,
        ),
        checks,
        cat,
    )


def generate_states() -> dict:
    """Retain source state surfaces and repair only ink/boundary reserves."""
    seeds = {
        "light": {
            "success": ["#e6f1e8", "#204b32", "#7e9f88"],
            "warning": ["#fbf1dc", "#604414", "#b59a65"],
            "danger": ["#f9e9e5", "#803c32", "#ba8b80"],
            "info": ["#e7eff8", "#245c86", "#7897b2"],
        },
        "dark": {
            "success": ["#153b31", "#b8e6d3", "#507b6d"],
            "warning": ["#3d3017", "#f3d798", "#aa8648"],
            "danger": ["#3d2424", "#f1beb7", "#a67570"],
            "info": ["#1d3043", "#b9d9f3", "#7399b9"],
        },
    }
    states = {
        mode: {
            name: dict(
                bg=a,
                ink=repair(b, [a], 5),
                border=repair(c, [a], 3),
                original_border=c,
                ink_contrast=ratio(repair(b, [a], 5), a),
                border_contrast=ratio(repair(c, [a], 3), a),
            )
            for name, (a, b, c) in vals.items()
        }
        for mode, vals in seeds.items()
    }
    return states


CSS = """.fb{margin:24px 0;padding:24px;border:1px solid #88958d;overflow:hidden}.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:8px}.fc{font:12px/1.4 system-ui;overflow-wrap:anywhere;padding:6px}.fc i{display:block;height:36px;border:1px solid currentColor}.ft{font-synthesis:none;overflow-wrap:anywhere}.ft p{margin:12px 0}.fr{font:14px/1.6 system-ui;overflow-wrap:anywhere}.fs{display:flex;align-items:center;gap:16px;margin:8px 0}.fs i{height:16px;background:#365d50;flex:none}"""


def render_role_sample(mode: dict) -> str:
    """Show static role application rather than implying live controls."""
    swatches, roles = mode["swatches"], mode["roles"]

    def color(role: str) -> str:
        return swatches[roles[role]]

    padding = 0 if mode["theme"] == "tufte" else 24
    background = "transparent" if mode["theme"] == "tufte" else color("panel")
    body_font = escape(mode["fonts"]["body"], quote=True)
    ui_font = escape(mode["fonts"]["ui"], quote=True)
    optional = ""
    if "optional-highlight-fill" in roles:
        optional = f'<p style="background:{color("optional-highlight-fill")};color:{color("optional-highlight-ink")}">Optional blue highlight fill with its intended ink</p>'
    return f"""<div class="fr" style="margin-top:24px;background:{background};padding:{padding}px;font-family:{body_font}">
      <p style="font-family:{ui_font}">Static visual examples — these are not interactive controls.</p>
      <div style="font-family:{escape(mode['fonts']['heading'],quote=True)};font-size:30px;color:{color('ink')}">A useful hierarchy</div>
      <p style="font-size:{mode['body_size']}px;color:{color('ink')}">Primary body text gives the idea room to breathe.</p>
      <p style="color:{color('muted')};font-family:{ui_font}">Muted supporting text · metadata 14</p>
      <p style="color:{color('accent-text')};text-decoration:underline;text-underline-offset:3px">Primary link ink</p>
      <p style="color:{color('secondary-text')}">Secondary supporting text</p>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;font-family:{ui_font};font-size:16px">
        <span style="display:inline-block;padding:8px 16px;background:{color('primary-fill')};color:{color('button-ink')};border-radius:{mode['radius']}px">Primary action</span>
        <span style="color:{color('secondary-action')}">Secondary action</span>
        <span style="padding:8px;border:2px solid {color('control-boundary')};outline:2px solid {color('focus')};outline-offset:4px">Control boundary + focus</span>
      </div>{optional}</div>"""


def fragment(d: dict, cat: dict) -> str:
    """Render an embeddable report section; font paths assume report location."""
    fonts = "\n".join(cat[n].get("fontCss", "") for n in PRIORITY).replace(
        "assets/htmpres-themes/", "../../_extensions/htmpres/themes/"
    )
    o = [
        f'<section id="foundation-specimens"><style>{fonts}{CSS}</style><h2>Candidate foundation specimens</h2><p>Research proposals; stock Bootswatch remains reference-only. General blog paired modes are proposals, not existing native Reading pairs. Numerical reserves do not guarantee physical projection performance.</p><p>{d["method"]}</p><h3>Shared type ladder</h3><div class="ft">'
    ]
    for size in SIZES:
        o.append(
            f'<p style="font-size:{size}px;line-height:1.2">{size} · Reading ideas</p>'
        )
    o += [
        "</div><p>Reading: metadata 14; navigation/control 16; sans body 18, serif body 20; heading 24/30/36; Folio/Nocturne optional display 48. Slides: body 30, key text 36, heading 36, title 48, hero 60/72, caption/code 24 (code 30 preferred). Below 24 is outside audience canvas or presenter controls; 12 only nonessential editor detail. Refactoring UI type p105.</p><h3>Shared spacing ladder</h3>"
    ]
    for s in SPACING:
        o.append(f'<div class="fs"><span>{s}px</span><i style="width:{s}px"></i></div>')
    o += [
        "<p>Refactoring UI spacing p73 subset. Blog: paragraph gap 16; heading after 12/16 before 32/48; panel padding 24; section gap 48; outer gutter 24 desktop / 16 mobile. Slides: outer 64; columns 48; block gap 32; paragraph gap 24; title-content 32; panel padding 32; in-group 16. Tufte text groups unboxed without inner padding. Border 1/2 is separate. Radius vocabulary 0/2/4/8. No permanent slide/card shadow; only floating blog menus/editor preview UI.</p>"
    ]
    o.append(
        '<nav aria-label="Theme specimens">'
        + " · ".join(
            f'<a href="#foundation-{n}">{cat[n]["title"]}</a>' for n in PRIORITY
        )
        + "</nav>"
    )
    for name in PRIORITY:
        o.append(
            f'<h3 id="foundation-{name}">{cat[name]["title"]} · paired swatch board</h3>'
        )
        for m in [m for m in d["modes"] if m["theme"] == name]:
            sw = m["swatches"]
            r = m["roles"]
            o.append(
                f'<article class="fb" style="background:{sw[r["paper"]]};color:{sw[r["ink"]]};border-radius:{m["radius"]}px"><h4>{m["mode"]} · radius {m["radius"]}</h4><div class="fg">'
            )
            for k, v in sw.items():
                o.append(
                    f'<div class="fc"><i style="background:{v}"></i>{k}<br>{v}</div>'
                )
            o.append('</div><div class="ft">')
            for role, text, size in [
                ("body", "A considered reading rhythm.", m["body_size"]),
                ("heading", "A clear section heading", 30),
                ("ui", "Navigation · Secondary action", 16),
                (
                    "display",
                    "Ideas worth reading",
                    48 if name in ["folio", "nocturne"] else 36,
                ),
                ("code", "const rhythm = 24;", 24),
            ]:
                o.append(
                    f'<p style="font-family:{escape(m["fonts"][role],quote=True)};font-size:{size}px;font-weight:400">{text}</p>'
                )
            o.append(
                "</div>"
                + render_role_sample(m)
                + '<p class="fr">'
                + escape(" · ".join(f"{k} → {v} {sw[v]}" for k, v in r.items()))
                + '</p><p class="fr">'
                + escape(str(m["fonts"]))
                + "</p></article>"
            )
    o.append(
        '<p>Regular bundled faces shown; system/Georgia/Consolas depend on local availability. Folio Caslon only large display; Source Serif 4 section headings and DM Sans UI. Tufte keeps achromatic link ink; optional blue is a highlight fill paired with explicit ink. Secondary action is neutral. Brand fills retained independently from repaired text. Darkly dark button retains #375a7f with separate light link ink. Hover/stateful interaction mappings remain unadopted; primary hover should stay within primary family.</p><h3>Shared state family</h3><p>Pair color with icons and words: ✓ Success, ! Warning, × Error, i Information, especially red-brand Simplex. UI states are not data series. Success, warning and danger anchors come from Reading sources; information is a new candidate. Boundaries are strengthened independently.</p><div class="fg">'
    )
    for mode, states in d["states"].items():
        for name, s in states.items():
            label = {
                "success": "✓ Success",
                "warning": "! Warning",
                "danger": "× Error",
                "info": "i Information",
            }[name]
            o.append(
                f'<div class="fc" style="background:{s["bg"]};color:{s["ink"]};border:2px solid {s["border"]}">{mode} {label}<br>bg {s["bg"]}<br>ink {s["ink"]}<br>border {s["border"]}<br>ink {s["ink_contrast"]:.2f}:1<br>border {s["border_contrast"]:.2f}:1</div>'
            )
    o.append(
        '</div><p><a href="results/foundations.json">Exact candidates</a> · <a href="results/foundations-contrasts.csv">Before/after paired role checks</a></p></section>'
    )
    return "\n".join(o)


def main() -> None:
    """Write research artifacts only."""
    d, c, cat = generate()
    p = HERE / "results"
    (p / "foundations.json").write_text(json.dumps(d, indent=2) + "\n")
    with (p / "foundations-contrasts.csv").open("w") as f:
        w = csv.DictWriter(f, fieldnames=list(c[0]))
        w.writeheader()
        w.writerows(c)
    (p / "foundations-specimens.html").write_text(fragment(d, cat))
    print(f'{len(d["modes"])} modes;{len(c)} checks')


if __name__ == "__main__":
    main()
