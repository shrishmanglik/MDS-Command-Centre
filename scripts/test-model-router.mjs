import { recordModelFailure, resolveLocalModelContract, resolveModelRoute } from "./lib/model-router.mjs";

const now = Date.parse("2026-07-11T00:00:00Z");
const inventory = [{ name: "qwen3-coder:30b", local: true }, { name: "llama3.1:8b", local: true }, { name: "qwen2.5vl:3b", local: true }];
const profiles = [{ id: "api-primary", status: "VERIFIED" }, { id: "api-secondary", status: "VERIFIED" }];
let state = { failures: [] };
let route = resolveModelRoute({ taskClass: "coding", inventory, profiles, state, now });
if (route.targetId !== "api-primary" || route.executionStarted) throw new Error("Verified primary profile was not selected safely.");
state = recordModelFailure(state, { targetId: "api-primary", reason: "rate_limit" }, now);
route = resolveModelRoute({ taskClass: "coding", inventory, profiles, state, now });
if (route.targetId !== "api-secondary") throw new Error("Auth profile rotation did not select the next verified profile.");
state = recordModelFailure(state, { targetId: "api-secondary", reason: "quota_exhausted" }, now);
route = resolveModelRoute({ taskClass: "coding", inventory, profiles, state, now });
if (route.targetId !== "qwen3-coder:30b" || route.layer !== "local") throw new Error("External failure did not fall back to local model.");
state = recordModelFailure(state, { targetId: "qwen3-coder:30b", reason: "runtime_unavailable" }, now);
route = resolveModelRoute({ taskClass: "coding", inventory, profiles, state, now });
if (route.targetId !== "llama3.1:8b") throw new Error("Local model failover chain did not advance.");
route = resolveModelRoute({ taskClass: "multimodal", inventory: [], profiles: [], state: { failures: [] }, now });
if (route.layer !== "offline" || route.targetId !== "manual-offline-handoff") throw new Error("Offline terminal fallback failed.");
const localInventory = [
  { id: "llama-chat", modelId: "llama3.1:8b", local: true, status: "AVAILABLE", interfaces: ["chat"], contextTokens: 8192, priority: 10, endpoint: "loopback" },
  { id: "nomic-embed", modelId: "nomic-embed-text", local: true, status: "AVAILABLE", interfaces: ["embedding"], contextTokens: 8192, priority: 20, endpoint: "loopback" },
  { id: "local-vector", modelId: "sqlite-vector", local: true, status: "AVAILABLE", interfaces: ["vector_search"], contextTokens: 4096, priority: 5, endpoint: "loopback" },
  { id: "cloud-chat", modelId: "remote", local: false, status: "AVAILABLE", interfaces: ["chat"], contextTokens: 100000, priority: 100 },
];
const chatContract = resolveLocalModelContract({ operation: "chat", inventory: localInventory, requirements: { minContextTokens: 4096 }, state, now });
if (chatContract.adapterId !== "llama-chat" || chatContract.promptMutationRequired || chatContract.executionStarted || chatContract.externalFallbackAllowed) throw new Error("Local chat interoperability contract failed.");
const embeddingContract = resolveLocalModelContract({ operation: "embedding", inventory: localInventory, state: {}, now });
if (embeddingContract.adapterId !== "nomic-embed" || embeddingContract.contract.output !== "float_vectors") throw new Error("Local embedding contract failed.");
const blockedContract = resolveLocalModelContract({ operation: "chat", inventory: localInventory, requirements: { minContextTokens: 32768 }, state: {}, now });
if (blockedContract.status !== "BLOCKED_NO_LOCAL_ADAPTER" || blockedContract.adapterId !== null) throw new Error("Unavailable local model did not fail closed.");
console.log("Model router checks passed.");
