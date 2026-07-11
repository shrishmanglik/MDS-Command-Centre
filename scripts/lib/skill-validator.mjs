import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

const MANIFESTS = ["skill-pack.yaml", "skill-pack.yml", "skill-pack.json"];
const TOP_LEVEL = new Set(["schemaVersion", "id", "name", "version", "description", "entrypoint", "capabilities", "permissions", "inputs", "outputs"]);
const CAPABILITIES = new Set(["read_files", "write_files", "run_checks", "model_request"]);
const VALUE_TYPES = new Set(["string", "boolean", "number", "object", "array"]);
const SECRET_PATH = /(^|[\\/])\.env[^\\/]*$|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|\.npmrc$/i;
const FORBIDDEN_FIELD = /^(secret|secrets|token|tokens|password|passwords|credential|credentials|api[_-]?key|private[_-]?key|command|commands|shell|script|url|endpoint)$/i;

function issue(code, pointer, message) { return { code, pointer, message }; }
function resolveManifest(inputPath, fsApi) {
  const absolute = path.resolve(inputPath);
  if (!fsApi.existsSync(absolute)) throw new Error("Skill Pack path does not exist.");
  if (fsApi.statSync(absolute).isDirectory()) {
    const matches = MANIFESTS.map((name) => path.join(absolute, name)).filter((file) => fsApi.existsSync(file));
    if (matches.length !== 1) throw new Error(`Skill Pack directory must contain exactly one of: ${MANIFESTS.join(", ")}.`);
    return matches[0];
  }
  if (!MANIFESTS.includes(path.basename(absolute))) throw new Error("Manifest filename must be skill-pack.yaml, skill-pack.yml, or skill-pack.json.");
  return absolute;
}

function parseManifest(file, fsApi) {
  if (SECRET_PATH.test(file)) throw new Error("Refused secret-shaped Skill Pack path.");
  const size = fsApi.statSync(file).size;
  if (size < 2 || size > 128 * 1024) throw new Error("Skill Pack manifest must be between 2 bytes and 128 KiB.");
  const source = fsApi.readFileSync(file, "utf8");
  if (file.endsWith(".json")) return JSON.parse(source);
  const document = parseDocument(source, { maxAliasCount: 0, strict: true, uniqueKeys: true, schema: "core" });
  if (document.errors.length) throw new Error(`YAML parse failed: ${document.errors.map((error) => error.message).join("; ")}`);
  if (document.warnings.length) throw new Error(`YAML warning treated as invalid: ${document.warnings.map((warning) => warning.message).join("; ")}`);
  return document.toJS({ maxAliasCount: 0 });
}

function findForbiddenFields(value, pointer = "", found = []) {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    const next = `${pointer}/${key}`;
    if (FORBIDDEN_FIELD.test(key)) found.push(next);
    findForbiddenFields(child, next, found);
  }
  return found;
}

export function validateSkillPack(inputPath, fsApi = fs) {
  const errors = [];
  let manifestPath;
  let pack;
  try { manifestPath = resolveManifest(inputPath, fsApi); pack = parseManifest(manifestPath, fsApi); } catch (error) { return { status: "INVALID", valid: false, errors: [issue("PARSE_OR_PATH", "/", error.message)], warnings: [], credentialValuesRead: false, secretFilesRead: false }; }
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) errors.push(issue("TYPE", "/", "Manifest root must be an object."));
  if (errors.length) return { status: "INVALID", valid: false, manifestPath, errors, warnings: [], credentialValuesRead: false, secretFilesRead: false };
  for (const key of Object.keys(pack)) if (!TOP_LEVEL.has(key)) errors.push(issue("UNKNOWN_FIELD", `/${key}`, "Unknown top-level field."));
  if (pack.schemaVersion !== "mds.skill-pack.v1") errors.push(issue("SCHEMA_VERSION", "/schemaVersion", "Expected mds.skill-pack.v1."));
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(String(pack.id || ""))) errors.push(issue("ID", "/id", "ID must be a lowercase kebab-case identifier."));
  if (!String(pack.name || "").trim() || String(pack.name).length > 100) errors.push(issue("NAME", "/name", "Name is required and limited to 100 characters."));
  if (!/^\d+\.\d+\.\d+$/.test(String(pack.version || ""))) errors.push(issue("VERSION", "/version", "Version must be exact semver x.y.z."));
  if (!String(pack.description || "").trim() || String(pack.description).length > 500) errors.push(issue("DESCRIPTION", "/description", "Description is required and limited to 500 characters."));
  const capabilities = Array.isArray(pack.capabilities) ? pack.capabilities : [];
  if (!Array.isArray(pack.capabilities) || !capabilities.length || capabilities.length > 12) errors.push(issue("CAPABILITIES", "/capabilities", "Provide 1-12 capabilities."));
  capabilities.forEach((value, index) => { if (!CAPABILITIES.has(value)) errors.push(issue("CAPABILITY", `/capabilities/${index}`, "Capability is not allowlisted.")); });
  const permissions = pack.permissions;
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) errors.push(issue("PERMISSIONS", "/permissions", "Permissions object is required."));
  else {
    for (const key of Object.keys(permissions)) if (!new Set(["writeFiles", "modelRequest"]).has(key)) errors.push(issue("PERMISSION", `/permissions/${key}`, "Permission is not supported in v1."));
    for (const key of ["writeFiles", "modelRequest"]) if (typeof permissions[key] !== "boolean") errors.push(issue("PERMISSION_TYPE", `/permissions/${key}`, "Permission must be boolean."));
  }
  for (const pointer of findForbiddenFields(pack)) errors.push(issue("FORBIDDEN_FIELD", pointer, "Executable, network, or credential-shaped fields are forbidden."));
  for (const collection of ["inputs", "outputs"]) {
    const rows = pack[collection];
    if (!Array.isArray(rows) || rows.length > 32) { errors.push(issue("IO_SCHEMA", `/${collection}`, "Must be an array of at most 32 fields.")); continue; }
    rows.forEach((row, index) => { if (!row || typeof row !== "object" || !/^[a-z][a-zA-Z0-9]{1,63}$/.test(String(row.name || "")) || !VALUE_TYPES.has(row.type)) errors.push(issue("IO_FIELD", `/${collection}/${index}`, "Each field requires a safe name and supported type.")); });
  }
  const entrypoint = String(pack.entrypoint || "");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.\\/-]*\.md$/.test(entrypoint) || SECRET_PATH.test(entrypoint)) errors.push(issue("ENTRYPOINT", "/entrypoint", "Entrypoint must be a non-secret Markdown path."));
  else {
    const root = path.dirname(manifestPath);
    const target = path.resolve(root, entrypoint);
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) errors.push(issue("ENTRYPOINT_ESCAPE", "/entrypoint", "Entrypoint escapes the Skill Pack directory."));
    else if (!fsApi.existsSync(target) || !fsApi.statSync(target).isFile()) errors.push(issue("ENTRYPOINT_MISSING", "/entrypoint", "Entrypoint file is missing."));
    else if (fsApi.statSync(target).size > 128 * 1024) errors.push(issue("ENTRYPOINT_SIZE", "/entrypoint", "Entrypoint exceeds 128 KiB."));
  }
  return { schemaVersion: "mds.skill-validator.receipt.v1", status: errors.length ? "INVALID" : "VALID", valid: !errors.length, manifestPath, skillId: String(pack.id || "UNKNOWN"), skillVersion: String(pack.version || "UNKNOWN"), errors, warnings: [], credentialValuesRead: false, secretFilesRead: false, loadAllowed: !errors.length, authority: "Offline structural validation only. Validation does not install, load, execute, trust, or grant authority to a Skill Pack." };
}
