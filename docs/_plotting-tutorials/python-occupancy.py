"""Illustrative building observations; native Seaborn with an explicit color scale."""
import matplotlib.pyplot as plt
from matplotlib.cm import ScalarMappable
import pandas as pd
import seaborn as sns
from plotfoundry import theme
from plotfoundry.matplotlib import context, colorscale, style_axes, export

observations = pd.DataFrame({
    "temperature_c": [8, 10, 12, 14, 16, 18, 20, 22, 24, 26],
    "electricity_kwh": [68, 62, 58, 53, 51, 48, 46, 45, 43, 42],
    "occupied_percent": [25, 35, None, 50, 60, 65, 70, 80, 90, 95],
})
# Use the same complete rows for the visible points and the descriptive fit.
observations = observations.dropna(subset=["temperature_c", "electricity_kwh",
                                            "occupied_percent"])
config = theme("nocturne", mode="dark", profile="reading")
ink = config.case["roles"]["ink"]
cmap, norm = colorscale(config, vmin=0, vmax=100)
with context(config):
    fig, ax = plt.subplots(figsize=(8, 5))
    fig.subplots_adjust(left=.14, right=.84, bottom=.18, top=.82)
    sns.scatterplot(data=observations, x="temperature_c", y="electricity_kwh",
                    hue="occupied_percent", palette=cmap, hue_norm=norm,
                    legend=False, alpha=1, edgecolor=ink, linewidth=1, s=55, ax=ax)
    sns.regplot(data=observations, x="temperature_c", y="electricity_kwh",
                scatter=False, ci=None, color=ink,
                line_kws={"linewidth": config.points(1)}, ax=ax)
    bar = fig.colorbar(ScalarMappable(norm=norm, cmap=cmap), ax=ax, pad=.04)
    bar.set_label("Occupied (%)")
    ax.set(title="Electricity and outdoor temperature", xlabel="Temperature (C)",
           ylabel="Electricity (kWh)")
    style_axes(ax, config)
    style_axes(bar.ax, config)
    export(fig, config, "python-occupancy", dpi=80)
    plt.close(fig)
