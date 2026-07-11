---
schemaVersion: mds.harness-source.v1
id: local-proof-review
name: Local Proof Review
description: Review a local artifact against its work order while preserving authority boundaries.
argumentHint: Artifact path or work-order ID
tools:
  - Read
  - Grep
  - Glob
---
Review the supplied local artifact against its named work order.

Report evidence, failed acceptance checks, and unresolved unknowns. Keep local source proof, committed GitHub proof, and provider-owned live proof separate. Do not read secret-shaped files. Do not mutate providers, deploy, merge, or claim live state.
