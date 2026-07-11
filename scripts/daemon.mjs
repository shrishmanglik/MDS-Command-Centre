import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const port = Number(valueAfter("--port", "5178"));
const root = valueAfter("--root", ".");
const probeOnce = args.includes("--probe-once");
const healthUrl = `http://127.0.0.1:${port}/api/health`;
const runtimeDir = path.join(appRoot, "output", "daemon");
const statusFile = path.join(runtimeDir, "status.json");
const logFile = path.join(runtimeDir, "daemon.log");
const errorLogFile = path.join(runtimeDir, "daemon-error.log");
let child;
let stopping = false;
let consecutiveFailures = 0;

if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Daemon port must be an integer from 1024 to 65535.");
fs.mkdirSync(runtimeDir, { recursive: true });

function writeStatus(status, detail = "") {
  const payload = {
    schemaVersion: "mds.command-centre.daemon-status.v1",
    status,
    detail: String(detail).slice(0, 500),
    pid: process.pid,
    childPid: child?.pid || null,
    healthUrl,
    authority: "D-local process evidence only. No provider, delivery, deployment, or external-channel state is proved.",
    updatedAt: new Date().toISOString(),
  };
  const temp = `${statusFile}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temp, statusFile);
}

async function probe() {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`health returned ${response.status}`);
    const payload = await response.json();
    if (payload.api !== true) throw new Error("health payload did not confirm local API");
    consecutiveFailures = 0;
    writeStatus("HEALTHY", `inboxEvents=${payload.inboxEvents ?? "UNKNOWN"}`);
    return true;
  } catch (error) {
    consecutiveFailures += 1;
    writeStatus("DEGRADED", `probe ${consecutiveFailures}/3: ${error.message}`);
    return false;
  }
}

function shutdown(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  writeStatus("STOPPING", signal);
  const timer = setTimeout(() => child?.kill("SIGKILL"), 5000);
  timer.unref();
  if (child && !child.killed) child.kill("SIGTERM");
  else process.exit(exitCode);
}

const stdout = fs.openSync(logFile, "a");
const stderr = fs.openSync(errorLogFile, "a");
child = spawn(process.execPath, ["scripts/serve.mjs", "--root", root, "--port", String(port)], {
  cwd: appRoot,
  env: { ...process.env, MDS_COMMAND_CENTRE_DAEMON: "1" },
  stdio: ["ignore", stdout, stderr],
  windowsHide: true,
});
writeStatus("STARTING", "loopback server spawned");

child.on("error", (error) => {
  writeStatus("FAILED", error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  fs.closeSync(stdout);
  fs.closeSync(stderr);
  writeStatus(stopping ? "STOPPED" : "FAILED", `child exit code=${code ?? "UNKNOWN"} signal=${signal || "none"}`);
  process.exit(stopping ? 0 : code || 1);
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

let ready = false;
for (let attempt = 1; attempt <= 20; attempt += 1) {
  if (await probe()) {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready) shutdown("startup health timeout", 1);
if (probeOnce && ready) shutdown("probe-once complete");

if (!probeOnce) {
  const monitor = setInterval(async () => {
    await probe();
    if (consecutiveFailures >= 3) shutdown("three consecutive health failures", 1);
  }, 15000);
  monitor.unref();
}
