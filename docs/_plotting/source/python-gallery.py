"""Generate actual installed-package specimens for every approved case."""

import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from plotfoundry import load_spec, theme
from plotfoundry.matplotlib import (
    context,
    line,
    scatter,
    heatmap,
    style_axes,
    export,
    annotate,
)


def render(
    output: Path,  # Output directory, without repository/runtime dependencies.
    case_ids: list[str] | None = None,  # Optional bounded case subset.
) -> list[dict]:  # Export evidence per selected case.
    """Exercise3/5categories, both continuous defaults, missing cells and late text."""
    results = []
    for case in load_spec()["cases"]:
        if case_ids is not None and case["id"] not in case_ids:
            continue
        config = theme(
            case["theme"],
            mode=case["mode"],
            profile=case["profile"],
            surface=case["surface"],
        )
        with context(config):
            fig, axes = plt.subplots(2, 2, figsize=(8, 8))
            fig.subplots_adjust(
                left=0.13, right=0.87, top=0.84, bottom=0.19, wspace=0.7, hspace=0.7
            )
            ax = axes[0, 0]
            for index, key in enumerate(["A", "B", "C"]):
                line(
                    ax,
                    [0, 1, 2],
                    [index * 2, index * 2 + 1, index * 2 + 0.6],
                    config,
                    domain=["A", "B", "C"],
                    category=key,
                )
            ax.set(
                xlim=(-0.2, 3.2),
                ylim=(-1, 10),
                title="Lines",
                xlabel="Time",
                ylabel="Value",
            )
            ax.legend(
                loc="upper left",
                frameon=False,
                ncol=3,
                columnspacing=0.8,
                handlelength=1,
                handletextpad=0.3,
            )
            ax = axes[0, 1]
            scatter(
                ax,
                list(range(5)),
                list(range(5)),
                config,
                domain=["A", "B", "C", "D", "E"],
                categories=["A", "B", "C", "D", "E"],
                variant="colorblind-subset-5",
            )
            ax.set(
                title="Categories", xlabel="Position", ylabel="Group", xlim=(-0.5, 5.5)
            )
            for ax, kind, values, limits in [
                (
                    axes[1, 0],
                    "sequential",
                    [[0, 0.25, None], [0.5, 0.75, 1]],
                    dict(vmin=0, vmax=1),
                ),
                (
                    axes[1, 1],
                    "diverging",
                    [[-2, -1, 0], [0.25, None, 1]],
                    dict(vmin=-2, vmax=1, center=0),
                ),
            ]:
                image = heatmap(ax, values, config, kind=kind, **limits)
                ax.set(title=kind.capitalize(), xlabel="Column", ylabel="Row")
                bar = fig.colorbar(image, ax=ax, fraction=0.08, pad=0.04)
                bar.set_label("Intensity")
            for ax in fig.axes:
                style_axes(ax, config)
            heading = fig.suptitle(
                case["theme"].replace("-", " ").title(),
                fontsize=config.points(case["typography"]["heading"]),
            )
            heading._plotfoundry_role = "heading"
            body = fig.text(
                0.13,
                0.065,
                "Placed annotation",
                fontsize=config.points(case["typography"]["body_annotation"]),
            )
            body._plotfoundry_role = "body_annotation"
            fig.text(
                0.13,
                0.025,
                case["mode"]
                + " / "
                + case["profile"]
                + " / "
                + case["surface"]
                + "; fixed canvas",
                fontsize=config.points(case["typography"]["metadata"]),
            )
            stem = output / case["id"].replace("/", "-")
            report = export(fig, config, stem, dpi=config.placed_width_css_px / 8)
            # Vector export can leave label positions calculated at72DPI.
            # Redraw at the current canvas DPI before measuring actualpaintedtext.
            fig.canvas.draw()
            renderer = fig.canvas.get_renderer()
            title_box = heading.get_window_extent(renderer)
            title_clear = all(
                not title_box.overlaps(ax.title.get_window_extent(renderer))
                for ax in axes.flat
            )
            if not title_clear:
                raise ValueError("Figure/subplot title overlap")
            footer_texts = [body, fig.texts[-1]]
            footer_clear = all(
                not a.get_window_extent(renderer).overlaps(
                    b.get_window_extent(renderer)
                )
                for a in footer_texts
                for b in [axes[1, 0].xaxis.label, axes[1, 1].xaxis.label]
            ) and not footer_texts[0].get_window_extent(renderer).overlaps(
                footer_texts[1].get_window_extent(renderer)
            )
            legend_box = axes[0, 0].get_legend().get_window_extent(renderer)
            legend_clear = all(
                not legend_box.overlaps(artist.get_window_extent(renderer))
                for artist in axes[0, 0].lines
            )
            canvas = fig.bbox
            tick_texts = set()
            painted_tick_texts = set()
            for ax in fig.axes:
                for axis in (ax.xaxis, ax.yaxis):
                    tick_texts.update(
                        text
                        for tick in [*axis.get_major_ticks(), *axis.get_minor_ticks()]
                        for text in (tick.label1, tick.label2)
                    )
                    painted_tick_texts.update(
                        text
                        for tick in axis._update_ticks()
                        for text in (tick.label1, tick.label2)
                    )
            text_fits = all(
                canvas.x0 <= box.x0
                and canvas.y0 <= box.y0
                and canvas.x1 >= box.x1
                and canvas.y1 >= box.y1
                for text in fig.findobj(matplotlib.text.Text)
                if text.get_visible()
                and text.get_text()
                and (text not in tick_texts or text in painted_tick_texts)
                for box in [text.get_window_extent(renderer)]
            )
            if not (footer_clear and legend_clear and text_fits):
                raise ValueError(
                    f"Text/legend/footer clipping or overlap: {case['id']} footer={footer_clear} legend={legend_clear} fits={text_fits}"
                )

            report["observed"] = {
                "titleLaneClear": title_clear,
                "footerClear": footer_clear,
                "legendClear": legend_clear,
                "textFits": text_fits,
                "axes": len(fig.axes),
                "lines": len(axes[0, 0].lines),
                "scatterGroups": len(axes[0, 1].collections),
                "missingCells": [len(axes[1, 0].patches), len(axes[1, 1].patches)],
                "fonts": sorted(
                    {
                        Path(text.get_fontproperties().get_file()).name
                        for text in fig.findobj(matplotlib.text.Text)
                    }
                ),
                "roles": case["roles"],
                "type": case["typography"],
            }
            results.append(report)
            plt.close(fig)
    output.mkdir(parents=True, exist_ok=True)
    (output / "manifest.json").write_text(json.dumps(results, indent=2) + "\n")
    cells = []
    for family in ["folio", "tufte", "darkly-reading"]:
        for mode, profile in [("light", "reading"), ("dark", "presentation")]:
            path = output / f"{family}-{mode}-{profile}-paper.png"
            if path.exists():
                cells.append(path)
    if cells:
        sheet = Image.new("RGB", (480 * 3, 500 * 2), "#eeeeee")
        draw = ImageDraw.Draw(sheet)
        for index, path in enumerate(cells):
            with Image.open(path) as image:
                thumb = ImageOps.contain(image.convert("RGB"), (480, 480))
                sheet.paste(thumb, ((index // 2) * 480, (index % 2) * 500 + 20))
                draw.text(
                    ((index // 2) * 480 + 8, (index % 2) * 500 + 3),
                    path.stem,
                    fill="#222222",
                )
        sheet.save(output / "overview.png")
    links = "".join(
        "<p>"
        + r["case"]
        + '</p><a href="'
        + r["case"].replace("/", "-")
        + '.svg"><img width="640" src="'
        + r["case"].replace("/", "-")
        + '.png"></a>'
        for r in results
    )
    (output / "index.html").write_text(
        "<!doctype html><title>Plotfoundry Python reference</title><h1>72-case reference</h1>"
        + links
    )

    return results


def main() -> None:  # Standalone example entry point.
    """Render one selected case or the complete72case reference gallery."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("plotfoundry-gallery"))
    parser.add_argument("--case", action="append")
    args = parser.parse_args()
    reports = render(args.output, args.case)
    print(f"Rendered {len(reports)} cases to {args.output}")


if __name__ == "__main__":
    main()
