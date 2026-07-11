import path from "node:path";
import { fileURLToPath } from "node:url";
import { approvePairing, ensurePairing, readPairings } from "./lib/pairing-store.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = path.join(appRoot, "output", "pairing-test", "registry.json");
const sender = `Test sender ${Date.now()}`;
const issued = ensurePairing(store, "synthetic", sender);
if (!issued.created || !issued.pairingKey || issued.record.status !== "QUARANTINED") throw new Error("Unknown stream was not quarantined with a key.");
if (JSON.stringify(readPairings(store)).includes(issued.pairingKey)) throw new Error("Plaintext pairing key leaked into registry.");
const approved = approvePairing(store, issued.pairingKey, "test-cli");
if (approved.record.status !== "PAIRED" || approved.alreadyApproved) throw new Error("Pairing approval did not transition to PAIRED.");
const replay = ensurePairing(store, "synthetic", sender);
if (replay.created || replay.pairingKey || replay.record.status !== "PAIRED") throw new Error("Known stream did not retain paired state without a new key.");
console.log("Pairing gate checks passed.");
