# Plotfoundry specification boundary

This directory owns the future language-neutral plotting contract. Piece 1 records
ownership only: `boundary.json` is scaffold metadata, **not** a plotting schema or
palette registry. It is not a runtime dependency of any package below.

Future promotion is separately authorized work. It imports exact published
foundation manifests from the nine authoritative upstream repositories at pinned
commits, plus approved frozen scientific decisions and assets. Native package
builds will bundle reviewed copies; installed use must never fetch research files
or require another sibling package, document engine or repository checkout.

No scientific data, fonts, adapters or renderer configuration is shipped here yet.
New scaffold metadata/documentation is MIT licensed; future imported assets retain
their original licenses and notices.
