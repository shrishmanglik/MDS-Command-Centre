import assert from "node:assert/strict";
import { parseGitReleaseLog, renderReleaseAudit } from "./lib/git-release-audit.mjs";

const raw = "\x1eaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\x1f2026-07-11T00:00:00Z\x1ffeat(router): add local routing\x1fAgent: Kai\nOperator: Shrish\n" +
  "\x1ebbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\x1f2026-07-11T01:00:00Z\x1ffix: fail closed\x1fNo attribution\n" +
  "\x1ecccccccccccccccccccccccccccccccccccccccc\x1f2026-07-11T02:00:00Z\x1fdocs!: update contract\x1fAgent: Kai\nAgent: Rook\nOperator: bad<script>\n";
const commits = parseGitReleaseLog(raw);
assert.equal(commits.length, 3);
assert.equal(commits[2].breaking, true);
const audit = renderReleaseAudit(commits, "v0.1.0..HEAD");
assert.match(audit.changelog, /## Features/);
assert.match(audit.changelog, /Agent personas: Kai, Rook/);
assert.match(audit.changelog, /Human operators: Shrish/);
assert.equal(audit.unattributedCommitCount, 1);
assert.equal(audit.tagCreated, false);
assert.doesNotMatch(audit.changelog, /bad<script>/);
assert.throws(() => parseGitReleaseLog("invalid"), /GIT_LOG_SHA_INVALID/);
console.log("Git release audit checks passed.");
