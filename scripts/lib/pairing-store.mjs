import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function streamIdFor(channel, senderLabel) {
  const identity = `${String(channel || "unknown").trim().toLowerCase()}\n${String(senderLabel || "unknown").trim().toLowerCase()}`;
  return `STREAM-${crypto.createHash("sha256").update(identity).digest("hex").slice(0, 20).toUpperCase()}`;
}

export function pairingKeyDigest(key) {
  return crypto.createHash("sha256").update(String(key || "").trim().toUpperCase()).digest("hex");
}

function sanitizeRecord(record) {
  return {
    streamId: String(record.streamId || "").slice(0, 32),
    channel: String(record.channel || "unknown").slice(0, 40),
    senderLabel: String(record.senderLabel || "Unknown sender").slice(0, 120),
    keyDigest: String(record.keyDigest || "").replace(/[^a-f0-9]/gi, "").slice(0, 64).toLowerCase(),
    status: record.status === "PAIRED" ? "PAIRED" : "QUARANTINED",
    createdAt: String(record.createdAt || new Date().toISOString()).slice(0, 80),
    approvedAt: record.status === "PAIRED" ? String(record.approvedAt || "UNKNOWN").slice(0, 80) : null,
    approvedBy: record.status === "PAIRED" ? String(record.approvedBy || "local-cli").slice(0, 120) : null,
  };
}

export function readPairings(storePath) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  return Array.isArray(records) ? records.map(sanitizeRecord).filter((record) => record.streamId && record.keyDigest) : [];
}

export function writePairings(storePath, records) {
  if (!Array.isArray(records) || records.length > 500) throw new Error("Pairing registry must contain at most 500 records.");
  const sanitized = records.map(sanitizeRecord);
  if (new Set(sanitized.map((record) => record.streamId)).size !== sanitized.length) throw new Error("Pairing stream IDs must be unique.");
  const payload = {
    schemaVersion: "mds.command-centre.pairing-registry.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local stream pairing only. Pairing does not authorize provider mutation, external sends, secret access, or code execution by itself.",
    records: sanitized,
  };
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, storePath);
  return payload;
}

export function ensurePairing(storePath, channel, senderLabel) {
  const streamId = streamIdFor(channel, senderLabel);
  const records = readPairings(storePath);
  const existing = records.find((record) => record.streamId === streamId);
  if (existing) return { record: existing, pairingKey: null, created: false };
  const pairingKey = `MDS-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const record = sanitizeRecord({ streamId, channel, senderLabel, keyDigest: pairingKeyDigest(pairingKey), status: "QUARANTINED" });
  writePairings(storePath, [record, ...records]);
  return { record, pairingKey, created: true };
}

export function approvePairing(storePath, key, approvedBy = "local-cli") {
  const digest = pairingKeyDigest(key);
  const records = readPairings(storePath);
  const record = records.find((item) => item.keyDigest === digest);
  if (!record) throw new Error("Pairing key not found.");
  if (record.status === "PAIRED") return { record, alreadyApproved: true };
  record.status = "PAIRED";
  record.approvedAt = new Date().toISOString();
  record.approvedBy = approvedBy;
  writePairings(storePath, records);
  return { record, alreadyApproved: false };
}
