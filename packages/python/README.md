# Plotfoundry for Python

Compare electricity use across buildings with Matplotlib, then adapt native
pandas and Seaborn plots. The [Python tutorial](https://rahuldave.com/htmpres/plotting-python.html)
pairs complete scripts with visible results, source downloads and all three
export formats. All tutorial measurements are illustrative.

## Install and draw your first chart

Version `0.1.0.dev1` is an unreleased reference. There is no PyPI release.
Use Python 3.12 or later and install a locally built wheel with its optional
Matplotlib dependencies:

```sh
python -m pip install 'path/to/plotfoundry-0.1.0.dev1-py3-none-any.whl[matplotlib]'
```

The website tutorial gives a pinned source-install recipe if you have no wheel.
Installed plots need no htmpres, document engine, R, Node or network access.
The following script compares six weeks of electricity use and preserves a
missing observation as a gap:

```python
"""Illustrative weekly electricity readings; no external data download."""
import matplotlib.pyplot as plt
from plotfoundry import theme
from plotfoundry.matplotlib import context, line, style_axes, export

weeks = [1, 2, 3, 4, 5, 6]
readings = {
    "Library": [420, 400, 390, 350, 330, 320],
    "Office": [510, 500, None, 470, 460, 450],
    "Workshop": [610, 630, 620, 600, 590, 580],
}
config = theme("folio", mode="light", profile="reading")
with context(config):
    fig, ax = plt.subplots(figsize=(8, 4.8))
    fig.subplots_adjust(left=.14, right=.80, bottom=.19, top=.82)
    for building, kwh in readings.items():
        line(ax, weeks, kwh, config, domain=list(readings), category=building)
    ax.set(title="Weekly electricity use", xlabel="Week", ylabel="Electricity (kWh)",
           xlim=(.8, 7), ylim=(250, 700), xticks=weeks)
    style_axes(ax, config)
    export(fig, config, "python-electricity", dpi=80)
    plt.close(fig)
```

Run the script from your working directory. It writes `python-electricity.png`,
SVG, PDF and an export report there. The Library uses less electricity each week;
the Office has no reading in week three. Replace the values and units, while
keeping an explicit domain so category identities remain stable after filtering.

## Choose a native workflow

The tutorial also shows a reservoir drawn by `DataFrame.plot`, a Seaborn scatter
with an explicit sequential color scale, and a diverging temperature heatmap.
Ordinary pandas or Seaborn calls receive fonts, backgrounds and axes from the
theme. They do not automatically gain category shapes, dashes or direct labels.

`colorscale` returns an exact `ListedColormap` and explicit normalization.
Use finite limits for sequential values and a meaningful center for diverging
values. The line helper preserves null or NaN gaps. The heatmap helper draws
crossed missing cells, while missing scatter points are omitted.

The three-category variant is the default. Five is an explicit conditional
choice with a different mapping. Keep the required cues and inspect the result.
A plain color cycle does not apply the complete line treatment.

## Placement, fonts and export

The reading profile declares 640 CSS-pixel placement with 16-pixel labels.
Presentation declares 1152 with 24-pixel labels. Keep the declared figure width
consistent with the actual Matplotlib Figure. DPI changes raster resolution,
not placed typography. The tutorial includes full-size profile comparisons.

`style_axes` applies chart roles after native artists exist. `annotate` selects
label, metadata or body text deliberately. Export binds supported text to exact
bundled files and real weights while preserving authored sizes and colors.
No global font registration is needed.

Use plain text. TeX, mathtext, absent glyphs and default logarithmic math
formatters fail rather than silently substitute another face. Complex shaping
and arbitrary native artists are outside the verified path.

PNG rasterizes glyphs, SVG outlines them, and PDF requests TrueType subsets.
Reports check file structure and font coverage, not universal PDF conformance.
Export keeps the full canvas without tight cropping. Check clipping and overlap
in the actual output. Preserve all bundled font notices when distributing files.

## Offline use and maintainer reference

The dependency-free core exposes `load_spec`, `theme` and `package_info` without
loading NumPy, Matplotlib or the DOM. The plotting adapter is an explicit import.
Resources include the scientific spec, exact fonts, source manifests and notices.
The installed code and pins detect drift; hashes are not authenticity signatures.

For an offline target, provision the wheel and all selected dependency wheels on
a compatible machine. pandas and Seaborn are optional dependencies of their tasks.
The package development lock is not required at installed use.

Tested versions are Python 3.12.10, Matplotlib 3.11.2, NumPy 2.5.4,
pandas 3.1.1 and Seaborn 0.13.2. Other platforms and versions need their own checks.

Maintainers use `just python-test`, `just python-gallery-check` and
`just python-install-test` from the repository. The snapshot check rejects stale
approved inputs. Explicit promotion is separate from ordinary builds.
The shipped gallery is an appearance and regression reference, not the tutorial.

The code is MIT licensed. Imported fonts and foundations keep their own notices.
See `LICENSE` and the installed `_resources` notice directories.
