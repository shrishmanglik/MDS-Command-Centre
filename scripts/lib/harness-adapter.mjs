import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;
const ALLOWED_FIELDS = new Set(["schemaVersion", "id", "name", "description", "argumentHint", "tools"]);
const ALLOWED_TOOLS = new Set(["Read", "Grep", "Glob"]);
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");

function parseSource(sourcePath) {
  if (SECRET_PATH.test(sourcePath)) throw new Error("SECRET_SHAPED_SOURCE_PATH");
  const stat = fs.statSync(sourcePath);
  if (!stat.isFile() || stat.size > 128 * 1024) throw new Error("SOURCE_SIZE_OR_TYPE_INVALID");
  const raw = fs.readFileSync(sourcePath, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) throw new Error("FRONTMATTER_REQUIRED");
  const document = YAML.parseDocument(match[1], { uniqueKeys: true, maxAliasCount: 0 });
  if (document.errors.length) throw new Error(`FRONTMATTER_INVALID: ${document.errors[0].message}`);
  const metadata = document.toJS({ maxAliasCount: 0 });
  const unknown = Object.keys(metadata).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unknown.length) throw new Error(`UNKNOWN_FIELD: ${unknown.join(",")}`);
  if (metadata.schemaVersion !== "mds.harness-source.v1") throw new Error("SCHEMA_VERSION_INVALID");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id || "")) throw new Error("ID_INVALID");
  for (const field of ["name", "description", "argumentHint"]) {
    if (typeof metadata[field] !== "string" || !metadata[field].trim() || metadata[field].length > 240) throw new Error(`${field.toUpperCase()}_INVALID`);
  }
  if (!Array.isArray(metadata.tools) || metadata.tools.some((tool) => !ALLOWED_TOOLS.has(tool))) throw new Error("TOOLS_INVALID");
  const body = match[2].trim();
  if (!body || body.length > 64 * 1024) throw new Error("BODY_INVALID");
  if (/!\{[\s\S]*?\}|@\{[\s\S]*?\}/.test(body)) throw new Error("EXECUTION_DIRECTIVE_FORBIDDEN");
  return { raw, metadata, body };
}

function renderTargets(metadata, body) {
  const input = `\n\nUser input: {{args}}`;
  return {
    [`.claude/agents/${metadata.id}.md`]: `---\nname: ${metadata.id}\ndescription: ${metadata.description}\ntools: ${metadata.tools.join(", ")}\n---\n${body}${input}\n`,
    [`.cursor/rules/${metadata.id}.mdc`]: `---\ndescription: ${metadata.description}\nglobs:\nalwaysApply: false\n---\n${body}${input}\n`,
    [`.gemini/commands/${metadata.id}.toml`]: `description = ${JSON.stringify(metadata.description)}\nprompt = ${JSON.stringify(`${body}${input}`)}\n`,
    [`.github/prompts/${metadata.id}.prompt.md`]: `---\nagent: 'agent'\ndescription: '${metadata.description.replaceAll("'", "''")}'\n---\n${body}\n\nUser input: \${input:request:${metadata.argumentHint.replaceAll("}", "")}}\n`,
  };
}

export function exportHarnessAdapters(sourcePath, options = {}) {
  const absoluteSource = path.resolve(sourcePath);
  const outputRoot = path.resolve(options.outputRoot || "generated-harnesses");
  const { raw, metadata, body } = parseSource(absoluteSource);
  const targets = renderTargets(metadata, body);
  const manifest = {
    schemaVersion: "mds.harness-export.v1",
    source: path.basename(absoluteSource),
    sourceSha256: digest(raw),
    authority: "Generated configuration only. No editor installation, provider call, credential access, or execution authority.",
    outputs: Object.entries(targets).map(([relativePath, content]) => ({ relativePath, sha256: digest(content) })),
  };
  const files = { ...targets, "manifest.json": `${JSON.stringify(manifest, null, 2)}\n` };
  const drift = Object.entries(files).filter(([relativePath, content]) => {
    const target = path.join(outputRoot, metadata.id, relativePath);
    return !fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content;
  }).map(([relativePath]) => relativePath);
  if (!options.check) {
    for (const [relativePath, content] of Object.entries(files)) {
      const target = path.join(outputRoot, metadata.id, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, "utf8");
    }
  }
  return { status: options.check ? (drift.length ? "DRIFT" : "PASS") : "EXPORTED", id: metadata.id, outputRoot, drift, manifest };
}
