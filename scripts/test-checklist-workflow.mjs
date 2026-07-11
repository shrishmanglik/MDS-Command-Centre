import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseChecklistWorkflow } from "./lib/checklist-workflow.mjs";

const valid = parseChecklistWorkflow("workflows/local-proof.checklist.md");
assert.equal(valid.status, "READY_FOR_SEQUENTIAL_REVIEW");
assert.equal(valid.steps.length, 3);
assert.equal(valid.steps[0].eligible, true);
assert.equal(valid.steps[1].eligible, false);
assert.equal(valid.executionStarted, false);
const root = fs.mkdtempSync(path.join(os.tmpdir(), "mds-checklist-"));
const base = fs.readFileSync("workflows/local-proof.checklist.md", "utf8");
const cases = [
  ["sequence.md", base.replace("2. [ ]", "3. [ ]"), /STEP_SEQUENCE_INVALID/],
  ["checked.md", base.replace("1. [ ]", "1. [x]"), /PRECHECKED_STEP_FORBIDDEN/],
  ["generic.md", base.replace("Read the named work order", "Execute the named work order"), /GENERIC_EXECUTE_FORBIDDEN/],
  ["missing.md", base.replace(/   - Verify: Every proposed target[^\n]+\n/, ""), /STEP_FIELD_MISSING/],
];
for (const [name, content, expected] of cases) {
  const file = path.join(root, name); fs.writeFileSync(file, content);
  assert.throws(() => parseChecklistWorkflow(file), expected);
}
fs.rmSync(root, { recursive: true, force: true });
console.log("Structured checklist workflow checks passed.");
