#!/usr/bin/env python3
"""Exercise the real Quarto preview server, without a browser dependency."""
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time
from urllib.error import URLError, HTTPError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = '''---
deck:
  theme: nocturne
  css: source.css
---
## First

Start here.

## Second {#second}

Preview original. $x^2$

::: notes
A presenter cue.
:::
'''

def check():
    with tempfile.TemporaryDirectory(prefix='htmpres-preview-') as scratch:
        deck = Path(scratch)
        (deck / 'slides.qmd').write_text(SOURCE)
        (deck / 'source.css').write_text('.preview-probe { font-weight: 600; }\n')
        (deck / 'assets').mkdir()
        (deck / 'assets/probe.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
        for watching in (True, False):
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
            base = f'http://127.0.0.1:{port}'
            command = ['quarto', 'run', 'scripts/htmpres.ts', 'serve', str(deck / 'slides.qmd'), '--port', str(port)]
            if watching: command.append('--watch')
            with (deck / 'server.log').open('w') as log:
                proc = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=log, start_new_session=True)
                try:
                    def get(path='/'):
                        with urlopen(base + path, timeout=2) as response:
                            return response.read().decode(), response.headers
                    def until(probe, message, timeout=60):
                        deadline = time.monotonic() + timeout
                        while time.monotonic() < deadline:
                            if proc.poll() is not None: raise AssertionError((deck / 'server.log').read_text())
                            try:
                                result = probe()
                                if result: return result
                            except (URLError, TimeoutError, ConnectionError): pass
                            time.sleep(.15)
                        raise AssertionError(message + '\n' + (deck / 'server.log').read_text())
                    until(lambda: get()[0], 'server readiness')
                    html, headers = get()
                    assert ('id="htmpres-preview"' in html) == watching
                    assert 'htmpres-preview' not in (deck / 'index.html').read_text()
                    if not watching:
                        try: get('/_htmpres/preview.json'); raise AssertionError('watch endpoint exposed without --watch')
                        except HTTPError as error: assert error.code == 404
                        continue
                    assert headers['Cache-Control'] == 'no-store'
                    assert 'id="htmpres-preview"' in get('/presenter.html')[0]
                    def revision():
                        body, status_headers = get('/_htmpres/preview.json')
                        assert status_headers['Cache-Control'] == 'no-store'
                        return json.loads(body)['revision']
                    previous = revision()
                    (deck / 'slides.qmd').write_text(SOURCE.replace('Preview original.', 'Preview updated.'))
                    until(lambda: revision() != previous and 'Preview updated.' in get()[0], 'source edit did not publish')
                    previous = revision()
                    (deck / 'source.css').write_text('.preview-probe { font-weight: 650; }\n')
                    until(lambda: revision() != previous and 'font-weight: 650' in get()[0], 'CSS edit did not publish')
                    previous = revision()
                    (deck / 'assets/probe.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><title>Updated</title></svg>')
                    until(lambda: revision() != previous, 'asset edit did not publish')
                    previous = revision()
                    valid = (deck / 'slides.qmd').read_text()
                    (deck / 'slides.qmd').write_text(valid + '\n---\n')
                    until(lambda: 'slide-break' in (deck / 'server.log').read_text(), 'invalid source was not checked')
                    assert revision() == previous and 'Preview updated.' in get()[0], 'invalid source replaced last good view'
                    (deck / 'slides.qmd').write_text(valid.replace('Preview updated.', 'Preview recovered.'))
                    until(lambda: revision() != previous and 'Preview recovered.' in get()[0], 'valid save did not recover')
                    previous = revision(); time.sleep(1)
                    assert revision() == previous, 'generated bundles caused a render loop'
                    assert 'htmpres-preview' not in (deck / 'presenter.html').read_text()
                finally:
                    os.killpg(proc.pid, signal.SIGTERM)
                    proc.wait(timeout=10)
    print('Preview server passed: source/CSS/assets, last-good recovery, clean exports, no generated loop and no-watch isolation.')

if __name__ == '__main__': check()
