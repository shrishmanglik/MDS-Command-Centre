const TASK_CHAINS = {
  coding: ["qwen3-coder:30b", "llama3.1:8b", "qwen2.5vl:3b"],
  general: ["llama3.1:8b", "gemma4:latest", "qwen2.5vl:3b"],
  multimodal: ["qwen2.5vl:3b", "gemma4:latest"],
};
const FAILURE_COOLDOWNS = { rate_limit: 15 * 60_000, quota_exhausted: 60 * 60_000, auth_unavailable: 30 * 60_000, runtime_unavailable: 5 * 60_000 };
const LOCAL_MODEL_CONTRACTS = Object.freeze({
  chat: { input: "messages", output: "assistant_message" },
  embedding: { input: "text_batch", output: "float_vectors" },
  vector_search: { input: "query_vector", output: "ranked_documents" },
});

function isOpen(failure, now) {
  return failure && new Date(failure.openUntil).getTime() > now;
}

export function recordModelFailure(state, input, now = Date.now()) {
  const reason = Object.hasOwn(FAILURE_COOLDOWNS, input.reason) ? input.reason : "runtime_unavailable";
  const targetId = String(input.targetId || "").slice(0, 120);
  if (!targetId) throw new Error("Failure targetId is required.");
  const failure = { targetId, reason, openedAt: new Date(now).toISOString(), openUntil: new Date(now + FAILURE_COOLDOWNS[reason]).toISOString(), source: "LOCAL_FAILURE_SIGNAL_ONLY" };
  return { ...state, failures: [failure, ...(state.failures || []).filter((item) => item.targetId !== targetId)].slice(0, 100), updatedAt: new Date(now).toISOString() };
}

export function resolveModelRoute({ taskClass = "general", inventory = [], profiles = [], state = {}, now = Date.now() }) {
  const normalizedTask = Object.hasOwn(TASK_CHAINS, taskClass) ? taskClass : "general";
  const failures = state.failures || [];
  const external = profiles.find((profile) => profile.status === "VERIFIED" && !isOpen(failures.find((item) => item.targetId === profile.id), now));
  if (external) return receipt(normalizedTask, "external", external.id, "VERIFIED_PROFILE_SELECTED", failures, now);
  const installed = new Set(inventory.filter((model) => model.local === true).map((model) => model.name));
  const local = TASK_CHAINS[normalizedTask].find((name) => installed.has(name) && !isOpen(failures.find((item) => item.targetId === name), now));
  if (local) return receipt(normalizedTask, "local", local, "LOCAL_MODEL_SELECTED", failures, now);
  return receipt(normalizedTask, "offline", "manual-offline-handoff", "NO_VERIFIED_MODEL_AVAILABLE", failures, now);
}

export function resolveLocalModelContract({ operation, inventory = [], state = {}, requirements = {}, now = Date.now() }) {
  if (!Object.hasOwn(LOCAL_MODEL_CONTRACTS, operation)) throw new Error("UNSUPPORTED_LOCAL_MODEL_OPERATION");
  const minContextTokens = Number(requirements.minContextTokens || 0);
  if (!Number.isInteger(minContextTokens) || minContextTokens < 0 || minContextTokens > 1_000_000) throw new Error("INVALID_CONTEXT_REQUIREMENT");
  const failures = state.failures || [];
  const candidates = inventory.filter((model) =>
    model.local === true && model.status === "AVAILABLE" &&
    Array.isArray(model.interfaces) && model.interfaces.includes(operation) &&
    Number(model.contextTokens || 0) >= minContextTokens &&
    !isOpen(failures.find((failure) => failure.targetId === model.id), now),
  );
  candidates.sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0) || String(left.id).localeCompare(String(right.id)));
  const selected = candidates[0];
  return {
    schemaVersion: "mds.local-model-contract-receipt.v1",
    operation, contract: LOCAL_MODEL_CONTRACTS[operation],
    status: selected ? "LOCAL_ADAPTER_SELECTED" : "BLOCKED_NO_LOCAL_ADAPTER",
    adapterId: selected?.id || null, modelId: selected?.modelId || null,
    endpoint: selected?.endpoint === "loopback" ? "loopback" : "NOT_EXPOSED",
    promptMutationRequired: false, executionStarted: false,
    externalFallbackAllowed: false, credentialValuesRead: false,
    authority: "Local routing receipt only. Availability must be declared by local inventory; no model call, download, process start, or provider fallback occurs.",
  };
}

function receipt(taskClass, layer, targetId, reason, failures, now) {
  return {
    schemaVersion: "mds.model-route-receipt.v1",
    resolvedAt: new Date(now).toISOString(),
    taskClass,
    layer,
    targetId,
    reason,
    executionStarted: false,
    credentialValuesRead: false,
    authority: "Routing decision only. Runtime execution and provider success require separate evidence.",
    openCircuits: failures.filter((failure) => isOpen(failure, now)).map(({ targetId: id, reason: why, openUntil }) => ({ targetId: id, reason: why, openUntil })),
  };
}

export { LOCAL_MODEL_CONTRACTS, TASK_CHAINS };
