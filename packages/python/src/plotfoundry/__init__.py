"""Standalone scientific data with an optional, explicitly imported plotting adapter."""

from importlib.metadata import version
from .core import Theme, load_spec, theme

__all__ = ["Theme", "load_spec", "theme", "package_info"]


def package_info() -> dict[str, str]:  # Fresh installed metadata record.
    """Return this independently versioned distribution's capabilities."""
    return {
        "name": "plotfoundry",
        "version": version("plotfoundry"),
        "status": "python-reference",
        "specVersion": "0.1.0",
    }
