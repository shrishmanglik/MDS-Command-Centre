import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROLES = Object.freeze(["PM", "Architect", "Developer"]);
const clean = (value, limit) => {
  const text = String(value || "").trim();
  if (!text || text.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error("PARTY_TEXT_INVALID");
  return text;
};

export function readPartyRooms(storePath) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return Array.isArray(parsed.rooms) ? parsed.rooms.slice(0, 100) : [];
}

function writePartyRooms(storePath, rooms) {
  const payload = {
    schemaVersion: "mds.party-room-registry.v1", updatedAt: new Date().toISOString(),
    authority: "D-local deliberation records only. Agent identity, execution, provider state, and implementation success are not proved.",
    rooms: rooms.slice(0, 100),
  };
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const temporary = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, storePath);
  return payload;
}

export function createPartyRoom(storePath, { title, workOrderId = "UNKNOWN" }) {
  const now = new Date().toISOString();
  const room = {
    id: `PARTY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title: clean(title, 160),
    workOrderId: /^[A-Z0-9-]{3,80}$/.test(workOrderId) ? workOrderId : "UNKNOWN",
    status: "DELIBERATING", requiredRoles: ROLES, contributions: [], decision: null,
    createdAt: now, updatedAt: now, executionStarted: false,
  };
  writePartyRooms(storePath, [room, ...readPartyRooms(storePath)]);
  return room;
}

export function addPartyContribution(storePath, { roomId, role, message }) {
  if (!ROLES.includes(role)) throw new Error("PARTY_ROLE_INVALID");
  const rooms = readPartyRooms(storePath);
  const room = rooms.find((item) => item.id === roomId);
  if (!room) throw new Error("PARTY_ROOM_NOT_FOUND");
  if (room.decision) throw new Error("PARTY_ROOM_CLOSED");
  room.contributions.push({ id: crypto.randomUUID(), role, message: clean(message, 4000), recordedAt: new Date().toISOString(), identityProof: "NOT_VERIFIED" });
  room.contributions = room.contributions.slice(-60);
  room.updatedAt = new Date().toISOString();
  writePartyRooms(storePath, rooms);
  return partyRoomReadiness(room);
}

export function partyRoomReadiness(room) {
  const contributedRoles = [...new Set((room.contributions || []).map((item) => item.role).filter((role) => ROLES.includes(role)))];
  const missingRoles = ROLES.filter((role) => !contributedRoles.includes(role));
  return {
    roomId: room.id, status: room.decision?.disposition === "APPROVED" && !missingRoles.length ? "HANDOFF_READY" : room.decision ? "REVISION_REQUIRED" : "DELIBERATING",
    contributedRoles, missingRoles, operatorDecisionRequired: !room.decision,
    executionStarted: false, spawnAuthorityGranted: false,
  };
}

export function decidePartyRoom(storePath, { roomId, disposition, rationale, operator }) {
  if (!["APPROVED", "REVISE"].includes(disposition)) throw new Error("PARTY_DISPOSITION_INVALID");
  const rooms = readPartyRooms(storePath);
  const room = rooms.find((item) => item.id === roomId);
  if (!room) throw new Error("PARTY_ROOM_NOT_FOUND");
  if (room.decision) throw new Error("PARTY_DECISION_ALREADY_RECORDED");
  const readiness = partyRoomReadiness(room);
  if (disposition === "APPROVED" && readiness.missingRoles.length) throw new Error(`PARTY_REQUIRED_ROLES_MISSING: ${readiness.missingRoles.join(",")}`);
  room.decision = { disposition, rationale: clean(rationale, 2000), operator: clean(operator, 80), decidedAt: new Date().toISOString(), authority: "MANUAL_LOCAL_OPERATOR_DECISION" };
  room.status = disposition === "APPROVED" ? "HANDOFF_READY" : "REVISION_REQUIRED";
  room.updatedAt = new Date().toISOString();
  writePartyRooms(storePath, rooms);
  return partyRoomReadiness(room);
}

export { ROLES as PARTY_ROLES };
