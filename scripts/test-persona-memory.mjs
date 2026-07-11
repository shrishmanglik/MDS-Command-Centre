import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendPersonaMemory, readPersonaMemory } from "./lib/persona-memory.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "mds-persona-"));
const store = path.join(root, "memory.json");
const roomId = "PARTY-ABCDEF12";
appendPersonaMemory(store, { roomId, role: "PM", content: "Scope and user outcome" });
appendPersonaMemory(store, { roomId, role: "Developer", content: "Implementation constraint" });
const pm = readPersonaMemory(store, { roomId, role: "PM" });
assert.equal(pm.entries.length, 1);
assert.doesNotMatch(JSON.stringify(pm), /Implementation constraint/);
assert.deepEqual(pm.isolatedFromRoles, ["Architect", "Developer"]);
for (let index = 0; index < 5; index += 1) appendPersonaMemory(store, { roomId, role: "Architect", content: `${index}-${"x".repeat(3990)}` });
assert.ok(readPersonaMemory(store, { roomId, role: "Architect" }).charCount <= 12000);
fs.rmSync(root, { recursive: true, force: true });
console.log("Persona memory checks passed.");
