import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const RANGE_PATTERN = /^(?:[0-9a-fA-F]{7,40}|HEAD(?:~\d{1,3})?|[A-Za-z0-9._/-]+)(?:\.\.(?:[0-9a-fA-F]{7,40}|HEAD(?:~\d{1,3})?|[A-Za-z0-9._/-]+))?$/;
const CATEGORY = Object.freeze({ feat: "Features", fix: "Fixes", perf: "Performance", refactor: "Refactors", docs: "Documentation", test: "Tests", build: "Build", ci: "CI", chore: "Maintenance" });

function cleanCredit(value) {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9 ._@/-]{0,79}$/.test(normalized) ? normalized : null;
}

export function parseGitReleaseLog(rawLog) {
  if (typeof rawLog !== "string" || rawLog.length > 2 * 1024 * 1024) throw new Error("GIT_LOG_SIZE_INVALID");
  return rawLog.split("\x1e").filter(Boolean).map((record) => {
    const [sha, authoredAt, subject, ...bodyParts] = record.replace(/^\r?\n/, "").split("\x1f");
    if (!/^[0-9a-f]{7,40}$/i.test(sha || "")) throw new Error("GIT_LOG_SHA_INVALID");
    const body = bodyParts.join("\x1f");
    const conventional = String(subject || "").match(/^([a-z]+)(?:\([^)]+\))?(!)?:\s+(.+)$/);
    const trailers = { agents: [], operators: [] };
    for (const line of body.split(/\r?\n/)) {
      const match = line.match(/^(Agent|Operator):\s*(.+)$/i);
      if (!match) continue;
      const credit = cleanCredit(match[2]);
      if (credit) trailers[match[1].toLowerCase() === "agent" ? "agents" : "operators"].push(credit);
    }
    return {
      sha: sha.toLowerCase(), authoredAt,
      type: conventional?.[1] || "other", breaking: Boolean(conventional?.[2]),
      summary: (conventional?.[3] || subject || "Untitled commit").trim().slice(0, 240),
      agents: [...new Set(trailers.agents)], operators: [...new Set(trailers.operators)],
    };
  });
}

export function renderReleaseAudit(commits, range) {
  const groups = new Map();
  for (const commit of commits) {
    const heading = CATEGORY[commit.type] || "Other";
    if (!groups.has(heading)) groups.set(heading, []);
    groups.get(heading).push(commit);
  }
  const people = {
    agents: [...new Set(commits.flatMap((commit) => commit.agents))].sort(),
    operators: [...new Set(commits.flatMap((commit) => commit.operators))].sort(),
  };
  const lines = ["# Release Audit", "", `Git range: \`${range}\``, "", "Authority: committed Git history only. No tag, release, deployment, or provider state was mutated or verified.", ""];
  for (const [heading, entries] of groups) {
    lines.push(`## ${heading}`, "");
    for (const commit of entries) lines.push(`- ${commit.breaking ? "**BREAKING** " : ""}${commit.summary} (\`${commit.sha.slice(0, 7)}\`)`);
    lines.push("");
  }
  lines.push("## Credits", "", `- Agent personas: ${people.agents.length ? people.agents.join(", ") : "UNKNOWN"}`, `- Human operators: ${people.operators.length ? people.operators.join(", ") : "UNKNOWN"}`, "");
  return {
    schemaVersion: "mds.git-release-audit.v1", range, commitCount: commits.length,
    changelog: `${lines.join("\n")}\n`, credits: people,
    unattributedCommitCount: commits.filter((commit) => !commit.agents.length && !commit.operators.length).length,
    historySha256: crypto.createHash("sha256").update(JSON.stringify(commits)).digest("hex"),
    tagCreated: false, releaseCreated: false, deploymentStarted: false,
  };
}

export function compileGitReleaseAudit({ repoPath, range = "HEAD~20..HEAD" }) {
  if (!RANGE_PATTERN.test(range) || range.includes(".." ) && range.split("..").length !== 2) throw new Error("GIT_RANGE_INVALID");
  const rawLog = execFileSync("git", ["log", range, "--max-count=200", "--format=%x1e%H%x1f%aI%x1f%s%x1f%b"], {
    cwd: repoPath, encoding: "utf8", timeout: 10_000, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
  });
  const commits = parseGitReleaseLog(rawLog);
  if (!commits.length) throw new Error("GIT_RANGE_EMPTY");
  return renderReleaseAudit(commits, range);
}
