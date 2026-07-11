import { execFileSync } from "node:child_process";

const LOOP_ALLOWLIST = Object.freeze(["lint", "build:static", "test:model-router", "test:verification-gap", "test:docs-staleness", "test:party-room", "test:persona-memory", "test:midas-loop", "harness:check"]);
const LOOP_PROFILES = Object.freeze({
  quick: ["lint", "test:verification-gap", "build:static"],
  full: ["lint", "test:verification-gap", "test:docs-staleness", "test:model-router", "build:static"],
});

function redactOutput(value) {
  return String(value || "")
    .replace(/((?:token|secret|password|api[_-]?key|authorization)\s*[:=]\s*)\S+/gi, "$1[REDACTED]")
    .slice(-4000);
}

function defaultRunner(script, cwd, timeoutMs) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  return execFileSync(npm, ["run", script], { cwd, encoding: "utf8", timeout: timeoutMs, windowsHide: true, maxBuffer: 512 * 1024 });
}

export function runMidasLoop({ room, scripts, profile, cwd, runner = defaultRunner, timeoutMs = 60_000 }) {
  if (room?.status !== "HANDOFF_READY" || room?.decision?.disposition !== "APPROVED") throw new Error("MIDAS_LOOP_APPROVED_HANDOFF_REQUIRED");
  if (profile) {
    if (!Object.hasOwn(LOOP_PROFILES, profile)) throw new Error("MIDAS_LOOP_PROFILE_INVALID");
    scripts = LOOP_PROFILES[profile];
  }
  if (!Array.isArray(scripts) || !scripts.length || scripts.length > 5 || scripts.some((script) => !LOOP_ALLOWLIST.includes(script))) throw new Error("MIDAS_LOOP_SCRIPT_NOT_ALLOWED");
  const startedAt = new Date().toISOString();
  const steps = [];
  for (const script of scripts) {
    try {
      const output = redactOutput(runner(script, cwd, timeoutMs));
      steps.push({ script, status: "PASS", output });
    } catch (error) {
      steps.push({ script, status: "FAIL", output: redactOutput(error.stdout || error.stderr || error.message) });
      break;
    }
  }
  const failedStep = steps.find((step) => step.status === "FAIL");
  return {
    schemaVersion: "mds.local-dev-loop-receipt.v1", roomId: room.id, startedAt, completedAt: new Date().toISOString(),
    status: steps.length === scripts.length && steps.every((step) => step.status === "PASS") ? "VERIFICATION_PASS" : "STOPPED_ON_FAILURE",
    profile: profile || "custom-allowlisted", steps, sequential: true, maxAttemptsPerStep: 1, codeModified: false,
    correctionPacket: failedStep ? { status: "READY_FOR_AGENT_HANDOFF", failedScript: failedStep.script, errorExcerpt: failedStep.output, requestedAction: "Diagnose the failed local stage, propose a bounded code change, and rerun only after operator approval.", agentCorrectionStarted: false } : null,
    providerCallsMade: false, deployStarted: false, pushStarted: false, secretsRead: false,
    authority: "Approved local verification loop only. It does not edit code, retry failures, deploy, push, merge, or call providers.",
  };
}

export { LOOP_ALLOWLIST, LOOP_PROFILES };
