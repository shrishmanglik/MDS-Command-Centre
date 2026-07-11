import fs from "node:fs";
import path from "node:path";
import { parse, Lang } from "@ast-grep/napi";
import { parseDocument } from "yaml";

const SECRET_PATH = /(^|[\\/])\.env[^\\/]*$|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|\.npmrc$/i;
const PROTECTED_SOURCE = /^(scripts\/lib\/.*\.(mjs|js|ts)|src\/.*\.(js|ts|tsx))$/;
const LANGUAGES = { ".js": Lang.JavaScript, ".mjs": Lang.JavaScript, ".ts": Lang.TypeScript, ".tsx": Lang.Tsx };
const KINDS = new Set(["function", "class", "method"]);

function failure(code, file, symbol, detail) { return { code, file, symbol, detail }; }
function contractsUnder(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile() && /\.verification\.(json|ya?ml)$/.test(entry.name)).map((entry) => path.join(entry.parentPath || entry.path, entry.name));
}
function parseContract(file) {
  if (SECRET_PATH.test(file)) throw new Error("Secret-shaped verification contract path refused.");
  const source = fs.readFileSync(file, "utf8");
  if (source.length > 128 * 1024) throw new Error("Verification contract exceeds 128 KiB.");
  if (file.endsWith(".json")) return JSON.parse(source);
  const document = parseDocument(source, { maxAliasCount: 0, strict: true, uniqueKeys: true, schema: "core" });
  if (document.errors.length || document.warnings.length) throw new Error([...document.errors, ...document.warnings].map((item) => item.message).join("; "));
  return document.toJS({ maxAliasCount: 0 });
}
function exported(node) { let current = node; for (let depth = 0; current && depth < 4; depth += 1, current = current.parent()) if (current.kind() === "export_statement") return true; return false; }
function symbolsFor(file, source) {
  const lang = LANGUAGES[path.extname(file).toLowerCase()];
  if (!lang) throw new Error("Unsupported AST language.");
  const root = parse(lang, source).root();
  if (root.find({ rule: { kind: "ERROR" } })) throw new Error("Source contains an AST parse error.");
  const symbols = [];
  for (const node of root.findAll({ rule: { kind: "function_declaration" } })) { const name = node.field("name")?.text(); if (name) symbols.push({ name, kind: "function", exported: exported(node) }); }
  for (const node of root.findAll({ rule: { kind: "variable_declarator" } })) { const name = node.field("name")?.text(); const value = node.field("value"); if (name && value && ["arrow_function", "function_expression"].includes(value.kind())) symbols.push({ name, kind: "function", exported: exported(node) }); }
  for (const node of root.findAll({ rule: { kind: "class_declaration" } })) { const name = node.field("name")?.text(); if (name) symbols.push({ name, kind: "class", exported: exported(node) }); }
  for (const node of root.findAll({ rule: { kind: "method_definition" } })) { const name = node.field("name")?.text(); if (name) symbols.push({ name, kind: "method", exported: false }); }
  return symbols;
}

export function evaluateVerificationGaps({ appRoot, changedFiles, contractRoot = path.join(appRoot, "work-orders", "verification") }) {
  const failures = [];
  const contracts = [];
  for (const file of contractsUnder(contractRoot)) {
    try {
      const contract = parseContract(file);
      if (contract.schemaVersion !== "mds.work-order-verification.v1" || !/^[A-Z0-9][A-Z0-9-]{2,80}$/.test(String(contract.workOrderId || "")) || !Array.isArray(contract.requiredSymbols) || !contract.requiredSymbols.length) throw new Error("Contract requires schemaVersion, workOrderId, and requiredSymbols.");
      for (const item of contract.requiredSymbols) if (!item || !PROTECTED_SOURCE.test(String(item.file || "")) || !KINDS.has(item.kind) || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(item.name || "")) || typeof item.exported !== "boolean") throw new Error("Contract contains an invalid required symbol.");
      contracts.push({ ...contract, contractPath: path.relative(appRoot, file).replace(/\\/g, "/") });
    } catch (error) { failures.push(failure("CONTRACT_INVALID", path.relative(appRoot, file).replace(/\\/g, "/"), "UNKNOWN", error.message)); }
  }
  const protectedChanges = [...new Set((changedFiles || []).map((file) => String(file).replace(/\\/g, "/")).filter((file) => PROTECTED_SOURCE.test(file)))];
  for (const changed of protectedChanges) if (!contracts.some((contract) => contract.requiredSymbols.some((symbol) => symbol.file === changed))) failures.push(failure("WORK_ORDER_COVERAGE_MISSING", changed, "UNKNOWN", "Changed implementation file is not covered by a verification contract."));
  const cache = new Map();
  for (const contract of contracts) for (const requirement of contract.requiredSymbols) {
    const absolute = path.resolve(appRoot, requirement.file); const relative = path.relative(appRoot, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative) || SECRET_PATH.test(relative)) { failures.push(failure("SOURCE_PATH_REFUSED", requirement.file, requirement.name, "Source path escaped root or is secret-shaped.")); continue; }
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) { failures.push(failure("SOURCE_MISSING", requirement.file, requirement.name, "Required source file is missing.")); continue; }
    try {
      if (!cache.has(requirement.file)) cache.set(requirement.file, symbolsFor(requirement.file, fs.readFileSync(absolute, "utf8")));
      const match = cache.get(requirement.file).find((symbol) => symbol.name === requirement.name && symbol.kind === requirement.kind);
      if (!match) failures.push(failure("SYMBOL_MISSING", requirement.file, requirement.name, `Required ${requirement.kind} was not found by AST.`));
      else if (requirement.exported && !match.exported) failures.push(failure("EXPORT_MISSING", requirement.file, requirement.name, "Required symbol exists but is not exported."));
    } catch (error) { failures.push(failure("AST_PARSE_FAILED", requirement.file, requirement.name, error.message)); }
  }
  return { schemaVersion: "mds.verification-gap.v1", status: failures.length ? "BLOCKED_VERIFICATION_GAP" : "PASS", integrationAllowed: failures.length === 0, changedProtectedFiles: protectedChanges, contractsEvaluated: contracts.map((contract) => ({ workOrderId: contract.workOrderId, contractPath: contract.contractPath })), failures, parser: "@ast-grep/napi", sourceBodiesRead: true, secretFilesRead: false, authority: "AST symbol-presence verification only. Passing does not prove behavioral correctness, test adequacy, specification quality, or live state." };
}
