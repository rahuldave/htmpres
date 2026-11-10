"""Illustrative reservoir measurements plotted with the native pandas API."""
import matplotlib.pyplot as plt
import pandas as pd
from plotfoundry import theme
from plotfoundry.matplotlib import context, annotate, style_axes, export

levels = pd.DataFrame({"month": [1, 2, 3, 4, 5, 6],
                       "level_m": [7.4, 7.1, 6.8, 6.0, 5.6, 5.2]})
config = theme("atelier", mode="light", profile="reading")
ink = config.case["roles"]["ink"]
with context(config):
    fig, ax = plt.subplots(figsize=(8, 4.8))
    fig.subplots_adjust(left=.14, right=.94, bottom=.19, top=.82)
    levels.plot(x="month", y="level_m", ax=ax, legend=False, color=ink,
                marker="o", linewidth=config.points(2.5))
    ax.axhline(5.5, color=ink, linestyle="--", linewidth=config.points(1))
    annotate(ax, "Planning level: 5.5 m", (1.1, 5.62), config, role="label")
    ax.set(title="Reservoir level falls below 5.5 m",
           xlabel="Month", ylabel="Water level (m)", xticks=levels.month,
           xlim=(.8, 6.2), ylim=(4.8, 8))
    style_axes(ax, config)
    export(fig, config, "python-reservoir", dpi=80)
    plt.close(fig)
