"""Plain pandas/Seaborn furniture versus compliant supported category helpers."""

from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from plotfoundry import theme
from plotfoundry.matplotlib import context, line, style_axes, export


def main() -> None:  # Standalone installed-package example.
    """Use ordinary frames and Seaborn axes without a document engine."""
    frame = pd.DataFrame({"time": [0, 1, 2], "A": [1, 2, 3], "B": [3, 2, 1]})
    config = theme("folio", mode="light")
    with context(config):
        fig, axes = plt.subplots(3, 1, figsize=(8, 9))
        fig.subplots_adjust(hspace=0.8)
        # Ordinary Seaborn output receives furniture/fonts only. Its bare category
        # cycle is not advertised as the approved operational categorical style.
        sns.lineplot(data=frame.set_index("time"), ax=axes[0], legend=True)
        axes[0].set_title("Seaborn theme only")
        frame.set_index("time").plot(ax=axes[1])
        axes[1].set_title("Pandas theme only")
        # The approved supported helper uses explicit IDs, edges, strokes/cues.
        for key in ["A", "B"]:
            line(
                axes[2],
                frame["time"],
                frame[key],
                config,
                domain=["A", "B"],
                category=key,
            )
        axes[2].set(title="Treated lines", xlim=(-0.1, 3))
        for ax in axes:
            style_axes(ax, config)
        export(fig, config, Path("dataframe-example"))
        plt.close(fig)


if __name__ == "__main__":
    main()
