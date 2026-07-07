// MDS Command Centre - adapter snapshot orchestrator (F5-MV-18).
// Runs every local adapter, writes three sanitized local snapshots plus the
// adapter health ledger, and seeds the two new writable stores if absent.
// Local-only. No provider mutation, no network, no secrets.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  localFilesAdapter,
  driveRootsAdapter,
  vcosAdapter,
  midasRuntimeAdapter,
  capabilityBrokerAdapter,
  gitLocalAdapter,
  githubMetadataAdapter,
  providerCliAdapter,
  modelProviderAdapter,
} from "./adapters/local-adapters.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(appRoot, "src", "data");

function writeJson(fileName, payload) {
  fs.mkdirSync(dataDir, { recursive: true });
  const target = path.join(dataDir, fileName);
  const temp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, target);
  return target;
}

function seedStoreIfMissing(fileName, schemaVersion, authority, collectionKey) {
  const target = path.join(dataDir, fileName);
  if (fs.existsSync(target)) return false;
  writeJson(fileName, {
    schemaVersion,
    updatedAt: new Date().toISOString(),
    authority,
    [collectionKey]: [],
  });
  return true;
}

const startedAt = new Date().toISOString();

const files = localFilesAdapter();
const drives = driveRootsAdapter();
const vcos = vcosAdapter();
const runtime = midasRuntimeAdapter();
const capabilities = capabilityBrokerAdapter();
const gitLocal = gitLocalAdapter();
const github = githubMetadataAdapter();
const providerClis = providerCliAdapter();
const models = modelProviderAdapter();

const all = [files, drives, vcos, runtime, capabilities, gitLocal, github, providerClis, models];

writeJson("localCapabilitySnapshot.json", {
  schemaVersion: "mds.command-centre.local-capability-snapshot.v1",
  generatedAt: startedAt,
  authority:
    "D-local capability records and validator summaries only. Live provider/deploy/db/auth/billing/payment states remain UNKNOWN until provider evidence is collected through an approved safe path.",
  capabilityBroker: capabilities.data,
  providerClis: providerClis.data,
  modelProviders: models.data,
});

writeJson("localSourceTruthSnapshot.json", {
  schemaVersion: "mds.command-centre.local-source-truth-snapshot.v1",
  generatedAt: startedAt,
  authority:
    "D-local filesystem/git metadata only. GitHub remains committed-code authority; drive roles per source-authority doctrine; secret-shaped paths refused at scan time.",
  drives: drives.data,
  allowlistedRoots: files.data,
  vcos: vcos.data,
  midasRuntime: runtime.data,
  gitLocal: gitLocal.data,
  github: github.data,
});

writeJson("localAdapterHealth.json", {
  schemaVersion: "mds.command-centre.local-adapter-health.v1",
  generatedAt: startedAt,
  authority: "Adapter contract + health ledger; degraded/failed adapters must stay visible, never hidden.",
  adapters: all.map(({ data, ...contract }) => contract),
});

const seededEvidence = seedStoreIfMissing(
  "localSourceEvidence.json",
  "mds.command-centre.local-source-evidence.v1",
  "D-local source evidence intake; evidence inputs only until verified and promoted. Not GitHub, provider, or memory truth.",
  "records",
);
const seededRequests = seedStoreIfMissing(
  "localCapabilityRequests.json",
  "mds.command-centre.local-capability-requests.v1",
  "D-local capability/action request packets; request-only staging. No packet grants execution authority by itself.",
  "records",
);

const degraded = all.filter((adapter) => adapter.status !== "ok").map((adapter) => `${adapter.adapter_id}:${adapter.status}`);
console.log(
  JSON.stringify(
    {
      ok: true,
      generatedAt: startedAt,
      adapters: all.length,
      degraded,
      seededEvidenceStore: seededEvidence,
      seededRequestStore: seededRequests,
    },
    null,
    2,
  ),
);
