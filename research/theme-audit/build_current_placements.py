"""Purpose-sized placements. Numeric/figure generation needs no renderer checkout.
Only the optional --renderer step needs the pinned htmpres checkout.
"""
import argparse, json, subprocess, shutil
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.text import Text
import matplotlib.patheffects as effects
import numpy as np
import itertools
import current_experiments as c


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--renderer',type=Path);args=parser.parse_args()
    foundations,provenance=c.load_inputs();normal,bold=c.font_files();data=json.loads((c.RUN/'results/synthetic-data.json').read_text());registry=json.loads((c.RUN/'decision-registry.json').read_text());palettes=json.loads((c.RUN/'results/palette-samples.json').read_text())
    dest=c.RUN/'placements';dest.mkdir(exist_ok=True);records=[]
    for profile,width,height in [('reading',640,3.4),('presentation',1152,3.4)]:
        for mode,count in itertools.product(['light','dark'],[3,5]):
            r=c.roles(foundations['folio'],mode);labelpx=16 if profile=='reading' else 24;size=c.point_size(labelpx,width)
            with plt.rc_context({'axes.unicode_minus':False,'pdf.fonttype':42,'svg.fonttype':'path','font.size':size}):
                fig,ax=plt.subplots(figsize=(8,height),layout='constrained',facecolor=r['paper']);ax.set_facecolor(r['paper']);x=np.array(data['x']);traces=np.array(data['traces']);traces=np.vstack([traces,traces[0]*.65+.35,traces[1]*1.1+.35])
                for i,color in enumerate(palettes['qualitative'][registry['encoding']['qualitative']['default' if count==3 else 'extended']]['colors']):
                    line,=ax.plot(x,traces[i],color=color,lw=c.point_size(2.5,width),marker=['o','s','^','D','v'][i],markevery=8,ms=c.point_size(7,width),mec=r['ink'],mew=c.point_size(1.5,width),ls=['-','--',':','-.',(0,(5,1,1,1))][i])
                    line.set_path_effects([effects.Stroke(linewidth=c.point_size(5.5,width),foreground=r['ink']),effects.Normal()]);ax.annotate('ABCDE'[i],(x[-1],traces[i,-1]),xytext=(5,0),textcoords='offset points',color=r['ink'],fontsize=size)
                ax.set(xlabel='Time',ylabel='Value',xlim=(0,11),xticks=[0,5,10]);ax.tick_params(colors=r['ink'],labelsize=size)
                for spine in ax.spines.values():spine.set_color(r['control-boundary'])
                ax.xaxis.label.set_color(r['ink']);ax.yaxis.label.set_color(r['ink']);fig.canvas.draw()
                texts=[]
                for text in fig.findobj(Text):
                    text.set_fontproperties(font_manager.FontProperties(fname=normal['folio'],size=size))
                    if text.get_visible() and text.get_text():texts.append(dict(text=text.get_text(),points=size,effective_css_px=size*width/(72*8)))
                fig.canvas.draw()
                key=f'folio-{mode}-{profile}'+('-five' if count==5 else '')
                for ext in ['png','svg','pdf']:fig.savefig(dest/f'{key}.{ext}',dpi=160,facecolor=r['paper'],transparent=False)
                plt.close(fig);records.append(dict(key=key,category_count=count,profile=profile,width_css_px=width,height_css_px=width*height/8,label_css_px=labelpx,texts=texts))
    (dest/'reading.html').write_text('<!doctype html><meta charset="utf-8"><title>Reading placement</title><style>body{margin:24px;font:16px system-ui}main{width:640px}img{display:block;width:640px;max-width:none}</style><main><h1>Reading placement at 640px</h1>'+''.join(f'<h2>{m}</h2><img alt="Folio {m} reading chart" src="folio-{m}-reading.png">' for m in ['light','dark'])+'</main>')
    for mode in ['light','dark']:
        folder=dest/f'slide-{mode}';folder.mkdir(exist_ok=True);shutil.copy2(dest/f'folio-{mode}-presentation.png',folder/'plot.png')
        (folder/'index.qmd').write_text(f'''---
title: Scientific placement acceptance
deck:
  theme: folio
  color-mode: {mode}
---

## Stable category identities

```{{=html}}
<img id="scientific-placement" src="plot.png" alt="Three stable category traces with ink under-strokes and edged markers" style="display:block;width:1152px;height:auto;max-width:100%;margin:0">
```
''')
        if args.renderer:
            revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=args.renderer,text=True).strip()
            if revision!=provenance['slide_commit']:raise ValueError('Renderer revision differs from verified source')
            command=['quarto','run',str(args.renderer/'scripts/htmpres.ts'),'render',str(folder/'index.qmd')]
            subprocess.run(command,cwd=args.renderer,check=True)
    c.write_json(dest/'geometry.json',dict(renderer_commit=provenance['slide_commit'],renderer_command='quarto run PINNED_CHECKOUT/scripts/htmpres.ts render ABSOLUTE_PLACEMENT/index.qmd',slide_css_px=[1280,720],insets_css_px=64,available_css_px=[1152,592],plot_css_px=[1152,489.6],responsive_policy='Image max-width100%; effective labels24*(actual measured image width/1152). Native-size acceptance only when actual image width1152 and slide1280x720; smaller browser shell has proportionally smaller type.',heading_css_px=36,records=records))

if __name__=='__main__':main()
