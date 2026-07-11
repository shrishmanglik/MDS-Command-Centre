import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;
const FIELDS = new Set(["schemaVersion", "id", "title", "authority"]);
const fail = (code, detail = "") => { throw new Error(detail ? `${code}: ${detail}` : code); };

export function parseChecklistWorkflow(workflowPath) {
  const absolutePath = path.resolve(workflowPath);
  if (SECRET_PATH.test(absolutePath)) fail("SECRET_SHAPED_WORKFLOW_PATH");
  const stat = fs.statSync(absolutePath);
  if (!stat.isFile() || stat.size > 128 * 1024) fail("WORKFLOW_SIZE_OR_TYPE_INVALID");
  const source = fs.readFileSync(absolutePath, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) fail("FRONTMATTER_REQUIRED");
  const document = YAML.parseDocument(match[1], { uniqueKeys: true, maxAliasCount: 0 });
  if (document.errors.length) fail("FRONTMATTER_INVALID", document.errors[0].message);
  const metadata = document.toJS({ maxAliasCount: 0 });
  const unknown = Object.keys(metadata).filter((key) => !FIELDS.has(key));
  if (unknown.length) fail("UNKNOWN_FIELD", unknown.join(","));
  if (metadata.schemaVersion !== "mds.checklist-workflow.v1") fail("SCHEMA_VERSION_INVALID");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id || "")) fail("ID_INVALID");
  if (typeof metadata.title !== "string" || !metadata.title.trim() || metadata.title.length > 160) fail("TITLE_INVALID");
  if (metadata.authority !== "LOCAL_PLAN_ONLY") fail("AUTHORITY_INVALID");
  const body = match[2].trim();
  if (!body.startsWith("Read fully and follow:\n") && !body.startsWith("Read fully and follow:\r\n")) fail("CHECKLIST_HEADING_REQUIRED");
  if (/\bexecute\b/i.test(body)) fail("GENERIC_EXECUTE_FORBIDDEN");
  const steps = [];
  let current = null;
  for (const line of body.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const step = line.match(/^(\d+)\. \[([ xX])\] (.+)$/);
    if (step) {
      if (step[2] !== " ") fail("PRECHECKED_STEP_FORBIDDEN", step[1]);
      current = { number: Number(step[1]), title: step[3].trim() };
      if (!current.title || current.title.length > 160) fail("STEP_TITLE_INVALID", step[1]);
      steps.push(current);
      continue;
    }
    const field = line.match(/^ {3}- (Action|Verify|Stop if): (.+)$/);
    if (!field || !current) fail("STEP_FORMAT_INVALID", line.trim());
    const key = field[1] === "Stop if" ? "stopIf" : field[1].toLowerCase();
    if (current[key]) fail("DUPLICATE_STEP_FIELD", `${current.number}.${field[1]}`);
    current[key] = field[2].trim();
  }
  if (!steps.length || steps.length > 100) fail("STEP_COUNT_INVALID");
  steps.forEach((step, index) => {
    if (step.number !== index + 1) fail("STEP_SEQUENCE_INVALID", `${step.number} at position ${index + 1}`);
    for (const key of ["action", "verify", "stopIf"]) if (!step[key]) fail("STEP_FIELD_MISSING", `${step.number}.${key}`);
  });
  return {
    schemaVersion: "mds.checklist-plan.v1", workflowId: metadata.id, title: metadata.title,
    sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
    status: "READY_FOR_SEQUENTIAL_REVIEW", currentStep: 1,
    steps: steps.map((step, index) => ({ ...step, status: "PENDING", eligible: index === 0 })),
    executionStarted: false,
    authority: "Parsed local checklist only. The parser does not run actions, commands, providers, deploys, or workflows.",
  };
}
