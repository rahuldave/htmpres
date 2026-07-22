#!/usr/bin/env bash
set -euo pipefail

theme_dir="${1:-/private/tmp/htmpres-theme-preview}"
site_dir="${2:-/private/tmp/htmpres-sites-preview}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_safe_tmp_path() {
  local path="$1"
  case "$path" in
    /tmp/*|/private/tmp/*) ;;
    *)
      echo "Refusing to manage non-temporary path: $path" >&2
      exit 1
      ;;
  esac

  case "$path" in
    /tmp|/tmp/|/private/tmp|/private/tmp/)
      echo "Refusing to manage top-level temporary directory: $path" >&2
      exit 1
      ;;
  esac
}

require_safe_tmp_path "$theme_dir"
require_safe_tmp_path "$site_dir"

if [ ! -f "$site_dir/package.json" ]; then
  echo "Missing Sites preview project at $site_dir" >&2
  echo "Create it once through the Sites workflow, then rerun this target." >&2
  exit 1
fi

cd "$repo_root"
quarto run scripts/htmpres.ts render decks/tutorial/index.qmd

copy_theme() {
  local theme="$1"
  local data_theme="$2"
  local dest="$theme_dir/$theme"

  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R decks/tutorial/. "$dest/"

  if [ -n "$data_theme" ]; then
    LC_ALL=C HTMPRES_THEME="$data_theme" perl -0pi -e '
      my $theme = $ENV{HTMPRES_THEME};
      if (s/(<html\b[^>]*\bdata-theme=")[^"]*(")/$1$theme$2/) {}
      else { s/<html\b/<html data-theme="$theme"/; }
    ' \
      "$dest/index.html" \
      "$dest/presenter.html"
  fi
}

rm -rf "$theme_dir"
mkdir -p "$theme_dir"
copy_theme "mono-grid" ""
copy_theme "sage" "sage"

mkdir -p "$site_dir/public/previews"
for theme in mono-grid sage; do
  rm -rf "$site_dir/public/previews/$theme"
  mkdir -p "$site_dir/public/previews/$theme"
  cp "$theme_dir/$theme/index.html" "$site_dir/public/previews/$theme/"
  cp "$theme_dir/$theme/presenter.html" "$site_dir/public/previews/$theme/"
  if [ -d "$theme_dir/$theme/assets" ]; then
    cp -R "$theme_dir/$theme/assets" "$site_dir/public/previews/$theme/"
  fi
done

(
  cd "$site_dir"
  env npm_config_cache="${NPM_CONFIG_CACHE:-/private/tmp/htmpres-npm-cache}" npm run build
)
