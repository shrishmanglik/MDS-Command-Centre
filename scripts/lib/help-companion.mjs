import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;

export function suggestWorkspaceNextStep({ repoPath, openFiles = [], gitRunner = execFileSync }) {
  const visibleFiles = openFiles.map((file) => path.resolve(repoPath, file)).filter((file) => !SECRET_PATH.test(file)).slice(0, 20).map((file) => ({ path: path.relative(repoPath, file).replace(/\\/g, "/"), exists: fs.existsSync(file) }));
  let lines = []; let gitStatus = "AVAILABLE";
  try { lines = String(gitRunner("git", ["status", "--porcelain=v1", "-uno"], { cwd: repoPath, encoding: "utf8", timeout: 5000, windowsHide: true, maxBuffer: 128 * 1024 })).split(/\r?\n/).filter(Boolean).slice(0, 200); }
  catch { gitStatus = "UNKNOWN_TIMEOUT_OR_ERROR"; }
  const staged = lines.filter((line) => line[0] && line[0] !== " ").length;
  const modified = lines.length;
  let nextStep = "Open the approved work order and identify one acceptance check.";
  if (gitStatus !== "AVAILABLE") nextStep = "Resolve Git status visibility before integration; preserve the worktree unchanged.";
  else if (staged) nextStep = "Run the focused verification for staged files before committing.";
  else if (modified) nextStep = "Review unstaged changes and map them to the active work order before staging.";
  else if (visibleFiles.some((file) => /work-orders?|README|AGENTS/i.test(file.path))) nextStep = "Read the open governing file fully, then execute its first unmet acceptance check.";
  return { schemaVersion: "mds.help-companion.v1", gitStatus, changedFileCount: modified, stagedFileCount: staged, openFiles: visibleFiles, nextStep, fileBodiesRead: false, secretPathsExcluded: openFiles.length - visibleFiles.length, chatMode: "DETERMINISTIC_LOCAL_GUIDANCE", providerCallMade: false };
}
