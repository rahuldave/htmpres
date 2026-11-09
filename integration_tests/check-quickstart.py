#!/usr/bin/env python3
"""Render the actual copyable beginner tutorial, including a theme change."""
from pathlib import Path
import json
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'docs/quickstart.qmd').read_text()
blocks = [body for _, body in re.findall(r'(?m)^(`{3,})markdown\n([\s\S]*?)^\1\s*$', source)]
complete = next(body for body in blocks if body.startswith('---\n'))
columns = next(body for body in blocks if body.startswith('## Compare two options'))

def cli(*args):
    result = subprocess.run(['quarto', 'run', 'scripts/htmpres.ts', *map(str, args)], cwd=ROOT, text=True, capture_output=True)
    if result.returncode: raise AssertionError(result.stdout + result.stderr)
    return result.stdout

with tempfile.TemporaryDirectory(prefix='htmpres-beginner-') as scratch:
    deck = Path(scratch) / 'my-talk'
    cli('deck', 'new', deck, '--title', 'My first talk', '--theme', 'nocturne')
    file = deck / 'index.qmd'
    for theme, mode in [('nocturne', 'auto'), ('simplex-reading', 'dark')]:
        authored = complete.replace('theme: nocturne', f'theme: {theme}').replace('color-mode: auto', f'color-mode: {mode}') + '\n' + columns
        file.write_text(authored)
        assert json.loads(cli('lint', file, '--json'))['ok']
        cli('render', file)
        cli('verify', file)
        audience = (deck / 'index.html').read_text()
        presenter = (deck / 'presenter.html').read_text()
        assert audience.count('<section class="slide') == 4
        assert f'data-theme="{theme}"' in audience
        assert f'data-color-mode-choice="{mode}"' in audience
        assert 'Explain why this idea matters' not in audience
        assert 'Explain why this idea matters' in presenter
        assert 'class="two-col"' in audience
        assert (deck / 'assets/htmpres-math/katex.min.js').is_file()
print('Beginner walkthrough passed: scaffold, copied talk/columns, lint/render/verify, notes isolation and bundled theme change.')
