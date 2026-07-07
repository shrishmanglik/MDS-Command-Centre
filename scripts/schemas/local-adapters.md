# F5-MV-18 Local Adapter and Store Schemas

Status: active. Local-only. UNKNOWN stays UNKNOWN.
Authority: these files are D-local operating surfaces; GitHub is committed-code
authority; provider dashboards are live-state authority; E is backup-only.

## Adapter contract (every adapter in scripts/adapters/local-adapters.mjs)

Every adapter returns an envelope:

| Field | Meaning |
|---|---|
| adapter_id | stable id (local-files-adapter, drive-roots-adapter, vcos-adapter, midas-runtime-adapter, capability-broker-adapter, git-local-adapter, github-metadata-adapter, provider-cli-adapter, model-provider-adapter) |
| authority | what this adapter's data is and is not authority for |
| risk_class | green_readonly / yellow_metadata (nothing higher exists in this slice) |
| read_scope / write_scope | declared scopes; write_scope is "none" for all adapters |
| secret_policy | refuse secret-shaped paths; redact secret-shaped content; never read .env/keys/tokens/cookies/auth stores |
| mutation_policy | no provider mutation, deploy, push, external send, payment/auth/schema change |
| last_checked_at / duration_ms | probe timing |
| status | ok / degraded / failed - degraded and failed stay VISIBLE in the UI |
| unknowns | preserved UNKNOWN statements |
| evidence_paths | where the underlying evidence lives |
| data | adapter payload (stripped from localAdapterHealth.json) |

Timeouts: external commands run with hard timeouts (git 8-12s, gh 10s,
validators 25s, where.exe 5s). A timeout degrades the adapter; it never fakes
a value.

## Generated snapshots (scripts/refresh-local-adapters.mjs)

- src/data/localCapabilitySnapshot.json - capability broker records
  (providers/requests read from vcos/mds-kernel/midas-runtime/capabilities/),
  capability + studio-readiness validator summaries, provider CLI presence
  (presence only; live state always "UNKNOWN (request_only)"), model runtime
  presence (no server start, no downloads, no API calls), paid-API adapters as
  record_only/red.
- src/data/localSourceTruthSnapshot.json - drive roles (D active, E
  backup-only), allowlisted-root shallow listings (secret-shaped names refused
  and counted), VCOS department roster + MIDAS path conflict, MIDAS runtime
  surface counts, local git metadata (branch/HEAD/remote-sanitized/dirty, max
  12 product repos), GitHub auth presence (account name only, never tokens).
- src/data/localAdapterHealth.json - the adapter envelopes without payloads.

## Writable stores (serve.mjs, PUT-gated, atomic temp-rename, capped)

- src/data/localSourceEvidence.json - mds.command-centre.local-source-evidence.v1
  {records: [{id, sourceType(url|d-path|github-repo-ref|notebooklm-note|
  session-extract), pointer, evidenceNote, authorityClass, expectedUse,
  unknownsPreserved, forbiddenActions(fixed), status, createdAt, updatedAt}]}.
  Server REFUSES records whose pointer matches a secret-shaped path. Max 300.
- src/data/localCapabilityRequests.json - mds.command-centre.local-capability-requests.v1
  {records: [{id, requestKind, target, action, riskClass, authorityBasis,
  allowedActions, forbiddenActions, evidenceRequired, stopCondition,
  validationCommands, unknownsPreserved, closeoutFormat, owner, status,
  createdAt, updatedAt}]}. Server REFUSES red-class records stored as APPROVED:
  approval authority lives only in the MIDAS runtime chain. Max 300.

## Browse endpoint (GET /api/browse?path=...)

Allowlisted roots: Products, vcos, command-centre, output/playwright, and the
D-root top level. Refuses (403): secret-shaped path segments, paths outside the
allowlist, and any path escaping the D root. Directory listings return metadata
only (name/kind/size/mtime, max 200 entries, secret-shaped names filtered and
counted). File hits return metadata only - contents are never streamed in this
slice.

## What none of this ever does

No provider mutation. No deploy. No git stage/commit/push/checkout. No PR. No
payment/auth/schema/env change. No external send. No login scraping. No
cookie/session reads. No secret reads. No duplicate CEO/Board/kernel/source-map
/product-registry/memory-root files.
