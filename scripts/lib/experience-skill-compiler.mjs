import fs from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { validateSkillPack } from "./skill-validator.mjs";

const SAFE_COMMAND = /^npm(?:\.cmd)? run (?:lint|build:static|test:[a-z0-9-]+|harness:check|docs:frontmatter|verify:gaps)$/;
const SECRET_TEXT = /(?:\.env|bearer\s+|(?:token|secret|password|api[_-]?key)\s*[:=]|-----BEGIN)/i;

function safeText(value, limit, label) {
  const text = String(value || "").trim();
  if (!text || text.length > limit || SECRET_TEXT.test(text) || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error(`EXPERIENCE_${label}_INVALID`);
  return text;
}

export function validateExperienceTrajectory(input) {
  if (input?.schemaVersion !== "mds.successful-trajectory.v1") throw new Error("EXPERIENCE_SCHEMA_INVALID");
  if (input.operatorApproved !== true || input.outcome !== "SUCCESS") throw new Error("EXPERIENCE_OPERATOR_APPROVAL_AND_SUCCESS_REQUIRED");
  const id = String(input.id || ""); if (!/^[a-z][a-z0-9-]{2,63}$/.test(id)) throw new Error("EXPERIENCE_ID_INVALID");
  if (!Array.isArray(input.steps) || input.steps.length < 2 || input.steps.length > 12) throw new Error("EXPERIENCE_STEP_COUNT_INVALID");
  const steps = input.steps.map((step, index) => {
    const terminalCommand = step.terminalCommand ? String(step.terminalCommand).trim() : null;
    if (terminalCommand && (!SAFE_COMMAND.test(terminalCommand) || /[;&|><`$]/.test(terminalCommand))) throw new Error(`EXPERIENCE_COMMAND_NOT_ALLOWED: ${index + 1}`);
    return { number: index + 1, action: safeText(step.action, 500, "ACTION"), verification: safeText(step.verification, 500, "VERIFICATION"), terminalCommand };
  });
  return { id, name: safeText(input.name, 100, "NAME"), description: safeText(input.description, 500, "DESCRIPTION"), sourceRef: safeText(input.sourceRef, 240, "SOURCE_REF"), steps };
}

export function compileExperienceSkill(input, outputRoot) {
  const trajectory = validateExperienceTrajectory(input);
  const root = path.resolve(outputRoot); const target = path.join(root, trajectory.id);
  const relative = path.relative(root, target); if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("EXPERIENCE_OUTPUT_ESCAPE");
  if (fs.existsSync(target)) throw new Error("EXPERIENCE_SKILL_ALREADY_EXISTS");
  const manifest = { schemaVersion: "mds.skill-pack.v1", id: trajectory.id, name: trajectory.name, version: "0.1.0", description: trajectory.description, entrypoint: "SKILL.md", capabilities: ["read_files", "run_checks"], permissions: { writeFiles: false, modelRequest: false }, inputs: [{ name: "artifactPath", type: "string" }], outputs: [{ name: "evidence", type: "array" }] };
  const body = [`# ${trajectory.name}`, "", trajectory.description, "", `Source evidence: ${trajectory.sourceRef}`, "", "Read fully and follow:"];
  for (const step of trajectory.steps) {
    body.push(`${step.number}. ${step.action}`, `   - Verify: ${step.verification}`);
    if (step.terminalCommand) body.push("", "   ```powershell", `   ${step.terminalCommand}`, "   ```");
  }
  body.push("", "This draft does not grant installation, execution, provider, deploy, push, or secret access authority.", "");
  fs.mkdirSync(target, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(target, "skill-pack.yaml"), stringify(manifest), { mode: 0o600 });
  fs.writeFileSync(path.join(target, "SKILL.md"), body.join("\n"), { mode: 0o600 });
  const validation = validateSkillPack(target);
  return { schemaVersion: "mds.experience-skill-compile.v1", status: validation.valid ? "DRAFT_VALIDATED" : "DRAFT_INVALID", skillPath: target, trajectorySourceRef: trajectory.sourceRef, validation, installed: false, loaded: false, executionApproved: false, operatorPromotionRequired: true };
}
