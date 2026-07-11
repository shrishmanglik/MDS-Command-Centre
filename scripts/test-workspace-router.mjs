import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeStreamToWorkspace } from "./lib/workspace-store.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nonce = Date.now();
const testRoot = path.join(appRoot, "output", "workspace-router-test", String(nonce));
const storePath = path.join(testRoot, "registry.json");
const workspaceRoot = path.join(testRoot, "workspaces");
const streamId = `STREAM-TEST-${nonce}`;
let blocked = false;
try {
  routeStreamToWorkspace({ storePath, workspaceRoot, pairingRecords: [], streamId, label: "Blocked", agents: ["Codex"] });
} catch (error) {
  blocked = /PAIRING_REQUIRED/.test(error.message);
}
if (!blocked) throw new Error("Unpaired stream was not blocked.");
const pairingRecords = [{ streamId, status: "PAIRED" }];
const first = routeStreamToWorkspace({ storePath, workspaceRoot, pairingRecords, streamId, label: "Isolated test workspace", contextNotes: "Synthetic router test.", agents: ["Codex", "Not Allowed"], event: { id: "TEST-EVENT", subject: "Test", receivedAt: new Date().toISOString() } });
if (!first.created || first.workspace.agents.includes("Not Allowed")) throw new Error("Workspace creation or agent allowlist failed.");
const absolute = path.resolve(path.dirname(storePath), first.workspace.relativePath);
const relative = path.relative(path.resolve(workspaceRoot), absolute);
if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Workspace escaped isolated root.");
for (const file of ["manifest.json", "context.md", "inbox-events.json"]) if (!fs.existsSync(path.join(absolute, file))) throw new Error(`Missing workspace artifact: ${file}`);
const replay = routeStreamToWorkspace({ storePath, workspaceRoot, pairingRecords, streamId, label: "Changed label", agents: ["Human"] });
if (replay.created || replay.workspace.id !== first.workspace.id) throw new Error("Stream routing was not idempotent.");
console.log("Workspace router checks passed.");
