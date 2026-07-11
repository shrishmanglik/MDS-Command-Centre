import assert from "node:assert/strict";
import { spawnParallelSubagents } from "./lib/subagent-engine.mjs";
const receipt = await spawnParallelSubagents({ concurrency: 3, tasks: [
  { id: "hash", type: "sha256", payload: { text: "MDS" } },
  { id: "metrics", type: "text-metrics", payload: { text: "one two\nthree" } },
  { id: "plan", type: "test-plan", payload: { subject: "router", behaviors: ["selects local model", "fails closed"] } },
] });
assert.equal(receipt.status, "COMPLETED");
assert.equal(receipt.results.length, 3);
assert.equal(receipt.results[1].result.words, 3);
assert.equal(receipt.results[2].result.cases.length, 4);
assert.equal(receipt.arbitraryCodeAllowed, false);
assert.equal(receipt.contextMode, "SERIALIZED_TASK_PAYLOAD_ONLY");
await assert.rejects(() => spawnParallelSubagents({ tasks: [{ type: "shell", payload: {} }] }), /TYPE_INVALID/);
await assert.rejects(() => spawnParallelSubagents({ tasks: [{ type: "sha256", payload: {} }], concurrency: 5 }), /CONCURRENCY_INVALID/);
console.log("Parallel subagent engine checks passed.");
