import { execFileSync } from "node:child_process";

const LOOP_ALLOWLIST = Object.freeze(["lint", "test:verification-gap", "test:docs-staleness", "test:party-room", "test:persona-memory", "test:midas-loop", "harness:check"]);

function defaultRunner(script, cwd, timeoutMs) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  return execFileSync(npm, ["run", script], { cwd, encoding: "utf8", timeout: timeoutMs, windowsHide: true, maxBuffer: 512 * 1024 });
}

export function runMidasLoop({ room, scripts, cwd, runner = defaultRunner, timeoutMs = 60_000 }) {
  if (room?.status !== "HANDOFF_READY" || room?.decision?.disposition !== "APPROVED") throw new Error("MIDAS_LOOP_APPROVED_HANDOFF_REQUIRED");
  if (!Array.isArray(scripts) || !scripts.length || scripts.length > 5 || scripts.some((script) => !LOOP_ALLOWLIST.includes(script))) throw new Error("MIDAS_LOOP_SCRIPT_NOT_ALLOWED");
  const startedAt = new Date().toISOString();
  const steps = [];
  for (const script of scripts) {
    try {
      const output = String(runner(script, cwd, timeoutMs) || "").slice(-4000);
      steps.push({ script, status: "PASS", output });
    } catch (error) {
      steps.push({ script, status: "FAIL", output: String(error.stdout || error.stderr || error.message).slice(-4000) });
      break;
    }
  }
  return {
    schemaVersion: "mds.local-dev-loop-receipt.v1", roomId: room.id, startedAt, completedAt: new Date().toISOString(),
    status: steps.length === scripts.length && steps.every((step) => step.status === "PASS") ? "VERIFICATION_PASS" : "STOPPED_ON_FAILURE",
    steps, sequential: true, maxAttemptsPerStep: 1, codeModified: false,
    providerCallsMade: false, deployStarted: false, pushStarted: false, secretsRead: false,
    authority: "Approved local verification loop only. It does not edit code, retry failures, deploy, push, merge, or call providers.",
  };
}

export { LOOP_ALLOWLIST };
