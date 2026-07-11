import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

const REQUIRED = ["schemaVersion", "id", "objective", "evidenceRequirement", "stopCondition", "validationPlan", "authority", "steps"];
const SECRET_PATH = /(^|[\\/])\.env[^\\/]*$|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|\.npmrc$/i;
const clamp = (value) => Math.max(1, Math.min(5, Math.round(value * 100) / 100));

function parseWorkflow(file) {
  const absolute = path.resolve(file);
  if (SECRET_PATH.test(absolute)) throw new Error("Refused secret-shaped workflow path.");
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error("Workflow file not found.");
  if (fs.statSync(absolute).size > 256 * 1024) throw new Error("Workflow exceeds 256 KiB.");
  const source = fs.readFileSync(absolute, "utf8");
  if (absolute.endsWith(".json")) return { workflow: JSON.parse(source), source, absolute };
  if (!/\.ya?ml$/i.test(absolute)) throw new Error("Workflow must be JSON or YAML.");
  const document = parseDocument(source, { maxAliasCount: 0, strict: true, uniqueKeys: true, schema: "core" });
  if (document.errors.length || document.warnings.length) throw new Error(`Workflow YAML invalid: ${[...document.errors, ...document.warnings].map((item) => item.message).join("; ")}`);
  return { workflow: document.toJS({ maxAliasCount: 0 }), source, absolute };
}

function layerScores(workflow) {
  const present = REQUIRED.filter((key) => key === "steps" ? Array.isArray(workflow?.steps) && workflow.steps.length > 0 : String(workflow?.[key] || "").trim()).length;
  const staticScore = clamp(1 + 4 * (present / REQUIRED.length));
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  const stepFields = steps.length ? steps.flatMap((step) => [step?.id, step?.action, step?.expectedOutput, step?.validation]).filter((value) => String(value || "").trim()).length / (steps.length * 4) : 0;
  const governance = [workflow?.evidenceRequirement, workflow?.stopCondition, workflow?.validationPlan, workflow?.authority].filter((value) => String(value || "").trim().length >= 12).length / 4;
  const rubricScore = clamp(1 + 4 * ((stepFields * 0.6) + (governance * 0.4)));
  return { staticScore, rubricScore };
}

function generator(seedHex) { let state = Number.parseInt(seedHex.slice(0, 8), 16) || 1; return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; }
function mutate(workflow, random) {
  const copy = JSON.parse(JSON.stringify(workflow));
  const modes = ["drop-validation", "drop-output", "blank-governance", "drop-step", "no-op"];
  const mode = modes[Math.floor(random() * modes.length)];
  const steps = Array.isArray(copy.steps) ? copy.steps : [];
  const index = steps.length ? Math.floor(random() * steps.length) : 0;
  if (mode === "drop-validation" && steps[index]) delete steps[index].validation;
  if (mode === "drop-output" && steps[index]) delete steps[index].expectedOutput;
  if (mode === "drop-step" && steps.length > 1) steps.splice(index, 1);
  if (mode === "blank-governance") copy[random() > 0.5 ? "evidenceRequirement" : "stopCondition"] = "";
  return copy;
}

function judgeLayer(receiptPath, workflowSha256) {
  if (!receiptPath) return { status: "NOT_RUN", score: null, evidence: "No local LLM judge receipt supplied." };
  const absolute = path.resolve(receiptPath);
  if (SECRET_PATH.test(absolute)) return { status: "REJECTED", score: null, evidence: "Secret-shaped receipt path refused." };
  try {
    const receipt = JSON.parse(fs.readFileSync(absolute, "utf8"));
    const valid = receipt.schemaVersion === "mds.llm-judge-receipt.v1" && receipt.workflowSha256 === workflowSha256 && receipt.evidenceStatus === "VERIFIED_LOCAL_JUDGE" && Number(receipt.score) >= 1 && Number(receipt.score) <= 5 && String(receipt.model || "").length > 2;
    return valid ? { status: "VERIFIED_LOCAL_JUDGE", score: Number(receipt.score), model: String(receipt.model), evidence: "Hash-bound local judge receipt." } : { status: "REJECTED", score: null, evidence: "Judge receipt failed schema, hash, model, score, or evidence-status checks." };
  } catch { return { status: "REJECTED", score: null, evidence: "Judge receipt could not be parsed." }; }
}

export function evaluateWorkflow(file, { trials = 50, judgeReceiptPath } = {}) {
  if (trials !== 50) throw new Error("MDS certification requires exactly 50 trials.");
  const { workflow, source, absolute } = parseWorkflow(file);
  const workflowSha256 = crypto.createHash("sha256").update(source).digest("hex");
  const base = layerScores(workflow);
  const random = generator(workflowSha256);
  const trialScores = Array.from({ length: trials }, () => { const score = layerScores(mutate(workflow, random)); return clamp((score.staticScore + score.rubricScore) / 2); });
  const mean = trialScores.reduce((sum, value) => sum + value, 0) / trials;
  const variance = trialScores.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / trials;
  const standardDeviation = Math.sqrt(variance);
  const provisionalGrade = clamp((base.staticScore + base.rubricScore) / 2);
  const stabilityRate = trialScores.filter((score) => Math.abs(score - provisionalGrade) <= 1).length / trials;
  const stable = stabilityRate >= 0.9 && standardDeviation <= 0.5;
  const judge = judgeLayer(judgeReceiptPath, workflowSha256);
  const certifiedGrade = judge.score == null ? null : clamp((base.staticScore + base.rubricScore + judge.score) / 3);
  const certified = stable && judge.status === "VERIFIED_LOCAL_JUDGE" && certifiedGrade >= 3;
  return { schemaVersion: "mds.plugin-eval.v1", workflowPath: absolute, workflowSha256, gradeScale: "1-5", provisionalGrade, certifiedGrade, certification: certified ? "CERTIFIED" : judge.status !== "VERIFIED_LOCAL_JUDGE" ? "BLOCKED_LLM_JUDGE_EVIDENCE" : stable ? "NOT_CERTIFIED_GRADE" : "NOT_CERTIFIED_UNSTABLE", layers: { static: { status: "COMPLETE", score: base.staticScore }, llmJudge: judge, monteCarlo: { status: "COMPLETE", trials, seed: workflowSha256, mean: clamp(mean), standardDeviation: Math.round(standardDeviation * 1000) / 1000, minimum: Math.min(...trialScores), maximum: Math.max(...trialScores), stabilityRate: Math.round(stabilityRate * 1000) / 1000, stable } }, credentialValuesRead: false, secretFilesRead: false, providerState: "UNKNOWN", authority: "Local evaluation receipt only. A provisional grade is not certification; LLM evidence and stability gates must both pass." };
}
