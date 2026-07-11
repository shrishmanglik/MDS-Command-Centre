import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MEDIA = Object.freeze({
  "image/png": { ext: ".png", max: 8 * 1024 * 1024, signature: (b) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  "image/jpeg": { ext: ".jpg", max: 8 * 1024 * 1024, signature: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "audio/wav": { ext: ".wav", max: 12 * 1024 * 1024, signature: (b) => b.subarray(0, 4).toString() === "RIFF" },
  "audio/mp4": { ext: ".m4a", max: 12 * 1024 * 1024, signature: (b) => b.subarray(4, 8).toString() === "ftyp" },
});

export function normalizeMobileNodeInput(input = {}) {
  const nodeId = String(input.nodeId || "").trim();
  if (!/^[a-zA-Z0-9_.-]{3,80}$/.test(nodeId)) throw new Error("Invalid mobile node ID.");
  const mimeType = String(input.mimeType || "").toLowerCase();
  const media = MEDIA[mimeType];
  if (!media) throw new Error("Unsupported mobile media type.");
  const encoded = String(input.dataBase64 || "");
  if (!encoded || !/^[A-Za-z0-9+/=]+$/.test(encoded)) throw new Error("Malformed mobile media payload.");
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > media.max) throw new Error("Mobile media payload exceeds its bounded limit.");
  if (!media.signature(bytes)) throw new Error("Mobile media signature does not match MIME type.");
  return { nodeId, label: String(input.label || "Mobile node").slice(0, 120), note: String(input.note || "").slice(0, 1000), mimeType, media, bytes };
}

export function persistMobileNodeInput(root, input, pairingStatus) {
  const normalized = normalizeMobileNodeInput(input);
  const id = `MOBILE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const directory = path.resolve(root, id);
  const relative = path.relative(path.resolve(root), directory);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Mobile artifact path escaped root.");
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const artifact = path.join(directory, `input${normalized.media.ext}`);
  fs.writeFileSync(artifact, normalized.bytes, { mode: 0o600 });
  const receipt = { id, nodeId: normalized.nodeId, label: normalized.label, note: normalized.note, mimeType: normalized.mimeType, bytes: normalized.bytes.length, sha256: crypto.createHash("sha256").update(normalized.bytes).digest("hex"), artifactPath: path.relative(path.resolve(root, "..", ".."), artifact).replace(/\\/g, "/"), pairingStatus, executionAllowed: false, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(directory, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  return receipt;
}
