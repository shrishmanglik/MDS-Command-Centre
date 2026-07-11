#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approvePairing, readPairings } from "./lib/pairing-store.mjs";
import { runDoctor } from "./lib/doctor.mjs";
import { validateSkillPack } from "./lib/skill-validator.mjs";
import { evaluateWorkflow } from "./lib/plugin-eval.mjs";
import { validateFrontmatterCollections } from "./lib/frontmatter-order.mjs";
import { exportHarnessAdapters } from "./lib/harness-adapter.mjs";
import { parseChecklistWorkflow } from "./lib/checklist-workflow.mjs";
import { compileGitReleaseAudit } from "./lib/git-release-audit.mjs";
import { addPartyContribution, createPartyRoom, decidePartyRoom, readPartyRooms } from "./lib/party-room.mjs";
import { appendPersonaMemory, readPersonaMemory } from "./lib/persona-memory.mjs";
import { runMidasLoop } from "./lib/midas-loop.mjs";
import { runSubagentTaskFile } from "./lib/subagent-engine.mjs";
import { parseCustomizerFile } from "./lib/declarative-customizer.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(appRoot, "src", "data", "localPairings.json");
const partyStorePath = path.join(appRoot, "src", "data", "localPartyRooms.json");
const personaMemoryStorePath = path.join(appRoot, "src", "data", "localPersonaMemory.json");
const [domain, action, value] = process.argv.slice(2);

if (domain === "doctor") {
  const result = runDoctor({ appRoot });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.blockers ? 1 : 0);
}

if (domain === "skills" && action === "validate") {
  if (!value) { console.error("Usage: midas skills validate <pack-path>"); process.exit(2); }
  const result = validateSkillPack(path.resolve(process.cwd(), value));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

if (domain === "eval") {
  if (!action) { console.error("Usage: midas eval <workflow-path> [--judge-receipt <path>]"); process.exit(2); }
  const receiptIndex = process.argv.indexOf("--judge-receipt");
  const result = evaluateWorkflow(path.resolve(process.cwd(), action), { trials: 50, judgeReceiptPath: receiptIndex >= 0 ? process.argv[receiptIndex + 1] : undefined });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.provisionalGrade >= 3 ? 0 : 1);
}

if (domain === "docs" && action === "validate") {
  const target = value ? path.resolve(process.cwd(), value) : path.join(appRoot, "generated-docs");
  const result = validateFrontmatterCollections(target);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

if (domain === "harness" && action === "export") {
  if (!value) { console.error("Usage: midas harness export <source-path> [--out <root>] [--check]"); process.exit(2); }
  const outIndex = process.argv.indexOf("--out");
  const result = exportHarnessAdapters(path.resolve(process.cwd(), value), {
    outputRoot: outIndex >= 0 ? path.resolve(process.cwd(), process.argv[outIndex + 1]) : path.join(appRoot, "generated-harnesses"),
    check: process.argv.includes("--check"),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "DRIFT" ? 1 : 0);
}

if (domain === "workflow" && action === "parse") {
  if (!value) { console.error("Usage: midas workflow parse <checklist-path>"); process.exit(2); }
  console.log(JSON.stringify(parseChecklistWorkflow(path.resolve(process.cwd(), value)), null, 2));
  process.exit(0);
}

if (domain === "release" && action === "audit") {
  const result = compileGitReleaseAudit({ repoPath: process.cwd(), range: value || "HEAD~20..HEAD" });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (domain === "party") {
  const cli = process.argv.slice(2);
  let result;
  if (action === "list") result = { rooms: readPartyRooms(partyStorePath), executionStarted: false };
  else if (action === "create") result = createPartyRoom(partyStorePath, { title: value, workOrderId: cli[3] || "UNKNOWN" });
  else if (action === "contribute") {
    const message = cli.slice(4).join(" ");
    result = addPartyContribution(partyStorePath, { roomId: value, role: cli[3], message });
    appendPersonaMemory(personaMemoryStorePath, { roomId: value, role: cli[3], content: message });
  }
  else if (action === "decide") result = decidePartyRoom(partyStorePath, { roomId: value, disposition: cli[3], operator: cli[4], rationale: cli.slice(5).join(" ") });
  else { console.error("Usage: midas party list | create <title> [work-order] | contribute <room-id> <role> <message> | decide <room-id> <APPROVED|REVISE> <operator> <rationale>"); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (domain === "memory" && action === "read") {
  const cli = process.argv.slice(2);
  console.log(JSON.stringify(readPersonaMemory(personaMemoryStorePath, { roomId: value, role: cli[3] }), null, 2));
  process.exit(0);
}

if (domain === "loop" && action === "run") {
  const cli = process.argv.slice(2);
  const room = readPartyRooms(partyStorePath).find((item) => item.id === value);
  const selection = String(cli[3] || "");
  const options = ["quick", "full"].includes(selection) ? { profile: selection } : { scripts: selection.split(",").filter(Boolean) };
  console.log(JSON.stringify(runMidasLoop({ room, ...options, cwd: appRoot }), null, 2));
  process.exit(0);
}

if (domain === "workers" && action === "run") {
  if (!value) { console.error("Usage: midas workers run <task-file.json>"); process.exit(2); }
  console.log(JSON.stringify(await runSubagentTaskFile(path.resolve(process.cwd(), value)), null, 2));
  process.exit(0);
}

if (domain === "customizer" && action === "validate") {
  if (!value) { console.error("Usage: midas customizer validate <config.toml>"); process.exit(2); }
  console.log(JSON.stringify(parseCustomizerFile(path.resolve(process.cwd(), value)), null, 2));
  process.exit(0);
}

if (domain !== "pairing" || !["list", "approve"].includes(action || "")) {
  console.error("Usage: midas doctor | midas skills validate <pack-path> | midas eval <workflow-path> | midas docs validate [root] | midas harness export <source-path> [--check] | midas workflow parse <checklist-path> | midas release audit [git-range] | midas pairing list | midas pairing approve <pairing-key>");
  process.exit(2);
}

if (action === "list") {
  const records = readPairings(storePath).map(({ keyDigest, ...record }) => record);
  console.log(JSON.stringify({ status: "LOCAL_PAIRING_REGISTRY_ONLY", records }, null, 2));
  process.exit(0);
}

if (!value) {
  console.error("A pairing key is required.");
  process.exit(2);
}

try {
  const result = approvePairing(storePath, value, "midas-cli");
  console.log(JSON.stringify({
    status: result.alreadyApproved ? "ALREADY_PAIRED" : "PAIRED",
    streamId: result.record.streamId,
    channel: result.record.channel,
    senderLabel: result.record.senderLabel,
    executionAuthority: "NOT_GRANTED",
  }, null, 2));
} catch (error) {
  console.error(`Pairing approval failed: ${error.message}`);
  process.exit(1);
}
