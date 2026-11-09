"""A correct HEAD must not lend its identity to uncommitted captured bytes."""
from pathlib import Path
import pytest
import freeze_scientific_inputs as capture


def test_reject_dirty_input_despite_matching_head(tmp_path, monkeypatch):
    path=tmp_path/'font.ttf';path.write_bytes(b'dirty font bytes')
    monkeypatch.setattr(capture.subprocess,'check_output',lambda *args,**kwargs:b'committed font bytes')
    with pytest.raises(ValueError,match='Dirty frozen input: font.ttf'):
        capture.verify_committed_inputs(tmp_path,capture.EXPECTED,['font.ttf'])
    assert not (tmp_path/'runs').exists()
    path.write_bytes(b'committed font bytes')
    capture.verify_committed_inputs(tmp_path,capture.EXPECTED,['font.ttf'])


def test_freeze_does_not_copy_untracked_font_or_symlink(tmp_path, monkeypatch):
    import json
    root=tmp_path/'slides';source=root/'_extensions/htmpres/themes';source.mkdir(parents=True)
    here=tmp_path/'research';here.mkdir()
    committed={}
    def add(name, content):
        path=source/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content)
        committed[str(path.relative_to(root))]=content
    catalog={'themes':{},'sources':{}}
    for name in capture.THEMES:
        catalog['themes'][name]={'theme':name};catalog['sources'][name]={'commit':'upstream'}
        add(f'foundations/{name}.json',json.dumps({'theme':name}).encode())
    add('catalog.json',json.dumps(catalog).encode())
    for name in ['foundations.mjs','component-defaults.mjs','themes.mjs','foundations-contract.schema.json']:
        add(name,b'committed source')
    add('fonts/owned.ttf',b'committed font');add('licenses/owned-LICENSE',b'notice')
    secret=tmp_path/'private.bin';secret.write_bytes(b'never copy me')
    (source/'fonts/untracked.ttf').write_bytes(b'untracked font')
    (source/'fonts/untracked-link.ttf').symlink_to(secret)
    for name in ['uv.lock','03-scientific-palettes.md','03-scientific-palettes.html']:
        (here/name).write_text('research-origin '+name)
    for name in ['results','styles','figures']: (here/name).mkdir()
    def git(args, **kwargs):
        if args[1]=='rev-parse': return capture.EXPECTED+'\n'
        if args[1]=='ls-tree': return '\n'.join(committed)+'\n'
        if args[1]=='show': return committed[args[2].split(':',1)[1]]
        raise AssertionError(args)
    monkeypatch.setattr(capture,'HERE',here)
    monkeypatch.setattr(capture.subprocess,'check_output',git)
    capture.freeze(root)
    result=here/'runs'/capture.RUN/'inputs'
    assert {p.name for p in (result/'fonts').iterdir()}=={'owned.ttf'}
    assert (result/'fonts/owned.ttf').read_bytes()==b'committed font'
    ledger=json.loads((result/'provenance.json').read_text())
    assert 'uv.lock' not in ledger['origins']['slide']['files']
    assert ledger['origins']['research_lock']['source']=='research/theme-audit/uv.lock'
