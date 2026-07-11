import crypto from "node:crypto";

export const SANDBOX_IMAGES = Object.freeze({
  node20: { image: "node:20-alpine", command: ["node", "/workspace/main.js"], filename: "main.js" },
  python312: { image: "python:3.12-alpine", command: ["python", "-I", "/workspace/main.py"], filename: "main.py" },
});

const MAX_SOURCE_BYTES = 64 * 1024;
const MAX_TIMEOUT_MS = 30_000;

export function normalizeSandboxRequest(input = {}) {
  if (input.mode && input.mode !== "docker") throw new Error("BLOCKED_MODE_UNSUPPORTED: only Docker isolation is enabled.");
  const runtime = String(input.runtime || "");
  const profile = SANDBOX_IMAGES[runtime];
  if (!profile) throw new Error("BLOCKED_IMAGE_NOT_ALLOWLISTED");
  const source = String(input.source || "");
  if (!source.trim()) throw new Error("Source is required.");
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) throw new Error("Source exceeds 64 KiB.");
  const timeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(1_000, Number(input.timeoutMs) || 10_000));
  return { runtime, source, timeoutMs, profile };
}

export function buildDockerArgs({ profile, jobName, workVolume }) {
  if (!/^[a-z0-9][a-z0-9_.-]{0,62}$/.test(jobName)) throw new Error("Invalid sandbox job name.");
  if (!/^[a-z0-9][a-z0-9_.-]{0,62}$/.test(workVolume)) throw new Error("Invalid sandbox volume name.");
  return [
    "run", "--rm", "--name", jobName,
    "--network", "none",
    "--read-only",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges:true",
    "--memory", "256m", "--memory-swap", "256m",
    "--cpus", "0.5", "--pids-limit", "64",
    "--user", "65534:65534",
    "--tmpfs", "/tmp:rw,noexec,nosuid,size=32m",
    "--mount", `type=volume,src=${workVolume},dst=/workspace,readonly`,
    profile.image,
    ...profile.command,
  ];
}

export function sandboxIds() {
  const suffix = crypto.randomBytes(6).toString("hex");
  return { receiptId: `SBX-${Date.now().toString(36).toUpperCase()}-${suffix.toUpperCase()}`, jobName: `mds-sbx-${suffix}`, workVolume: `mds-sbx-${suffix}` };
}

export function sandboxPolicy() {
  return {
    mode: "docker",
    ssh: "UNSUPPORTED",
    network: "none",
    rootFilesystem: "read-only",
    hostMounts: false,
    secrets: false,
    privileged: false,
    images: Object.entries(SANDBOX_IMAGES).map(([id, value]) => ({ id, image: value.image })),
    limits: { timeoutMs: MAX_TIMEOUT_MS, sourceBytes: MAX_SOURCE_BYTES, memory: "256m", cpus: 0.5, pids: 64, outputBytes: 2_000 },
    authority: "Ephemeral local Docker execution only. A receipt is not provider, deployment, security-certification, or production proof.",
  };
}
