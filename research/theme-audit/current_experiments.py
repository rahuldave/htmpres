"""Frozen-input current study. Never write the historical results/styles/figures."""
from pathlib import Path
from importlib.metadata import version
import hashlib, itertools, json, xml.etree.ElementTree as ET
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.text import Text
import matplotlib.patheffects as effects
from matplotlib.colors import ListedColormap, TwoSlopeNorm, to_hex, to_rgb
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.patches import Rectangle
import numpy as np
import pandas as pd
import seaborn as sns
from colorspacious import cspace_convert
from fontTools.ttLib import TTFont
from measure import contrast, PRIORITY
from experiments import profile, simulate, white_veil, palette_samples, minimum_distance, OKABE_ITO

HERE=Path(__file__).resolve().parent
RUN=HERE/'runs/foundations-2026-11-09'
INPUT=RUN/'inputs'
SEED=20261109
VISIONS=['normal','deuteranomaly','protanomaly','tritanomaly']
SEQUENTIAL=['cividis','viridis','mako','rocket','crest','flare','Blues','Greens','Purples','YlOrBr','Greys']
DIVERGING=['BrBG','RdBu','coolwarm','PuOr','RdYlGn','seismic']
CONTROLS=['jet','rainbow','turbo']
CONDITIONS=[('srgb',1.,0.),('srgb',.7,0.),('srgb',.4,0.),('linear-light',.7,0.),('linear-light',.4,0.),('srgb',1.,.1),('srgb',1.,.2),('srgb',.4,.2)]


def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')


def load_inputs():
    provenance=json.loads((INPUT/'provenance.json').read_text())
    for name,digest in provenance['files'].items():
        if sha(INPUT/name)!=digest: raise ValueError('Frozen input changed: '+name)
    return {n:json.loads((INPUT/'foundations'/f'{n}.json').read_text()) for n in PRIORITY},provenance


def roles(f,mode):
    d=f['modes'][mode]
    return {k:d['swatches'][ref] for k,ref in d['roles'].items()}


def srgb_decode(values):
    v=np.asarray(values,dtype=float)
    return np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4)


def srgb_encode(values):
    v=np.asarray(values,dtype=float)
    return np.where(v<=.0031308,12.92*v,1.055*np.maximum(v,0)**(1/2.4)-.055)


def composite(rgb,bg,alpha,model='srgb'):
    """Encoded-sRGB is validated against Agg; linear-light is an alternative."""
    if model=='srgb': return np.asarray(rgb)*alpha+np.asarray(bg)*(1-alpha)
    if model=='linear-light': return srgb_encode(srgb_decode(rgb)*alpha+srgb_decode(bg)*(1-alpha))
    raise ValueError(model)


def shown_colors(rgb,bg,vision,alpha=1,veil=0,model='srgb'):
    """Composite, linear-light white veil, CVD, then clip both display fields."""
    marks,clip=simulate(white_veil(composite(rgb,bg,alpha,model),veil),vision)
    background,bg_clip=simulate(white_veil(np.asarray(bg)[None,:],veil),vision)
    return marks,background[0],clip,bg_clip


def validate_agg():
    rows=[]
    for color,bg,alpha in itertools.product(['#0072b2','#d55e00','#f0e442'],['#ffffff','#182032','#efe9dc'],[.4,.7,1.]):
        fig=Figure(figsize=(1,1),dpi=100,facecolor=bg);canvas=FigureCanvasAgg(fig)
        ax=fig.add_axes([0,0,1,1]);ax.set_axis_off()
        ax.add_patch(Rectangle((.1,.1),.8,.8,color=color,alpha=alpha,linewidth=0,antialiased=False))
        canvas.draw();actual=np.asarray(canvas.buffer_rgba())[50,50,:3]/255
        rgb=np.array(to_rgb(color));background=np.array(to_rgb(bg))
        rows.append(dict(mark=color,background=bg,alpha=alpha,actual_rgb=actual.tolist(),srgb_error=float(np.max(abs(actual-composite(rgb,background,alpha)))),linear_light_error=float(np.max(abs(actual-composite(rgb,background,alpha,'linear-light'))))))
    write_json(RUN/'results/agg-alpha-validation.json',rows)
    if max(r['srgb_error'] for r in rows)>2/255: raise AssertionError('Agg/sRGB mismatch')
    return rows


def ui_measurements(foundations):
    rows=[]
    for name,f in foundations.items():
        for mode in ['light','dark']:
            r=roles(f,mode)
            for ink,bg in itertools.product(['ink','muted','accent-text','secondary-text','code-ink'],['paper','panel','code']):
                rows.append(dict(theme=name,mode=mode,foreground=ink,surface=bg,ratio=float(contrast(to_rgb(r[ink]),to_rgb(r[bg])))))
    pd.DataFrame(rows).to_csv(RUN/'results/current-ui-roles.csv',index=False,float_format='%.8f')
    return rows


def freeze_palettes(foundations):
    maps={n:palette_samples(n) for n in SEQUENTIAL+DIVERGING+CONTROLS}
    # Render and measure the same explicit 257-entry LUT; exact center at index128.
    for n in DIVERGING:
        original=maps[n];maps[n]=np.column_stack([np.interp(np.linspace(0,1,257),np.linspace(0,1,len(original)),original[:,i]) for i in range(3)])
    definitions={n:dict(kind='diverging' if n in DIVERGING else 'negative-control' if n in CONTROLS else 'sequential',source=n,samples=rgb.tolist()) for n,rgb in maps.items()}
    for name,f in foundations.items():
        for mode in ['light','dark']:
            key=f'{name}-{mode}-optional-ramp';r=roles(f,mode)
            maps[key]=np.asarray((sns.light_palette if mode=='light' else sns.dark_palette)(r['accent-text'],n_colors=256))
            definitions[key]=dict(kind='optional-theme-ramp',source_role='accent-text',theme=name,mode=mode,samples=maps[key].tolist(),default=False)
    categories={}
    for pool,colors in {'okabe-ito':np.array([to_rgb(c) for c in OKABE_ITO]),'colorblind':np.array(sns.color_palette('colorblind',8))}.items():
        for count in [3,5,8]: categories[f'{pool}-prefix-{count}']=dict(source=pool,indices=list(range(count)),colors=[to_hex(c) for c in colors[:count]])
        for count in [3,5]:
            candidates=[]
            for indices in itertools.combinations(range(8),count):
                score=min(minimum_distance(simulate(colors[list(indices)],v)[0]) for v in VISIONS)
                candidates.append((score,indices))
            score,indices=max(candidates,key=lambda item:(item[0],tuple(-i for i in item[1])))
            categories[f'{pool}-subset-{count}']=dict(source=pool,indices=list(indices),colors=[to_hex(c) for c in colors[list(indices)]],selection='Finite global maximin CAM02-UCS distance across normal and three severity100 simulations; lexicographic tie break. Visibility assessed separately.',selection_score=score)
    for pool in ['tab10','Set2','Dark2']:
        categories[f'{pool}-prefix-8']=dict(source=pool,indices=list(range(8)),colors=[to_hex(c) for c in sns.color_palette(pool,8)])
    colors=np.asarray(sns.color_palette('Dark2',8));indices=[1,3,6]
    categories['Dark2-visibility-3']=dict(source='Dark2',indices=indices,colors=[to_hex(c) for c in colors[indices]],selection='All three colors pass the stated normal-vision opaque 3:1 surface screen; diagnostic CVD separation tradeoff, not default.')
    write_json(RUN/'results/palette-samples.json',dict(maps=definitions,qualitative=categories,assignment='Caller supplies stable ordered category IDs. No mode/theme reordering.'))
    return maps,categories


def assign_categories(ordered_ids,colors,observed_ids):
    """Explicit domain freezes slots independently of observed data ordering."""
    if len(set(ordered_ids))!=len(ordered_ids): raise ValueError('Duplicate category IDs')
    if len(ordered_ids)>len(colors): raise ValueError('Palette capacity exceeded')
    if len(set(colors[:len(ordered_ids)]))!=len(ordered_ids): raise ValueError('Duplicate category colors')
    mapping=dict(zip(ordered_ids,colors))
    return [mapping[category] for category in observed_ids]


def map_metrics(maps):
    rows=[];norms=[]
    for name,rgb in maps.items():
        arms={'whole':rgb}
        if name in DIVERGING:
            cmap=matplotlib.colormaps[name]
            arms={'left':rgb[:129],'right':rgb[128:]}
        for vision in VISIONS:
            for arm,values in arms.items():
                shown,clip=simulate(values,vision)
                rows.append(dict(map=name,vision=vision,arm=arm,samples=len(values),clipped_fraction=clip,**profile(shown)))
        if name in DIVERGING:
            for lo,center,hi in [(-1,0,1),(-2,0,1)]:
                norm=TwoSlopeNorm(vmin=lo,vcenter=center,vmax=hi)
                for value in sorted(set(np.linspace(lo,hi,7).tolist()+[float(center)])):
                    norms.append(dict(map=name,vmin=lo,center=center,vmax=hi,value=value,normalized=float(norm(value)),color=to_hex(ListedColormap(rgb)(float(norm(value))))))
    frame=pd.DataFrame(rows);frame.to_csv(RUN/'results/map-metrics.csv',index=False,float_format='%.8f')
    pd.DataFrame(norms).to_csv(RUN/'results/normalization-examples.csv',index=False,float_format='%.8f')
    return frame


def category_metrics(foundations,categories):
    rows=[]
    for name,f in foundations.items():
        for mode,surface in itertools.product(['light','dark'],['paper','panel']):
            bg=np.array(to_rgb(roles(f,mode)[surface]))
            for palette,spec in categories.items():
                rgb=np.array([to_rgb(c) for c in spec['colors']])
                for model,alpha,veil in CONDITIONS:
                    for vision in VISIONS:
                        shown,shown_bg,clip,bg_clip=shown_colors(rgb,bg,vision,alpha,veil,model)
                        ratios=contrast(shown,shown_bg);ucs=cspace_convert(shown,'sRGB1','CAM02-UCS');distance=np.linalg.norm(ucs[:,None]-ucs[None,:],axis=-1)
                        i,j=min(itertools.combinations(range(len(rgb)),2),key=lambda pair:distance[pair])
                        for profile_name in ['reading','presentation']:
                            rows.append(dict(theme=name,mode=mode,surface=surface,profile=profile_name,palette=palette,count=len(rgb),vision=vision,alpha_model=model,alpha=alpha,linear_light_veil=veil,min_distance=float(distance[i,j]),pair_i=i,pair_j=j,min_mark_contrast=float(ratios.min()),marks_below_3=int((ratios<3).sum()),mark_clipped_fraction=clip,background_clipped_fraction=bg_clip))
    frame=pd.DataFrame(rows);frame.to_csv(RUN/'results/category-metrics.csv',index=False,float_format='%.8f')
    return frame


def map_backgrounds(foundations,maps):
    rows=[]
    for name,f in foundations.items():
        for mode,surface in itertools.product(['light','dark'],['paper','panel']):
            bg=np.array(to_rgb(roles(f,mode)[surface]))
            for palette in SEQUENTIAL+DIVERGING+CONTROLS+[f'{name}-{mode}-optional-ramp']:
                for vision in VISIONS:
                    shown,shown_bg,clip,bg_clip=shown_colors(maps[palette],bg,vision)
                    ratios=contrast(shown,shown_bg)
                    rows.append(dict(theme=name,mode=mode,surface=surface,map=palette,vision=vision,min_contrast=float(ratios.min()),start_contrast=float(ratios[0]),end_contrast=float(ratios[-1]),fraction_below_3=float((ratios<3).mean()),mark_clipped_fraction=clip,background_clipped_fraction=bg_clip))
    frame=pd.DataFrame(rows);frame.to_csv(RUN/'results/map-backgrounds.csv',index=False,float_format='%.8f')
    return frame


def pool_visibility(foundations):
    rows=[]
    for pool,colors in [('okabe-ito',[to_rgb(v) for v in OKABE_ITO]),('colorblind',sns.color_palette('colorblind',8)),('Dark2',sns.color_palette('Dark2',8))]:
        for index,color in enumerate(colors):
            normal=[];allmodels=[]
            for f in foundations.values():
                for mode,surface,vision in itertools.product(['light','dark'],['paper','panel'],VISIONS):
                    shown,bg,_,_=shown_colors(np.array([color]),np.array(to_rgb(roles(f,mode)[surface])),vision)
                    ratio=float(contrast(shown,bg)[0]);allmodels.append(ratio)
                    if vision=='normal':normal.append(ratio)
            rows.append(dict(pool=pool,index=index,color=to_hex(color),normal_min=min(normal),all_model_min=min(allmodels),all_model_pass_3=min(allmodels)>=3))
    pd.DataFrame(rows).to_csv(RUN/'results/category-pool-visibility.csv',index=False,float_format='%.8f')


def font_files():
    derived=RUN/'fonts';derived.mkdir(exist_ok=True);conversions=[]
    for source_name in ['et-book-roman-line-figures.woff','et-book-bold-line-figures.woff']:
        source=INPUT/'fonts'/source_name;target=derived/source_name.replace('.woff','.ttf')
        font=TTFont(source,recalcTimestamp=False)
        record=dict(source=str(source.relative_to(RUN)),source_sha256=sha(source),family=font['name'].getDebugName(1),weight=font['OS/2'].usWeightClass,embedding_flags=font['OS/2'].fsType,tool='fontTools '+version('fonttools'),operation='Decode WOFF to sfnt; retain outlines/names/flags/timestamps',license='inputs/licenses/tufte-LICENSE')
        font.flavor=None;font.save(target,reorderTables=False);record.update(output=str(target.relative_to(RUN)),output_sha256=sha(target));conversions.append(record)
    normal={};bold={};records={}
    for theme in PRIORITY:
        stem={'folio':'dm-sans','atelier':'dm-sans','nocturne':'dm-sans','zephyr-reading':'inter','simplex-reading':'open-sans','darkly-reading':'lato'}.get(theme)
        if theme=='tufte': normal[theme]=derived/'et-book-roman-line-figures.ttf';bold[theme]=derived/'et-book-bold-line-figures.ttf'
        elif stem:
            normal[theme]=INPUT/'fonts'/f'{stem}-400-normal.ttf';bold[theme]=INPUT/'fonts'/f'{stem}-{700 if stem=="lato" else 600}-normal.ttf'
        else:
            for mapping,weight in [(normal,400),(bold,700)]:
                source=Path(matplotlib.get_data_path())/'fonts/ttf'/('DejaVuSans.ttf' if weight==400 else 'DejaVuSans-Bold.ttf')
                target=derived/f'dejavu-sans-{weight}.ttf';target.write_bytes(source.read_bytes());mapping[theme]=target
        records[theme]={}
        for role,path in [('ui',normal[theme]),('heading',bold[theme])]:
            font=TTFont(path,recalcTimestamp=False)
            records[theme][role]=dict(file=str(path.relative_to(RUN)),sha256=sha(path),internal_family=font['name'].getDebugName(1),weight=font['OS/2'].usWeightClass,requested_family=('platform UI sans' if theme in ['pulse-reading','litera-reading'] else font['name'].getDebugName(1)),notice_paths=(['fonts/DejaVu-LICENSE'] if theme in ['pulse-reading','litera-reading'] else ['inputs/licenses/tufte-LICENSE'] if theme=='tufte' else ['inputs/licenses/'+{'dm-sans':theme+'-dmsans-OFL.txt','inter':'zephyr-reading-inter-OFL.txt','open-sans':'simplex-reading-open-sans-OFL.txt','lato':'darkly-reading-lato-OFL.txt'}[stem]]),package_source=('Matplotlib '+version('matplotlib')+' mpl-data/fonts/ttf/'+('DejaVuSans.ttf' if role=='ui' else 'DejaVuSans-Bold.ttf') if theme in ['pulse-reading','litera-reading'] else None),glyph_policy='ASCII minus for numeric ticks; all actual displayed glyphs must exist',fallback=theme in ['pulse-reading','litera-reading'],reason='Pinned portable fallback for platform UI stack' if theme in ['pulse-reading','litera-reading'] else 'Owned licensed chart UI face; independent from prose font')
    notices=list(Path(matplotlib.__file__).parent.rglob('LICENSE_DEJAVU*'))
    if not notices: raise RuntimeError('Missing DejaVu license')
    (derived/'DejaVu-LICENSE').write_bytes(notices[0].read_bytes())
    for theme in records:
        for entry in records[theme].values():
            if not entry['notice_paths'] or not all((RUN/notice).is_file() for notice in entry['notice_paths']): raise AssertionError('Missing font notice '+theme)
            if theme=='tufte': entry['conversion']=next(v for v in conversions if v['output']==entry['file'])
    write_json(RUN/'results/font-conversions.json',conversions);write_json(RUN/'results/font-resolution.json',records)
    return normal,bold


def point_size(pixels,placed_width,figure_width=8): return pixels*72*figure_width/placed_width


def make_registry(foundations,category):
    default='colorblind-subset-3';extended='colorblind-subset-5'
    voices={'folio':'Warm paper/green furniture, sans chart UI; rust is an explicit alternative focus.','atelier':'Square teal furniture; keep scientific encodings independent of teal.','nocturne':'Ink-blue/pearl furniture, scarce brass focus and sans chart UI.','tufte':'Neutral unboxed furniture and real ETBembo UI; optional blue focus is explicit.','zephyr-reading':'Inter UI; dark accent text is distinct from button fill.','simplex-reading':'Open Sans UI; brand red never automatically means negative data.','pulse-reading':'Purple focus; disclosed portable DejaVu Sans for platform UI.','litera-reading':'Serif document prose remains distinct from portable sans chart UI.','darkly-reading':'Lato UI; pale-blue focus rather than dark-blue button fill for thin marks.'}
    registry=dict(schemaVersion=1,run=RUN.name,encoding=dict(qualitative=dict(default=default,extended=extended,alternatives=[],assignment='Caller supplies stable ordered category IDs; preserve across mode and figures; use direct labels/markers/dashes',eight_color_policy='Comparison only; no universal eight-color recommendation'),sequential=dict(default='cividis',alternatives=['viridis','mako','rocket'],normalization='Explicit vmin/vmax; no automatic mode reversal'),diverging=dict(default='BrBG',alternatives=['RdBu','coolwarm'],normalization='Explicit vmin, meaningful center, vmax; disclose asymmetric limits',missing='Opaque contextual neutral fill plus cross/hatch; not the center color')),typography=dict(mapping='Ticks/category labels/legends: UI16 reading, label24 presentation. Plot headings:30 reading/36 presentation. Metadata:14 reading/24 presentation. Body annotations30 only deliberately; deck/display48 is not a plot default.',equation='placed_css_px = points * placed_width_px / (72 * figure_width_inches)',figure_width_inches=8,placed_width_px=dict(reading=640,presentation=1152)),themes={},palette_definitions='results/palette-samples.json',font_resolution='results/font-resolution.json',sources='inputs/provenance.json',limitations=['3:1 is a thin-mark engineering risk screen, not a universal perception threshold','CAM02-UCS distances and CVs are comparative model evidence','CVD severity100/clipping does not certify universal access','Linear-light white veil is illustrative; no physical projector/print trial'])
    for name,f in foundations.items():
        cases=category[(category.theme==name)&(category.palette==default)&(category.alpha==1)&(category.linear_light_veil==0)&(category.alpha_model=='srgb')]
        registry['themes'][name]=dict(decision='Common explicit data maps with theme furniture; categorical choice requires redundant cues and surface review',voice=voices[name],qualitative=default,extended_qualitative=extended,sequential='cividis',diverging='BrBG',category_min_contrast=float(cases.min_mark_contrast.min()),category_worst_distance=float(cases.min_distance.min()),category_mark_risk=bool((cases.marks_below_3>0).any()),optional_ramps=[f'{name}-{m}-optional-ramp' for m in ['light','dark']],optional_ramp_policy='Research alternatives, never automatic UI-ladder defaults',modes={m:{surface:{k:roles(f,m)[k] for k in ['ink','muted','accent-text','secondary-text','control-boundary']}|dict(background=roles(f,m)[surface]) for surface in ['paper','panel']} for m in ['light','dark']})
    q=registry['encoding']['qualitative']
    q['variants']={default:dict(status='recommended',max_categories=3,stable_slots=['A','B','C'],markers=['o','s','^'],dashes=['solid','dashed','dotted']),extended:dict(status='explicit-conditional',max_categories=5,stable_slots=['A','B','C','D','E'],markers=['o','s','^','D','v'],dashes=['solid','dashed','dotted','dashdot',[5,1,1,1]],limitations='Worst simulated CAM02 separation is lower than3-category option; small count does not certify identification. Required ink under-stroke/edged markers and direct labels apply; review density and occlusion.')}
    q.update(bare_cycle_supported=False,max_categories=3,status='supported-with-required-ink-understroke',stable_slots=['A','B','C'],required_treatment=dict(foreground_css_px=2.5,understroke_css_px=5.5,understroke_role='ink',marker_css_px=7,marker_edge_css_px=1.5,marker_edge_role='ink',markers=['o','s','^'],dashes=['solid','dashed','dotted'],labels='Explicit category ID at endpoint; no overlapping legend'),diagnostic_only=['okabe-ito-subset-3','okabe-ito-subset-5','Dark2-visibility-3'])
    registry['typography']['profiles']={'reading':dict(label=16,heading=30,metadata=14,body_annotation=18),'presentation':dict(label=24,heading=36,metadata=24,body_annotation=30)}
    registry['lut']=dict(color_space='gamma-encoded sRGB float0..1',positions='uniform0..1',interpretation='ListedColormap; no automatic reversal',diverging='257 samples: componentwise linear interpolation of source256 in encoded sRGB, shared exact middle sample',approved_ids=['cividis','viridis','mako','rocket','BrBG','RdBu','coolwarm',default,extended])
    registry['encoding']['special_values']=dict(bad=dict(fill_role='muted',ink_role='background',hatch='x'),under='endpoint',over='endpoint',clip=True)
    for name,f in foundations.items():
        ratios=[]
        for mode,surface,vision in itertools.product(['light','dark'],['paper','panel'],VISIONS):
            r=roles(f,mode);mark,bg,_,_=shown_colors(np.asarray([to_rgb(r['ink'])]),np.asarray(to_rgb(r[surface])),vision)
            ratios.append(float(contrast(mark,bg)[0]))
        registry['themes'][name]['typography_profiles']={job:dict(label=f['typography']['profiles'][job]['label'],heading=f['typography']['profiles'][job]['heading'],metadata=f['typography']['profiles'][job]['metadata'],body_annotation=f['typography']['profiles'][job]['body']) for job in ['reading','presentation']}
        registry['themes'][name]['required_ink_edge_min_contrast']=min(ratios)
        registry['themes'][name]['category_mark_risk']=True
        registry['themes'][name]['decision']='Use fixed category colors only with required theme-ink under-stroke and edged markers; bare thin strokes unsupported. Labels/dashes supplement, never restore vanished strokes.'
    write_json(RUN/'decision-registry.json',registry);return registry


def displayed_texts(fig):
    """Use current axis tick lists, not cached dormant Tick artists in findobj."""
    texts=list(fig.texts)
    for ax in fig.axes:
        texts.extend(ax.texts)
        texts.extend([ax.title,ax._left_title,ax._right_title,ax.xaxis.label,ax.yaxis.label,ax.xaxis.get_offset_text(),ax.yaxis.get_offset_text()])
        for axis in [ax.xaxis,ax.yaxis]:
            for tick in axis._update_ticks(): texts.extend([tick.label1,tick.label2])
    return [text for text in texts if text.get_visible() and text.get_text()]


def render_specimens(foundations,maps,categories,normal,bold):
    rng=np.random.default_rng(SEED);x=np.linspace(0,10,40)
    traces=np.array([np.sin(x/2+phase)*.15+x*slope for phase,slope in [(0,.1),(.5,.07),(1,.12)]])+rng.normal(0,.015,(3,40))
    field=np.outer(np.linspace(0,1,14),np.linspace(.2,1,18));residual=np.outer(np.sin(np.linspace(-np.pi,np.pi,14)),np.linspace(.2,1,18));residual[3:5,7:9]=np.nan
    write_json(RUN/'results/synthetic-data.json',dict(seed=SEED,x=x.tolist(),traces=traces.tolist(),magnitude=field.tolist(),residual=[[None if np.isnan(v) else float(v) for v in row] for row in residual]))
    output=RUN/'figures';output.mkdir(exist_ok=True);(RUN/'styles').mkdir(exist_ok=True);records=[]
    coverage={name:{'ui':TTFont(normal[name]).getBestCmap(),'heading':TTFont(bold[name]).getBestCmap()} for name in foundations}
    palette=categories['colorblind-subset-3']['colors'];markers=['o','s','^'];dashes=['-','--',':']
    for name,f in foundations.items():
        for mode,job,surface in itertools.product(['light','dark'],['reading','presentation'],['paper','panel']):
            r=roles(f,mode);p=f['typography']['profiles'][job];placed=640 if job=='reading' else 1152
            label_px=p['ui'] if job=='reading' else p['label'];label=point_size(label_px,placed);heading=point_size(p['heading'],placed);meta=point_size(p['metadata'],placed)
            key=f'{name}-{mode}-{job}-{surface}';background=r[surface]
            rc={'figure.facecolor':background,'axes.facecolor':background,'savefig.facecolor':background,'savefig.transparent':False,'text.color':r['ink'],'axes.labelcolor':r['ink'],'xtick.color':r['ink'],'ytick.color':r['ink'],'axes.edgecolor':r['control-boundary'],'grid.color':r['line'],'font.size':label,'axes.titlesize':label,'axes.labelsize':label,'xtick.labelsize':label,'ytick.labelsize':label,'legend.fontsize':label,'lines.linewidth':point_size(2.5,placed),'axes.spines.top':False,'axes.spines.right':False,'pdf.fonttype':42,'svg.fonttype':'path','axes.unicode_minus':False}
            with plt.rc_context(rc):
                fig,axes=plt.subplots(2,2,figsize=(8,5.6),layout='constrained')
                for i in range(3):
                    line,=axes[0,0].plot(x,traces[i],label=f'Category {chr(65+i)}',color=palette[i],marker=markers[i],markevery=10,linestyle=dashes[i],markersize=point_size(7,placed),markeredgecolor=r['ink'],markeredgewidth=point_size(1.5,placed))
                    line.set_path_effects([effects.Stroke(linewidth=point_size(5.5,placed),foreground=r['ink']),effects.Normal()])
                axes[0,0].set_title('Fixed category identities',loc='left');
                for i in range(3): axes[0,0].annotate(chr(65+i),(x[-1],traces[i,-1]),xytext=(4,0),textcoords='offset points',fontsize=label,color=r['ink'])
                axes[0,0].set_xlim(0,12);axes[0,0].set(xlabel='Time',ylabel='Value',xticks=[0,5,10])
                im=axes[0,1].imshow(field,cmap=ListedColormap(maps['cividis']),vmin=0,vmax=1,aspect='auto',interpolation='nearest');axes[0,1].set_title('Magnitude · cividis',loc='left');fig.colorbar(im,ax=axes[0,1],ticks=[0,.5,1],shrink=.75)
                cmap=ListedColormap(maps['BrBG']);cmap.set_bad(r['muted']);im=axes[1,0].imshow(np.ma.masked_invalid(residual),cmap=cmap,norm=TwoSlopeNorm(vmin=-1,vcenter=0,vmax=1),aspect='auto',interpolation='nearest')
                for y,z in zip(*np.where(np.isnan(residual))): axes[1,0].plot(z,y,'x',color=background,markersize=point_size(4,placed),markeredgewidth=1)
                axes[1,0].set_title('Residual · BrBG; × missing',loc='left');fig.colorbar(im,ax=axes[1,0],ticks=[-1,0,1],shrink=.75)
                for ax in [axes[0,1],axes[1,0]]: ax.set_xticks([]);ax.set_yticks([])
                focus=r.get('optional-highlight-ink',r['accent-text']) if name=='tufte' else r['accent-text']
                for i in range(3):
                    axes[1,1].plot(x,traces[i],color=focus if i==1 else r['muted'],linestyle=dashes[i]);axes[1,1].annotate(['A','Focus','B'][i],(x[-1],traces[i,-1]),xytext=(3,0),textcoords='offset points',fontsize=label)
                axes[1,1].set_title('One focus + labelled context',loc='left');axes[1,1].set_xlim(0,12);axes[1,1].set_xticks([0,5,10])
                fig.suptitle(f'{name} · {mode} · {job}',fontsize=heading);fig.supxlabel(f'{surface} · fixed maps/data · labels {label_px}px at {placed}px',fontsize=meta)
                fig.canvas.draw()
                for text in displayed_texts(fig): text.set_fontproperties(font_manager.FontProperties(fname=bold[name] if text is fig._suptitle else normal[name],size=text.get_fontsize()))
                fig.canvas.draw();renderer=fig.canvas.get_renderer();outside=[]
                for text in displayed_texts(fig):
                    if text.get_visible() and text.get_text():
                        covered=coverage[name]['ui' if text is not fig._suptitle else 'heading']
                        missing=[char for char in text.get_text() if ord(char) not in covered and not char.isspace()]
                        if missing: raise AssertionError(f'Missing glyphs {name}: {missing}')
                        box=text.get_window_extent(renderer)
                        if box.x0 < -1 or box.y0 < -1 or box.x1 > fig.bbox.width+1 or box.y1 > fig.bbox.height+1: outside.append(text.get_text())
                for ext in ['png','svg','pdf']:
                    fig.savefig(output/f'{key}.{ext}',dpi=160,facecolor=background,transparent=False,metadata={'Creator':'htmpres frozen foundation study'} if ext=='pdf' else None)
                from PIL import Image
                corner=Image.open(output/f'{key}.png').convert('RGBA').getpixel((0,0));expected=tuple(round(v*255) for v in to_rgb(background))
                if corner[:3]!=expected or corner[3]!=255: raise AssertionError('PNG background mismatch '+key)
                ET.parse(output/f'{key}.svg');plt.close(fig)
            records.append(dict(key=key,theme=name,mode=mode,profile=job,surface=surface,placed_width_px=placed,figure_width_inches=8,label_points=label,effective_label_px=label*placed/(72*8),heading_points=heading,effective_heading_px=heading*placed/(72*8),metadata_points=meta,effective_metadata_px=meta*placed/(72*8),ui_font=str(normal[name].relative_to(RUN)),heading_font=str(bold[name].relative_to(RUN)),background=background,opaque_png_corner=True,svg_parses=True,pdf_header=(output/f'{key}.pdf').read_bytes().startswith(b'%PDF-'),text_outside_canvas=outside))
            (RUN/'styles'/f'{key}.mplstyle').write_text('# Furniture only; explicit font registration and data encodings required.\n'+'\n'.join(f'{k}: {str(v).lstrip("#")}' for k,v in rc.items())+'\n')
    write_json(RUN/'results/placement-and-exports.json',records)
    html=['<!doctype html><html lang="en"><meta charset="utf-8"><title>Current placed specimens</title><style>body{margin:24px;font:16px system-ui;background:#f5f5f5}figure{margin:24px 0 64px}img{display:block;max-width:none}section{overflow:auto}figcaption{margin:8px 0}</style><h1>Diagnostic contact sheets</h1><p>Declared image widths are retained. Presentation sheets exceed slide height and are not slide-fit acceptance specimens. See placements/slide-light/index.html for the purpose-sized actual slide. A resized thumbnail is not a placement check. Scroll horizontally where needed.</p>']
    for row in records: html.append(f'<section><figure id="{row["key"]}"><figcaption>{row["key"]} · labels {row["effective_label_px"]:g}px · heading {row["effective_heading_px"]:g}px · <a href="figures/{row["key"]}.svg">SVG</a> · <a href="figures/{row["key"]}.pdf">PDF</a></figcaption><img alt="{row["key"]}" src="figures/{row["key"]}.png" style="width:{row["placed_width_px"]}px"></figure></section>')
    (RUN/'gallery.html').write_text('\n'.join(html)+'</html>');return records


def diagnostics(maps,categories):
    folder=RUN/'figures';folder.mkdir(exist_ok=True);names=['cividis','viridis','Blues','jet','turbo']
    fig,axes=plt.subplots(5,3,figsize=(10,7),layout='constrained')
    for i,name in enumerate(names):
        rgb=maps[name];axes[i,0].imshow(rgb[None,:,:],aspect='auto');axes[i,0].set_title(name,loc='left');axes[i,0].set_axis_off();axes[i,1].plot(cspace_convert(rgb,'sRGB1','CIELab')[:,0]);axes[i,1].set_ylabel('L*');axes[i,2].plot(np.linalg.norm(np.diff(cspace_convert(rgb,'sRGB1','CAM02-UCS'),axis=0),axis=1));axes[i,2].set_ylabel('Adjacent Δ')
    fig.savefig(folder/'map-diagnostics.png',dpi=150);plt.close(fig)
    names=['okabe-ito-prefix-3','okabe-ito-subset-3','okabe-ito-subset-5','colorblind-subset-3','colorblind-subset-5'];fig,axes=plt.subplots(5,4,figsize=(11,5),layout='constrained')
    for i,name in enumerate(names):
        for j,vision in enumerate(VISIONS):
            shown,_=simulate(np.array([to_rgb(c) for c in categories[name]['colors']]),vision);axes[i,j].imshow(shown[None,:,:],aspect='auto');axes[i,j].set_xticks(range(len(shown)),[chr(65+k) for k in range(len(shown))]);axes[i,j].set_yticks([])
            if i==0: axes[i,j].set_title(vision)
            if j==0: axes[i,j].set_ylabel(name,rotation=0,ha='right',va='center',fontsize=9)
    fig.savefig(folder/'category-comparisons.png',dpi=150);plt.close(fig)


def main():
    (RUN/'results').mkdir(parents=True,exist_ok=True)
    foundations,provenance=load_inputs();print('Verified frozen input hashes',flush=True)
    agg=validate_agg();ui=ui_measurements(foundations);maps,categories=freeze_palettes(foundations);metrics=map_metrics(maps);print('Palette definitions, exact-center maps and Agg checks ready',flush=True)
    category=category_metrics(foundations,categories);backgrounds=map_backgrounds(foundations,maps);print(f'Completed {len(category)} category-condition rows',flush=True)
    pool_visibility(foundations);normal,bold=font_files();make_registry(foundations,category);diagnostics(maps,categories);placements=render_specimens(foundations,maps,categories,normal,bold)
    manifest=dict(run=RUN.name,seed=SEED,slide_commit=provenance['slide_commit'],themes=PRIORITY,modes=['light','dark'],surfaces=['paper','panel'],profiles=['reading','presentation'],visions=VISIONS,conditions=CONDITIONS,counts=dict(ui_roles=len(ui),map_rows=len(metrics),category_rows=len(category),background_rows=len(backgrounds),placements=len(placements),agg_validation=len(agg)),versions={p:version(p) for p in ['numpy','pandas','matplotlib','seaborn','colorspacious','fonttools','pillow']},methods={p:sha(HERE/p) for p in ['current_experiments.py','experiments.py','measure.py']},input_provenance_sha256=sha(INPUT/'provenance.json'),palette_samples_sha256=sha(RUN/'results/palette-samples.json'),font_resolution_sha256=sha(RUN/'results/font-resolution.json'))
    write_json(RUN/'manifest.json',manifest);print(json.dumps(manifest['counts']),flush=True)

if __name__=='__main__': main()
