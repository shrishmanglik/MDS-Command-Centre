// MDS Command Centre - local adapter layer (F5-MV-18).
// Every adapter is read-only against declared scopes, refuses secret-shaped
// paths, never mutates providers, and degrades honestly on timeout/failure.
// Output is sanitized local JSON only. UNKNOWN stays UNKNOWN.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const D_ROOT = "D:/Million Dollar AI Studio";

const SECRET_PATH_PATTERN =
  /(^|[\\/])\.env[^\\/]*$|\.pem$|\.p12$|\.pfx$|(^|[\\/])id_rsa[^\\/]*$|\.key$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|authinfo|(^|[\\/])hosts\.ya?ml$|\.npmrc$|(^|[\\/])\.aws([\\/]|$)|(^|[\\/])\.ssh([\\/]|$)/i;

const SECRET_CONTENT_PATTERN =
  /sk_live|sk_test|SUPABASE_SERVICE_ROLE|BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-/;

const VALIDATOR_TIMEOUT_MS = 60000;

export function isSecretShapedPath(candidate) {
  return SECRET_PATH_PATTERN.test(String(candidate || ""));
}

export function redactSecretShapes(text) {
  return String(text || "").replace(SECRET_CONTENT_PATTERN, "[REDACTED-SECRET-SHAPE]");
}

function nowIso() {
  return new Date().toISOString();
}

function isInsideDroot(candidate) {
  const relative = path.relative(D_ROOT, path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function runCommand(command, args, timeoutMs = 8000) {
  try {
    const stdout = execFileSync(command, args, {
      timeout: timeoutMs,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GH_NO_UPDATE_NOTIFIER: "1", GIT_OPTIONAL_LOCKS: "0" },
    });
    return { ok: true, stdout: String(stdout || "").trim() };
  } catch (error) {
    const timedOut = error.code === "ETIMEDOUT" || /ETIMEDOUT/.test(String(error.message));
    return { ok: false, timedOut, error: timedOut ? "timeout" : String(error.message || "failed").slice(0, 200) };
  }
}

function commandPresent(command) {
  const probe = runCommand("where.exe", [command], 5000);
  if (!probe.ok) return { present: false, reason: probe.timedOut ? "timeout" : "not found" };
  const first = probe.stdout.split(/\r?\n/)[0] || "";
  return { present: Boolean(first), location: first };
}

export function adapterEnvelope(spec, executor) {
  const startedAt = Date.now();
  const base = {
    adapter_id: spec.adapter_id,
    authority: spec.authority,
    risk_class: spec.risk_class,
    read_scope: spec.read_scope,
    write_scope: spec.write_scope || "none",
    secret_policy: "refuse secret-shaped paths; redact secret-shaped content; never read .env/keys/tokens/cookies/auth stores",
    mutation_policy: "no provider mutation, no deploy, no push, no external send, no payment/auth/schema change",
    last_checked_at: nowIso(),
    status: "ok",
    unknowns: [...(spec.unknowns || [])],
    evidence_paths: [...(spec.evidence_paths || [])],
    duration_ms: 0,
  };
  try {
    const data = executor(base);
    base.duration_ms = Date.now() - startedAt;
    return { ...base, data };
  } catch (error) {
    base.duration_ms = Date.now() - startedAt;
    base.status = "failed";
    base.unknowns.push(`adapter failed: ${redactSecretShapes(String(error.message || error)).slice(0, 200)}`);
    return { ...base, data: null };
  }
}

function readJsonSubset(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function listEntriesShallow(absDir, maxEntries = 30) {
  const names = fs.readdirSync(absDir, { withFileTypes: true });
  const entries = [];
  let refusedSecretShaped = 0;
  for (const entry of names) {
    if (isSecretShapedPath(entry.name)) {
      refusedSecretShaped += 1;
      continue;
    }
    if (entries.length >= maxEntries) continue;
    let sizeBytes = 0;
    let modifiedAt = null;
    try {
      const stat = fs.statSync(path.join(absDir, entry.name));
      sizeBytes = entry.isFile() ? stat.size : 0;
      modifiedAt = stat.mtime.toISOString();
    } catch {
      // stat failure stays non-fatal; metadata stays null
    }
    entries.push({ name: entry.name, kind: entry.isDirectory() ? "dir" : "file", sizeBytes, modifiedAt });
  }
  return {
    total: names.length,
    dirs: names.filter((entry) => entry.isDirectory()).length,
    files: names.filter((entry) => entry.isFile()).length,
    refusedSecretShaped,
    entries,
  };
}

// 1. local-files-adapter + 2. drive-roots-adapter -------------------------

export const ALLOWLISTED_ROOTS = [
  { id: "d-root", relativePath: ".", label: "D root (active operating root)" },
  { id: "products", relativePath: "Products", label: "Products" },
  { id: "vcos", relativePath: "vcos", label: "vcos" },
  { id: "command-centre", relativePath: "command-centre", label: "command-centre" },
  { id: "playwright-output", relativePath: "output/playwright", label: "output/playwright" },
];

export function localFilesAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "local-files-adapter",
      authority: "D-local filesystem metadata only; not GitHub or provider truth.",
      risk_class: "green_readonly",
      read_scope: ALLOWLISTED_ROOTS.map((root) => root.relativePath).join("; "),
      evidence_paths: ALLOWLISTED_ROOTS.map((root) => root.relativePath),
    },
    () => {
      const roots = ALLOWLISTED_ROOTS.map((root) => {
        const absPath = path.join(D_ROOT, root.relativePath);
        if (!fs.existsSync(absPath)) {
          return { ...root, exists: false, listing: null };
        }
        return { ...root, exists: true, listing: listEntriesShallow(absPath) };
      });
      return { roots };
    },
  );
}

export function driveRootsAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "drive-roots-adapter",
      authority: "Configured drive roles only: D active, E backup-only. No drive crawling.",
      risk_class: "green_readonly",
      read_scope: "drive-root existence checks only",
      unknowns: ["drive free-space, health, and backup freshness are not checked in this slice"],
    },
    () => ({
      drives: [
        { drive: "D:", role: "active operating root", present: fs.existsSync("D:/"), policy: "read/write via governed adapters" },
        { drive: "E:", role: "backup/recovery only", present: fs.existsSync("E:/"), policy: "never written by Command Centre" },
      ],
    }),
  );
}

// 3. vcos-adapter ----------------------------------------------------------

export function vcosAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "vcos-adapter",
      authority: "D-local VCOS department/roster/readiness files; kernel and source map remain the owners.",
      risk_class: "green_readonly",
      read_scope: "vcos/*/DIRECTOR.md; vcos/mds-kernel/architecture-map/source-map.yaml; vcos/mds-kernel/studio-readiness/",
      evidence_paths: ["vcos/mds-kernel/architecture-map/source-map.yaml"],
    },
    (envelope) => {
      const vcosDir = path.join(D_ROOT, "vcos");
      const departments = fs
        .readdirSync(vcosDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(vcosDir, entry.name, "DIRECTOR.md")))
        .map((entry) => {
          let director = "UNKNOWN";
          try {
            const head = fs.readFileSync(path.join(vcosDir, entry.name, "DIRECTOR.md"), "utf8").slice(0, 2000);
            const match = head.match(/^#\s*(?:DIRECTOR:?\s*)?(.+)$/m);
            if (match) director = match[1].trim().slice(0, 80);
          } catch {
            director = "UNKNOWN";
          }
          return { slug: entry.name, directorHeading: director };
        });

      let midasPathConflict = "UNKNOWN";
      const sourceMapPath = path.join(D_ROOT, "vcos/mds-kernel/architecture-map/source-map.yaml");
      if (fs.existsSync(sourceMapPath)) {
        const raw = fs.readFileSync(sourceMapPath, "utf8");
        midasPathConflict = /conflict/i.test(raw)
          ? "CONFLICT RECORDED: canonical MIDAS path unresolved (Claude.md says E:/, disk shows vcos/development-studio/frameworks/midas/); pending Shrish ADR"
          : "no conflict marker found in source map";
      } else {
        envelope.unknowns.push("architecture-map/source-map.yaml missing");
      }
      return { departmentCount: departments.length, departments, midasPathConflict };
    },
  );
}

// 4. midas-runtime-adapter -------------------------------------------------

const RUNTIME_SURFACES = [
  ["work-orders", "vcos/mds-kernel/midas-runtime/work-orders"],
  ["approvals", "vcos/mds-kernel/midas-runtime/approvals"],
  ["packets", "vcos/mds-kernel/midas-runtime/packets"],
  ["proof", "vcos/mds-kernel/midas-runtime/proof"],
  ["loop", "vcos/mds-kernel/midas-runtime/loop"],
  ["learning", "vcos/mds-kernel/midas-runtime/learning"],
  ["registry", "vcos/mds-kernel/midas-runtime/registry"],
  ["harness", "vcos/mds-kernel/midas-runtime/harness"],
  ["breaksuite", "vcos/mds-kernel/midas-runtime/breaksuite/cases"],
  ["capabilities", "vcos/mds-kernel/midas-runtime/capabilities"],
];

export function midasRuntimeAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "midas-runtime-adapter",
      authority: "MIDAS runtime artifacts are execution truth on D; validators are the verdict authority.",
      risk_class: "green_readonly",
      read_scope: "vcos/mds-kernel/midas-runtime/** (counts + shallow metadata only)",
      unknowns: ["deep validator verdicts require running the runtime validators; only counts are read here"],
    },
    () => {
      const surfaces = RUNTIME_SURFACES.map(([id, relativePath]) => {
        const absPath = path.join(D_ROOT, relativePath);
        if (!fs.existsSync(absPath)) return { id, relativePath, exists: false, artifactCount: 0 };
        const files = fs.readdirSync(absPath).filter((name) => !name.startsWith(".") && name !== "__pycache__");
        return { id, relativePath, exists: true, artifactCount: files.length };
      });
      return { surfaces };
    },
  );
}

// 5. capability broker readers ---------------------------------------------

function readYamlishRecords(absDir) {
  if (!fs.existsSync(absDir)) return { records: [], missing: true };
  const records = [];
  const unparsed = [];
  for (const name of fs.readdirSync(absDir)) {
    if (!/\.ya?ml$/i.test(name)) continue;
    try {
      records.push(readJsonSubset(path.join(absDir, name)));
    } catch {
      unparsed.push(name);
    }
  }
  return { records, unparsed, missing: false };
}

export function capabilityBrokerAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "capability-broker-adapter",
      authority: "Capability provider/request records are D-local governance state; live provider state stays UNKNOWN.",
      risk_class: "green_readonly",
      read_scope: "vcos/mds-kernel/midas-runtime/capabilities/{providers,requests}; vcos/mds-kernel/studio-readiness/",
      evidence_paths: ["vcos/mds-kernel/midas-runtime/capabilities"],
    },
    (envelope) => {
      const providers = readYamlishRecords(path.join(D_ROOT, "vcos/mds-kernel/midas-runtime/capabilities/providers"));
      const requests = readYamlishRecords(path.join(D_ROOT, "vcos/mds-kernel/midas-runtime/capabilities/requests"));
      if (providers.missing) envelope.unknowns.push("capabilities/providers directory missing");
      if (requests.missing) envelope.unknowns.push("capabilities/requests directory missing");
      for (const name of [...(providers.unparsed || []), ...(requests.unparsed || [])]) {
        envelope.unknowns.push(`unparsed capability file: ${name}`);
        envelope.status = "degraded";
      }

      const validators = {};
      for (const [id, script] of [
        ["capabilities", "vcos/mds-kernel/midas-runtime/capabilities/validate_capabilities.py"],
        ["studioReadiness", "vcos/mds-kernel/studio-readiness/validate_studio_readiness.py"],
      ]) {
        if (!fs.existsSync(path.join(D_ROOT, script))) {
          validators[id] = { status: "UNKNOWN", note: "validator script missing" };
          continue;
        }
        const result = runCommand("python", [path.join(D_ROOT, script), "--json"], VALIDATOR_TIMEOUT_MS);
        if (!result.ok) {
          validators[id] = { status: result.timedOut ? "degraded (timeout)" : "degraded (error)", note: result.error || "timeout" };
          envelope.status = "degraded";
          continue;
        }
        try {
          const parsed = JSON.parse(result.stdout);
          validators[id] = { status: parsed.ok === true ? "PASS" : "FAIL", ok: parsed.ok === true, summary: parsed };
        } catch {
          validators[id] = { status: "degraded (unparseable output)" };
          envelope.status = "degraded";
        }
      }
      return {
        providers: providers.records,
        requests: requests.records,
        validators,
      };
    },
  );
}

// 6. git-local-adapter -------------------------------------------------------

function resolveGitDir(repoAbsPath) {
  const dotGit = path.join(repoAbsPath, ".git");
  if (!fs.existsSync(dotGit)) return null;
  const stat = fs.statSync(dotGit);
  if (stat.isDirectory()) return isInsideDroot(dotGit) && !isSecretShapedPath(dotGit) ? dotGit : null;
  const content = fs.readFileSync(dotGit, "utf8").trim();
  const match = content.match(/^gitdir:\s*(.+)$/i);
  if (!match) return null;
  const gitDir = match[1].trim();
  const resolvedGitDir = path.isAbsolute(gitDir) ? gitDir : path.resolve(repoAbsPath, gitDir);
  if (!isInsideDroot(resolvedGitDir) || isSecretShapedPath(resolvedGitDir)) return null;
  return resolvedGitDir;
}

function readPackedRef(gitDir, refPath) {
  const packedRefs = path.join(gitDir, "packed-refs");
  if (!fs.existsSync(packedRefs)) return "UNKNOWN";
  const lines = fs.readFileSync(packedRefs, "utf8").split(/\r?\n/);
  const line = lines.find((candidate) => candidate.endsWith(` ${refPath}`));
  return line ? line.split(" ")[0].slice(0, 7) : "UNKNOWN";
}

function readRemoteFromConfig(gitDir) {
  const configPath = path.join(gitDir, "config");
  if (!fs.existsSync(configPath)) return "UNKNOWN";
  const config = fs.readFileSync(configPath, "utf8");
  const originMatch = config.match(/\[remote "origin"\][\s\S]*?url\s*=\s*([^\r\n]+)/);
  if (!originMatch) return "UNKNOWN";
  return redactSecretShapes(originMatch[1].trim().replace(/(https?:\/\/)[^@/]+@/, "$1***@"));
}

function gitProbe(repoAbsPath) {
  const probe = { relativePath: path.relative(D_ROOT, repoAbsPath) || ".", branch: "UNKNOWN", head: "UNKNOWN", remote: "UNKNOWN", dirty: "UNKNOWN", status: "ok" };
  try {
    const gitDir = resolveGitDir(repoAbsPath);
    if (!gitDir) throw new Error(".git metadata missing");
    const headText = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
    if (headText.startsWith("ref:")) {
      const refPath = headText.replace(/^ref:\s*/, "");
      probe.branch = refPath.replace(/^refs\/heads\//, "");
      const refFile = path.join(gitDir, ...refPath.split("/"));
      probe.head = fs.existsSync(refFile) ? fs.readFileSync(refFile, "utf8").trim().slice(0, 7) : readPackedRef(gitDir, refPath);
    } else {
      probe.branch = "DETACHED";
      probe.head = headText.slice(0, 7);
    }
    probe.remote = readRemoteFromConfig(gitDir);
    probe.dirty = "UNKNOWN (dirty probe skipped; no git subprocesses in adapter)";
    probe.status = "degraded";
  } catch (error) {
    probe.status = "degraded";
    probe.dirty = "UNKNOWN";
    probe.remote = "UNKNOWN";
  }
  return probe;
}

export function gitLocalAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "git-local-adapter",
      authority: "Local git metadata only; GitHub remains committed-code authority. No stage/commit/push/checkout.",
      risk_class: "green_readonly",
      read_scope: "D-root .git branch/HEAD/remote metadata; Products/*/.git branch/HEAD/remote metadata (max 12 repos)",
      unknowns: ["dirty state intentionally remains UNKNOWN in the adapter because git status can hang on large D-root worktrees"],
    },
    (envelope) => {
      const repos = [];
      repos.push(gitProbe(D_ROOT));
      const productsDir = path.join(D_ROOT, "Products");
      if (fs.existsSync(productsDir)) {
        const productRepos = fs
          .readdirSync(productsDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(productsDir, entry.name, ".git")))
          .slice(0, 12);
        for (const entry of productRepos) repos.push(gitProbe(path.join(productsDir, entry.name)));
      }
      if (repos.some((repo) => repo.status === "degraded")) envelope.status = "degraded";
      return { repos };
    },
  );
}

// 7. github-metadata-adapter -------------------------------------------------

export function githubMetadataAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "github-metadata-adapter",
      authority: "GitHub is committed-code authority; this adapter reads safe auth presence only. No mutations ever.",
      risk_class: "yellow_metadata",
      read_scope: "gh CLI presence + parsed login state (account name only, never tokens)",
      unknowns: ["repo/PR/release metadata not fetched in this slice; auth state UNKNOWN unless gh reports it safely"],
    },
    (envelope) => {
      const gh = commandPresent("gh");
      if (!gh.present) {
        envelope.unknowns.push("gh CLI not found; GitHub metadata UNKNOWN");
        return { ghPresent: false, authState: "UNKNOWN" };
      }
      const status = runCommand("gh", ["auth", "status"], 10000);
      if (!status.ok) {
        envelope.status = "degraded";
        return { ghPresent: true, authState: "UNKNOWN", note: status.timedOut ? "gh auth status timeout" : "gh auth status unavailable" };
      }
      const combined = redactSecretShapes(status.stdout);
      const account = combined.match(/account\s+([A-Za-z0-9-]+)/i) || combined.match(/Logged in to github\.com as\s+([A-Za-z0-9-]+)/i);
      return {
        ghPresent: true,
        authState: account ? "logged-in" : "UNKNOWN",
        account: account ? account[1] : "UNKNOWN",
      };
    },
  );
}

// 8. provider-cli-adapter + 9. model-provider-adapter ------------------------

const PROVIDER_CLIS = [
  { id: "vercel", command: "vercel", provider: "Vercel" },
  { id: "supabase", command: "supabase", provider: "Supabase" },
  { id: "wrangler", command: "wrangler", provider: "Cloudflare" },
  { id: "railway", command: "railway", provider: "Railway" },
  { id: "gh", command: "gh", provider: "GitHub" },
];

export function providerCliAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "provider-cli-adapter",
      authority: "CLI presence is capability metadata only; provider dashboards remain live-state authority.",
      risk_class: "green_readonly",
      read_scope: "where.exe lookups only; no CLI is invoked against a provider",
      unknowns: ["all provider live states (deploy/db/schema/auth/billing/payments) are UNKNOWN and request-only"],
    },
    () => ({
      clis: PROVIDER_CLIS.map((cli) => {
        const probe = commandPresent(cli.command);
        return {
          ...cli,
          present: probe.present,
          location: probe.location || null,
          liveState: "UNKNOWN (request_only)",
          allowedActions: ["record capability", "create local request packet"],
          forbiddenActions: ["deploy", "migrate", "env read/write", "billing/payment", "external send"],
        };
      }),
    }),
  );
}

const MODEL_RUNTIMES = [
  { id: "ollama", command: "ollama", kind: "local-oss", notes: "presence only; server never started, models never pulled" },
  { id: "python", command: "python", kind: "local-runtime", notes: "runtime for validators" },
  { id: "node", command: "node", kind: "local-runtime", notes: "runtime for Command Centre" },
];

export function modelProviderAdapter() {
  return adapterEnvelope(
    {
      adapter_id: "model-provider-adapter",
      authority: "Model adapter records only; no server start, no model download, no paid API call.",
      risk_class: "green_readonly",
      read_scope: "command presence lookups only",
      unknowns: [
        "local model viability is UNKNOWN until a governed benchmark run",
        "paid API adapters (Anthropic/OpenAI-class) are record-only and red-gated; no keys are read or checked",
      ],
    },
    () => ({
      runtimes: MODEL_RUNTIMES.map((runtime) => ({ ...runtime, present: commandPresent(runtime.command).present })),
      paidApiAdapters: [
        { id: "anthropic-api", status: "record_only", riskClass: "red", liveState: "UNKNOWN", note: "requires Red approval artifact before any use" },
        { id: "openai-api", status: "record_only", riskClass: "red", liveState: "UNKNOWN", note: "requires Red approval artifact before any use" },
      ],
    }),
  );
}
