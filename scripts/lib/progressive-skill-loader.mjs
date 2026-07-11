import fs from "node:fs";
import path from "node:path";
import { validateSkillPack } from "./skill-validator.mjs";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;

function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

export function matchSkillTriggers(input, registry) {
  const query = normalize(input);
  if (!query || query.length > 4000) throw new Error("SKILL_TRIGGER_INPUT_INVALID");
  if (!registry || registry.schemaVersion !== "mds.skill-triggers.v1" || !Array.isArray(registry.skills) || registry.skills.length > 200) throw new Error("SKILL_TRIGGER_REGISTRY_INVALID");
  return registry.skills.map((skill) => {
    if (!/^[a-z][a-z0-9-]{2,63}$/.test(skill.id || "") || !Array.isArray(skill.keywords) || !skill.keywords.length || skill.keywords.length > 20) throw new Error("SKILL_TRIGGER_ENTRY_INVALID");
    const matchedKeywords = skill.keywords.map(normalize).filter((keyword) => keyword.length >= 3 && (` ${query} `).includes(` ${keyword} `));
    return { id: skill.id, relativePath: String(skill.relativePath || ""), matchedKeywords, score: matchedKeywords.length };
  }).filter((skill) => skill.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 3);
}

export function loadTriggeredSkills({ input, registryPath, skillsRoot, fsApi = fs }) {
  const absoluteRegistry = path.resolve(registryPath); const absoluteRoot = path.resolve(skillsRoot);
  if (SECRET_PATH.test(absoluteRegistry) || SECRET_PATH.test(absoluteRoot)) throw new Error("SKILL_TRIGGER_SECRET_PATH");
  const registry = JSON.parse(fsApi.readFileSync(absoluteRegistry, "utf8"));
  const matches = matchSkillTriggers(input, registry); const loaded = [];
  for (const match of matches) {
    const packPath = path.resolve(absoluteRoot, match.relativePath); const relative = path.relative(absoluteRoot, packPath);
    if (relative.startsWith("..") || path.isAbsolute(relative) || SECRET_PATH.test(packPath)) throw new Error("SKILL_TRIGGER_PATH_ESCAPE");
    const validation = validateSkillPack(packPath, fsApi); if (!validation.valid) throw new Error(`SKILL_TRIGGER_PACK_INVALID: ${match.id}`);
    const entrypoint = path.join(packPath, "SKILL.md"); const instructions = fsApi.readFileSync(entrypoint, "utf8");
    if (instructions.length > 128 * 1024) throw new Error("SKILL_TRIGGER_INSTRUCTIONS_TOO_LARGE");
    loaded.push({ id: match.id, matchedKeywords: match.matchedKeywords, instructions });
  }
  return { schemaVersion: "mds.progressive-skill-context.v1", matchedSkillCount: matches.length, loadedSkillCount: loaded.length, loaded, unmatchedInstructionsRead: false, maxSkills: 3, executionStarted: false, authority: "Local prompt-context assembly only. Matching does not install, execute, trust, or grant authority to a Skill Pack." };
}
