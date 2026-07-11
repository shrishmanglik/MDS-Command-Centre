const TASK_CHAINS = {
  coding: ["qwen3-coder:30b", "llama3.1:8b", "qwen2.5vl:3b"],
  general: ["llama3.1:8b", "gemma4:latest", "qwen2.5vl:3b"],
  multimodal: ["qwen2.5vl:3b", "gemma4:latest"],
};
const FAILURE_COOLDOWNS = { rate_limit: 15 * 60_000, quota_exhausted: 60 * 60_000, auth_unavailable: 30 * 60_000, runtime_unavailable: 5 * 60_000 };

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

export { TASK_CHAINS };
