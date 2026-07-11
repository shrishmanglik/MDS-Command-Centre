import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const AGENT_ALLOWLIST = new Set(["Codex", "Claude Code", "Antigravity", "Human"]);

function safeWorkspaceId(streamId) {
  return `WS-${crypto.createHash("sha256").update(String(streamId)).digest("hex").slice(0, 16).toUpperCase()}`;
}

function safeLabel(value) {
  const label = String(value || "Local client workspace").trim().slice(0, 120);
  if (!label || /[\x00-\x1f]/.test(label)) throw new Error("Workspace label is invalid.");
  return label;
}

function sanitizeWorkspace(record) {
  const agents = Array.isArray(record.agents) ? record.agents.filter((agent) => AGENT_ALLOWLIST.has(agent)).slice(0, 4) : [];
  return {
    id: String(record.id || "").replace(/[^A-Z0-9-]/g, "").slice(0, 24),
    streamId: String(record.streamId || "").replace(/[^A-Z0-9-]/g, "").slice(0, 32),
    label: safeLabel(record.label),
    status: record.status === "ACTIVE" ? "ACTIVE" : "LOCAL_ONLY",
    agents: agents.length ? agents : ["Human"],
    contextNotes: String(record.contextNotes || "No workspace context recorded.").slice(0, 4000),
    relativePath: String(record.relativePath || "").replace(/\\/g, "/").slice(0, 240),
    createdAt: String(record.createdAt || new Date().toISOString()).slice(0, 80),
    updatedAt: String(record.updatedAt || new Date().toISOString()).slice(0, 80),
    executionAuthority: "NOT_GRANTED",
    externalState: "UNKNOWN",
  };
}

export function readWorkspaces(storePath) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  return Array.isArray(records) ? records.map(sanitizeWorkspace).filter((record) => record.id && record.streamId) : [];
}

export function writeWorkspaces(storePath, records) {
  if (!Array.isArray(records) || records.length > 300) throw new Error("Workspace registry must contain at most 300 records.");
  const sanitized = records.map(sanitizeWorkspace);
  if (new Set(sanitized.map((record) => record.id)).size !== sanitized.length) throw new Error("Workspace IDs must be unique.");
  if (new Set(sanitized.map((record) => record.streamId)).size !== sanitized.length) throw new Error("Each stream may map to only one workspace.");
  const payload = {
    schemaVersion: "mds.command-centre.workspace-registry.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local isolated workspace routing only. No provider identity, external account, code execution, or live state is proved.",
    records: sanitized,
  };
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, storePath);
  return payload;
}

export function routeStreamToWorkspace({ storePath, workspaceRoot, pairingRecords, streamId, label, contextNotes, agents, event }) {
  const pairing = pairingRecords.find((record) => record.streamId === streamId);
  if (pairing?.status !== "PAIRED") throw new Error("PAIRING_REQUIRED: stream must be manually paired before workspace routing.");
  const existing = readWorkspaces(storePath).find((record) => record.streamId === streamId);
  if (existing) return { workspace: existing, created: false };
  const id = safeWorkspaceId(streamId);
  const root = path.resolve(workspaceRoot);
  const absolute = path.resolve(root, id);
  const relativeCheck = path.relative(root, absolute);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) throw new Error("Workspace path escaped the contained root.");
  const now = new Date().toISOString();
  const workspace = sanitizeWorkspace({
    id,
    streamId,
    label,
    contextNotes,
    agents,
    status: "ACTIVE",
    relativePath: path.relative(path.dirname(storePath), absolute).replace(/\\/g, "/"),
    createdAt: now,
    updatedAt: now,
  });
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  fs.mkdirSync(absolute, { recursive: false, mode: 0o700 });
  const manifest = { schemaVersion: "mds.workspace.manifest.v1", ...workspace };
  const eventReference = event
    ? [{ id: String(event.id || "UNKNOWN").slice(0, 90), receivedAt: String(event.receivedAt || "UNKNOWN").slice(0, 80), subject: String(event.subject || "Untitled signal").slice(0, 240), pairingStatus: "PAIRED" }]
    : [];
  fs.writeFileSync(path.join(absolute, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(absolute, "context.md"), `# ${workspace.label}\n\n${workspace.contextNotes}\n\nExecution authority: NOT_GRANTED\nExternal state: UNKNOWN\n`, { mode: 0o600 });
  fs.writeFileSync(path.join(absolute, "inbox-events.json"), `${JSON.stringify({ schemaVersion: "mds.workspace.inbox-references.v1", events: eventReference }, null, 2)}\n`, { mode: 0o600 });
  writeWorkspaces(storePath, [workspace, ...readWorkspaces(storePath)]);
  return { workspace, created: true };
}

export { AGENT_ALLOWLIST };
