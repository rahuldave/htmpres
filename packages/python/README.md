# Plotfoundry for Python — unreleased scaffold

This is an independent, identity-only package. It does not provide themes,
palettes, fonts or plotting adapters yet. No htmpres, Quarto, R, JavaScript or
repository checkout is needed after installation. There are no runtime package
dependencies. Python 3.11+ is supported by this scaffold.

Build locally using `uv build --project packages/python --out-dir .build/packages/python`
from the monorepo, or `uv build` inside this package. Install the resulting wheel
with your Python package installer; no PyPI publication is claimed. After install:

```python
from plotfoundry import package_info
print(package_info())
```

`package_info()` returns a fresh dictionary with this distribution's name,
installed version and `status="scaffold"`. The Python version is independently
maintained in `pyproject.toml`; it is not inferred from a root package or sibling.
`examples/hello.py` is standalone. Build-only Hatchling is pinned; it is not needed
by installed users. This new scaffold is MIT licensed; see `LICENSE`.
