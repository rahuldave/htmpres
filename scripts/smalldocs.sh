#!/usr/bin/env bash
set -euo pipefail
# Override with an installed CLI if desired; otherwise use the pinned isolated tool.
if [[ -n "${SMALLDOCS_BIN:-}" ]]; then
  exec "$SMALLDOCS_BIN" "$@"
fi
exec uvx --from smalldocs==0.5.5 smalldocs "$@"
