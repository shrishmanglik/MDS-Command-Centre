import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ensurePairing, readPairings, streamIdFor } from "./lib/pairing-store.mjs";
import { readWorkspaces, routeStreamToWorkspace } from "./lib/workspace-store.mjs";
import { parseVoiceTranscript, WAKE_WORD } from "./lib/voice-gate.mjs";
import { recordModelFailure, resolveModelRoute, TASK_CHAINS } from "./lib/model-router.mjs";
import { readA2UIDocuments, sanitizeA2UIDocument, writeA2UIDocuments } from "./lib/a2ui-store.mjs";
import { buildDockerArgs, normalizeSandboxRequest, sandboxIds, sandboxPolicy } from "./lib/sandbox-runner.mjs";
import { persistMobileNodeInput } from "./lib/mobile-node-intake.mjs";
import { guardedRequest } from "./lib/ssrf-guard.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const rootArg = args[args.indexOf("--root") + 1] || ".";
const portArg = Number(args[args.indexOf("--port") + 1] || 5178);
const root = path.resolve(appRoot, rootArg);
const ticketStore = path.join(appRoot, "src", "data", "localTickets.json");
const activityStore = path.join(appRoot, "src", "data", "localActivityLog.json");
const decisionStore = path.join(appRoot, "src", "data", "localDecisionExports.json");
const runStore = path.join(appRoot, "src", "data", "localAgentRuns.json");
const researchStore = path.join(appRoot, "src", "data", "localResearchBriefs.json");
const researchSourceStore = path.join(appRoot, "src", "data", "localResearchSources.json");
const deltaReviewStore = path.join(appRoot, "src", "data", "localDeltaReviews.json");
const snapshotFile = path.join(appRoot, "src", "data", "warRoomSnapshot.json");
const refreshScript = path.join(appRoot, "scripts", "refresh-war-room-data.mjs");
const adapterRefreshScript = path.join(appRoot, "scripts", "refresh-local-adapters.mjs");
const sourceEvidenceStore = path.join(appRoot, "src", "data", "localSourceEvidence.json");
const capabilityRequestStore = path.join(appRoot, "src", "data", "localCapabilityRequests.json");
const inboxStore = path.join(appRoot, "src", "data", "localInboxEvents.json");
const pairingStore = path.join(appRoot, "src", "data", "localPairings.json");
const workspaceStore = path.join(appRoot, "src", "data", "localWorkspaces.json");
const workspaceRoot = path.join(appRoot, "output", "workspaces");
const voiceCommandStore = path.join(appRoot, "src", "data", "localVoiceCommands.json");
const voiceEngine = path.join(appRoot, "voice", "bin", process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli");
const voiceModel = path.join(appRoot, "voice", "models", "ggml-base.en.bin");
const modelRouterStore = path.join(appRoot, "src", "data", "localModelRouter.json");
const canvasStore = path.join(appRoot, "src", "data", "localCanvasDocuments.json");
const sandboxReceiptStore = path.join(appRoot, "src", "data", "localSandboxReceipts.json");
const mobileNodeRoot = path.join(appRoot, "output", "mobile-nodes");
const D_ROOT = "D:/Million Dollar AI Studio";
const BROWSE_ROOTS = ["Products", "vcos", "command-centre", "output/playwright", "."];
const SECRET_PATH_PATTERN =
  /(^|[\\/])\.env[^\\/]*$|\.pem$|\.p12$|\.pfx$|(^|[\\/])id_rsa[^\\/]*$|\.key$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|authinfo|(^|[\\/])hosts\.ya?ml$|\.npmrc$|(^|[\\/])\.aws([\\/]|$)|(^|[\\/])\.ssh([\\/]|$)/i;

function findExecutable(names) {
  const pathEntries = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const directory of pathEntries) {
    for (const name of names) {
      const candidate = path.join(directory, process.platform === "win32" ? `${name}.exe` : name);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

function voiceStatus() {
  const engine = fs.existsSync(voiceEngine) && fs.statSync(voiceEngine).isFile() ? voiceEngine : findExecutable(["whisper-cli"]);
  const ffmpeg = findExecutable(["ffmpeg"]);
  const modelPresent = fs.existsSync(voiceModel) && fs.statSync(voiceModel).isFile();
  return {
    status: engine && ffmpeg && modelPresent ? "READY_LOCAL_OFFLINE" : "BLOCKED_ENGINE_MISSING",
    engine: engine ? "whisper-cli" : "UNKNOWN",
    audioConverter: ffmpeg ? "ffmpeg" : "UNKNOWN",
    model: modelPresent ? path.relative(appRoot, voiceModel) : "UNKNOWN",
    wakeWord: WAKE_WORD,
    continuousCaptureAllowed: Boolean(engine && ffmpeg && modelPresent),
    commandMode: "DRAFT_ONLY",
    authority: "Local offline STT metadata only. No microphone permission, model execution, code execution, provider action, or external send is implied.",
  };
}

function localModelInventory() {
  const ollama = findExecutable(["ollama"]);
  if (!ollama) return [];
  try {
    const output = execFileSync(ollama, ["list"], { cwd: appRoot, encoding: "utf8", timeout: 5000, windowsHide: true });
    return String(output).split(/\r?\n/).slice(1).map((line) => line.trim().split(/\s{2,}/)[0]).filter(Boolean).map((name) => ({ name, local: !/:cloud$/i.test(name), evidence: "ollama list metadata" }));
  } catch {
    return [];
  }
}

function readModelRouter() {
  const fallback = { schemaVersion: "mds.command-centre.model-router.v1", updatedAt: "UNKNOWN", authProfiles: [], failures: [], receipts: [] };
  if (!fs.existsSync(modelRouterStore)) return fallback;
  const parsed = JSON.parse(fs.readFileSync(modelRouterStore, "utf8"));
  return { ...fallback, ...parsed, authProfiles: Array.isArray(parsed.authProfiles) ? parsed.authProfiles.slice(0, 20) : [], failures: Array.isArray(parsed.failures) ? parsed.failures.filter((failure) => new Date(failure.openUntil).getTime() > Date.now()).slice(0, 100) : [], receipts: Array.isArray(parsed.receipts) ? parsed.receipts.slice(0, 100) : [] };
}

function writeModelRouter(state) {
  const payload = {
    schemaVersion: "mds.command-centre.model-router.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local model routing and circuit-breaker state only. No credential values, provider calls, model execution, quota truth, or billing state is stored.",
    authProfiles: (state.authProfiles || []).map((profile) => ({ id: String(profile.id).slice(0, 80), provider: String(profile.provider || "UNKNOWN").slice(0, 40), status: profile.status === "VERIFIED" ? "VERIFIED" : "UNKNOWN", credentialRef: "PROVIDER_OWNED_NOT_READ" })).slice(0, 20),
    failures: (state.failures || []).slice(0, 100),
    receipts: (state.receipts || []).slice(0, 100),
  };
  const temp = `${modelRouterStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, modelRouterStore);
  return payload;
}

function resolveAndStoreModelRoute(taskClass) {
  const state = readModelRouter();
  const receipt = resolveModelRoute({ taskClass, inventory: localModelInventory(), profiles: state.authProfiles, state });
  return { receipt, state: writeModelRouter({ ...state, receipts: [receipt, ...state.receipts] }), inventory: localModelInventory(), chains: TASK_CHAINS };
}

function execFilePromise(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, { windowsHide: true, timeout: 120000, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = String(stderr || "").slice(0, 2000);
        reject(error);
        return;
      }
      resolve({ stdout: String(stdout || "").slice(0, 2000), stderr: String(stderr || "").slice(0, 2000) });
    });
  });
}

function readSandboxReceipts() {
  if (!fs.existsSync(sandboxReceiptStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(sandboxReceiptStore, "utf8"));
  return Array.isArray(parsed.receipts) ? parsed.receipts.slice(0, 100) : [];
}

function writeSandboxReceipt(receipt) {
  const payload = {
    schemaVersion: "mds.command-centre.sandbox-receipts.v1",
    updatedAt: new Date().toISOString(),
    authority: sandboxPolicy().authority,
    receipts: [receipt, ...readSandboxReceipts()].slice(0, 100),
  };
  const temp = `${sandboxReceiptStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, sandboxReceiptStore);
  return payload;
}

async function dockerStatus() {
  const docker = findExecutable(["docker"]);
  if (!docker) return { status: "BLOCKED_RUNTIME_UNAVAILABLE", dockerPresent: false, daemonReachable: false, policy: sandboxPolicy() };
  try {
    await execFilePromise(docker, ["info", "--format", "{{.ServerVersion}}"], { cwd: appRoot, timeout: 5000 });
    return { status: "READY_LOCAL_DOCKER", dockerPresent: true, daemonReachable: true, policy: sandboxPolicy() };
  } catch {
    return { status: "BLOCKED_RUNTIME_UNAVAILABLE", dockerPresent: true, daemonReachable: false, policy: sandboxPolicy() };
  }
}

async function executeSandbox(input) {
  const docker = findExecutable(["docker"]);
  const readiness = await dockerStatus();
  if (!docker || readiness.status !== "READY_LOCAL_DOCKER") throw new Error("BLOCKED_RUNTIME_UNAVAILABLE: Docker daemon is required; host execution fallback is forbidden.");
  const request = normalizeSandboxRequest(input);
  try {
    await execFilePromise(docker, ["image", "inspect", request.profile.image], { cwd: appRoot, timeout: 5000 });
  } catch {
    throw new Error(`BLOCKED_IMAGE_UNAVAILABLE: ${request.profile.image} must already exist locally; automatic pulls are forbidden.`);
  }
  const ids = sandboxIds();
  const artifactDir = path.join(appRoot, "output", "sandboxes", ids.receiptId);
  fs.mkdirSync(artifactDir, { recursive: true, mode: 0o700 });
  const sourcePath = path.join(artifactDir, request.profile.filename);
  fs.writeFileSync(sourcePath, request.source, { mode: 0o600 });
  const initName = `${ids.jobName}-init`;
  const startedAt = new Date().toISOString();
  let result = { stdout: "", stderr: "" };
  let status = "COMPLETED";
  try {
    await execFilePromise(docker, ["volume", "create", "--label", "mds.command-centre.ephemeral=true", ids.workVolume], { cwd: appRoot, timeout: 10_000 });
    await execFilePromise(docker, ["create", "--name", initName, "--mount", `type=volume,src=${ids.workVolume},dst=/workspace`, request.profile.image, "true"], { cwd: appRoot, timeout: 15_000 });
    await execFilePromise(docker, ["cp", sourcePath, `${initName}:/workspace/${request.profile.filename}`], { cwd: appRoot, timeout: 10_000 });
    await execFilePromise(docker, ["rm", initName], { cwd: appRoot, timeout: 10_000 });
    result = await execFilePromise(docker, buildDockerArgs({ profile: request.profile, jobName: ids.jobName, workVolume: ids.workVolume }), { cwd: appRoot, timeout: request.timeoutMs, maxBuffer: 16 * 1024 });
  } catch (error) {
    status = error.killed || error.signal ? "TIMED_OUT" : "FAILED";
    result = { stdout: String(error.stdout || "").slice(0, 16 * 1024), stderr: String(error.stderr || error.message || "").slice(0, 16 * 1024) };
  } finally {
    await execFilePromise(docker, ["rm", "-f", initName], { cwd: appRoot, timeout: 5000 }).catch(() => {});
    await execFilePromise(docker, ["rm", "-f", ids.jobName], { cwd: appRoot, timeout: 5000 }).catch(() => {});
    await execFilePromise(docker, ["volume", "rm", "-f", ids.workVolume], { cwd: appRoot, timeout: 5000 }).catch(() => {});
    fs.rmSync(artifactDir, { recursive: true, force: true });
  }
  const receipt = {
    id: ids.receiptId, status, runtime: request.runtime, image: request.profile.image,
    startedAt, completedAt: new Date().toISOString(), timeoutMs: request.timeoutMs,
    sourceSha256: crypto.createHash("sha256").update(request.source).digest("hex"),
    stdout: result.stdout.slice(0, 2000), stderr: result.stderr.slice(0, 2000),
    policy: sandboxPolicy(), hostExecution: false, externalState: "UNKNOWN",
  };
  return { receipt, ...writeSandboxReceipt(receipt) };
}

async function transcribeLocalAudio(parsed) {
  const status = voiceStatus();
  if (!status.continuousCaptureAllowed) throw new Error("BLOCKED_ENGINE_MISSING: local whisper-cli, ffmpeg, and app-owned model are required.");
  const mimeType = String(parsed.mimeType || "").toLowerCase();
  if (!new Set(["audio/webm", "audio/wav", "audio/wave", "audio/x-wav"]).has(mimeType)) throw new Error("Only WAV or WebM audio is accepted.");
  const encoded = String(parsed.audioBase64 || "");
  if (!encoded || encoded.length > 12 * 1024 * 1024 || !/^[A-Za-z0-9+/=]+$/.test(encoded)) throw new Error("Audio payload is missing, malformed, or exceeds 9 MB decoded.");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > 9 * 1024 * 1024) throw new Error("Decoded audio exceeds the 9 MB limit.");
  const jobId = `VOICEJOB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const jobDir = path.join(appRoot, "output", "voice", "jobs", jobId);
  fs.mkdirSync(jobDir, { recursive: true, mode: 0o700 });
  const source = path.join(jobDir, mimeType === "audio/webm" ? "capture.webm" : "capture.wav");
  const wav = path.join(jobDir, "capture-16k.wav");
  const outputPrefix = path.join(jobDir, "transcript");
  fs.writeFileSync(source, bytes, { mode: 0o600 });
  await execFilePromise(findExecutable(["ffmpeg"]), ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", source, "-ar", "16000", "-ac", "1", wav], { cwd: jobDir });
  const engine = fs.existsSync(voiceEngine) && fs.statSync(voiceEngine).isFile() ? voiceEngine : findExecutable(["whisper-cli"]);
  await execFilePromise(engine, ["-m", voiceModel, "-f", wav, "-otxt", "-of", outputPrefix, "-nt"], { cwd: jobDir });
  const transcriptFile = `${outputPrefix}.txt`;
  if (!fs.existsSync(transcriptFile)) throw new Error("Offline STT completed without a transcript artifact.");
  const transcript = fs.readFileSync(transcriptFile, "utf8").trim().slice(0, 2000);
  const payload = writeVoiceCommand({ ...parseVoiceTranscript(transcript), jobId, evidencePath: path.relative(appRoot, jobDir).replace(/\\/g, "/") });
  return { ...payload, jobId, evidencePath: path.relative(appRoot, jobDir).replace(/\\/g, "/") };
}

function readVoiceCommands() {
  if (!fs.existsSync(voiceCommandStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(voiceCommandStore, "utf8"));
  return Array.isArray(parsed.records) ? parsed.records.slice(0, 200) : [];
}

function writeVoiceCommand(result) {
  const record = {
    id: `VOICE-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    ...result,
    transcript: String(result.transcript || "").slice(0, 2000),
    executionAllowed: false,
  };
  const payload = {
    schemaVersion: "mds.command-centre.local-voice-commands.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local voice command drafts only. Voice never grants code execution, external sends, provider mutation, payment, deploy, secret, pairing approval, or live-state authority.",
    records: [record, ...readVoiceCommands()].slice(0, 200),
  };
  const temp = `${voiceCommandStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, voiceCommandStore);
  return { record, ...payload };
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const target = path.resolve(root, `.${clean}`);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return target;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function readBody(request, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sanitizeTicket(ticket) {
  const now = new Date().toISOString();
  return {
    id: String(ticket.id || `MCC-${Date.now().toString(36).toUpperCase()}`).slice(0, 80),
    title: String(ticket.title || "").slice(0, 240),
    lane: String(ticket.lane || "Command Centre").slice(0, 120),
    owner: String(ticket.owner || "Codex Board").slice(0, 120),
    status: String(ticket.status || "ACTIVE").slice(0, 40),
    priority: String(ticket.priority || "P1").slice(0, 12),
    sourceEvidence: String(ticket.sourceEvidence || "").slice(0, 2000),
    proofCondition: String(ticket.proofCondition || "").slice(0, 2000),
    stopCondition: String(ticket.stopCondition || "").slice(0, 2000),
    nextAction: String(ticket.nextAction || "").slice(0, 2000),
    closeoutRaw: String(ticket.closeoutRaw || "").slice(0, 12000),
    closeoutSummary: String(ticket.closeoutSummary || "").slice(0, 2000),
    evidencePaths: String(ticket.evidencePaths || "").slice(0, 3000),
    validationRun: String(ticket.validationRun || "").slice(0, 3000),
    unknownsPreserved: String(ticket.unknownsPreserved || "").slice(0, 2000),
    authorityConflicts: String(ticket.authorityConflicts || "").slice(0, 2000),
    memoryRecommendation: String(ticket.memoryRecommendation || "ledger_only").slice(0, 1000),
    reviewerStatus: String(ticket.reviewerStatus || "NOT REVIEWED").slice(0, 80),
    reviewNotes: String(ticket.reviewNotes || "").slice(0, 2000),
    reviewedBy: String(ticket.reviewedBy || "").slice(0, 120),
    reviewedAt: String(ticket.reviewedAt || "").slice(0, 80),
    promotionStatus: String(ticket.promotionStatus || "NOT STAGED").slice(0, 80),
    promotionNotes: String(ticket.promotionNotes || "").slice(0, 2000),
    stagedBy: String(ticket.stagedBy || "").slice(0, 120),
    stagedAt: String(ticket.stagedAt || "").slice(0, 80),
    closedBy: String(ticket.closedBy || "").slice(0, 120),
    closeoutAt: String(ticket.closeoutAt || "").slice(0, 80),
    createdAt: String(ticket.createdAt || now).slice(0, 80),
    updatedAt: String(ticket.updatedAt || now).slice(0, 80),
  };
}

function sanitizeInboxEvent(event) {
  const now = new Date().toISOString();
  const allowedChannels = new Set(["manual", "synthetic", "system", "telegram", "whatsapp", "imessage", "feishu"]);
  const allowedStatuses = new Set(["NEW", "TRIAGED", "ROUTED", "CLOSED"]);
  const channel = String(event.channel || "manual").toLowerCase();
  const status = String(event.status || "NEW").toUpperCase();
  const senderLabel = String(event.senderLabel || "Unknown sender").slice(0, 120);
  const streamId = streamIdFor(channel, senderLabel);
  const pairing = readPairings(pairingStore).find((record) => record.streamId === streamId);
  const pairingStatus = pairing?.status === "PAIRED" ? "PAIRED" : "QUARANTINED";
  return {
    id: String(event.id || `INBOX-${Date.now().toString(36).toUpperCase()}`).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 90),
    receivedAt: String(event.receivedAt || now).slice(0, 80),
    channel: allowedChannels.has(channel) ? channel : "manual",
    senderLabel,
    subject: String(event.subject || "Untitled signal").slice(0, 240),
    body: String(event.body || "").slice(0, 4000),
    status: allowedStatuses.has(status) ? status : "NEW",
    risk: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"].includes(String(event.risk || "UNKNOWN").toUpperCase())
      ? String(event.risk || "UNKNOWN").toUpperCase()
      : "UNKNOWN",
    provenance: String(event.provenance || "manual_local_intake").slice(0, 240),
    routeTarget: String(event.routeTarget || "UNASSIGNED").slice(0, 120),
    externalState: "UNKNOWN",
    streamId,
    pairingStatus,
    executionAllowed: pairingStatus === "PAIRED",
    updatedAt: String(event.updatedAt || now).slice(0, 80),
  };
}

function intakeInboxEvent(event) {
  const pairing = ensurePairing(pairingStore, event.channel, event.senderLabel);
  const sanitized = sanitizeInboxEvent({ ...event, status: "NEW" });
  const current = readInboxEvents();
  const payload = writeInboxEvents([sanitized, ...current.filter((item) => item.id !== sanitized.id)]);
  return { ...payload, event: sanitized, pairingKey: pairing.pairingKey, pairingCreated: pairing.created };
}

function readInboxEvents() {
  if (!fs.existsSync(inboxStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(inboxStore, "utf8"));
  const events = Array.isArray(parsed) ? parsed : parsed.events;
  return Array.isArray(events) ? events.map(sanitizeInboxEvent) : [];
}

function writeInboxEvents(events) {
  if (!Array.isArray(events)) throw new Error("inbox events must be an array.");
  if (events.length > 300) throw new Error("Refusing to store more than 300 local inbox events.");
  const sanitized = events.map(sanitizeInboxEvent);
  if (new Set(sanitized.map((event) => event.id)).size !== sanitized.length) throw new Error("Inbox event IDs must be unique.");
  const payload = {
    schemaVersion: "mds.command-centre.local-inbox.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local synthetic/manual intake only. No live channel connection, delivery, identity verification, or provider state is proved.",
    events: sanitized.slice(0, 300),
  };
  const temp = `${inboxStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, inboxStore);
  return payload;
}

function sanitizeActivityEvent(event) {
  const now = new Date().toISOString();
  return {
    id: String(event.id || `ACT-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    timestamp: String(event.timestamp || now).slice(0, 80),
    action: String(event.action || "activity_recorded").slice(0, 120),
    ticketId: String(event.ticketId || "UNKNOWN").slice(0, 80),
    title: String(event.title || "").slice(0, 240),
    lane: String(event.lane || "Command Centre").slice(0, 120),
    owner: String(event.owner || "Codex Board").slice(0, 120),
    status: String(event.status || "UNKNOWN").slice(0, 80),
    reviewStatus: String(event.reviewStatus || "UNKNOWN").slice(0, 80),
    promotionStatus: String(event.promotionStatus || "UNKNOWN").slice(0, 80),
    memoryRecommendation: String(event.memoryRecommendation || "ledger_only").slice(0, 1000),
    evidencePaths: String(event.evidencePaths || "").slice(0, 3000),
    validationRun: String(event.validationRun || "").slice(0, 3000),
    unknownsPreserved: String(event.unknownsPreserved || "").slice(0, 2000),
    authorityConflicts: String(event.authorityConflicts || "").slice(0, 2000),
    details: String(event.details || "").slice(0, 3000),
    packet: String(event.packet || "").slice(0, 12000),
  };
}

function sanitizeDecisionExport(decision) {
  const now = new Date().toISOString();
  return {
    id: String(decision.id || `DEC-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    createdAt: String(decision.createdAt || now).slice(0, 80),
    updatedAt: String(decision.updatedAt || now).slice(0, 80),
    sourceEventId: String(decision.sourceEventId || "").slice(0, 90),
    sourceEventIds: Array.isArray(decision.sourceEventIds)
      ? decision.sourceEventIds.map((id) => String(id || "").slice(0, 90)).filter(Boolean).slice(0, 25)
      : String(decision.sourceEventIds || "")
          .split(/[,\s]+/)
          .map((id) => String(id || "").slice(0, 90))
          .filter(Boolean)
          .slice(0, 25),
    sourceAction: String(decision.sourceAction || "UNKNOWN").slice(0, 120),
    ticketId: String(decision.ticketId || "UNKNOWN").slice(0, 80),
    title: String(decision.title || "").slice(0, 240),
    decisionType: String(decision.decisionType || "ledger_append_candidate").slice(0, 120),
    disposition: String(decision.disposition || "DRAFT").slice(0, 80),
    director: String(decision.director || "Codex Strategic Board").slice(0, 120),
    authorityBasis: String(decision.authorityBasis || "").slice(0, 3000),
    evidencePaths: String(decision.evidencePaths || "").slice(0, 3000),
    validationRun: String(decision.validationRun || "").slice(0, 3000),
    unknownsPreserved: String(decision.unknownsPreserved || "").slice(0, 2000),
    authorityConflicts: String(decision.authorityConflicts || "").slice(0, 2000),
    memoryAction: String(decision.memoryAction || "ledger_only").slice(0, 1000),
    officialLedgerCandidate: String(decision.officialLedgerCandidate || "").slice(0, 12000),
    bundleSummary: String(decision.bundleSummary || "").slice(0, 3000),
    ledgerBundleCandidate: String(decision.ledgerBundleCandidate || "").slice(0, 16000),
    notes: String(decision.notes || "").slice(0, 3000),
    packet: String(decision.packet || "").slice(0, 24000),
  };
}

function sanitizeAgentRun(run) {
  const now = new Date().toISOString();
  const sourceStreamId = String(run.sourceStreamId || "").slice(0, 32);
  const sourcePairing = sourceStreamId ? readPairings(pairingStore).find((record) => record.streamId === sourceStreamId) : null;
  const pairingBlocked = Boolean(sourceStreamId) && sourcePairing?.status !== "PAIRED";
  return {
    id: String(run.id || `RUN-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    ticketId: String(run.ticketId || "UNKNOWN").slice(0, 80),
    title: String(run.title || "").slice(0, 240),
    targetAgent: String(run.targetAgent || "Codex").slice(0, 80),
    owner: String(run.owner || "Codex Strategic Board").slice(0, 120),
    lane: String(run.lane || "Command Centre").slice(0, 120),
    status: pairingBlocked ? "BLOCKED_PAIRING_REQUIRED" : String(run.status || "DRAFT").slice(0, 80),
    priority: String(run.priority || "P1").slice(0, 12),
    approvalClass: pairingBlocked ? "PAIRING_REQUIRED" : String(run.approvalClass || "LOCAL_ONLY").slice(0, 80),
    sourceStreamId,
    sourcePairingStatus: sourceStreamId ? sourcePairing?.status || "QUARANTINED" : "NOT_APPLICABLE",
    executionAllowed: sourceStreamId ? sourcePairing?.status === "PAIRED" : true,
    objective: String(run.objective || "").slice(0, 3000),
    sourceEvidence: String(run.sourceEvidence || "").slice(0, 3000),
    allowedActions: String(run.allowedActions || "").slice(0, 3000),
    forbiddenActions: String(run.forbiddenActions || "").slice(0, 3000),
    evidenceRequirement: String(run.evidenceRequirement || "").slice(0, 3000),
    proofCondition: String(run.proofCondition || "").slice(0, 3000),
    stopCondition: String(run.stopCondition || "").slice(0, 3000),
    closeoutFormat: String(run.closeoutFormat || "").slice(0, 3000),
    validationPlan: String(run.validationPlan || "").slice(0, 3000),
    unknownsPreserved: String(run.unknownsPreserved || "").slice(0, 2000),
    authorityBasis: String(run.authorityBasis || "").slice(0, 3000),
    packet: String(run.packet || "").slice(0, 24000),
    createdAt: String(run.createdAt || now).slice(0, 80),
    updatedAt: String(run.updatedAt || now).slice(0, 80),
  };
}

function sanitizeResearchBrief(brief) {
  const now = new Date().toISOString();
  return {
    id: String(brief.id || `RES-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    createdAt: String(brief.createdAt || now).slice(0, 80),
    updatedAt: String(brief.updatedAt || now).slice(0, 80),
    sourceType: String(brief.sourceType || "NotebookLM").slice(0, 80),
    sourceTitle: String(brief.sourceTitle || "").slice(0, 240),
    sourceEvidence: String(brief.sourceEvidence || "").slice(0, 4000),
    sourceUrl: String(brief.sourceUrl || "").slice(0, 1000),
    repoOrNotebook: String(brief.repoOrNotebook || "").slice(0, 1000),
    researchSummary: String(brief.researchSummary || "").slice(0, 5000),
    proposedSlice: String(brief.proposedSlice || "").slice(0, 3000),
    leverageClaim: String(brief.leverageClaim || "").slice(0, 2000),
    timeboxMinutes: String(brief.timeboxMinutes || "30").slice(0, 20),
    targetAgent: String(brief.targetAgent || "Codex").slice(0, 80),
    owner: String(brief.owner || "Codex Strategic Board").slice(0, 120),
    lane: String(brief.lane || "Research Studio").slice(0, 120),
    status: String(brief.status || "DRAFT").slice(0, 80),
    expectedArtifact: String(brief.expectedArtifact || "").slice(0, 3000),
    evidenceRequirement: String(brief.evidenceRequirement || "").slice(0, 3000),
    proofCondition: String(brief.proofCondition || "").slice(0, 3000),
    stopCondition: String(brief.stopCondition || "").slice(0, 3000),
    validationPlan: String(brief.validationPlan || "").slice(0, 3000),
    ipClassification: String(brief.ipClassification || "private_ip").slice(0, 80),
    unknownsPreserved: String(brief.unknownsPreserved || "").slice(0, 2000),
    packet: String(brief.packet || "").slice(0, 24000),
  };
}

function sanitizeResearchSource(source) {
  return {
    id: String(source.id || `SRC-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    sourceType: String(source.sourceType || "D-local docs").slice(0, 80),
    title: String(source.title || "").slice(0, 240),
    sourcePath: String(source.sourcePath || "").slice(0, 1000),
    sourceEvidence: String(source.sourceEvidence || "").slice(0, 4000),
    authorityStatus: String(source.authorityStatus || "EVIDENCE_ONLY").slice(0, 120),
    freshness: String(source.freshness || "UNKNOWN until verified.").slice(0, 1000),
    researchSummary: String(source.researchSummary || "").slice(0, 5000),
    proposedSlice: String(source.proposedSlice || "").slice(0, 3000),
    leverageClaim: String(source.leverageClaim || "").slice(0, 2000),
    expectedArtifact: String(source.expectedArtifact || "").slice(0, 3000),
    evidenceRequirement: String(source.evidenceRequirement || "").slice(0, 3000),
    proofCondition: String(source.proofCondition || "").slice(0, 3000),
    validationPlan: String(source.validationPlan || "").slice(0, 3000),
    stopCondition: String(source.stopCondition || "").slice(0, 3000),
    timeboxMinutes: String(source.timeboxMinutes || "30").slice(0, 20),
    targetAgent: String(source.targetAgent || "Codex").slice(0, 80),
    owner: String(source.owner || "Atlas / Research Studio").slice(0, 120),
    lane: String(source.lane || "Research Studio").slice(0, 120),
    ipClassification: String(source.ipClassification || "private_ip").slice(0, 80),
    unknownsPreserved: String(source.unknownsPreserved || "Research source is evidence input only; live state remains UNKNOWN.").slice(0, 2000),
  };
}

function sanitizeDeltaReview(review) {
  const now = new Date().toISOString();
  return {
    id: String(review.id || `DELTA-${Date.now().toString(36).toUpperCase()}`).slice(0, 90),
    createdAt: String(review.createdAt || now).slice(0, 80),
    updatedAt: String(review.updatedAt || now).slice(0, 80),
    sourceId: String(review.sourceId || "UNKNOWN").slice(0, 120),
    title: String(review.title || "").slice(0, 240),
    archivedEvidence: String(review.archivedEvidence || "").slice(0, 5000),
    currentAuthority: String(review.currentAuthority || "").slice(0, 3000),
    archivedClaim: String(review.archivedClaim || "").slice(0, 4000),
    currentConstraint: String(review.currentConstraint || "").slice(0, 3000),
    decision: String(review.decision || "REVISE").slice(0, 40),
    rationale: String(review.rationale || "").slice(0, 4000),
    owner: String(review.owner || "Codex Strategic Board").slice(0, 120),
    lane: String(review.lane || "VCOS Builder Studio").slice(0, 120),
    proofCondition: String(review.proofCondition || "").slice(0, 3000),
    nextAction: String(review.nextAction || "").slice(0, 3000),
    stopCondition: String(review.stopCondition || "").slice(0, 3000),
    unknownsPreserved: String(review.unknownsPreserved || "").slice(0, 3000),
    packet: String(review.packet || "").slice(0, 26000),
  };
}

function readTickets() {
  if (!fs.existsSync(ticketStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(ticketStore, "utf8"));
  const tickets = Array.isArray(parsed) ? parsed : parsed.tickets;
  return Array.isArray(tickets) ? tickets.map(sanitizeTicket) : [];
}

function writeTickets(tickets) {
  if (!Array.isArray(tickets)) throw new Error("tickets must be an array.");
  if (tickets.length > 100) throw new Error("Refusing to store more than 100 local tickets.");
  fs.mkdirSync(path.dirname(ticketStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-tickets.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local file-backed ticket store; not provider or GitHub truth until reviewed.",
    tickets: tickets.map(sanitizeTicket),
  };
  const temp = `${ticketStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, ticketStore);
  return payload;
}

function readActivityLog() {
  if (!fs.existsSync(activityStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(activityStore, "utf8"));
  const events = Array.isArray(parsed) ? parsed : parsed.events;
  return Array.isArray(events) ? events.map(sanitizeActivityEvent) : [];
}

function writeActivityLog(events) {
  if (!Array.isArray(events)) throw new Error("events must be an array.");
  if (events.length > 250) throw new Error("Refusing to store more than 250 local activity events.");
  fs.mkdirSync(path.dirname(activityStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-activity.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local activity evidence only; not official ledger, company memory, GitHub truth, or provider live-state proof.",
    events: events.map(sanitizeActivityEvent).slice(0, 250),
  };
  const temp = `${activityStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, activityStore);
  return payload;
}

function readDecisionExports() {
  if (!fs.existsSync(decisionStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(decisionStore, "utf8"));
  const decisions = Array.isArray(parsed) ? parsed : parsed.decisions;
  return Array.isArray(decisions) ? decisions.map(sanitizeDecisionExport) : [];
}

function writeDecisionExports(decisions) {
  if (!Array.isArray(decisions)) throw new Error("decisions must be an array.");
  if (decisions.length > 200) throw new Error("Refusing to store more than 200 local decision exports.");
  fs.mkdirSync(path.dirname(decisionStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-decisions.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local director decision exports only; not official ledger, company memory, GitHub truth, or provider live-state proof.",
    decisions: decisions.map(sanitizeDecisionExport).slice(0, 200),
  };
  const temp = `${decisionStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, decisionStore);
  return payload;
}

function readAgentRuns() {
  if (!fs.existsSync(runStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(runStore, "utf8"));
  const runs = Array.isArray(parsed) ? parsed : parsed.runs;
  return Array.isArray(runs) ? runs.map(sanitizeAgentRun) : [];
}

function writeAgentRuns(runs) {
  if (!Array.isArray(runs)) throw new Error("runs must be an array.");
  if (runs.length > 200) throw new Error("Refusing to store more than 200 local agent runs.");
  fs.mkdirSync(path.dirname(runStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-agent-runs.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local agent run control only; not external execution, official ledger, company memory, GitHub truth, or provider live-state proof.",
    runs: runs.map(sanitizeAgentRun).slice(0, 200),
  };
  const temp = `${runStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, runStore);
  return payload;
}

function readResearchBriefs() {
  if (!fs.existsSync(researchStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(researchStore, "utf8"));
  const briefs = Array.isArray(parsed) ? parsed : parsed.briefs;
  return Array.isArray(briefs) ? briefs.map(sanitizeResearchBrief) : [];
}

function writeResearchBriefs(briefs) {
  if (!Array.isArray(briefs)) throw new Error("briefs must be an array.");
  if (briefs.length > 200) throw new Error("Refusing to store more than 200 local research briefs.");
  fs.mkdirSync(path.dirname(researchStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-research-briefs.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local research-to-execution briefs only; NotebookLM/GitHub research is evidence input, not provider truth, official ledger, company memory, or external execution.",
    briefs: briefs.map(sanitizeResearchBrief).slice(0, 200),
  };
  const temp = `${researchStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, researchStore);
  return payload;
}

function readResearchSources() {
  if (!fs.existsSync(researchSourceStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(researchSourceStore, "utf8"));
  const sources = Array.isArray(parsed) ? parsed : parsed.sources;
  return Array.isArray(sources) ? sources.map(sanitizeResearchSource).slice(0, 50) : [];
}

function readDeltaReviews() {
  if (!fs.existsSync(deltaReviewStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(deltaReviewStore, "utf8"));
  const reviews = Array.isArray(parsed) ? parsed : parsed.reviews;
  return Array.isArray(reviews) ? reviews.map(sanitizeDeltaReview) : [];
}

function writeDeltaReviews(reviews) {
  if (!Array.isArray(reviews)) throw new Error("reviews must be an array.");
  if (reviews.length > 120) throw new Error("Refusing to store more than 120 local delta reviews.");
  fs.mkdirSync(path.dirname(deltaReviewStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-delta-reviews.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local archive-vs-current review staging only; not a duplicate kernel, source-of-truth file, official ledger entry, memory promotion, GitHub release proof, provider truth, or external execution.",
    reviews: reviews.map(sanitizeDeltaReview).slice(0, 120),
  };
  const temp = `${deltaReviewStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, deltaReviewStore);
  return payload;
}

function sanitizeSourceEvidence(record) {
  const now = new Date().toISOString();
  return {
    id: String(record.id || `SRC-${Date.now().toString(36).toUpperCase()}`).slice(0, 80),
    sourceType: String(record.sourceType || "url").slice(0, 40),
    pointer: String(record.pointer || "").slice(0, 2000),
    evidenceNote: String(record.evidenceNote || "").slice(0, 3000),
    authorityClass: String(record.authorityClass || "evidence-input-until-verified").slice(0, 200),
    expectedUse: String(record.expectedUse || "").slice(0, 2000),
    unknownsPreserved: String(record.unknownsPreserved || "Live provider/payment/deploy/auth/schema states remain UNKNOWN.").slice(0, 2000),
    forbiddenActions: "No login scraping, no cookie/session reads, no external posting, no secret reads.",
    status: String(record.status || "RECORDED").slice(0, 40),
    createdAt: String(record.createdAt || now).slice(0, 80),
    updatedAt: now,
  };
}

function readSourceEvidence() {
  if (!fs.existsSync(sourceEvidenceStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(sourceEvidenceStore, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  return Array.isArray(records) ? records.map(sanitizeSourceEvidence) : [];
}

function writeSourceEvidence(records) {
  if (!Array.isArray(records)) throw new Error("records must be an array.");
  if (records.length > 300) throw new Error("Refusing to store more than 300 local source evidence records.");
  for (const record of records) {
    if (SECRET_PATH_PATTERN.test(String(record.pointer || ""))) {
      throw new Error("Refused: source pointer matches a secret-shaped path.");
    }
  }
  fs.mkdirSync(path.dirname(sourceEvidenceStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-source-evidence.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local source evidence intake; evidence inputs only until verified and promoted. Not GitHub, provider, or memory truth.",
    records: records.map(sanitizeSourceEvidence).slice(0, 300),
  };
  const temp = `${sourceEvidenceStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, sourceEvidenceStore);
  return payload;
}

function sanitizeCapabilityRequest(record) {
  const now = new Date().toISOString();
  return {
    id: String(record.id || `CAPREQ-${Date.now().toString(36).toUpperCase()}`).slice(0, 80),
    requestKind: String(record.requestKind || "capability").slice(0, 60),
    target: String(record.target || "").slice(0, 400),
    action: String(record.action || "").slice(0, 400),
    riskClass: String(record.riskClass || "green_readonly").slice(0, 60),
    authorityBasis: String(record.authorityBasis || "D-local request staging only; execution requires the MIDAS approval chain.").slice(0, 1000),
    allowedActions: String(record.allowedActions || "record request; route to review").slice(0, 1500),
    forbiddenActions: String(
      record.forbiddenActions ||
        "No provider mutation, deploy, push, payment/auth/schema change, secret read, external send, or app launch from this packet.",
    ).slice(0, 1500),
    evidenceRequired: String(record.evidenceRequired || "").slice(0, 1500),
    stopCondition: String(record.stopCondition || "Stop before any side effect not named in allowedActions.").slice(0, 1500),
    validationCommands: String(record.validationCommands || "").slice(0, 1500),
    unknownsPreserved: String(record.unknownsPreserved || "Live provider states remain UNKNOWN.").slice(0, 1500),
    closeoutFormat: String(record.closeoutFormat || "local closeout note + review routing; no official ledger append").slice(0, 600),
    owner: String(record.owner || "shrish").slice(0, 120),
    status: String(record.status || "REQUESTED").slice(0, 40),
    createdAt: String(record.createdAt || now).slice(0, 80),
    updatedAt: now,
  };
}

function readCapabilityRequests() {
  if (!fs.existsSync(capabilityRequestStore)) return [];
  const parsed = JSON.parse(fs.readFileSync(capabilityRequestStore, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  return Array.isArray(records) ? records.map(sanitizeCapabilityRequest) : [];
}

function writeCapabilityRequests(records) {
  if (!Array.isArray(records)) throw new Error("records must be an array.");
  if (records.length > 300) throw new Error("Refusing to store more than 300 local capability requests.");
  for (const record of records) {
    if (/red|provider_mutation|payment|deploy|external_send/i.test(String(record.riskClass || "")) && String(record.status || "") === "APPROVED") {
      throw new Error("Refused: red-class requests cannot be stored as APPROVED from the Command Centre; approval lives in the MIDAS chain.");
    }
  }
  fs.mkdirSync(path.dirname(capabilityRequestStore), { recursive: true });
  const payload = {
    schemaVersion: "mds.command-centre.local-capability-requests.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local capability/action request packets; request-only staging. No packet grants execution authority by itself.",
    records: records.map(sanitizeCapabilityRequest).slice(0, 300),
  };
  const temp = `${capabilityRequestStore}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, capabilityRequestStore);
  return payload;
}

function browseListing(requestedPath) {
  const relative = String(requestedPath || ".").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") || ".";
  const withinAllowlist = BROWSE_ROOTS.some((allowRoot) => {
    if (allowRoot === ".") return true;
    return relative === allowRoot || relative.startsWith(`${allowRoot}/`);
  });
  const rootLevelOnly = relative === "." || !relative.includes("/");
  if (!withinAllowlist && !rootLevelOnly) {
    return { ok: false, refused: true, reason: `Path outside allowlisted roots: ${BROWSE_ROOTS.join(", ")}` };
  }
  if (SECRET_PATH_PATTERN.test(relative)) {
    return { ok: false, refused: true, reason: "Refused: secret-shaped path. Command Centre never reads env/keys/tokens/cookies/auth stores." };
  }
  const absolute = path.resolve(D_ROOT, relative);
  const relativeCheck = path.relative(D_ROOT, absolute);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
    return { ok: false, refused: true, reason: "Refused: path escapes the D operating root." };
  }
  if (!fs.existsSync(absolute)) return { ok: false, refused: false, reason: "Path does not exist." };
  const stat = fs.statSync(absolute);
  if (!stat.isDirectory()) {
    return {
      ok: true,
      kind: "file",
      relativePath: relative,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      note: "File metadata only; Command Centre does not stream file contents in this slice.",
    };
  }
  const names = fs.readdirSync(absolute, { withFileTypes: true });
  let refusedSecretShaped = 0;
  const entries = [];
  for (const entry of names) {
    if (SECRET_PATH_PATTERN.test(entry.name)) {
      refusedSecretShaped += 1;
      continue;
    }
    if (entries.length >= 200) continue;
    let sizeBytes = 0;
    let modifiedAt = null;
    try {
      const entryStat = fs.statSync(path.join(absolute, entry.name));
      sizeBytes = entry.isFile() ? entryStat.size : 0;
      modifiedAt = entryStat.mtime.toISOString();
    } catch {
      modifiedAt = null;
    }
    entries.push({ name: entry.name, kind: entry.isDirectory() ? "dir" : "file", sizeBytes, modifiedAt });
  }
  return { ok: true, kind: "dir", relativePath: relative, total: names.length, refusedSecretShaped, entries };
}

function snapshotHealth() {
  const snapshot = fs.existsSync(snapshotFile) ? JSON.parse(fs.readFileSync(snapshotFile, "utf8")) : null;
  const sources = snapshot?.sourceHealth || [];
  return {
    api: true,
    appRoot,
    snapshotExists: fs.existsSync(snapshotFile),
    snapshotGeneratedAt: snapshot?.generatedAt || null,
    ticketStore: path.relative(appRoot, ticketStore),
    ticketStoreExists: fs.existsSync(ticketStore),
    activityStore: path.relative(appRoot, activityStore),
    activityStoreExists: fs.existsSync(activityStore),
    activityEvents: fs.existsSync(activityStore) ? readActivityLog().length : 0,
    decisionStore: path.relative(appRoot, decisionStore),
    decisionStoreExists: fs.existsSync(decisionStore),
    decisionExports: fs.existsSync(decisionStore) ? readDecisionExports().length : 0,
    runStore: path.relative(appRoot, runStore),
    runStoreExists: fs.existsSync(runStore),
    agentRuns: fs.existsSync(runStore) ? readAgentRuns().length : 0,
    researchStore: path.relative(appRoot, researchStore),
    researchStoreExists: fs.existsSync(researchStore),
    researchBriefs: fs.existsSync(researchStore) ? readResearchBriefs().length : 0,
    researchSourceStore: path.relative(appRoot, researchSourceStore),
    researchSourceStoreExists: fs.existsSync(researchSourceStore),
    researchSources: fs.existsSync(researchSourceStore) ? readResearchSources().length : 0,
    deltaReviewStore: path.relative(appRoot, deltaReviewStore),
    deltaReviewStoreExists: fs.existsSync(deltaReviewStore),
    deltaReviews: fs.existsSync(deltaReviewStore) ? readDeltaReviews().length : 0,
    inboxStore: path.relative(appRoot, inboxStore),
    inboxStoreExists: fs.existsSync(inboxStore),
    inboxEvents: fs.existsSync(inboxStore) ? readInboxEvents().length : 0,
    pairingStore: path.relative(appRoot, pairingStore),
    pairedStreams: readPairings(pairingStore).filter((record) => record.status === "PAIRED").length,
    quarantinedStreams: readPairings(pairingStore).filter((record) => record.status === "QUARANTINED").length,
    workspaces: readWorkspaces(workspaceStore).length,
    voice: voiceStatus(),
    modelRouter: { inventory: localModelInventory().length, openCircuits: readModelRouter().failures.length },
    canvasDocuments: readA2UIDocuments(canvasStore, fs).length,
    sandboxReceipts: readSandboxReceipts().length,
    sources,
  };
}

async function handleApi(request, response, pathname) {
  try {
    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, snapshotHealth());
      return true;
    }
    if (request.method === "GET" && pathname === "/api/tickets") {
      sendJson(response, 200, { tickets: readTickets(), store: path.relative(appRoot, ticketStore) });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/inbox") {
      sendJson(response, 200, { events: readInboxEvents(), store: path.relative(appRoot, inboxStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/inbox") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const events = Array.isArray(parsed) ? parsed : parsed.events;
      sendJson(response, 200, writeInboxEvents(events));
      return true;
    }
    if (request.method === "POST" && pathname === "/api/inbox/intake") {
      const parsed = JSON.parse(await readBody(request, 64 * 1024));
      sendJson(response, 201, intakeInboxEvent(parsed.event || parsed));
      return true;
    }
    if (request.method === "POST" && pathname === "/api/mobile-node/intake") {
      const parsed = JSON.parse(await readBody(request, 18 * 1024 * 1024));
      const pairing = ensurePairing(pairingStore, "mobile-node", String(parsed.nodeId || "UNKNOWN"));
      const receipt = persistMobileNodeInput(mobileNodeRoot, parsed, pairing.record.status);
      const intake = intakeInboxEvent({ id: receipt.id, receivedAt: receipt.createdAt, channel: "mobile-node", senderLabel: receipt.nodeId, subject: `${receipt.mimeType.startsWith("image/") ? "Screenshot" : "Voice note"} from ${receipt.label}`, body: receipt.note || `Mobile work-order input stored at ${receipt.artifactPath}.`, status: "NEW", risk: "MEDIUM", provenance: "native_mobile_explicit_capture", routeTarget: "Product Ops", artifactPath: receipt.artifactPath });
      sendJson(response, 201, { receipt, event: intake.event, pairingKey: pairing.pairingKey, pairingCreated: pairing.created, executionAllowed: false });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/http-proxy") {
      const parsed = JSON.parse(await readBody(request, 32 * 1024));
      const result = await guardedRequest(parsed.url, { method: String(parsed.method || "GET").toUpperCase() });
      sendJson(response, 200, result);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/pairing") {
      sendJson(response, 200, { records: readPairings(pairingStore).map(({ keyDigest, ...record }) => record), store: path.relative(appRoot, pairingStore) });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/workspaces") {
      sendJson(response, 200, { records: readWorkspaces(workspaceStore), store: path.relative(appRoot, workspaceStore), runtimeRoot: path.relative(appRoot, workspaceRoot) });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/workspaces/route") {
      const parsed = JSON.parse(await readBody(request, 64 * 1024));
      const event = readInboxEvents().find((item) => item.id === String(parsed.eventId || ""));
      if (!event) throw new Error("Inbox event not found.");
      const result = routeStreamToWorkspace({
        storePath: workspaceStore,
        workspaceRoot,
        pairingRecords: readPairings(pairingStore),
        streamId: event.streamId,
        label: parsed.label || event.senderLabel,
        contextNotes: parsed.contextNotes || `Local workspace for ${event.senderLabel}. Source channel: ${event.channel}.`,
        agents: parsed.agents,
        event,
      });
      sendJson(response, result.created ? 201 : 200, result);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/voice/status") {
      sendJson(response, 200, { ...voiceStatus(), drafts: readVoiceCommands().length });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/voice/commands") {
      sendJson(response, 200, { records: readVoiceCommands(), store: path.relative(appRoot, voiceCommandStore) });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/voice/transcript") {
      const parsed = JSON.parse(await readBody(request, 32 * 1024));
      const result = parseVoiceTranscript(parsed.transcript);
      sendJson(response, 201, writeVoiceCommand(result));
      return true;
    }
    if (request.method === "POST" && pathname === "/api/voice/audio") {
      const status = voiceStatus();
      if (!status.continuousCaptureAllowed) {
        sendJson(response, 503, { ok: false, status: status.status, error: "Offline whisper-cli and app-owned model are required before microphone audio is accepted." });
        return true;
      }
      const parsed = JSON.parse(await readBody(request, 12 * 1024 * 1024));
      sendJson(response, 201, await transcribeLocalAudio(parsed));
      return true;
    }
    if (request.method === "GET" && pathname === "/api/model-router/status") {
      const state = readModelRouter();
      sendJson(response, 200, { state, inventory: localModelInventory(), chains: TASK_CHAINS, credentialValuesRead: false });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/model-router/resolve") {
      const parsed = JSON.parse(await readBody(request, 32 * 1024));
      sendJson(response, 201, resolveAndStoreModelRoute(String(parsed.taskClass || "general")));
      return true;
    }
    if (request.method === "POST" && pathname === "/api/model-router/failure") {
      const parsed = JSON.parse(await readBody(request, 32 * 1024));
      const state = readModelRouter();
      const failed = recordModelFailure(state, { targetId: parsed.targetId, reason: parsed.reason });
      writeModelRouter(failed);
      sendJson(response, 201, resolveAndStoreModelRoute(String(parsed.taskClass || "general")));
      return true;
    }
    if (request.method === "GET" && pathname === "/api/canvas") {
      sendJson(response, 200, { records: readA2UIDocuments(canvasStore, fs), store: path.relative(appRoot, canvasStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/canvas") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      sendJson(response, 200, writeA2UIDocuments(canvasStore, records, fs));
      return true;
    }
    if (request.method === "POST" && pathname === "/api/canvas/import") {
      const parsed = JSON.parse(await readBody(request, 256 * 1024));
      sendJson(response, 201, { document: sanitizeA2UIDocument(parsed.document || parsed), imported: true, executionAllowed: false });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/sandbox/status") {
      sendJson(response, 200, { ...(await dockerStatus()), receipts: readSandboxReceipts() });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/sandbox/execute") {
      const parsed = JSON.parse(await readBody(request, 96 * 1024));
      sendJson(response, 201, await executeSandbox(parsed));
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/tickets") {
      const parsed = JSON.parse(await readBody(request));
      const tickets = Array.isArray(parsed) ? parsed : parsed.tickets;
      const payload = writeTickets(tickets);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/activity") {
      sendJson(response, 200, { events: readActivityLog(), store: path.relative(appRoot, activityStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/activity") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const events = Array.isArray(parsed) ? parsed : parsed.events;
      const payload = writeActivityLog(events);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/decisions") {
      sendJson(response, 200, { decisions: readDecisionExports(), store: path.relative(appRoot, decisionStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/decisions") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const decisions = Array.isArray(parsed) ? parsed : parsed.decisions;
      const payload = writeDecisionExports(decisions);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/runs") {
      sendJson(response, 200, { runs: readAgentRuns(), store: path.relative(appRoot, runStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/runs") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const runs = Array.isArray(parsed) ? parsed : parsed.runs;
      const payload = writeAgentRuns(runs);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/research") {
      sendJson(response, 200, { briefs: readResearchBriefs(), store: path.relative(appRoot, researchStore) });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/research-sources") {
      sendJson(response, 200, { sources: readResearchSources(), store: path.relative(appRoot, researchSourceStore) });
      return true;
    }
    if (request.method === "GET" && pathname === "/api/delta-reviews") {
      sendJson(response, 200, { reviews: readDeltaReviews(), store: path.relative(appRoot, deltaReviewStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/delta-reviews") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const reviews = Array.isArray(parsed) ? parsed : parsed.reviews;
      const payload = writeDeltaReviews(reviews);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/research") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const briefs = Array.isArray(parsed) ? parsed : parsed.briefs;
      const payload = writeResearchBriefs(briefs);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/source-evidence") {
      sendJson(response, 200, { records: readSourceEvidence(), store: path.relative(appRoot, sourceEvidenceStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/source-evidence") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      const payload = writeSourceEvidence(records);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/capability-requests") {
      sendJson(response, 200, { records: readCapabilityRequests(), store: path.relative(appRoot, capabilityRequestStore) });
      return true;
    }
    if (request.method === "PUT" && pathname === "/api/capability-requests") {
      const parsed = JSON.parse(await readBody(request, 512 * 1024));
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      const payload = writeCapabilityRequests(records);
      sendJson(response, 200, payload);
      return true;
    }
    if (request.method === "GET" && pathname === "/api/browse") {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const listing = browseListing(url.searchParams.get("path") || ".");
      sendJson(response, listing.ok ? 200 : 403, listing);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/refresh-adapters") {
      execFile(process.execPath, [adapterRefreshScript], { cwd: appRoot, timeout: 180000 }, (error, stdout, stderr) => {
        if (error) {
          sendJson(response, 500, { ok: false, error: error.message, stderr: String(stderr || "").slice(0, 2000) });
          return;
        }
        sendJson(response, 200, { ok: true, stdout: String(stdout || "").slice(0, 2000) });
      });
      return true;
    }
    if (request.method === "POST" && pathname === "/api/refresh-snapshot") {
      execFile(process.execPath, [refreshScript], { cwd: appRoot, timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          sendJson(response, 500, { ok: false, error: error.message, stderr: String(stderr || "").slice(0, 2000) });
          return;
        }
        sendJson(response, 200, { ok: true, stdout: String(stdout || "").slice(0, 2000), health: snapshotHealth() });
      });
      return true;
    }
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message });
    return true;
  }
  return false;
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`).pathname;
  if (pathname.startsWith("/api/") && (await handleApi(request, response, pathname))) return;

  const target = safePath(request.url || "/");
  if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes.get(path.extname(target)) || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(target).pipe(response);
});

server.listen(portArg, "127.0.0.1", () => {
  console.log(`MDS Command Centre serving ${root} at http://127.0.0.1:${portArg}/`);
});
