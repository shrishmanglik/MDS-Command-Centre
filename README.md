# MDS Command Centre

Status: Sprint 001 local-first shell.

This app reads whitelisted seed files from `D:/Million Dollar AI Studio/command-centre/war-room/` and local MIDAS framework contracts into a local JSON snapshot, then renders an operator cockpit for Today, Inbox, Launch OS, Search, Queue, Boards, Runtime, Proof, Operator OS, Research, Runs, Tickets, Dispatch, Closeout, Review, Promote, Activity, Decisions, Benchmark, and Health.

The Inbox view is the first local-first gateway slice. It normalizes manual, synthetic, and local system signals into one queue, supports `NEW -> TRIAGED -> ROUTED -> CLOSED`, records source/provenance and risk, and generates a copyable routing preview. It does not connect to WhatsApp, Telegram, iMessage, Feishu, or any other external channel; it does not verify sender identity or send replies. Those provider and delivery states remain `UNKNOWN`.

The daemon wrapper keeps the loopback server process observable for an operating-system user service. `scripts/daemon.mjs` starts the server on `127.0.0.1`, probes `/api/health`, writes bounded process status under `output/daemon/`, exits after three consecutive health failures, and handles `SIGINT`/`SIGTERM` cleanly. The OS service manager owns restart behavior. Templates are provided for Linux user `systemd`, macOS `launchd`, and a Windows PowerShell entrypoint. Nothing installs or enables itself.

The Today view now renders a structured local control surface, not just Markdown board previews. It normalizes revenue truth, Product VCOS rows, frontend/backend/payment/deploy/provider gates, provider readiness blockers, Shrish-only approvals, active CEO work orders, agent assignments, failures, releases, content queue, Board decisions, CEO actions, next action, and nightly closeout evidence from the snapshot. Each row carries source evidence and claim ceilings so local readiness cannot become a live provider/payment/deployment claim.

The CEO work-order control creates file-backed local tickets from source-derived work orders and records a `ceo_work_order_created` Activity event. It does not launch agents, append the official ledger, promote company memory, push GitHub, mutate providers, deploy, move money, read secrets, or contact anyone externally.

When served through `npm run dev` or `npm run desktop`, local tickets are written to `src/data/localTickets.json` through a loopback-only API. If the API is unavailable, the browser falls back to `localStorage` and the UI labels that fallback.

Local ticket activity is written separately to `src/data/localActivityLog.json`. Activity events survive ticket cleanup and can be copied or downloaded as local evidence packets. They are not the official execution ledger, company memory, GitHub committed truth, or provider live-state proof.

Director decision exports are written to `src/data/localDecisionExports.json`. They assemble activity evidence into a signed local packet for later director/CEO/Board review. They do not append the official ledger, promote company memory, push GitHub, mutate providers, or prove live state.

The Queue view derives candidate work items from the existing War Room queue and work-order pack. Creating or dispatching from Queue only creates a D-local ticket; it does not mutate providers, GitHub, payment systems, dashboards, or external channels.

The Today and Queue views also surface local `READY_FOR_DIRECTOR_REVIEW` decision packets from `src/data/localDecisionExports.json`. These are manual review cues only: they do not append the official ledger, promote memory, mutate providers, push GitHub, or prove live state.

The Search view indexes loaded War Room boards, source-derived work items, product readiness rows, local tickets, activity events, and director decisions into one local routing surface. Operators can filter by type and lane, inspect lane/owner rollups, open the source view, create a local ticket from a result, save browser-local search views, generate a bulk dispatch packet from selected evidence items, or stage that packet into local Activity history. Search-derived tickets, saved views, and staged bulk dispatch packets remain D-local/browser-local only and inherit fail-closed stop conditions.

The Operator OS view joins the active objective, next safe action, source authority ladder, product operating rows, agent route controls, local gate counts, and a copyable `LOCAL_PACKET_ONLY` command packet. It can create a D-local operator ticket from the current spine, but it does not mutate providers, GitHub, payment rails, official ledger state, company memory, or external channels.

The Launch OS view turns the Command Centre itself into a category, UX, revenue, and launch-readiness surface. It records the section truth, primary/secondary users, operating category, whole-section scorecard, ideal information architecture, end-to-end UX journey, deterministic spine, revenue path, launch package, and 30/90/365 day product arc. It is strategy/readiness evidence only: it does not prove live deployment, payment configuration, provider state, auth state, customer demand, or revenue.

The Research view converts NotebookLM, GitHub repo, D-local docs, market research, or chat-extract findings into a 15-30 minute execution brief. It has a read-only Source intake lane backed by `src/data/localResearchSources.json` for D-local evidence pointers such as MIDAS Framework current session extracts, archived framework docs, and public-candidate repo paths. It forces source evidence, research summary, leverage claim, expected artifact, evidence requirement, proof condition, validation plan, stop condition, IP/publication classification, and UNKNOWN preservation before creating a local run. It also includes an archive-vs-current delta review desk backed by `src/data/localDeltaReviews.json`, where archived MIDAS patterns can be staged as `REUSE`, `REVISE`, or `PARK` only after naming archived evidence, current D authority checked, no-duplicate-kernel constraints, proof condition, stop condition, and UNKNOWN preservation. Saved `REUSE` or `REVISE` delta reviews can create D-local tickets and local run-control packets; `PARK` remains a hold state and cannot create operator work. Research briefs and delta reviews remain evidence inputs only; they do not override D doctrine, GitHub committed-code authority, provider live-state authority, official ledger review, or company-memory promotion gates.

The Runs view turns a local ticket into a founder-governed agent run-control packet with target agent, owner, approval class, allowed actions, forbidden actions, evidence requirement, proof condition, stop condition, validation plan, authority basis, and closeout format. Runs are stored in `src/data/localAgentRuns.json` and remain `LOCAL_RUN_CONTROL_ONLY`: they do not launch agents, deploy, mutate providers, push GitHub, append the official ledger, promote memory, move money, or contact anyone externally.

The Closeout view lets an operator paste an agent closeout, parse evidence and validation fields, save them back to the D-local ticket, and generate a ledger-ready CSV preview. It can also draft closeout fields from a linked local run packet as an import aid, but the draft keeps `NEEDS OPERATOR EVIDENCE` placeholders until a human/operator replaces them with actual proof and explicitly saves. Operators can snapshot that draft into local Activity as `closeout_draft_saved`; this preserves evidence context without changing ticket closeout fields, reviewer status, official ledger state, company memory, GitHub, or providers. Saved draft Activity events can be routed back to Closeout and applied to the visible form fields for editing, but that apply step is form-only and still does not save, approve, append, promote, or prove anything. It also shows an evidence resolver for the latest promotion preflight, including blocking fields, current `NEEDS_MORE_EVIDENCE` or `READY_FOR_DIRECTOR_REVIEW` status, a local resolver packet, and a guarded re-run action for director preflight. It does not append the official ledger, promote memory, approve the work, or convert local run-control packets into proof by itself.

The Review view is a local reviewer acceptance queue. It checks ticket readiness, closeout evidence, source-health matches, validation, UNKNOWN preservation, and authority conflicts before saving a local `ACCEPTED` or `NEEDS FIX` status. It includes a delta-derived work filter, linked-run panel, and evidence resolver so archive-vs-current tickets and their local run-control packets can be reviewed together before any promotion staging. It does not append the official ledger or promote memory.

The Promote view converts accepted local tickets into a director-ready promotion packet with checklist, ledger row candidate, memory action recommendation, and forbidden-action guardrails. It now includes promotion filters, delta-work visibility, linked-run/manual-authority preflight checks, and a local director preflight action that creates `READY_FOR_DIRECTOR_REVIEW` only when the preflight passes; otherwise it creates `NEEDS_MORE_EVIDENCE`. Staging and preflight exports are local state only; official ledger append and company-memory promotion remain outside the app.

The Activity view shows local evidence events for ticket creation, saves, closeouts, review decisions, promotion staging, bulk dispatch staging, imports, and deletion. Saved closeout draft events can open the linked ticket in Closeout with that Activity packet selected for form-only application. Activity remains an audit trail for operators and reviewers, not a promotion mechanism.

The Decisions view turns local activity events into director-ready export packets with evidence paths, validation, unknowns preserved, authority conflicts, memory action, and manual closeout requirements. It can filter and bundle multiple local activity events into one local director decision packet with a CSV ledger-staging candidate, including a dispatch-only path for staged bulk dispatch packets. The director review inbox shows pending `READY_FOR_DIRECTOR_REVIEW` packets, disposition counts, a local readiness checklist, and quick local disposition updates. It also generates a manual authority handoff packet with source-of-truth boundaries, readiness checks, forbidden actions, and `LOCAL_PACKET_ONLY` status for a responsible director, CEO, Board reviewer, or Shrish. It is a staging desk only; official ledger append and memory promotion remain manual authority-gated actions outside the app.

## Guardrails

- Local-first only.
- No deploy script.
- No provider dashboard, database, auth, billing, payment, or environment mutation.
- No `.env`, token, credential, private key, or provider secret reads.
- Live provider, revenue, payment, deployment, auth, and schema states remain `UNKNOWN` unless their owning authority proves them.

## Commands

```powershell
npm run refresh-data
npm run dev
npm run build
npm run desktop
npm run daemon:probe
npm run service:render
```

`npm run service:render` produces path-resolved systemd and launchd definitions under `output/daemon/service-config/`. Installation remains a manual operator action because persistence changes host state. The Windows entrypoint is `service/windows/run-command-centre-daemon.ps1`; registering it with Task Scheduler is intentionally not automatic.

There are no runtime npm dependencies for Sprint 001; the app is plain HTML, CSS, and JavaScript.

`npm run desktop` opens the local web app in a dedicated Edge or Chrome app window. It is a conservative desktop shell, not a packaged production desktop app.

Local API routes:

- `GET /api/health` reports snapshot and source-health state.
- `GET /api/tickets` reads the D-local ticket file.
- `PUT /api/tickets` writes sanitized local tickets.
- `GET /api/inbox` reads normalized manual/synthetic local inbox events.
- `PUT /api/inbox` writes sanitized local inbox events with unique IDs and bounded fields.
- `GET /api/activity` reads the D-local activity file.
- `PUT /api/activity` writes sanitized local activity events.
- `GET /api/decisions` reads D-local director decision exports.
- `PUT /api/decisions` writes sanitized local director decision exports.
- `GET /api/runs` reads D-local agent run-control records.
- `PUT /api/runs` writes sanitized local agent run-control records.
- `GET /api/research` reads D-local research-to-execution briefs.
- `PUT /api/research` writes sanitized local research-to-execution briefs.
- `GET /api/research-sources` reads sanitized D-local research source pointers only; it does not read source file bodies.
- `GET /api/delta-reviews` reads D-local archive-vs-current delta reviews.
- `PUT /api/delta-reviews` writes sanitized D-local archive-vs-current delta reviews.
- `POST /api/refresh-snapshot` regenerates the local war-room snapshot only.

## F5-MV-18: End-to-end VCOS operating cockpit surfaces

New lanes (left nav): **VCOS** (department roster, MIDAS path conflict, runtime
surface counts, studio/capability validator states), **Files** (allowlisted
D-root explorer with secret-path refusal; drives D active / E backup-only),
**Git Truth** (local branch/HEAD/remote metadata for D-root + product repos;
dirty state is preserved as `UNKNOWN` inside the adapter because full `git
status` can hang on large D-root worktrees; no push/PR ever), **Sources**
(evidence intake for URL / D-path / GitHub ref / NotebookLM note / session
extract; records only, no fetching, no login scraping), **Capabilities**
(capability broker records + local request packet creation + adapter health),
**Providers** (cloud/provider portals and CLIs as metadata-only/request-only
records), and **Models** (local OSS model runtime metadata plus paid API
adapter contracts; no model server starts, downloads, API calls, or env reads).

The app shell groups lanes by operating mode and shows a top readiness band for
adapter spine, local roots, provider CLI metadata, model runtime metadata, and
snapshot freshness. Lanes can be deep-linked with `?view=providers` and
`?view=models` for handoff/screenshot proof.

Adapter snapshots: `npm run refresh-data` builds both the war-room snapshot and
the local adapter snapshots. `node scripts/refresh-local-adapters.mjs` (or the
"Refresh adapters" button, `POST /api/refresh-adapters`) builds
`localCapabilitySnapshot.json`, `localSourceTruthSnapshot.json`,
`localAdapterHealth.json` and seeds the `localSourceEvidence.json` /
`localCapabilityRequests.json` stores. Degraded or failed adapters stay visible
- timeouts are never hidden. The static build now includes the adapter snapshots
and request/evidence stores.

Schemas: `scripts/schemas/local-adapters.md`. Hard boundaries unchanged: no
secrets/env reads, no provider mutation, no deploy/push/PR, no external sends,
no official-ledger append, no duplicate kernels/source maps.
