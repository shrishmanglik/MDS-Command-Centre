import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SENSITIVE_PATH = /(^|[\\/])\.env[^\\/]*$|\.(pem|p12|pfx|key)$|(^|[\\/])id_rsa[^\\/]*$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|\.npmrc$|(^|[\\/])\.aws([\\/]|$)|(^|[\\/])\.ssh([\\/]|$)/i;
const CREDENTIAL_NAME = /(api[_-]?key|secret|token|password|credential|private[_-]?key|client[_-]?secret)/i;

function check(id, status, detail) { return { id, status, detail }; }
function fieldNames(value, names = []) { if (!value || typeof value !== "object") return names; for (const [key, child] of Object.entries(value)) { names.push(key); fieldNames(child, names); } return names; }

export function runDoctor({ appRoot, fsApi = fs, trackedFiles, environmentNames = Object.keys(process.env) }) {
  const checks = [];
  const required = ["scripts/serve.mjs", "scripts/daemon.mjs", "src/data", "output"];
  for (const relative of required) {
    const target = path.join(appRoot, relative);
    checks.push(check(`path:${relative}`, fsApi.existsSync(target) ? "PASS" : "BLOCK", fsApi.existsSync(target) ? "present" : "missing"));
  }
  const output = path.join(appRoot, "output");
  try { fsApi.mkdirSync(output, { recursive: true }); const probe = path.join(output, `.doctor-${process.pid}.tmp`); fsApi.writeFileSync(probe, "doctor\n", { flag: "wx" }); fsApi.rmSync(probe); checks.push(check("output:writable", "PASS", "bounded write/remove probe passed")); } catch { checks.push(check("output:writable", "BLOCK", "bounded write/remove probe failed")); }
  const serverPath = path.join(appRoot, "scripts", "serve.mjs");
  if (fsApi.existsSync(serverPath)) {
    const server = fsApi.readFileSync(serverPath, "utf8");
    checks.push(check("api:loopback-binding", server.includes('server.listen(portArg, "127.0.0.1"') ? "PASS" : "BLOCK", "server must bind explicitly to 127.0.0.1"));
  }
  const tracked = trackedFiles || (() => { try { return execFileSync("git", ["ls-files", "-z"], { cwd: appRoot, encoding: "utf8", timeout: 5000, windowsHide: true }).split("\0").filter(Boolean); } catch { return null; } })();
  if (!tracked) checks.push(check("git:sensitive-paths", "WARN", "tracked-file inventory unavailable"));
  else { const count = tracked.filter((file) => SENSITIVE_PATH.test(file)).length; checks.push(check("git:sensitive-paths", count ? "BLOCK" : "PASS", count ? `${count} secret-shaped tracked path(s); names withheld` : "no secret-shaped tracked paths")); }
  const pairingPath = path.join(appRoot, "src", "data", "localPairings.json");
  if (fsApi.existsSync(pairingPath)) {
    try { const names = fieldNames(JSON.parse(fsApi.readFileSync(pairingPath, "utf8"))); const unsafe = names.filter((name) => CREDENTIAL_NAME.test(name) && name !== "keyDigest"); checks.push(check("pairing:credential-fields", unsafe.length ? "BLOCK" : "PASS", unsafe.length ? `${unsafe.length} plaintext credential-shaped field name(s); names and values withheld` : "digest-only pairing fields")); } catch { checks.push(check("pairing:credential-fields", "BLOCK", "pairing registry is not valid JSON")); }
  }
  const envCount = environmentNames.filter((name) => CREDENTIAL_NAME.test(name)).length;
  checks.push(check("environment:names-only", envCount ? "WARN" : "PASS", envCount ? `${envCount} credential-shaped environment variable name(s) present; names and values withheld` : "no credential-shaped variable names observed"));
  const ignorePath = path.join(appRoot, ".gitignore");
  const ignored = fsApi.existsSync(ignorePath) ? fsApi.readFileSync(ignorePath, "utf8") : "";
  checks.push(check("gitignore:env", /(^|\n)\.env(\n|$)/.test(ignored) && ignored.includes(".env.*") ? "PASS" : "BLOCK", "env files must be ignored"));
  const model = path.join(appRoot, "voice", "models", "ggml-base.en.bin");
  checks.push(check("voice:model", fsApi.existsSync(model) ? "PASS" : "WARN", fsApi.existsSync(model) ? "app-owned model present" : "optional local voice model missing"));
  const blockers = checks.filter((item) => item.status === "BLOCK").length;
  const warnings = checks.filter((item) => item.status === "WARN").length;
  return { schemaVersion: "mds.command-centre.doctor.v1", status: blockers ? "BLOCKED" : warnings ? "READY_WITH_WARNINGS" : "READY", blockers, warnings, credentialValuesRead: false, secretFilesRead: false, authority: "Local path and configuration evidence only. Provider, deployment, payment, auth, and credential validity remain UNKNOWN.", checkedAt: new Date().toISOString(), checks };
}
