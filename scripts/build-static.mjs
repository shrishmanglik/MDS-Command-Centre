import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(appRoot, "dist");

function copy(relativePath) {
  const source = path.join(appRoot, relativePath);
  const target = path.join(dist, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.rmSync(dist, { recursive: true, force: true });
copy("index.html");
copy("graph-editor.html");
copy("src/styles.css");
copy("src/graph-editor.css");
copy("src/graph-editor.js");
copy("src/static-app.js");
copy("src/data/warRoomSnapshot.json");
copy("src/data/localTickets.json");
copy("src/data/localActivityLog.json");
copy("src/data/localDecisionExports.json");
copy("src/data/localResearchSources.json");
copy("src/data/localResearchBriefs.json");
copy("src/data/localDeltaReviews.json");
copy("src/data/localAgentRuns.json");
copy("src/data/localCapabilitySnapshot.json");
copy("src/data/localSourceTruthSnapshot.json");
copy("src/data/localAdapterHealth.json");
copy("src/data/localSourceEvidence.json");
copy("src/data/localCapabilityRequests.json");
copy("src/data/localInboxEvents.json");
copy("src/data/localPairings.json");
copy("src/data/localWorkspaces.json");
copy("src/data/localVoiceCommands.json");
copy("src/data/localModelRouter.json");
copy("src/data/localCanvasDocuments.json");
copy("src/data/localSandboxReceipts.json");
copy("src/data/localPartyRooms.json");
copy("src/data/localPersonaMemory.json");
copy("src/data/localTeamSignals.json");
console.log(`Built static Command Centre to ${path.relative(appRoot, dist)}`);
