"""Direct invariants for current methods; historical fixtures are never regenerated."""
import json
import numpy as np
import pytest
from matplotlib.colors import ListedColormap, TwoSlopeNorm
import current_experiments as c


def test_transfer_and_composite_models():
    values=np.linspace(0,1,101)
    np.testing.assert_allclose(c.srgb_encode(c.srgb_decode(values)),values,atol=1e-14)
    mark=np.array([[.2,.5,.8]]);bg=np.array([.9,.8,.7])
    for model in ['srgb','linear-light']:
        np.testing.assert_allclose(c.composite(mark,bg,0,model),bg[None,:])
        np.testing.assert_allclose(c.composite(mark,bg,1,model),mark)
    assert c.composite(np.ones(3),np.zeros(3),.5)[0]==.5
    assert c.composite(np.ones(3),np.zeros(3),.5,'linear-light')[0]==pytest.approx(.73535698)


def test_both_fields_order_and_clipping():
    mark=np.array([[1.,0,0]]);bg=np.array([.1,.3,.6])
    actual=c.shown_colors(mark,bg,'deuteranomaly',.4,.2)
    expected,clip=c.simulate(c.white_veil(c.composite(mark,bg,.4),.2),'deuteranomaly')
    background,bclip=c.simulate(c.white_veil(bg[None,:],.2),'deuteranomaly')
    np.testing.assert_allclose(actual[0],expected);np.testing.assert_allclose(actual[1],background[0])
    assert actual[2:]==(clip,bclip)
    plain=c.shown_colors(mark,bg,'normal')
    np.testing.assert_allclose(plain[0],mark,atol=1e-15);np.testing.assert_allclose(plain[1],bg,atol=1e-15)


def test_actual_agg_encoded_alpha(tmp_path,monkeypatch):
    monkeypatch.setattr(c,'RUN',tmp_path)
    rows=c.validate_agg()
    assert len(rows)==27
    assert max(r['srgb_error'] for r in rows)<=2/255
    assert max(r['linear_light_error'] for r in rows)>.1


def test_frozen_maps_exact_center_and_no_lookup_endpoint_plateau():
    data=json.loads((c.RUN/'results/palette-samples.json').read_text())
    for name in c.DIVERGING:
        rgb=np.array(data['maps'][name]['samples'])
        assert len(rgb)==257
        assert not np.array_equal(rgb[-1],rgb[-2])
        assert np.array_equal(rgb[:129][-1],rgb[128:][0])
        cmap=ListedColormap(rgb)
        for limits in [(-1,0,1),(-2,0,1)]:
            norm=TwoSlopeNorm(vmin=limits[0],vcenter=limits[1],vmax=limits[2])
            np.testing.assert_allclose(cmap(float(norm(0)))[:3],rgb[128])
            np.testing.assert_allclose(cmap(float(norm(limits[0])))[:3],rgb[0])
            np.testing.assert_allclose(cmap(float(norm(limits[2])))[:3],rgb[-1])
        assert TwoSlopeNorm(vmin=-2,vcenter=0,vmax=1)(-.5)!=1-TwoSlopeNorm(vmin=-2,vcenter=0,vmax=1)(.5)
    with pytest.raises(ValueError):TwoSlopeNorm(vmin=0,vcenter=0,vmax=1)


def test_current_default_requires_visible_furniture():
    registry=json.loads((c.RUN/'decision-registry.json').read_text())
    q=registry['encoding']['qualitative']
    assert not q['bare_cycle_supported']
    assert q['required_treatment']['understroke_role']=='ink'
    assert q['default']=='colorblind-subset-3'
    assert all(t['required_ink_edge_min_contrast']>=3 for t in registry['themes'].values())


def test_baseline_bytes_unchanged():
    hashes=json.loads((c.HERE/'historical/baseline-hashes.json').read_text())
    for path,digest in hashes.items():assert c.sha(c.HERE/path)==digest


def test_assignment_permutation_capacity_and_duplicates():
    ids=['A','B','C'];colors=['red','green','blue']
    assert c.assign_categories(ids,colors,['C','A','B'])==['blue','red','green']
    assert c.assign_categories(ids,colors,['B','C'])==['green','blue']
    with pytest.raises(ValueError):c.assign_categories(['A','A'],colors,['A'])
    with pytest.raises(ValueError):c.assign_categories(ids,['red'],['A'])
    with pytest.raises(ValueError):c.assign_categories(ids,['red','red','blue'],['A'])


def test_full_matrix_fonts_and_exports():
    rows=json.loads((c.RUN/'results/placement-and-exports.json').read_text())
    assert len(rows)==9*2*2*2
    assert len({(r['theme'],r['mode'],r['profile'],r['surface']) for r in rows})==72
    for r in rows:
        assert r['effective_label_px']==(16 if r['profile']=='reading' else 24)
        assert r['opaque_png_corner'] and r['svg_parses'] and r['pdf_header']
        assert not r['text_outside_canvas']
    fonts=json.loads((c.RUN/'results/font-resolution.json').read_text())
    for roles in fonts.values():
        for role in roles.values():
            assert role['notice_paths']
            assert all((c.RUN/n).is_file() for n in role['notice_paths'])
            assert c.sha(c.RUN/role['file'])==role['sha256']
    for name in ['pulse-reading','litera-reading']:
        assert fonts[name]['ui']['package_source'].startswith('Matplotlib ')


def test_placed_pixel_treatment_and_browser_geometry():
    pixels=json.loads((c.RUN/'results/understroke-pixels.json').read_text())
    assert len(pixels)==2
    for r in pixels:
        assert r['uniform_core_pixels']>0 and r['uniform_ink_edge_pixels']>0 and r['antialiased_pixels']>0
    evidence=json.loads((c.RUN/'placements/browser-evidence.json').read_text())
    for mode in ['nativeLight','nativeDark']:
        assert evidence[mode]['inside'] and evidence[mode]['effectiveLabelPx']==24
    assert evidence['reducedViewport']['inside'] and evidence['reducedViewport']['effectiveLabelPx']<24
    assert all(r['width']==640 and r['loaded'] for r in evidence['reading'])


def test_frozen_inputs_load_without_sibling_lookup(tmp_path,monkeypatch):
    import shutil
    snapshot=tmp_path/'inputs';shutil.copytree(c.INPUT,snapshot)
    monkeypatch.setattr(c,'INPUT',snapshot)
    foundations,provenance=c.load_inputs()
    assert set(foundations)==set(c.PRIORITY)
    assert provenance['slide_commit']=='04cef45c3374a018d3b32b9c53a2e4e43e7c88ec'
    (snapshot/'foundations/folio.json').write_text('{}')
    with pytest.raises(ValueError,match='Frozen input changed'):c.load_inputs()


def test_explicit_five_category_variant_is_operational():
    registry=json.loads((c.RUN/'decision-registry.json').read_text());q=registry['encoding']['qualitative']
    spec=q['variants'][q['extended']]
    assert spec['max_categories']==5 and spec['status']=='explicit-conditional'
    assert len(set(spec['markers']))==len(spec['dashes'])==len(set(spec['stable_slots']))==5
    palette=json.loads((c.RUN/'results/palette-samples.json').read_text())['qualitative'][q['extended']]['colors']
    assert len(c.assign_categories(spec['stable_slots'],palette,list(reversed(spec['stable_slots']))))==5
    geometry=json.loads((c.RUN/'placements/geometry.json').read_text())
    five=[r for r in geometry['records'] if r['category_count']==5]
    assert len(five)==4
    assert all(t['effective_css_px']==r['label_css_px'] for r in five for t in r['texts'])


def test_evidence_manifest_detects_method_report_and_artifact_drift():
    evidence=json.loads((c.RUN/'evidence-manifest.json').read_text())
    for name,digest in evidence['methods'].items():assert c.sha(c.HERE/name)==digest,name
    for name,digest in evidence['reports'].items():assert c.sha(c.HERE/name)==digest,name
    for name,digest in evidence['artifacts'].items():assert c.sha(c.RUN/name)==digest,name
