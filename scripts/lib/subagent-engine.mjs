import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";

const TYPES = new Set(["sha256", "text-metrics", "json-validate", "test-plan"]);
const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;

function validateTask(task, index) {
  if (!task || !TYPES.has(task.type)) throw new Error(`SUBAGENT_TASK_TYPE_INVALID: ${index}`);
  const payload = task.payload && typeof task.payload === "object" && !Array.isArray(task.payload) ? task.payload : {};
  if (Buffer.byteLength(JSON.stringify(payload)) > 64 * 1024) throw new Error(`SUBAGENT_PAYLOAD_TOO_LARGE: ${index}`);
  return { id: String(task.id || `task-${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 48), type: task.type, payload };
}

function spawnOne(task, timeoutMs) {
  return new Promise((resolve) => {
    const rpcId = crypto.randomUUID();
    const worker = new Worker(new URL("./subagent-worker-thread.mjs", import.meta.url), { resourceLimits: { maxOldGenerationSizeMb: 32, maxYoungGenerationSizeMb: 8, stackSizeMb: 2 } });
    let settled = false;
    const finish = (receipt) => { if (settled) return; settled = true; clearTimeout(timer); worker.terminate(); resolve({ taskId: task.id, type: task.type, rpcId, ...receipt }); };
    const timer = setTimeout(() => finish({ status: "TIMEOUT", error: "WORKER_TIMEOUT" }), timeoutMs);
    worker.once("message", (message) => finish(message.rpcId === rpcId ? message : { status: "FAILED", error: "RPC_ID_MISMATCH" }));
    worker.once("error", (error) => finish({ status: "FAILED", error: String(error.message).slice(0, 240) }));
    worker.postMessage({ rpcId, task });
  });
}

export async function spawnParallelSubagents({ tasks, concurrency = 2, timeoutMs = 5000 }) {
  if (!Array.isArray(tasks) || !tasks.length || tasks.length > 16) throw new Error("SUBAGENT_TASK_COUNT_INVALID");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("SUBAGENT_CONCURRENCY_INVALID");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 10_000) throw new Error("SUBAGENT_TIMEOUT_INVALID");
  const queue = tasks.map(validateTask);
  const results = new Array(queue.length);
  let cursor = 0;
  async function lane() { while (cursor < queue.length) { const index = cursor++; results[index] = await spawnOne(queue[index], timeoutMs); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => lane()));
  return { schemaVersion: "mds.parallel-subagent-receipt.v1", status: results.every((item) => item.status === "COMPLETED") ? "COMPLETED" : "PARTIAL", concurrency, taskCount: tasks.length, results, workerIsolation: "NODE_WORKER_THREAD", arbitraryCodeAllowed: false, shellAllowed: false, filesystemAllowed: false, providerCallsMade: false, credentialValuesRead: false, contextMode: "SERIALIZED_TASK_PAYLOAD_ONLY" };
}

export async function runSubagentTaskFile(taskFile) {
  const absolute = path.resolve(taskFile);
  if (SECRET_PATH.test(absolute)) throw new Error("SUBAGENT_SECRET_SHAPED_PATH");
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size > 256 * 1024) throw new Error("SUBAGENT_TASK_FILE_INVALID");
  const parsed = JSON.parse(fs.readFileSync(absolute, "utf8"));
  return spawnParallelSubagents({ tasks: parsed.tasks, concurrency: parsed.concurrency || 2, timeoutMs: parsed.timeoutMs || 5000 });
}

export { TYPES as SUBAGENT_TASK_TYPES };
