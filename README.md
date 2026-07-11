# MDS Command Centre

Status: Sprint 001 local-first shell.

This app reads whitelisted seed files from `D:/Million Dollar AI Studio/command-centre/war-room/` and local MIDAS framework contracts into a local JSON snapshot, then renders an operator cockpit for Today, Inbox, Launch OS, Search, Queue, Boards, Runtime, Proof, Operator OS, Research, Runs, Tickets, Dispatch, Closeout, Review, Promote, Activity, Decisions, Benchmark, and Health.

The Inbox view is the first local-first gateway slice. It normalizes manual, synthetic, and local system signals into one queue, supports `NEW -> TRIAGED -> ROUTED -> CLOSED`, records source/provenance and risk, and generates a copyable routing preview. It does not connect to WhatsApp, Telegram, iMessage, Feishu, or any other external channel; it does not verify sender identity or send replies. Those provider and delivery states remain `UNKNOWN`.

The daemon wrapper keeps the loopback server process observable for an operating-system user service. `scripts/daemon.mjs` starts the server on `127.0.0.1`, probes `/api/health`, writes bounded process status under `output/daemon/`, exits after three consecutive health failures, and handles `SIGINT`/`SIGTERM` cleanly. The OS service manager owns restart behavior. Templates are provided for Linux user `systemd`, macOS `launchd`, and a Windows PowerShell entrypoint. Nothing installs or enables itself.

The zero-trust pairing gate quarantines every previously unseen channel/sender stream. Intake returns a one-time key while `src/data/localPairings.json` stores only its SHA-256 digest. The stream remains `QUARANTINED` with `executionAllowed=false` until an operator runs `midas pairing approve <pairing-key>` (or `node scripts/midas.mjs pairing approve <pairing-key>` from the repo). Pairing changes the stream to `PAIRED`; it does not itself authorize a model run, code execution, provider access, external send, or identity claim. A separate governed run remains mandatory.

The dynamic workspace router maps each paired stream to exactly one generated workspace under `output/workspaces/`. Unpaired streams fail with `PAIRING_REQUIRED`; callers cannot provide filesystem paths or workspace IDs. Each workspace contains a bounded `manifest.json`, `context.md`, and `inbox-events.json`, and agents are restricted to the local allowlist (`Codex`, `Claude Code`, `Antigravity`, `Human`). Workspace routing remains local-only and grants no execution or external authority.

The Voice lane implements an operator-triggered local wake service around the wake word `Midas`. Browser microphone capture never auto-starts and is enabled only when the loopback API verifies local `ffmpeg`, app-owned `voice/bin/whisper-cli.exe` (or a PATH fallback), and the app-owned `voice/models/ggml-base.en.bin` model. Five-second WebM/WAV chunks are bounded, converted and transcribed through fixed executable arguments without a shell, and retained under `output/voice/jobs/` as local evidence. Transcripts become drafts through a deterministic command gate. Voice may draft safe view navigation or workspace notes; code execution, shell commands, pairing approval, provider actions, deployment, payments, secret access, and external sends are blocked. Engine and model artifacts are machine-local and excluded from Git.

The Models lane includes a credential-blind failover resolver. Auth profiles store names and verification state only; credential values remain provider-owned and unread. Explicit `rate_limit`, `quota_exhausted`, `auth_unavailable`, and `runtime_unavailable` signals open bounded local circuit breakers, then atomically re-resolve through the next verified profile, a task-aware installed Ollama model chain, or `manual-offline-handoff`. Local inventory comes from bounded `ollama list` metadata and excludes `:cloud` entries. Route receipts always preserve `executionStarted=false` until a separate runtime proves execution.

The local interoperability contract maps stable `chat`, `embedding`, and `vector_search` operations to explicitly declared offline adapters. Selection requires `local=true`, `status=AVAILABLE`, a matching interface, sufficient context capacity, and a closed circuit; priority then resolves deterministically. Cloud inventory is never eligible, prompts do not require modification, and unavailable capabilities return `BLOCKED_NO_LOCAL_ADAPTER`. Contract receipts do not call, download, or start models and preserve `executionStarted=false`.

The Live Canvas lane is a local A2UI editor with a component palette, responsive visual stage, document list, selected-component inspector, drag/reorder controls, workspace binding, local save, and agent JSON import. The server accepts only `heading`, `text`, `metric`, `button`, `input`, `notice`, `divider`, and `table` records with bounded tones and widths. HTML, scripts, URLs, event handlers, templates, embedded media, CSS, and executable actions are rejected. Agent imports remain `DRAFT_LOCAL`; only an operator can save them, and every document preserves `executionAllowed=false`.

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
npm run doctor
npm run skills:validate -- skill-packs/local-review
npm run eval -- workflows/example-review.workflow.yaml
npm run hooks:install
npm run docs:check
npm run docs:frontmatter
npm run verify:gaps
npm run harness:export
npm run harness:check
npm run workflow:parse
npm run release:audit
npm run party:list
npm run refresh-data
npm run dev
npm run build
npm run desktop
npm run daemon:probe
npm run service:render
npm run test:pairing
npm run test:workspace-router
npm run test:voice-gate
npm run test:model-router
npm run test:a2ui
```

`midas doctor` (or `npm run doctor`) is the fail-closed startup guard for local paths and security defaults. It verifies required directories and bounded writability, explicit loopback binding, tracked secret-shaped filenames, digest-only pairing fields, `.env` ignore rules, and optional voice readiness. Credential-shaped environment variables are counted by name only; names and values are withheld, and `.env`, key, token, cookie, auth, and credential files are never opened. Blocking findings prevent `dev`, `daemon`, tray, and desktop startup through npm pre-hooks. Provider and credential validity remain `UNKNOWN`.

`midas skills validate <pack-path>` validates JSON or YAML Skill Pack manifests offline before loading. The `mds.skill-pack.v1` contract enforces exact fields, semver, allowlisted capabilities, explicit permissions, bounded typed inputs/outputs, a contained Markdown entrypoint, duplicate-key rejection, and secret/executable/network field refusal. A valid receipt means structural eligibility only; it does not install, load, execute, trust, or grant authority to the pack.

`midas eval <workflow-path>` runs the Three-Layer Quality Evaluator. Static and deterministic rubric layers produce a provisional 1–5 grade, then exactly 50 SHA-256-seeded mutation trials measure mean, standard deviation, range, and stability rate. The LLM Judge layer remains `NOT_RUN` unless a hash-bound `mds.llm-judge-receipt.v1` with `VERIFIED_LOCAL_JUDGE` evidence is supplied via `--judge-receipt`; without that evidence, certification is `BLOCKED_LLM_JUDGE_EVIDENCE` even when the provisional grade and stability pass. No provider call or model result is fabricated.

`npm run hooks:install` configures this repository to use `.githooks/`. The pre-commit documentation-staleness guard evaluates staged filenames only and requires mapped API/CLI/runtime/desktop/mobile documentation in the same commit as corresponding source changes. `npm run docs:check` runs the staged check directly, while CI evaluates the pushed commit range so bypassing a local hook cannot bypass integration. Secret-shaped filenames are withheld and file contents are never read. Passing confirms mapping coverage only, not documentation accuracy or live-state truth.

`midas docs validate [root]` (or `npm run docs:frontmatter`) validates generated product briefs and user journeys under `generated-docs/`. It enforces exact frontmatter key order, collection-specific document types, contiguous unique `navIndex` values, `NN-slug.md` filename alignment, ISO dates, bounded statuses, and `LOCAL_DRAFT_ONLY` authority. The pre-commit hook runs it after the staleness guard. Validation aligns metadata only; it does not approve document content or public claims.

`npm run verify:gaps` is the mandatory third-tier AST review gate. Machine-readable `work-orders/verification/*.verification.yaml` contracts name required JavaScript/TypeScript symbols by file, kind, name, and export requirement. `@ast-grep/napi` parses changed protected source files; missing contract coverage, missing functions/classes/methods, wrong kinds, absent exports, parse failures, and unsafe paths block commit and CI integration. Passing proves requested symbol presence only, not behavior or test adequacy.

`npm run harness:export` compiles `harness-sources/local-proof-review.md` into deterministic native project assets for Claude (`.claude/agents`), Cursor (`.cursor/rules`), Gemini CLI (`.gemini/commands`), and GitHub Copilot (`.github/prompts`). The governed source allowlists read-only tools, rejects secret-shaped paths and execution/file-injection directives, and emits a SHA-256 manifest. `npm run harness:check` is read-only and fails on missing or changed generated output. Exporting configuration does not install an editor integration, access credentials, call a provider, or grant execution authority.

`npm run workflow:parse` parses a governed `Read fully and follow:` Markdown checklist into a deterministic JSON plan. Every step must be unchecked, sequentially numbered, and include `Action`, `Verify`, and `Stop if` fields. Generic `execute` instructions, missing verification, pre-checked steps, sequence gaps, malformed metadata, and secret-shaped input paths fail closed. The receipt makes only the first step eligible and records `executionStarted=false`; parsing never runs a command or workflow.

`npm run release:audit` compiles the cross-platform, CI-safe `HEAD~1..HEAD` committed range into a conventional-commit changelog and machine-readable audit receipt; `midas release audit <range>` accepts a wider validated range when local history is available. Agent personas and human operators are credited only from explicit `Agent:` and `Operator:` commit trailers; missing credits remain `UNKNOWN`, malformed credits are excluded, and unattributed commits are counted. Git is invoked without a shell, with a 200-commit ceiling and timeout. The audit never creates or moves tags, publishes releases, deploys, or infers provider state.

Party Mode persists bounded local deliberation rooms through `midas party create`, `contribute`, `decide`, and `list`. An approved handoff requires recorded contributions from PM, Architect, and Developer plus an explicit human operator decision. Contributions are evidence records with `identityProof=NOT_VERIFIED`; they do not prove that an autonomous persona ran. Rooms never spawn agents or begin implementation, and every readiness receipt preserves `executionStarted=false` and `spawnAuthorityGranted=false`.

Each Party Mode contribution is also written to an independently capped PM, Architect, or Developer memory buffer. `midas memory read <room-id> <role>` returns only the requested role buffer plus the names of excluded roles; entries are pruned oldest-first above 12,000 characters to bound context growth. Persona memory remains local and records `identityProof=NOT_VERIFIED`.

`midas loop run <room-id> <quick|full|comma-separated-scripts>` runs a `HANDOFF_READY` room through a fixed profile or up to five allowlisted local stages. `quick` runs lint, AST verification, and static compilation; `full` adds documentation and model-router unit checks. It stops on the first failure, permits one attempt per stage, bounds subprocess time and output, redacts credential-shaped assignments, and emits a correction packet for agent handoff. The packet never starts self-correction: code edits and reruns require a separate approved action. The loop cannot invoke arbitrary commands, deploy, push, merge, or call providers.

Graph Studio (`graph-editor.html`) is a local visual state-machine editor for start, agent, gate, tool, and end nodes with conditional edges and explicit loop edges. Drafts persist in browser local storage and remain `EXECUTION OFF`. The graph validator caps graphs at 50 nodes and 100 edges; loop edges require `maxIterations` from 2 to 20. The parallel wave scheduler selects only dependency-ready nodes, caps concurrency at four, and runs injected local workers with `nextWaveRequiresReview=true`. It does not spawn provider agents or subprocesses.

`midas workers run <task-file.json>` spawns up to four isolated Node worker threads using an ID-bound RPC message protocol. Task files may contain at most 16 bounded `test-plan`, `text-metrics`, `json-validate`, or `sha256` tasks. Each worker receives only one serialized payload, runs with memory and time limits, returns one bounded result, and is terminated. Arbitrary code, shell commands, filesystem tools, provider calls, and credential reads are unavailable. This reduces parent-context pollution but does not claim literal zero token or compute cost.

`midas customizer validate <config.toml>` parses strict TOML agent metadata with `smol-toml`. The `mds.customizer.v1` schema accepts only agent ID, bounded prompt, up to five allowlisted tools, capped tool/output limits, and three mandatory safety rules. Unknown tables or fields, duplicate TOML keys, unsafe prompt directives, secret-shaped paths, unapproved tools, excessive bounds, and attempts to disable work-order, provider-mutation, or UNKNOWN-preservation rules fail closed. A valid receipt remains `applied=false`; runtime application is a separate governed action.

The cross-platform signaling gateway stages task and heartbeat envelopes for Feishu, Slack, Teams, and generic adapters in `localTeamSignals.json`. `midas signals stage <signal.json>` normalizes and deduplicates a local signal; `midas signals list` reads the outbox. Destination references are opaque IDs, not endpoints. Secret-shaped content, URLs, markup, malformed progress, unsupported platforms, and oversized fields are rejected. Platform payloads are previews with `sendStarted=false`, `endpointResolved=false`, and credential state `UNKNOWN`; no external message or webhook is sent.

`midas tasks restructure <tasks.json>` proposes direct task routing by replacing Scrum Master, Coordinator, Task Manager, and Administrator relay assignments with Developer while preserving PM, Architect, QA, Human, and existing Developer ownership. It emits a receipt with `sourceModified=false` and never starts execution or overwrites the input manifest.

`midas game inspect <project-path>` detects Unity, Unreal, or Godot from manifest paths and returns engine-specific compile/test command previews. It does not read manifest bodies or game assets, probe engine installations, import assets, or start compilation; engine availability remains `UNKNOWN`.

`midas help [open-file ...]` is a deterministic local companion that combines bounded `git status --porcelain -uno` metadata with explicitly named open-file existence checks. It excludes secret-shaped paths, reads no file bodies, makes no provider call, and suggests one next action for clean, modified, staged, or Git-unknown states. This is rule-based guidance, not a live AI chat claim.

`midas profile record <observation.json>` records explicit, source-referenced developer preferences in coding-style, tooling, verification, communication, or workflow categories; `midas profile show` derives the reviewable model. Claims require support from at least two distinct sources and more support than contradiction before becoming `ACCEPTED_REVIEWABLE`. Conflicting evidence remains `DISPUTED`. Sensitive personal attributes and hidden telemetry are excluded, and every claim preserves `autoApplied=false`; current instructions, work orders, and safety rules always outrank the profile.

`midas experience compile <trajectory.json>` converts an explicitly operator-approved `SUCCESS` trajectory into a new draft `mds.skill-pack.v1` directory under `output/generated-skill-packs/`. Trajectories require 2–12 ordered action/verification steps and may include only narrowly allowlisted npm verification commands with no shell metacharacters or secret-shaped content. The compiler runs the offline Skill Pack validator immediately. Successful output remains `installed=false`, `loaded=false`, and `executionApproved=false`; an operator must separately review and promote it.

`midas skills load <task text>` assembles prompt context through progressive disclosure. It reads the bounded local trigger registry, matches normalized keyword phrases, selects at most three skills, validates each matched pack, and only then reads matched `SKILL.md` instructions. Unmatched skill bodies are not read or included. A match assembles local context only; it does not install, execute, trust, or grant permissions to the pack.

The governed outbound HTTP path is `POST /api/http-proxy`. It accepts only HTTP(S) GET/HEAD requests, blocks userinfo and custom ports, resolves and validates every DNS answer, rejects private/link-local/loopback/reserved/metadata targets, pins the approved address during connection, and revalidates every redirect. It strips caller credentials and proxy environment behavior and bounds redirects, time, and response size. Docker sandboxes remain `--network none`; direct subagent egress is not enabled. This is a loopback governed egress path, not transparent host-wide interception.

`npm run service:render` produces path-resolved systemd and launchd definitions under `output/daemon/service-config/`. Installation remains a manual operator action because persistence changes host state. The Windows entrypoint is `service/windows/run-command-centre-daemon.ps1`; registering it with Task Scheduler is intentionally not automatic.

`npm run tray` starts the Windows system-tray companion. Its menu can start, stop, or restart only the daemon process owned by that tray session, open the local Command Centre, run bounded diagnostics, and open local daemon logs. A pre-existing server is monitored but never terminated. `npm run tray:diagnostics` emits the same no-secret readiness record without opening a UI. The tray does not install itself, elevate privileges, register startup persistence, mutate providers, or prove external state. macOS menu-bar support remains unsupported.

There are no runtime npm dependencies for Sprint 001; the app is plain HTML, CSS, and JavaScript.

`npm run desktop` opens the local web app in a dedicated Edge or Chrome app window. It is a conservative desktop shell, not a packaged production desktop app.

Local API routes:

- `GET /api/health` reports snapshot and source-health state.
- `GET /api/tickets` reads the D-local ticket file.
- `PUT /api/tickets` writes sanitized local tickets.
- `GET /api/inbox` reads normalized manual/synthetic local inbox events.
- `PUT /api/inbox` writes sanitized local inbox events with unique IDs and bounded fields.
- `POST /api/inbox/intake` derives stream identity, enforces quarantine/pairing state, and returns a new pairing key once.
- `POST /api/mobile-node/intake` accepts bounded, signature-checked screenshot or voice-note artifacts from an explicit-capture mobile node and creates a quarantined inbox input with `executionAllowed=false`.
- `POST /api/http-proxy` performs bounded public GET/HEAD requests through DNS-pinned SSRF and redirect validation without forwarding caller credentials.
- `GET /api/pairing` returns pairing metadata without key digests or plaintext keys.
- `GET /api/workspaces` returns the sanitized local workspace registry.
- `POST /api/workspaces/route` idempotently maps a paired Inbox stream into a contained local workspace.
- `GET /api/voice/status` reports local offline engine/model readiness without reading credential values.
- `GET /api/voice/commands` returns local draft history.
- `POST /api/voice/transcript` evaluates a local transcript through the wake/command gate.
- `POST /api/voice/audio` accepts bounded local audio only when the offline adapter is ready.
- `GET /api/model-router/status` reports names-only profiles, local model inventory, circuits, chains, and receipts.
- `POST /api/model-router/resolve` creates a task-class routing receipt without executing a model.
- `POST /api/model-router/failure` opens a bounded circuit and returns the next eligible route.
- `GET /api/canvas` reads sanitized local A2UI documents.
- `PUT /api/canvas` writes bounded local A2UI documents.
- `POST /api/canvas/import` sanitizes an agent-supplied A2UI draft without saving or executing it.
- `GET /api/sandbox/status` reports Docker readiness, fixed images, isolation policy, and bounded local receipts.
- `POST /api/sandbox/execute` runs allowlisted Node.js or Python source in an ephemeral, networkless Docker container. It never falls back to the host shell or pulls missing images.
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
