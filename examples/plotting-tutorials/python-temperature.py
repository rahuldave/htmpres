"""Illustrative room deviations from a 20 C target; missing is not zero."""
import matplotlib.pyplot as plt
from plotfoundry import theme
from plotfoundry.matplotlib import context, heatmap, style_axes, export

# Rows are rooms; columns are successive inspection days.
deviations_c = [[-2, -1, 0, 1], [0, None, 2, 3], [-1, 0, 3, 5]]
config = theme("litera-reading", mode="light", profile="reading")
with context(config):
    fig, ax = plt.subplots(figsize=(8, 4.8))
    fig.subplots_adjust(left=.16, right=.84, bottom=.19, top=.82)
    image = heatmap(ax, deviations_c, config, vmin=-2, vmax=5,
                    kind="diverging", center=0)
    ax.set(title="Temperature relative to 20 C", xlabel="Inspection day",
           yticks=[0, 1, 2], yticklabels=["Reading", "Meeting", "Studio"],
           xticks=[0, 1, 2, 3], xticklabels=["1", "2", "3", "4"])
    bar = fig.colorbar(image, ax=ax, pad=.04, ticks=[-2, -1, 0, 2.5, 5])
    bar.set_label("Deviation (C)")
    style_axes(ax, config)
    style_axes(bar.ax, config)
    export(fig, config, "python-temperature", dpi=80)
    plt.close(fig)
