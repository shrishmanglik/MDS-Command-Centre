import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path";
import { loadTriggeredSkills, matchSkillTriggers } from "./lib/progressive-skill-loader.mjs";
const registry=JSON.parse(fs.readFileSync("config/skill-triggers.json","utf8")); assert.equal(matchSkillTriggers("Prepare a work order review with local evidence",registry)[0].score,2);
const matched=loadTriggeredSkills({input:"Create verification findings from local evidence",registryPath:"config/skill-triggers.json",skillsRoot:"skill-packs"}); assert.equal(matched.loadedSkillCount,1); assert.match(matched.loaded[0].instructions,/Local Review/); assert.equal(matched.unmatchedInstructionsRead,false);
const unmatched=loadTriggeredSkills({input:"Format a short greeting",registryPath:"config/skill-triggers.json",skillsRoot:"skill-packs"}); assert.equal(unmatched.loadedSkillCount,0); assert.deepEqual(unmatched.loaded,[]);
assert.throws(()=>matchSkillTriggers("test",{schemaVersion:"wrong",skills:[]}),/REGISTRY_INVALID/); assert.ok(path.isAbsolute(path.resolve("skill-packs"))); console.log("Progressive skill loader checks passed.");
