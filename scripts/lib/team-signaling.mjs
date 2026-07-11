import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PLATFORMS = new Set(["feishu", "slack", "teams", "generic"]);
const SIGNAL_TYPES = new Set(["TASK_STARTED", "TASK_PROGRESS", "TASK_BLOCKED", "TASK_COMPLETED", "HEARTBEAT"]);
const SECRET_CONTENT = /(?:bearer\s+[A-Za-z0-9._-]+|(?:token|secret|password|api[_-]?key)\s*[:=]\s*\S+|-----BEGIN [A-Z ]+PRIVATE KEY-----)/i;
const UNSAFE = /<\/?[a-z]|https?:\/\/|javascript:/i;

function text(value, limit, label) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(normalized) || SECRET_CONTENT.test(normalized) || UNSAFE.test(normalized)) throw new Error(`SIGNAL_${label}_INVALID`);
  return normalized;
}

export function normalizeTeamSignal(input) {
  if (!PLATFORMS.has(input?.platform)) throw new Error("SIGNAL_PLATFORM_INVALID");
  if (!SIGNAL_TYPES.has(input?.type)) throw new Error("SIGNAL_TYPE_INVALID");
  const destinationRef = String(input.destinationRef || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/.test(destinationRef)) throw new Error("SIGNAL_DESTINATION_REF_INVALID");
  const signal = {
    platform: input.platform, type: input.type, destinationRef,
    taskId: text(input.taskId || "UNKNOWN", 80, "TASK_ID"),
    summary: text(input.summary, 500, "SUMMARY"),
    progress: input.type === "TASK_PROGRESS" ? Math.max(0, Math.min(100, Number(input.progress))) : null,
  };
  if (input.type === "TASK_PROGRESS" && !Number.isFinite(signal.progress)) throw new Error("SIGNAL_PROGRESS_INVALID");
  const digest = crypto.createHash("sha256").update(JSON.stringify(signal)).digest("hex");
  return { id: `SIG-${digest.slice(0, 16).toUpperCase()}`, digest, ...signal, stagedAt: new Date().toISOString(), status: "STAGED_LOCAL", sendStarted: false };
}

export function renderPlatformSignal(signalInput) {
  const signal = signalInput.digest ? signalInput : normalizeTeamSignal(signalInput);
  const line = `[${signal.type}] ${signal.taskId}: ${signal.summary}${signal.progress === null ? "" : ` (${signal.progress}%)`}`;
  const payloads = {
    feishu: { msg_type: "text", content: { text: line } },
    slack: { text: line, unfurl_links: false, unfurl_media: false },
    teams: { type: "message", text: line },
    generic: { event: signal.type, taskId: signal.taskId, message: signal.summary, progress: signal.progress },
  };
  return { platform: signal.platform, destinationRef: signal.destinationRef, payload: payloads[signal.platform], sendStarted: false, credentialsRequired: "UNKNOWN", endpointResolved: false };
}

export function stageTeamSignal(storePath, input) {
  const signal = normalizeTeamSignal(input);
  const current = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : { signals: [] };
  const signals = Array.isArray(current.signals) ? current.signals : [];
  const duplicate = signals.find((item) => item.digest === signal.digest);
  if (duplicate) return { signal: duplicate, duplicate: true, preview: renderPlatformSignal(duplicate) };
  const payload = { schemaVersion: "mds.team-signaling-outbox.v1", updatedAt: new Date().toISOString(), authority: "D-local staged signals only. No external message, webhook, credential read, or provider delivery is attempted or proved.", signals: [signal, ...signals].slice(0, 500) };
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temporary = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, storePath);
  return { signal, duplicate: false, preview: renderPlatformSignal(signal) };
}

export function readTeamSignals(storePath) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return Array.isArray(parsed.signals) ? parsed.signals.slice(0, 500) : [];
}

export { PLATFORMS as SIGNAL_PLATFORMS, SIGNAL_TYPES };
