"""Validate the delivered evidence package, not only the prose generator."""
import json
import pandas as pd
from build_reports import HERE, REPORTS, check_links


def test_report_links_and_images_resolve() -> None:
    for report in REPORTS:
        check_links(HERE / f"{report}.html")


def test_measurement_matrix_is_complete() -> None:
    metadata = json.loads((HERE / "results/experiment-manifest.json").read_text())
    for name, count in [("map-metrics", 196), ("map-backgrounds", 936), ("category-metrics", 2304)]:
        frame = pd.read_csv(HERE / f"results/{name}.csv")
        assert len(frame) == count
        assert not frame.isna().any().any()
    categories = pd.read_csv(HERE / "results/category-metrics.csv")
    assert set(categories.theme) == set(metadata["themes"])
    assert set(categories.surface) == {"paper", "panel"}
    assert set(categories.vision) == set(metadata["visions"])
    assert categories.groupby(["theme", "mode", "surface"]).size().eq(64).all()
