"""One-time input capture. Current experiments subsequently need only these files."""
from pathlib import Path
import argparse, hashlib, json, re, shutil, subprocess

HERE = Path(__file__).resolve().parent
RUN = 'foundations-2026-11-09'
THEMES = ['folio','atelier','nocturne','tufte','zephyr-reading','simplex-reading','pulse-reading','litera-reading','darkly-reading']
EXPECTED = '04cef45c3374a018d3b32b9c53a2e4e43e7c88ec'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def verify_committed_inputs(root, revision, relative_paths):
    """Reject dirty captured inputs before creating a capture directory."""
    for name in relative_paths:
        committed = subprocess.check_output(['git','show',f'{revision}:{name}'],cwd=root)
        if (root/name).read_bytes() != committed:
            raise ValueError('Dirty frozen input: '+name)

def freeze(root):
    revision = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    if revision != EXPECTED:
        raise ValueError('Slide checkout differs from the verified gate commit')
    tracked = subprocess.check_output(['git','ls-tree','-r','--name-only',revision,'--','_extensions/htmpres/themes'],cwd=root,text=True).splitlines()
    captured = [p for p in tracked if '/fonts/' in p or '/licenses/' in p or any(p.endswith('/'+n) for n in ['catalog.json','foundations.mjs','component-defaults.mjs','themes.mjs','foundations-contract.schema.json']) or any(p.endswith('/foundations/'+n+'.json') for n in THEMES)]
    verify_committed_inputs(root, revision, captured)
    target = HERE / 'runs' / RUN / 'inputs'
    if target.exists():
        raise FileExistsError('Frozen input capture already exists; do not silently replace it')
    target.mkdir(parents=True)
    source = root / '_extensions/htmpres/themes'
    catalog = json.loads((source/'catalog.json').read_text())
    (target/'foundations').mkdir()
    for name in THEMES:
        shutil.copy2(source/'foundations'/f'{name}.json', target/'foundations'/f'{name}.json')
    for name in ['foundations.mjs','component-defaults.mjs','themes.mjs','foundations-contract.schema.json']:
        shutil.copy2(source/name,target/name)
    (target/'catalog-owned.json').write_text(json.dumps({'themes':{n:catalog['themes'][n] for n in THEMES},'sources':{n:catalog['sources'][n] for n in THEMES}},indent=2)+'\n')
    # Copy only the validated committed asset set. Never follow symlinks or
    # include untracked files through a working-tree copytree.
    for name in captured:
        if '/fonts/' in name or '/licenses/' in name:
            destination = target / Path(name).relative_to('_extensions/htmpres/themes')
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_bytes(subprocess.check_output(['git','show',f'{revision}:{name}'],cwd=root))
    shutil.copy2(HERE/'uv.lock',target/'uv.lock')
    historical = HERE/'historical'
    historical.mkdir(exist_ok=True)
    old = (HERE/'03-scientific-palettes.md').read_text()
    (historical/'03-scientific-palettes-pre-foundations.md').write_text(re.sub(r'\]\((?!https?://|#)([^)]+)\)',r'](../\1)',old))
    html = (HERE/'03-scientific-palettes.html').read_text()
    html = re.sub(r'(href|src)="(?!https?://|#)([^\"]+)"',r'\1="../\2"',html)
    (historical/'03-scientific-palettes-pre-foundations.html').write_text(html)
    baseline = {str(p.relative_to(HERE)):sha(p) for folder in ['results','styles','figures'] for p in sorted((HERE/folder).rglob('*')) if p.is_file()}
    (historical/'baseline-hashes.json').write_text(json.dumps(baseline,indent=2)+'\n')
    files={str(p.relative_to(target)):sha(p) for p in sorted(target.rglob('*')) if p.is_file()}
    metadata={'run':RUN,'slide_commit':revision,'upstream':{n:catalog['sources'][n] for n in THEMES},'files':files,'seed':20261109,'historical_doc':'historical/03-scientific-palettes-pre-foundations.md','origins':{'slide':{'commit':revision,'files':[name for name in files if name!='uv.lock']},'research_lock':{'source':'research/theme-audit/uv.lock','sha256':files['uv.lock'],'attribution':'Research environment lock; not taken from the slide commit'}}}
    (target/'provenance.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(f'Frozen {len(files)} inputs for {len(THEMES)} themes at {revision}')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--slide-root',type=Path,required=True)
    freeze(parser.parse_args().slide_root.resolve())
