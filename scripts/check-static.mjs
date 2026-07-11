import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "index.html",
  "src/styles.css",
  "src/static-app.js",
  "src/data/warRoomSnapshot.json",
  "src/data/localTickets.json",
  "src/data/localActivityLog.json",
  "src/data/localDecisionExports.json",
  "src/data/localResearchSources.json",
  "src/data/localResearchBriefs.json",
  "src/data/localDeltaReviews.json",
  "src/data/localAgentRuns.json",
  "src/data/localCapabilitySnapshot.json",
  "src/data/localSourceTruthSnapshot.json",
  "src/data/localAdapterHealth.json",
  "src/data/localSourceEvidence.json",
  "src/data/localCapabilityRequests.json",
  "src/data/localInboxEvents.json",
  "src/data/localPairings.json",
  "src/data/localWorkspaces.json",
  "src/data/localVoiceCommands.json",
  "src/data/localModelRouter.json",
  "src/data/localCanvasDocuments.json",
  "src/data/localSandboxReceipts.json",
  "desktop/launch-command-centre.ps1",
  "desktop/command-centre-tray.ps1",
];

const missing = required.filter((relativePath) => !fs.existsSync(path.join(appRoot, relativePath)));
if (missing.length) {
  throw new Error(`Missing required files: ${missing.join(", ")}`);
}

const html = fs.readFileSync(path.join(appRoot, "index.html"), "utf8");
const js = fs.readFileSync(path.join(appRoot, "src/static-app.js"), "utf8");
if (html.includes('href="/src/') || html.includes('src="/src/') || js.includes("fetch(`/src/")) {
  throw new Error("Static asset and snapshot paths must remain deployment-relative.");
}
const snapshot = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/warRoomSnapshot.json"), "utf8"));
const tickets = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localTickets.json"), "utf8"));
const activity = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localActivityLog.json"), "utf8"));
const decisions = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localDecisionExports.json"), "utf8"));
const runs = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localAgentRuns.json"), "utf8"));
const research = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localResearchBriefs.json"), "utf8"));
const researchSources = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localResearchSources.json"), "utf8"));
const deltaReviews = JSON.parse(fs.readFileSync(path.join(appRoot, "src/data/localDeltaReviews.json"), "utf8"));

if (!html.includes("/src/static-app.js")) throw new Error("index.html does not load the static app.");
if (!js.includes("mds-command-centre:tickets:v1") || !js.includes("localStorage.getItem") || !js.includes("localStorage.setItem")) {
  throw new Error("ticket persistence checks did not find localStorage read/write usage.");
}
if (!js.includes("Generate dispatch packet")) throw new Error("dispatch UI label missing.");
if (
  !js.includes("controlSurface()") ||
  !js.includes("Five Product VCOS feed") ||
  !js.includes("Shrish decisions and approvals only") ||
  !js.includes("CEO work-order control") ||
  !js.includes("Nightly closeout") ||
  !js.includes("data-control-work-order") ||
  !js.includes("ceo_work_order_created")
) {
  throw new Error("structured control-surface Today dashboard or CEO work-order wiring is missing.");
}
const requiredNavLabels = [
  "Queue",
  "Search",
  "Runtime",
  "Proof",
  "Operator OS",
  "Research",
  "Runs",
  "Closeout",
  "Review",
  "Promote",
  "Activity",
  "Decisions",
];
if (requiredNavLabels.some((label) => !js.includes(`"${label}"`))) {
  throw new Error("queue/runtime/proof/operator/research/runs/closeout/review/promote/activity/decisions navigation missing.");
}
if (!js.includes("buildOperatorSpinePacket") || !js.includes("Operator OS spine") || !js.includes("create-spine-ticket") || !js.includes("operator_spine_ticket_created")) {
  throw new Error("Operator OS spine and local ticket wiring is missing.");
}
const requiredSystemNavLabels = ["VCOS", "Files", "Git Truth", "Sources", "Capabilities", "Providers", "Models"];
if (requiredSystemNavLabels.some((label) => !js.includes(`"${label}"`))) {
  throw new Error("F5-MV-18 VCOS/Files/Git/Sources/Capabilities/Providers/Models navigation missing.");
}
if (!js.includes('"Launch OS"') || !js.includes("renderLaunchOs") || !js.includes("Founder VCOS operating cockpit")) {
  throw new Error("Launch OS strategy/readiness lane is missing.");
}
if (!js.includes("commandReadinessBand") || !js.includes("Adapter spine")) {
  throw new Error("Command Centre top readiness band is missing.");
}
if (!js.includes("source_evidence_recorded") || !js.includes("/api/source-evidence") || !js.includes("capability_request_created") || !js.includes("/api/capability-requests")) {
  throw new Error("F5-MV-18 source-evidence and capability-request wiring is missing.");
}
if (!js.includes("/api/browse") || !js.includes("secret-shaped") || !js.includes("refresh-adapters")) {
  throw new Error("F5-MV-18 allowlisted browse, secret refusal, or adapter refresh wiring is missing.");
}
const serveJs = fs.readFileSync(path.join(appRoot, "scripts/serve.mjs"), "utf8");
if (!serveJs.includes("SECRET_PATH_PATTERN") || !serveJs.includes("/api/browse") || !serveJs.includes("writeSourceEvidence") || !serveJs.includes("writeCapabilityRequests")) {
  throw new Error("F5-MV-18 server-side secret refusal or new stores are missing.");
}
const adapterModule = fs.readFileSync(path.join(appRoot, "scripts/adapters/local-adapters.mjs"), "utf8");
if (!adapterModule.includes("isSecretShapedPath") || !adapterModule.includes("isInsideDroot") || !adapterModule.includes("no provider mutation")) {
  throw new Error("F5-MV-18 adapter secret/mutation policy is missing.");
}
if (!js.includes("buildRunPacket") || !js.includes("LOCAL_RUN_CONTROL_ONLY") || !js.includes("agent_run_draft_created") || !js.includes("/api/runs")) {
  throw new Error("local agent run-control wiring is missing.");
}
if (!js.includes("buildResearchPacket") || !js.includes("LOCAL_RESEARCH_TO_RUN_ONLY") || !js.includes("research_run_staged") || !js.includes("/api/research")) {
  throw new Error("local research-to-execution wiring is missing.");
}
if (!js.includes("briefFromResearchSource") || !js.includes("research_source_brief_created") || !js.includes("/api/research-sources")) {
  throw new Error("research source intake wiring is missing.");
}
if (
  !js.includes("buildDeltaPacket") ||
  !js.includes("LOCAL_DELTA_REVIEW_ONLY") ||
  !js.includes("delta_review_created") ||
  !js.includes("ticketFromDeltaReview") ||
  !js.includes("runFromDeltaReview") ||
  !js.includes("stageDeltaWork") ||
  !js.includes("pendingDeltaStage") ||
  !js.includes("data-delta-stage-submit") ||
  !js.includes("deltaExecutionGate") ||
  !js.includes("delta_ticket_staged") ||
  !js.includes("delta_run_staged") ||
  !js.includes("create-ticket-from-delta") ||
  !js.includes("create-run-from-delta") ||
  !js.includes("/api/delta-reviews") ||
  !js.includes("duplicate kernels")
) {
  throw new Error("archive-vs-current delta review or ticket/run staging wiring is missing.");
}
if (!js.includes("copyTextToClipboard") || !js.includes("document.execCommand(\"copy\")")) {
  throw new Error("packet copy fallback wiring is missing.");
}
if (!js.includes("data-queue-ticket") || !js.includes("ticketFromQueueItem")) {
  throw new Error("source-derived queue to ticket wiring is missing.");
}
if (!js.includes("commandSearchItems") || !js.includes("routingRollups") || !js.includes("data-search-ticket")) {
  throw new Error("command search and lane/owner rollup wiring is missing.");
}
if (!js.includes("storageSearchViewsKey") || !js.includes("buildBulkDispatchPacket") || !js.includes("data-search-select")) {
  throw new Error("saved search views and bulk dispatch selection wiring is missing.");
}
if (!js.includes("bulkDispatchActivityTicket") || !js.includes("bulk_dispatch_staged") || !js.includes("save-bulk-dispatch")) {
  throw new Error("bulk dispatch Activity staging wiring is missing.");
}
if (!js.includes("export-tickets") || !js.includes("ticket-import")) {
  throw new Error("ticket import/export controls missing.");
}
if (!js.includes("delete-ticket")) {
  throw new Error("ticket deletion control missing.");
}
if (!js.includes("validateTicket") || !js.includes("Local Readiness Gate")) {
  throw new Error("ticket readiness validation is missing.");
}
if (!js.includes("parseCloseout") || !js.includes("buildLedgerPreview") || !js.includes("closeout-form")) {
  throw new Error("closeout intake and ledger preview wiring is missing.");
}
if (
  !js.includes("buildCloseoutDraftFromRun") ||
  !js.includes("renderCloseoutImportAid") ||
  !js.includes("insert-closeout-draft") ||
  !js.includes("copy-closeout-draft") ||
  !js.includes("download-closeout-draft") ||
  !js.includes("save-closeout-draft-evidence") ||
  !js.includes("closeout_draft_saved")
) {
  throw new Error("closeout run-packet import aid wiring is missing.");
}
if (
  !js.includes("pendingCloseoutDraftEventId") ||
  !js.includes("renderPendingCloseoutDraftPanel") ||
  !js.includes("applyCloseoutDraftEventToForm") ||
  !js.includes("route-closeout-draft") ||
  !js.includes("apply-pending-closeout-draft") ||
  !js.includes("pending-closeout-draft-event")
) {
  throw new Error("Activity-to-Closeout draft apply wiring is missing.");
}
if (!js.includes("reviewChecklist") || !js.includes("buildReviewPacket") || !js.includes("mark-accepted")) {
  throw new Error("reviewer acceptance queue wiring is missing.");
}
if (
  !js.includes("reviewQueueTickets") ||
  !js.includes("reviewQueueCounts") ||
  !js.includes("isDeltaDerivedTicket") ||
  !js.includes("linkedRunsForTicket") ||
  !js.includes("data-review-filter") ||
  !js.includes("data-open-run")
) {
  throw new Error("delta-derived review queue filtering or linked-run wiring is missing.");
}
if (!js.includes("promotionChecklist") || !js.includes("buildPromotionPacket") || !js.includes("mark-promotion-staged")) {
  throw new Error("promotion staging packet wiring is missing.");
}
if (
  !js.includes("buildPromotionPreflight") ||
  !js.includes("buildPromotionPreflightPacket") ||
  !js.includes("preparePromotionDirectorPreflight") ||
  !js.includes("data-promotion-filter") ||
  !js.includes("prepare-promotion-preflight") ||
  !js.includes("promotion_preflight_prepared")
) {
  throw new Error("promotion preflight/director handoff wiring is missing.");
}
if (
  !js.includes("promotionEvidenceResolution") ||
  !js.includes("buildEvidenceResolutionPacket") ||
  !js.includes("renderEvidenceResolutionPanel") ||
  !js.includes("copy-evidence-resolution") ||
  !js.includes("download-evidence-resolution")
) {
  throw new Error("Closeout/Review evidence-resolution wiring is missing.");
}
if (!js.includes("recordActivity") || !js.includes("buildActivityPacket") || !js.includes("/api/activity")) {
  throw new Error("local activity trail wiring is missing.");
}
if (!js.includes("buildDirectorDecisionPacket") || !js.includes("localDecisionExports.json") || !js.includes("/api/decisions")) {
  throw new Error("director decision export wiring is missing.");
}
if (!js.includes("buildDecisionLedgerCandidate") || !js.includes("sourceEventIds") || !js.includes("new-decision-bundle")) {
  throw new Error("director bundle and local ledger-staging wiring is missing.");
}
if (!js.includes("dispatchDecisionEvents") || !js.includes("new-dispatch-decision-bundle") || !js.includes("director_dispatch_bundle_created")) {
  throw new Error("dispatch-to-director bundle wiring is missing.");
}
if (!js.includes("pendingDirectorBundles") || !js.includes("data-open-decision") || !js.includes("Pending director review") || !js.includes("Director review queue")) {
  throw new Error("Today/Queue director-review signal wiring is missing.");
}
if (!js.includes("decisionReadiness") || !js.includes("Director review inbox") || !js.includes("data-decision-disposition") || !js.includes("director_decision_disposition_updated")) {
  throw new Error("director review inbox/readiness/disposition wiring is missing.");
}
if (!js.includes("buildAuthorityHandoffPacket") || !js.includes("Manual authority handoff") || !js.includes("copy-authority-handoff") || !js.includes("handoff_status: LOCAL_PACKET_ONLY")) {
  throw new Error("manual authority handoff packet wiring is missing.");
}
if (!js.includes("/api/tickets") || !js.includes("/api/health") || !js.includes("refresh-snapshot")) {
  throw new Error("local API persistence/health wiring is missing.");
}
if (!js.includes("renderInbox") || !js.includes("inboxRoutingPacket") || !js.includes("/api/inbox") || !js.includes("LOCAL_PACKET_ONLY")) {
  throw new Error("local inbox intake, state machine, or routing-preview wiring is missing.");
}
const server = fs.readFileSync(path.join(appRoot, "scripts", "serve.mjs"), "utf8");
const pairingCli = fs.readFileSync(path.join(appRoot, "scripts", "midas.mjs"), "utf8");
if (!server.includes("/api/inbox/intake") || !server.includes("pairingStatus") || !server.includes("BLOCKED_PAIRING_REQUIRED") || !server.includes("executionAllowed")) {
  throw new Error("server-side inbox pairing enforcement is missing.");
}
if (!pairingCli.includes("pairing approve") || !pairingCli.includes("executionAuthority")) {
  throw new Error("manual pairing approval CLI is missing or overclaims execution authority.");
}
const workspaceStore = fs.readFileSync(path.join(appRoot, "scripts", "lib", "workspace-store.mjs"), "utf8");
if (!server.includes("/api/workspaces/route") || !server.includes("routeStreamToWorkspace") || !workspaceStore.includes("PAIRING_REQUIRED") || !workspaceStore.includes("Workspace path escaped")) {
  throw new Error("pairing-gated contained workspace routing is missing.");
}
if (!js.includes("renderWorkspaces") || !js.includes("route-inbox-workspace") || !js.includes("One paired stream, one contained workspace")) {
  throw new Error("workspace router operator surface is missing.");
}
const voiceGate = fs.readFileSync(path.join(appRoot, "scripts", "lib", "voice-gate.mjs"), "utf8");
if (!server.includes("/api/voice/audio") || !server.includes("voiceEngine") || !server.includes("whisper-cli.exe") || !server.includes("transcribeLocalAudio") || !voiceGate.includes("BLOCKED_FORBIDDEN_VOICE_ACTION")) {
  throw new Error("local offline voice adapter or deterministic wake gate is missing.");
}
if (!js.includes("renderVoice") || !js.includes("startVoiceCapture") || !js.includes("voice-transcript-form") || !js.includes("executionAllowed=false")) {
  throw new Error("voice operator surface or fail-closed draft copy is missing.");
}
const modelRouter = fs.readFileSync(path.join(appRoot, "scripts", "lib", "model-router.mjs"), "utf8");
if (!server.includes("/api/model-router/resolve") || !server.includes("/api/model-router/failure") || !server.includes("credentialRef: \"PROVIDER_OWNED_NOT_READ\"") || !modelRouter.includes("quota_exhausted")) {
  throw new Error("credential-blind model failover or circuit-breaker API is missing.");
}
if (!js.includes("model-route-form") || !js.includes("model-failure-form") || !js.includes("executionStarted=false")) {
  throw new Error("model failover operator controls or claim ceiling is missing.");
}
const a2uiStore = fs.readFileSync(path.join(appRoot, "scripts", "lib", "a2ui-store.mjs"), "utf8");
if (!server.includes("/api/canvas/import") || !server.includes("sanitizeA2UIDocument") || !a2uiStore.includes("UNSAFE_CONTENT")) {
  throw new Error("A2UI server sanitization or import boundary is missing.");
}
if (!js.includes("renderCanvas") || !js.includes("canvas-component-form") || !js.includes("data-canvas-add") || !js.includes("executionAllowed=false")) {
  throw new Error("interactive A2UI canvas editor wiring is missing.");
}
const sandboxRunner = fs.readFileSync(path.join(appRoot, "scripts", "lib", "sandbox-runner.mjs"), "utf8");
if (!server.includes("/api/sandbox/execute") || !server.includes("BLOCKED_RUNTIME_UNAVAILABLE") || !server.includes("BLOCKED_IMAGE_UNAVAILABLE")) {
  throw new Error("fail-closed Docker sandbox API is missing.");
}
const mobileNodeIntake = fs.readFileSync(path.join(appRoot, "scripts", "lib", "mobile-node-intake.mjs"), "utf8");
const androidManifest = fs.readFileSync(path.join(appRoot, "mobile", "android", "app", "src", "main", "AndroidManifest.xml"), "utf8");
if (!server.includes("/api/mobile-node/intake") || !server.includes("persistMobileNodeInput") || !mobileNodeIntake.includes("executionAllowed: false")) {
  throw new Error("pairing-gated mobile node intake is missing.");
}
if (androidManifest.includes("CAMERA") || androidManifest.includes("MEDIA_PROJECTION") || androidManifest.includes("FOREGROUND_SERVICE")) {
  throw new Error("Android companion requested an unapproved capture or background permission.");
}
if (!sandboxRunner.includes('"--network", "none"') || !sandboxRunner.includes('"--read-only"') || !sandboxRunner.includes('"--cap-drop", "ALL"') || !sandboxRunner.includes("no-new-privileges:true")) {
  throw new Error("sandbox isolation flags are incomplete.");
}
if (!js.includes("renderSandbox") || !js.includes("sandbox-form") || !js.includes("No network, host mounts, secrets")) {
  throw new Error("sandbox operator surface or claim boundary is missing.");
}
const daemon = fs.readFileSync(path.join(appRoot, "scripts", "daemon.mjs"), "utf8");
const trayController = fs.readFileSync(path.join(appRoot, "desktop", "command-centre-tray.ps1"), "utf8");
if (!trayController.includes("System.Windows.Forms.NotifyIcon") || !trayController.includes("sessionOwnsDaemon") || !trayController.includes("Stop blocked: this tray does not own")) {
  throw new Error("Windows tray companion or session-owned process boundary is missing.");
}
const systemd = fs.readFileSync(path.join(appRoot, "service", "systemd", "mds-command-centre.service"), "utf8");
const launchd = fs.readFileSync(path.join(appRoot, "service", "launchd", "com.mds.command-centre.plist"), "utf8");
if (!daemon.includes("127.0.0.1") || !daemon.includes("three consecutive health failures") || !daemon.includes("SIGTERM")) {
  throw new Error("daemon loopback, health-failure, or shutdown contract is missing.");
}
if (!systemd.includes("Restart=on-failure") || !launchd.includes("SuccessfulExit")) {
  throw new Error("systemd/launchd restart contract is missing.");
}
if (!Array.isArray(snapshot.sources) || snapshot.sources.length < 6) throw new Error("war-room snapshot is incomplete.");
if (!snapshot.controlSurface || snapshot.controlSurface.status !== "LOCAL_CONTROL_SURFACE_ONLY") {
  throw new Error("structured controlSurface snapshot is missing.");
}
if (!Array.isArray(snapshot.controlSurface.productVcos) || snapshot.controlSurface.productVcos.length !== 5) {
  throw new Error("controlSurface must include exactly five Product VCOS rows.");
}
if (!snapshot.controlSurface.productVcos.every((row) => row.evidence && row.claimCeiling && row.frontendGate && row.backendGate && row.paymentGate && row.deployGate && row.providerGate)) {
  throw new Error("Product VCOS rows must include evidence, claim ceilings, and all gate statuses.");
}
if (
  !snapshot.controlSurface.revenue?.sourceEvidence ||
  !/UNVERIFIED|UNKNOWN|verified payment evidence/i.test(
    `${snapshot.controlSurface.revenue.mrr} ${snapshot.controlSurface.revenue.status} ${snapshot.controlSurface.revenue.sourceEvidence}`,
  )
) {
  throw new Error("controlSurface revenue claim must remain evidence-capped.");
}
if (!Array.isArray(snapshot.controlSurface.approvals?.shrishRequired)) {
  throw new Error("controlSurface Shrish approval queue is missing.");
}
if (!Array.isArray(snapshot.controlSurface.workOrders?.active) || snapshot.controlSurface.workOrders.active.length < 1) {
  throw new Error("controlSurface active work orders are missing.");
}
if (!Array.isArray(snapshot.controlSurface.agentAssignments?.routes)) {
  throw new Error("controlSurface agent assignments are missing.");
}
if (!snapshot.controlSurface.nightlyCloseout?.sourceEvidence) {
  throw new Error("controlSurface nightly closeout evidence is missing.");
}
const expectedSourceHealth = snapshot.sources.length + (Array.isArray(snapshot.repoSources) ? snapshot.repoSources.length : 0);
if (!Array.isArray(snapshot.sourceHealth) || snapshot.sourceHealth.length !== expectedSourceHealth) {
  throw new Error("source health metadata is incomplete.");
}
if (snapshot.sources.some((source) => source.relativePath.includes(".env"))) {
  throw new Error("snapshot source list unexpectedly includes an env path.");
}
if (!snapshot.framework?.agentProfiles?.profiles?.length) throw new Error("MIDAS agent profiles were not loaded.");
if (!snapshot.framework?.runControls?.profiles?.length) throw new Error("MIDAS run controls were not loaded.");
if (!snapshot.framework?.qualityScorecard?.components?.length) throw new Error("MIDAS quality scorecard was not loaded.");
if (!Array.isArray(snapshot.matrixBenchmark) || snapshot.matrixBenchmark.length < 4) {
  throw new Error("Matrix benchmark comparison is incomplete.");
}
if (!Array.isArray(snapshot.workQueue) || snapshot.workQueue.length < 4) {
  throw new Error("source-derived work queue is incomplete.");
}
if (snapshot.workQueue.some((item) => !item.sourceEvidence || !item.stopCondition || !item.targetAgent)) {
  throw new Error("work queue items are missing routing evidence, stop condition, or target agent.");
}
if (!Array.isArray(tickets.tickets)) throw new Error("local ticket store is malformed.");
if (!Array.isArray(activity.events)) throw new Error("local activity log is malformed.");
if (!Array.isArray(decisions.decisions)) throw new Error("local decision export store is malformed.");
if (!Array.isArray(runs.runs)) throw new Error("local agent run store is malformed.");
if (!Array.isArray(research.briefs)) throw new Error("local research brief store is malformed.");
if (!Array.isArray(researchSources.sources) || researchSources.sources.length < 2) {
  throw new Error("local research source intake store is malformed or incomplete.");
}
if (researchSources.sources.some((source) => !source.sourceEvidence || !source.authorityStatus || !/UNKNOWN|evidence|reference|candidate/i.test(`${source.unknownsPreserved} ${source.authorityStatus}`))) {
  throw new Error("research source records must include evidence, authority status, and UNKNOWN/evidence boundaries.");
}
if (!Array.isArray(deltaReviews.reviews)) throw new Error("local delta review store is malformed.");
if (!/duplicate kernel|source-of-truth|provider truth|memory promotion/i.test(deltaReviews.authority || "")) {
  throw new Error("local delta review store must preserve local-only authority boundaries.");
}

console.log("Static checks passed.");
