"""Guard independent seed compatibility with reviewed evidence and schema."""

import json
import pytest
from build_contract import contracts, validate
from measure import HERE, CATALOG, PRIORITY


@pytest.mark.parametrize("theme", PRIORITY)
def test_preserved_and_paired(theme: str) -> None:
    """All anchors/candidates remain exact and both consumer profiles stay explicit."""
    d = validate(contracts()[theme])
    seed = json.loads((HERE / "foundation-seeds" / f"{theme}.json").read_text())
    assert seed == d
    old = json.loads((HERE / "results/foundations.json").read_text())
    cat = json.loads(CATALOG.read_text())["themes"]
    assert d["nativeMode"] == cat[theme]["native"]
    for mode, m in d["modes"].items():
        source = next(
            x for x in old["modes"] if x["theme"] == theme and x["mode"] == mode
        )
        assert all(m["swatches"][k] == v for k, v in source["swatches"].items())
        assert all(m["roles"][k] == v for k, v in source["roles"].items())
    assert d["typography"]["profiles"]["presentation"]["body"] == 30
    assert d["typography"]["profiles"]["reading"]["body"] in [18, 20]
    assert d["typography"]["profiles"]["reading"]["title"] == 36
    assert d["typography"]["profiles"]["reading"]["display"] == 48
    assert d["typography"]["profiles"]["presentation"]["title"] == 48
    assert (
        d["spacing"]["profiles"]["presentation"]["group"]
        > d["spacing"]["profiles"]["presentation"]["withinGroup"]
    )
    assert d["shape"]["restingShadow"] == "none"


def test_bad_reference_rejected() -> None:
    """A role cannot silently point at a missing swatch."""
    d = contracts()["folio"]
    d["modes"]["light"]["roles"]["ink"] = "missing"
    with pytest.raises(AssertionError):
        validate(d)


def test_invalid_schema_rejected() -> None:
    """Seed validation includes the repeatable Draft 2020-12 schema check."""
    from jsonschema import ValidationError

    d = contracts()["folio"]
    d["nativeMode"] = "unknown"
    with pytest.raises(ValidationError):
        validate(d)
