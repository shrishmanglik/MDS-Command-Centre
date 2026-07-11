#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approvePairing, readPairings } from "./lib/pairing-store.mjs";
import { runDoctor } from "./lib/doctor.mjs";
import { validateSkillPack } from "./lib/skill-validator.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(appRoot, "src", "data", "localPairings.json");
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

if (domain !== "pairing" || !["list", "approve"].includes(action || "")) {
  console.error("Usage: midas doctor | midas skills validate <pack-path> | midas pairing list | midas pairing approve <pairing-key>");
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
