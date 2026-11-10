"""Standalone identity scaffold. Plotting APIs are not implemented yet."""

from importlib.metadata import version

__all__ = ["package_info"]


def package_info() -> dict[str, str]:
    """Return a fresh identity record for this installed distribution."""
    return {
        "name": "plotfoundry",
        "version": version("plotfoundry"),
        "status": "scaffold",
    }
