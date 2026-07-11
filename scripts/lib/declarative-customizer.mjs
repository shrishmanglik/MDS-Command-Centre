import fs from "node:fs";
import path from "node:path";
import { parse } from "smol-toml";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;
const ROOT_KEYS = new Set(["schema_version", "agent", "limits", "rules"]);
const TABLE_KEYS = Object.freeze({ agent: new Set(["id", "prompt", "tools"]), limits: new Set(["max_tool_calls", "max_output_chars"]), rules: new Set(["require_work_order", "deny_provider_mutation", "preserve_unknown"]) });
const TOOL_ALLOWLIST = new Set(["Read", "Grep", "Glob", "Validate", "Test"]);
const UNSAFE_PROMPT = /\b(?:ignore (?:all |previous )?instructions|reveal (?:secrets?|tokens?)|read \.env|disable (?:safety|rules)|bypass approval|curl\s|powershell\s|cmd\.exe)\b/i;

function exactKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}_TABLE_REQUIRED`);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label}_UNKNOWN_FIELD: ${unknown.join(",")}`);
}

export function validateCustomizerConfig(config) {
  exactKeys(config, ROOT_KEYS, "ROOT");
  if (config.schema_version !== "mds.customizer.v1") throw new Error("CUSTOMIZER_SCHEMA_INVALID");
  for (const table of Object.keys(TABLE_KEYS)) exactKeys(config[table], TABLE_KEYS[table], table.toUpperCase());
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(config.agent.id || "")) throw new Error("CUSTOMIZER_AGENT_ID_INVALID");
  const prompt = String(config.agent.prompt || "").trim();
  if (!prompt || prompt.length > 4000 || UNSAFE_PROMPT.test(prompt)) throw new Error("CUSTOMIZER_PROMPT_INVALID");
  if (!Array.isArray(config.agent.tools) || config.agent.tools.length > 5 || config.agent.tools.some((tool) => !TOOL_ALLOWLIST.has(tool))) throw new Error("CUSTOMIZER_TOOLS_INVALID");
  const maxToolCalls = Number(config.limits.max_tool_calls);
  const maxOutputChars = Number(config.limits.max_output_chars);
  if (!Number.isInteger(maxToolCalls) || maxToolCalls < 0 || maxToolCalls > 25) throw new Error("CUSTOMIZER_TOOL_LIMIT_INVALID");
  if (!Number.isInteger(maxOutputChars) || maxOutputChars < 1000 || maxOutputChars > 50_000) throw new Error("CUSTOMIZER_OUTPUT_LIMIT_INVALID");
  if (Object.values(config.rules).some((value) => value !== true)) throw new Error("CUSTOMIZER_SAFETY_RULE_CANNOT_BE_DISABLED");
  return {
    schemaVersion: "mds.customizer-receipt.v1",
    agent: { id: config.agent.id, prompt, tools: [...new Set(config.agent.tools)] },
    limits: { maxToolCalls, maxOutputChars },
    rules: { requireWorkOrder: true, denyProviderMutation: true, preserveUnknown: true },
    status: "VALID_LOCAL_OVERRIDE",
    applied: false,
    authority: "Validated local metadata only. Applying the override requires a separate runtime action and does not grant tools, provider access, or execution authority.",
  };
}

export function parseCustomizerFile(configPath) {
  const absolute = path.resolve(configPath);
  if (SECRET_PATH.test(absolute)) throw new Error("CUSTOMIZER_SECRET_SHAPED_PATH");
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size > 64 * 1024) throw new Error("CUSTOMIZER_FILE_INVALID");
  return validateCustomizerConfig(parse(fs.readFileSync(absolute, "utf8")));
}

export { TOOL_ALLOWLIST as CUSTOMIZER_TOOL_ALLOWLIST };
