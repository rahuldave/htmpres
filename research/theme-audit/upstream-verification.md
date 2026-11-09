# Upstream foundation verification

Verified 9 November 2026. All nine owned themes have merged and published the approved foundation work. Independent and parent review preceded merging; CI passed on the exact reviewed heads. Post-merge CI and Pages passed, and the final demo CSS was verified live. The original repositories were clean on `main`, equal to `origin/main`, at closeout.

The [rollout plan](implementation-plan.md) proceeds to phase 4, slide consumer adoption. Phase 5 experiment reruns and phase 6 plotting API/package work remain pending. Doc 3 retains its pre-implementation measurements as historical evidence until the rerun.

## Verification scope

| Gate | Recorded result |
| --- | --- |
| Custom three | 43 tests per repository with locked SmallDocs 0.3.1 and isolated 0.5.5; real Quarto 1.8.26 consumers |
| Reading five | 16 tests per repository, 80 total; generated SmallDocs and Quarto consumers |
| Tufte | 41 tests; generated SmallDocs and Quarto consumers |
| Browser | Nine themes × two renderers × two modes (36 combinations), plus real 390px layouts |
| Publication | Reviewed-head CI, post-merge CI, Pages and final live demo CSS passed for all nine |
| Source identity | Published manifest bytes in each original repository match the SHA-256 values below |

Actual browser checks covered effective body, UI and code typography, font families, measure and padding, state pairs, search/mode glyphs, form entry, focus, errors, selected and disabled controls. Final corrections included code at 16px/24px with one padding owner (unboxed for Tufte), native stylesheet specificity, embedded glyph paint, Simplex hover gradients, semantic action pairs, neutral outer control boundaries and opaque disabled-state precedence. Font package/resource checks complemented computed font-family checks; narrow layouts were inspected visually.

Numerical validation is scoped to intended pairs: 5:1 ordinary text on paper/panel/code, 4.5:1 action ink/fill, and 3:1 focus/control boundaries against intended surfaces. State boundaries were tested against state fills; semantic buttons use the neutral control boundary for their outer edge. These checks do not establish whole-page accessibility or performance on a physical projector. No room/projector test was performed.

## Exact published sources

Use these merged revisions and manifest hashes for subsequent imports and experiments. Each manifest is `_extensions/<theme>/foundations.json`; its authoritative upstream source is `src/foundations.json`. The linked browser helpers are committed rerunnable evidence, rather than temporary local QA records.

### folio

[Merged PR](https://github.com/rahuldave/smalldocs-folio/pull/1) · [browser helper](https://github.com/rahuldave/smalldocs-folio/blob/e33e059ff40fd49aad28a8b7449cf77449e66898/integration_tests/foundations-browser.mjs)

- Source commit: [e33e059ff40fd49aad28a8b7449cf77449e66898](https://github.com/rahuldave/smalldocs-folio/commit/e33e059ff40fd49aad28a8b7449cf77449e66898)
- [Published manifest](https://github.com/rahuldave/smalldocs-folio/blob/e33e059ff40fd49aad28a8b7449cf77449e66898/_extensions/folio/foundations.json) SHA-256: `55d01ee2b4df07fc32bb058833ff4c267b511854fa1ee338fe2f226fa784ee33`

### atelier

[Merged PR](https://github.com/rahuldave/smalldocs-atelier/pull/1) · [browser helper](https://github.com/rahuldave/smalldocs-atelier/blob/b285e162eed9521114745e34ce3b3d3af5474177/integration_tests/foundations-browser.mjs)

- Source commit: [b285e162eed9521114745e34ce3b3d3af5474177](https://github.com/rahuldave/smalldocs-atelier/commit/b285e162eed9521114745e34ce3b3d3af5474177)
- [Published manifest](https://github.com/rahuldave/smalldocs-atelier/blob/b285e162eed9521114745e34ce3b3d3af5474177/_extensions/atelier/foundations.json) SHA-256: `3ec385d97407a81a0c0296742f1e96a6ef4ffa58d23ca5327059389614e6a44c`

### nocturne

[Merged PR](https://github.com/rahuldave/smalldocs-nocturne/pull/1) · [browser helper](https://github.com/rahuldave/smalldocs-nocturne/blob/061dce7006116f5e86e666baa3f40b6e70029303/integration_tests/foundations-browser.mjs)

- Source commit: [061dce7006116f5e86e666baa3f40b6e70029303](https://github.com/rahuldave/smalldocs-nocturne/commit/061dce7006116f5e86e666baa3f40b6e70029303)
- [Published manifest](https://github.com/rahuldave/smalldocs-nocturne/blob/061dce7006116f5e86e666baa3f40b6e70029303/_extensions/nocturne/foundations.json) SHA-256: `02381470c683f1002f88f0ef82b07543d3b168bb8dff5f3d7e7557f39cffb5b2`

### tufte

[Merged PR](https://github.com/rahuldave/smalldocs-tufte/pull/2) · [browser helper](https://github.com/rahuldave/smalldocs-tufte/blob/70a75da3a3dbc5e87f404fc350723799beca38b5/tests/browser-state-actions.mjs)

- Source commit: [70a75da3a3dbc5e87f404fc350723799beca38b5](https://github.com/rahuldave/smalldocs-tufte/commit/70a75da3a3dbc5e87f404fc350723799beca38b5)
- [Published manifest](https://github.com/rahuldave/smalldocs-tufte/blob/70a75da3a3dbc5e87f404fc350723799beca38b5/_extensions/tufte/foundations.json) SHA-256: `b0cb548a3a28a689450693806eec82f09632610e72828991bd1d74aee68aea85`

### zephyr-reading

[Merged PR](https://github.com/rahuldave/smalldocs-zephyr-reading/pull/4) · [browser helper](https://github.com/rahuldave/smalldocs-zephyr-reading/blob/f809045ba0dd3420c1cfda74a9046f4d7b85b79c/integration_tests/reading-browser.mjs)

- Source commit: [f809045ba0dd3420c1cfda74a9046f4d7b85b79c](https://github.com/rahuldave/smalldocs-zephyr-reading/commit/f809045ba0dd3420c1cfda74a9046f4d7b85b79c)
- [Published manifest](https://github.com/rahuldave/smalldocs-zephyr-reading/blob/f809045ba0dd3420c1cfda74a9046f4d7b85b79c/_extensions/zephyr-reading/foundations.json) SHA-256: `e426bbf820b70b1a36646df17c5d3e626644b2f17c93601fd68e5dd24a74ccbf`

### simplex-reading

[Merged PR](https://github.com/rahuldave/smalldocs-simplex-reading/pull/4) · [browser helper](https://github.com/rahuldave/smalldocs-simplex-reading/blob/4d2b2560a51708c470c28e62a4578074651bace6/integration_tests/reading-browser.mjs)

- Source commit: [4d2b2560a51708c470c28e62a4578074651bace6](https://github.com/rahuldave/smalldocs-simplex-reading/commit/4d2b2560a51708c470c28e62a4578074651bace6)
- [Published manifest](https://github.com/rahuldave/smalldocs-simplex-reading/blob/4d2b2560a51708c470c28e62a4578074651bace6/_extensions/simplex-reading/foundations.json) SHA-256: `e7b79329b789a89a06183b9de58e03ce2ce76d1fd368403f3bb777aa6206e09b`

### pulse-reading

[Merged PR](https://github.com/rahuldave/smalldocs-pulse-reading/pull/4) · [browser helper](https://github.com/rahuldave/smalldocs-pulse-reading/blob/e02631d0efe6da4fb8bb36095c0c2f0b0a468146/integration_tests/reading-browser.mjs)

- Source commit: [e02631d0efe6da4fb8bb36095c0c2f0b0a468146](https://github.com/rahuldave/smalldocs-pulse-reading/commit/e02631d0efe6da4fb8bb36095c0c2f0b0a468146)
- [Published manifest](https://github.com/rahuldave/smalldocs-pulse-reading/blob/e02631d0efe6da4fb8bb36095c0c2f0b0a468146/_extensions/pulse-reading/foundations.json) SHA-256: `272ef2054d08336592d526087db1ae6be86beda2d68d27c3ad2c5e9428ec092d`

### litera-reading

[Merged PR](https://github.com/rahuldave/smalldocs-litera-reading/pull/4) · [browser helper](https://github.com/rahuldave/smalldocs-litera-reading/blob/714bb3cf198ef1d4be7fe0f954061e5352d8a407/integration_tests/reading-browser.mjs)

- Source commit: [714bb3cf198ef1d4be7fe0f954061e5352d8a407](https://github.com/rahuldave/smalldocs-litera-reading/commit/714bb3cf198ef1d4be7fe0f954061e5352d8a407)
- [Published manifest](https://github.com/rahuldave/smalldocs-litera-reading/blob/714bb3cf198ef1d4be7fe0f954061e5352d8a407/_extensions/litera-reading/foundations.json) SHA-256: `eddd68b2ae7ebfb4b2f98be61da0f53e1cfe7bb0be8b9acb55a1d54ac139de0d`

### darkly-reading

[Merged PR](https://github.com/rahuldave/smalldocs-darkly-reading/pull/4) · [browser helper](https://github.com/rahuldave/smalldocs-darkly-reading/blob/5a3024001d402ce854b26e1e69b17dea7f1fe4d9/integration_tests/reading-browser.mjs)

- Source commit: [5a3024001d402ce854b26e1e69b17dea7f1fe4d9](https://github.com/rahuldave/smalldocs-darkly-reading/commit/5a3024001d402ce854b26e1e69b17dea7f1fe4d9)
- [Published manifest](https://github.com/rahuldave/smalldocs-darkly-reading/blob/5a3024001d402ce854b26e1e69b17dea7f1fe4d9/_extensions/darkly-reading/foundations.json) SHA-256: `b084c63f7487aeb8e93f690258cd7ab0384529ea6007a30656c4c2423124823d`

Tufte was introduced by [PR 1](https://github.com/rahuldave/smalldocs-tufte/pull/1) (initial merged revision `5044253`), then completed by PR 2 above. Its [consumer verification builder](https://github.com/rahuldave/smalldocs-tufte/blob/70a75da3a3dbc5e87f404fc350723799beca38b5/scripts/verify_consumers.py) builds current generated files with SmallDocs 0.5.5 and Quarto. Upstream repositories retain local build/test instructions and fixtures alongside these helpers.
