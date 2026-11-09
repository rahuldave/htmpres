"""Bind the final methods and derived artifacts after all generators finish."""
import current_experiments as c


def main():
    methods=['current_experiments.py','current_treatment.py','build_current_placements.py','build_current_report.py','freeze_scientific_inputs.py','finalize_current_evidence.py','experiments.py','measure.py','uv.lock','build_reports.py']
    files={str(p.relative_to(c.RUN)):c.sha(p) for p in sorted(c.RUN.rglob('*')) if p.is_file() and p.name not in ['evidence-manifest.json','run.log','render.log']}
    c.write_json(c.RUN/'evidence-manifest.json',dict(methods={p:c.sha(c.HERE/p) for p in methods},artifacts=files,reports={name:c.sha(c.HERE/name) for name in ['03-scientific-palettes.md','03-scientific-palettes.html']},scope='Current input snapshots, results, registry, fonts/licenses, rendered figures, actual slide assets, browser observations and relative screenshots. Historical baseline has separate immutable hash manifest.'))

if __name__=='__main__':main()
