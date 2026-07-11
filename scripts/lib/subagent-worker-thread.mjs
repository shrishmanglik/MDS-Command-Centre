import crypto from "node:crypto";
import { parentPort } from "node:worker_threads";

function handle(task) {
  if (task.type === "sha256") return { sha256: crypto.createHash("sha256").update(String(task.payload.text || "")).digest("hex") };
  if (task.type === "text-metrics") {
    const text = String(task.payload.text || "");
    return { characters: text.length, words: text.trim() ? text.trim().split(/\s+/).length : 0, lines: text ? text.split(/\r?\n/).length : 0 };
  }
  if (task.type === "json-validate") {
    try { JSON.parse(String(task.payload.text || "")); return { valid: true, error: null }; }
    catch (error) { return { valid: false, error: String(error.message).slice(0, 240) }; }
  }
  if (task.type === "test-plan") {
    const subject = String(task.payload.subject || "unit").trim().slice(0, 100);
    const behaviors = Array.isArray(task.payload.behaviors) ? task.payload.behaviors.map((item) => String(item).trim().slice(0, 120)).filter(Boolean).slice(0, 20) : [];
    return { subject, cases: behaviors.flatMap((behavior) => [{ title: `${behavior}: expected path`, kind: "positive" }, { title: `${behavior}: rejected boundary`, kind: "negative" }]).slice(0, 40), generatedCode: false };
  }
  throw new Error("WORKER_TASK_TYPE_UNSUPPORTED");
}

parentPort.on("message", (message) => {
  try { parentPort.postMessage({ rpcId: message.rpcId, status: "COMPLETED", result: handle(message.task) }); }
  catch (error) { parentPort.postMessage({ rpcId: message.rpcId, status: "FAILED", error: String(error.message).slice(0, 240) }); }
});
