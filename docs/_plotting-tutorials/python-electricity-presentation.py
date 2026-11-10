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
config = theme("folio", mode="light", profile="presentation")
with context(config):
    fig, ax = plt.subplots(figsize=(8, 4.8))
    fig.subplots_adjust(left=.14, right=.80, bottom=.19, top=.82)
    for building, kwh in readings.items():
        line(ax, weeks, kwh, config, domain=list(readings), category=building)
    ax.set(title="Weekly electricity use", xlabel="Week", ylabel="Electricity (kWh)",
           xlim=(.8, 7), ylim=(250, 700), xticks=weeks)
    style_axes(ax, config)
    export(fig, config, "python-electricity-presentation", dpi=144)
    plt.close(fig)
