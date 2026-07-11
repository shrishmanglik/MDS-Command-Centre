import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PARTY_ROLES } from "./party-room.mjs";

const MAX_ROLE_CHARS = 12_000;
const safeText = (value) => {
  const text = String(value || "").trim();
  if (!text || text.length > 4000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error("PERSONA_MEMORY_TEXT_INVALID");
  return text;
};

function readRegistry(storePath) {
  if (!fs.existsSync(storePath)) return { rooms: {} };
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return parsed && typeof parsed.rooms === "object" && !Array.isArray(parsed.rooms) ? parsed : { rooms: {} };
}

function writeRegistry(storePath, registry) {
  const payload = { schemaVersion: "mds.persona-memory.v1", updatedAt: new Date().toISOString(), authority: "D-local isolated persona notes only. Identity and agent execution are not verified.", rooms: registry.rooms };
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temporary = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, storePath);
  return payload;
}

export function appendPersonaMemory(storePath, { roomId, role, content }) {
  if (!/^PARTY-[A-F0-9]{8}$/.test(roomId || "")) throw new Error("PERSONA_MEMORY_ROOM_INVALID");
  if (!PARTY_ROLES.includes(role)) throw new Error("PERSONA_MEMORY_ROLE_INVALID");
  const registry = readRegistry(storePath);
  registry.rooms[roomId] ||= { PM: [], Architect: [], Developer: [] };
  const entries = registry.rooms[roomId][role];
  entries.push({ id: crypto.randomUUID(), content: safeText(content), recordedAt: new Date().toISOString(), identityProof: "NOT_VERIFIED" });
  while (entries.reduce((total, entry) => total + entry.content.length, 0) > MAX_ROLE_CHARS) entries.shift();
  writeRegistry(storePath, registry);
  return readPersonaMemory(storePath, { roomId, role });
}

export function readPersonaMemory(storePath, { roomId, role }) {
  if (!PARTY_ROLES.includes(role)) throw new Error("PERSONA_MEMORY_ROLE_INVALID");
  const entries = readRegistry(storePath).rooms?.[roomId]?.[role] || [];
  return {
    schemaVersion: "mds.persona-memory-buffer.v1", roomId, role,
    entries: entries.slice(-30), charCount: entries.reduce((total, entry) => total + entry.content.length, 0),
    isolatedFromRoles: PARTY_ROLES.filter((candidate) => candidate !== role),
    authority: "Role-scoped local memory only. Other role buffers are not returned.",
  };
}
