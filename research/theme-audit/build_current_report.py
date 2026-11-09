"""Derive current scientific recommendations/tables from the versioned run."""
import json
import pandas as pd
import current_experiments as c


def table(frame):
    return '| '+' | '.join(frame.columns)+' |\n| '+' | '.join(['---']*len(frame.columns))+' |\n'+'\n'.join('| '+' | '.join(str(v) for v in row)+' |' for row in frame.itertuples(index=False,name=None))


def main():
    registry=json.loads((c.RUN/'decision-registry.json').read_text());manifest=json.loads((c.RUN/'manifest.json').read_text());metrics=pd.read_csv(c.RUN/'results/map-metrics.csv');cats=pd.read_csv(c.RUN/'results/category-metrics.csv');agg=json.loads((c.RUN/'results/agg-alpha-validation.json').read_text());fonts=json.loads((c.RUN/'results/font-resolution.json').read_text());ui=pd.read_csv(c.RUN/'results/current-ui-roles.csv');root='runs/'+c.RUN.name
    theme_rows=[]
    for theme,t in registry['themes'].items():theme_rows.append([theme,fonts[theme]['ui']['internal_family'],f"{t['category_min_contrast']:.2f}",f"{t['required_ink_edge_min_contrast']:.2f}",t['voice']])
    maps=metrics.query("vision=='normal' and map in ['cividis','viridis','Blues','BrBG','RdBu','jet','turbo']")[["map","arm","L_span","reversals","L_linear_rmse","step_cv","flat_steps"]].copy()
    for col in ['L_span','L_linear_rmse','step_cv']:maps[col]=maps[col].map(lambda v:f'{v:.3f}')
    comparison=cats.query("alpha==1 and linear_light_veil==0 and alpha_model=='srgb' and palette in ['okabe-ito-subset-3','colorblind-subset-3','Dark2-visibility-3']")
    comp=comparison.groupby('palette').agg(worst_contrast=('min_mark_contrast','min'),worst_distance=('min_distance','min')).reset_index();comp=comp.assign(**{col:comp[col].map(lambda v:f'{v:.3f}') for col in ['worst_contrast','worst_distance']})
    seq=metrics[metrics['map'].isin(['cividis','viridis'])].groupby('map').agg(worst_cv=('step_cv','max'),max_clip=('clipped_fraction','max'))
    div=metrics[metrics['map'].isin(['BrBG','RdBu','coolwarm'])]
    balance={name:group.pivot(index='vision',columns='arm',values='L_span').diff(axis=1)['right'].abs().max() for name,group in div.groupby('map')}
    text=f'''# Scientific palettes after the owned foundations

This is the current decision study for all nine revised themes, pinned to verified slide commit `{manifest['slide_commit']}`. The recommendation is **shared scientific encodings with theme-specific furniture**, with a required rendering treatment for categorical lines. No theme UI ladder becomes an automatic data map. The [original Doc3](historical/03-scientific-palettes-pre-foundations.html), its conclusions and [baseline hashes](historical/baseline-hashes.json) remain historical evidence; their measurements are not the current results.

The [decision registry]({root}/decision-registry.json) is the package handoff. Its recommended supported defaults are the fixed `colorblind-subset-3` assignment with ink under-strokes/edged markers, `cividis` for magnitude, and `BrBG` for signed deviation. Named alternatives are explicit choices, never mode-dependent automatic reversals. Diagnostic pools remain available for research comparisons and are excluded from the recommended public-map whitelist.

## Source freeze and scope

The [provenance ledger]({root}/inputs/provenance.json) pins the nine upstream merged revisions, exact published manifests, actual slide adapter/profile source, font/license bytes, and a separately attributed research lock. Capture reads validated committed assets, excludes untracked files and symlink targets, and fails for dirty tracked inputs before writing. Current numerical reruns read only the copied inputs; they need no sibling checkouts or network. The [final evidence manifest]({root}/evidence-manifest.json) binds all generators, derived artifacts and this Markdown/HTML report without a self-hash cycle. The [run manifest]({root}/manifest.json) binds seed, backend/dependency versions, generator hashes and inputs. Font files and sample order are part of the result, not ambient host state.

The matrix contains nine themes × two modes × two surfaces × two profiles. There are {manifest['counts']['category_rows']:,} category-condition rows, {manifest['counts']['background_rows']:,} map/background rows, and {manifest['counts']['placements']} PNG/SVG/PDF diagnostic specimens. Color-only reading/presentation rows repeat the same measurements for deployment lookup; **they are not independent perceptual validations**. Real profile differences occur in font, type size, geometry and placement. Synthetic data and fixed geometry isolate comparisons; no reader study, projector or print trial was performed.

The refreshed UI-role checks keep ordinary text separate from marks: minimum primary/code ink contrast is {ui.query("foreground=='ink'").ratio.min():.3f}; muted is {ui.query("foreground=='muted'").ratio.min():.3f}; accent text is {ui.query("foreground=='accent-text'").ratio.min():.3f}. These opaque role checks are not data-map tests or a repeat of the prior browser/control gate.

## A usable categorical recommendation

Category IDs A/B/C keep these exact colors in every theme/mode: `#0173b2`, `#d55e00`, `#fbafe4`. The subset is selected once from the fixed Seaborn colorblind pool by finite maximin CAM02-UCS distance over normal plus three severity 100 simulations, with a documented deterministic tie break. Its palette order and slot assignment are frozen in [palette-samples.json]({root}/results/palette-samples.json). Passing a different data order must not change a category's slot; duplicates and requests beyond capacity are rejected. The default domain has capacity three. The named five-category extension is explicit and conditional: its worst simulated separation is lower, so it carries five stable shapes/dashes/direct IDs and the same required ink treatment, with density/occlusion review. Eight-color pools remain diagnostic. [Five-category light]({root}/placements/folio-light-presentation-five.png) and [dark]({root}/placements/folio-dark-presentation-five.png) specimens show that bounded extension; they are not a universal legibility certification.

A bare thin-line cycle is **unsupported**: some colors nearly coincide with a background. Max-distance selection alone selected black for Okabe–Ito and visibly lost it on dark Folio. The bounded visibility alternative uses Dark2 indices1/3/6. Its normal-vision worst surface contrast is {cats.query("palette=='Dark2-visibility-3' and vision=='normal' and alpha==1 and linear_light_veil==0 and alpha_model=='srgb'").min_mark_contrast.min():.3f}, but its worst simulated separation is smaller. The [per-color screen]({root}/results/category-pool-visibility.csv) shows that no individual color in the three bounded pools clears the chosen opaque 3:1 screen over every simulated model/surface, so we do not pretend a new subset resolves all constraints.

{table(comp)}

These are model comparisons, not universal perceptual cutoffs. The engineering 3:1 mark screen is a warning signal, separate from text/control requirements and separate from CAM02 separation. The supported treatment is a **2.5px color trace over a 5.5px theme-primary-ink under-stroke**, plus 7px markers with 1.5px ink edges, stable dashes/shapes and direct endpoint IDs. It preserves a visible trace skeleton when the color core is weak; labels/dashes alone cannot restore a vanished stroke. It does not guarantee hue identification for all observers or resolve occlusion at intersections. The package must apply the treatment operationally rather than expose a misleading bare default cycle.

The [actual-scale Agg pixel evidence]({root}/results/understroke-pixels.json) examines uniform core, uniform ink edge, antialiased edge and crossing regions separately. Antialiased pixels can approach the background; their ranges are observations, not an edge-wide 3:1 guarantee. At crossings the later trace occludes the earlier one. See [light]({root}/figures/understroke-pixels-light.png) and [dark]({root}/figures/understroke-pixels-dark.png). Filled marks need ink edges too; dense overlap remains a task-specific design decision.

![Fixed categorical subsets under the four vision models]({root}/figures/category-comparisons.png)

*Diagnostic subsets and simulations. These swatches do not establish stroke visibility; the untreated maximin palettes remain comparisons.*

## Explicit decisions for all nine

All nine use the same named categorical treatment, cividis magnitude and BrBG deviation defaults. Furniture and concrete chart UI faces differ. The categorical column is the worst opaque color-core contrast across both surfaces/modes and all four vision models; the ink-edge column is the corresponding required ink's worst contrast. This does not conflate a strong edge with a strong color core.

{table(pd.DataFrame(theme_rows,columns=['Theme','Concrete chart UI','Core minimum','Ink-edge minimum','Theme decision']))}

Pulse and Litera deliberately use a disclosed portable DejaVu Sans chart UI rather than claim a particular host platform/Georgia face. Tufte uses converted ET Book with internal family ETBembo 400/700. The [font resolution]({root}/results/font-resolution.json) records requested/resolved faces, weights, file hashes and notices; [conversion provenance]({root}/results/font-conversions.json) records WOFF source hashes and fontTools settings. Fallbacks come from exact locked Matplotlib package files, never host font lookup. Numeric ticks use ASCII minus because ETBembo lacks U+2212; actual displayed glyph coverage is checked. ETBook's nonessential `webf` table is ignored by PDF subsetting; outline/name/weight conversion is recorded.

## Sequential maps and diverging normalization

`cividis` is the common sequential default because its worst simulated adjacent-step CV is {seq.loc['cividis','worst_cv']:.3f} versus {seq.loc['viridis','worst_cv']:.3f} for viridis, with lower maximum clipping ({seq.loc['cividis','max_clip']:.3f} versus {seq.loc['viridis','max_clip']:.3f}). Both remain monotonic in every tested model. Viridis is more uniform in normal vision (CV 0.012 versus 0.055), so cividis is a deliberate simulation-robustness tradeoff rather than a universal winner; `viridis` is a useful alternative, with `mako`/`rocket` named choices. ColorBrewer Blues/Greens/Purples/YlOrBr/Greys test familiar ordered ramps. Optional theme accent ramps are measured alternatives, not UI-derived defaults. Use an explicit vmin/vmax and preserve orientation across modes. Continuous cell interiors need not all contrast 3:1 with the surrounding panel; boundary/context decisions remain separate from the ordered data encoding. Background contrast and clipping are recorded for every theme/surface/model in [map-backgrounds.csv]({root}/results/map-backgrounds.csv).

{table(maps)}

L* span/reversals/linear-fit RMSE and CAM02 adjacent-step CV answer different questions. Monotonic lightness does not prove uniformity; a low CV does not prove every task easier. Jet/rainbow/turbo controls expose strong reversals and step variation and are not approved sequential defaults. The [diagnostic plot]({root}/figures/map-diagnostics.png) and [full map metrics]({root}/results/map-metrics.csv) include all simulations and optional ramps.

`BrBG` is the common signed default with `RdBu`/`coolwarm` named alternatives. BrBG limits worst simulated arm-span imbalance to {balance['BrBG']:.2f} L* versus {balance['RdBu']:.2f} for RdBu and {balance['coolwarm']:.2f} for coolwarm, while retaining monotonic arms in all models. RdBu has better normal-vision span balance and lower worst step CV, but reaches higher simulated clipping; coolwarm has smaller normal L* spans and one simulated arm reversal. BrBG's worst step CV is higher than RdBu's, so this is a balanced-arm/range choice, not perceptual dominance. Both arms are tested including the same exact center. To avoid a 256-entry lookup duplicating the right endpoint at 129 samples, the actual rendered/frozen LUT is 257 entries: componentwise encoded-sRGB interpolation from the pinned source 256, with shared index 128. This is an explicit derived map definition, not a claim to unmodified ColorBrewer samples. Metrics use those exact two129-entry arms. Arm span and CV are reported separately; center neutrality and arm balance do not follow from monotonicity alone.

Use `TwoSlopeNorm(vmin=..., vcenter=..., vmax=...)` with all limits explicit. It maps the center to 0.5; asymmetric limits do **not** make equal signed magnitudes equally distant. [Normalization examples]({root}/results/normalization-examples.csv) include (-1, 0, 1) and (-2, 0, 1); tests verify endpoints, exact center and invalid ordering. Missing values use opaque muted furniture plus a contrasting cross/hatch, never the diverging center color. Under/over values use explicit endpoint clipping; package-facing special-value policy is machine-readable.

![Sequential map lightness and adjacent-step diagnostics]({root}/figures/map-diagnostics.png)

*Normal-vision diagnostic curves compare lightness ordering and step variation; simulated results are retained in the tables.*

## Alpha, veiling and simulations

The ordinary Matplotlib Agg source-over operation is modeled in **gamma-encoded sRGB**, not linear light. All27 mark/background/alpha pixel comparisons agree within {max(v['srgb_error'] for v in agg):.6f} per channel (allowed 2/255); the [validation table]({root}/results/agg-alpha-validation.json) also shows why the linear-light alternative is different. Alpha0/1, transfer-function round trips and the two midpoint predictions are direct invariants. Pixel interiors and antialiased edges are separate evidence.

For every category condition, composite first; then apply the named illustrative white veil in linear light; then simulate the final marks **and actual background** with the same Machado type/severity 100; then clip and record fractions. Recompute both surface contrast and category distance after this pipeline. Both encoded and linear-light alpha are compared at 0.7/0.4; veil strengths 0.1/0.2 and one combined alpha 0.4/veil 0.2 case are explicit, not projector calibration. Clipping/model extremes limit interpretation. There is no universal color-vision accessibility certification here. [Category metrics]({root}/results/category-metrics.csv) retain all conditions and surfaces.

## Typography, real placement and exports

Chart labels/ticks/legends map to reading UI 16px and presentation label 24px. Plot headings use 30/36px; metadata 14/24px. Deliberate body annotations use the specific foundation body role: 20px for the serif reading profiles, 18px for the other reading profiles, and 30px for presentation. Per-theme numeric mappings are in the registry. Deck/display 48px is not the plot-title default. Real regular and heading faces are used; furniture stays independent from data encoding.

The calculation is `effective CSS px = points × measured placed width / (72 × figure width inches)`. An 8-inch plot at 1152px therefore needs 12pt text to yield 24px; shrinking it reduces the effective size. The [72 diagnostic sheets]({root}/gallery.html) are640px reading or 1152px presentation, with every actual Text face/size checked and opaque PNG/SVG/PDF exports. Their presentation contact sheets are1152×806px and **do not fit a slide**; they are diagnostic comparisons only.

The [reading acceptance page]({root}/placements/reading.html) places the wide plot at 640px. The [actual light slide]({root}/placements/slide-light/index.html) and [dark slide]({root}/placements/slide-dark/index.html) were rendered with the verified pinned htmpres checkout from saved QMD. The purpose-sized plot is 1152×489.6px, fitting the1152×592 content region of a native 1280×720 slide. Images are responsive inside smaller slide shells:24px is claimed only when measured plot width is 1152px; at smaller widths the effective size is24×actual_width/1152. Sidebar/browser chrome can reduce the slide, so viewport dimensions alone do not prove native placement. [Geometry and regeneration command]({root}/placements/geometry.json) preserve that distinction. The browser review measured a native 1280×720 slide and 1152×489.59 plot at 1680×1000 viewport, preserving 24px labels and 64px side insets. At the reduced1280×720 browser viewport, the actual slide was1008×567 and plot880×374, giving18.333px effective labels without clipping. Reading images loaded at640×272, preserving16px labels. The [durable browser evidence]({root}/placements/browser-evidence.json) includes relative-path screenshots and measurements. Reduced viewports scale the image and type together. Each saved slide has a static mode-matched bitmap; the UI mode toggle does not recolor embedded pixels.

![Folio light chart with required under-strokes and edged markers]({root}/placements/folio-light-presentation.png)

![Folio dark chart with the same category assignments and required treatment]({root}/placements/folio-dark-presentation.png)

*Matching light/dark examples. Inline previews may scale; intended 24px labels are verified only by the separate measured placement evidence.*

## Reproduce without overwriting history

From this research directory:

```sh
just current
uv run --frozen python current_treatment.py
uv run --frozen python build_current_report.py
just check
```

`current` regenerates only the versioned run and standalone placements from copied inputs. `check` builds reports and runs tests; it never invokes historical measurement/foundation generators. `just historical-reproduce` is the explicit opt-in baseline regeneration path and uses frozen historical inputs. The archived original source files and lock remain in historical/inputs; ordinary current verification cannot overwrite baseline results/styles/figures. Tests bind their saved hashes.

To regenerate actual slide HTML only, use `uv run --frozen python build_current_placements.py --renderer PINNED_CHECKOUT` at the exact verified revision. This optional integration step requires that checkout; the numeric/figure run does not. HTML and required runtime assets are saved beside the specimens. PNG/SVG/PDF backgrounds, source hashes, sample order, fixed seed, fonts, licenses and placed-text records are inspectable artifacts. Numerical/sample/font results are reproducible; PDF/SVG container metadata and identifiers may differ across reruns, and the final evidence manifest binds the actual generated bytes.

## Evidence and remaining decisions

The numerical results support a common named map policy and theme-specific furniture for all nine. Required categorical under-strokes are a concrete rendering obligation, not a footnote. Human discrimination, dense overlaps, responsive size changes, projection and print remain use-context evaluations. The next plotting package should consume the registry and enforce explicit normalization/category domains/treatment, while preserving the diagnostic controls for research only.

Primary method references: [Matplotlib colormap guidance](https://matplotlib.org/stable/users/explain/colors/colormaps.html), [TwoSlopeNorm](https://matplotlib.org/stable/api/_as_gen/matplotlib.colors.TwoSlopeNorm.html), [Seaborn palette guidance](https://seaborn.pydata.org/tutorial/color_palettes.html), [Colorspacious CVD simulation](https://colorspacious.readthedocs.io/en/latest/tutorial.html#simulating-colorblindness), and the [Machado model](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html). Source-book references and the original interpretive claims remain in the linked historical Doc3; this current study does not replace those sources with model scores.
'''
    # Correct prose adjacency while preserving code, paths, IDs and mathematical notation.
    for old,new in [('indices1/3/6','indices 1/3/6'),('two129-entry','two 129-entry'),('All27','All 27'),('Alpha0/1','Alpha 0/1'),('are640px','are 640px'),('are1152','are 1152'),('the1152','the 1152'),('shells:24px','shells: 24px'),('is24×','is 24×'),('reduced1280','reduced 1280'),('was1008','was 1008'),('plot880','plot 880'),('giving18.333','giving 18.333'),('at640','at 640'),('preserving16','preserving 16')]:text=text.replace(old,new)
    (c.HERE/'03-scientific-palettes.md').write_text(text)

if __name__=='__main__':main()
