import assert from "node:assert/strict";
import { buildDockerArgs, normalizeSandboxRequest, sandboxPolicy, SANDBOX_IMAGES } from "./lib/sandbox-runner.mjs";

const request = normalizeSandboxRequest({ runtime: "node20", source: "console.log('ok')", timeoutMs: 99_000 });
assert.equal(request.timeoutMs, 30_000);
const args = buildDockerArgs({ profile: SANDBOX_IMAGES.node20, jobName: "mds-sbx-test", workVolume: "mds-sbx-test" });
for (const required of ["--rm", "--network", "none", "--read-only", "--cap-drop", "ALL", "no-new-privileges:true", "--memory", "256m", "--pids-limit", "64", "65534:65534"]) assert.ok(args.includes(required), required);
assert.ok(args.some((arg) => arg.includes("dst=/workspace,readonly")));
assert.equal(sandboxPolicy().hostMounts, false);
assert.throws(() => normalizeSandboxRequest({ mode: "ssh", runtime: "node20", source: "x" }), /BLOCKED_MODE_UNSUPPORTED/);
assert.throws(() => normalizeSandboxRequest({ runtime: "ubuntu", source: "x" }), /BLOCKED_IMAGE_NOT_ALLOWLISTED/);
assert.throws(() => normalizeSandboxRequest({ runtime: "node20", source: "" }), /required/);
assert.throws(() => normalizeSandboxRequest({ runtime: "node20", source: "x".repeat(70_000) }), /64 KiB/);
assert.throws(() => buildDockerArgs({ profile: SANDBOX_IMAGES.node20, jobName: "bad name", workVolume: "ok" }), /Invalid/);
console.log("Sandbox runner checks passed.");
