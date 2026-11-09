"""Focused Agg pixel evidence for required line under-strokes at actual CSS scale."""
import json
import matplotlib.patheffects as pe
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.colors import to_rgb
import numpy as np
from PIL import Image
import current_experiments as c


def run():
    foundations,_=c.load_inputs();palettes=json.loads((c.RUN/'results/palette-samples.json').read_text())['qualitative'];colors=palettes['colorblind-subset-3']['colors'];records=[]
    for mode in ['light','dark']:
        r=c.roles(foundations['folio'],mode);fig=Figure(figsize=(8,2),dpi=144,facecolor=r['paper']);canvas=FigureCanvasAgg(fig);ax=fig.add_axes([0,0,1,1]);ax.set(xlim=(0,1152),ylim=(0,288));ax.set_axis_off()
        # Lower horizontal opaque interior, upper diagonals crossing. Pixel studies are separate.
        for i,(xs,ys) in enumerate([([100,1052],[60,60]),([100,1052],[130,250]),([100,1052],[250,130])]):
            line,=ax.plot(xs,ys,color=colors[i],lw=c.point_size(2.5,1152),antialiased=True)
            line.set_path_effects([pe.Stroke(linewidth=c.point_size(5.5,1152),foreground=r['ink']),pe.Normal()])
        canvas.draw();pixels=np.asarray(canvas.buffer_rgba())[:,:,:3]/255;bg=np.array(to_rgb(r['paper']));ink=np.array(to_rgb(r['ink']));core=np.array(to_rgb(colors[0]));strip=pixels[224:232,300:850].reshape(-1,3)
        core_count=int((np.max(abs(strip-core),axis=1)<2/255).sum());edge_count=int((np.max(abs(strip-ink),axis=1)<2/255).sum());bgmask=np.max(abs(strip-bg),axis=1)<2/255;antialias=strip[(np.max(abs(strip-core),axis=1)>=2/255)&(np.max(abs(strip-ink),axis=1)>=2/255)&~bgmask]
        crossing=pixels[93:104,570:582].reshape(-1,3)
        assert core_count>0 and edge_count>0
        destination=c.RUN/'figures'/f'understroke-pixels-{mode}.png';Image.fromarray(np.asarray(canvas.buffer_rgba())).save(destination)
        records.append(dict(mode=mode,width_css_px=1152,output_pixels=[1152,288],device_pixel_ratio=1,foreground_css_px=2.5,understroke_css_px=5.5,uniform_core_pixels=core_count,uniform_ink_edge_pixels=edge_count,antialiased_pixels=len(antialias),antialias_contrast_range=[float(c.contrast(antialias,bg).min()),float(c.contrast(antialias,bg).max())],crossing_unique_rgb=len(np.unique(crossing,axis=0)),crossing_contrast_range=[float(c.contrast(crossing,bg).min()),float(c.contrast(crossing,bg).max())],scope='Local Agg pixels at1x placement scale; antialias/overlap ranges are observed evidence, not uniform-edge contrast guarantees. Later trace occludes earlier trace at crossing.'))
    c.write_json(c.RUN/'results/understroke-pixels.json',records);return records

if __name__=='__main__':run()
