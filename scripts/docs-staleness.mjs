#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { evaluateDocsStaleness } from "./lib/docs-staleness.mjs";

const args = process.argv.slice(2);
const rangeIndex = args.indexOf("--range");
let gitArgs;
if (args.includes("--staged")) gitArgs = ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"];
else if (rangeIndex >= 0 && args[rangeIndex + 1]) gitArgs = ["diff", "--name-only", "--diff-filter=ACMR", "-z", args[rangeIndex + 1]];
else { console.error("Usage: node scripts/docs-staleness.mjs --staged | --range <git-range>"); process.exit(2); }

try {
  const files = execFileSync("git", gitArgs, { encoding: "utf8", timeout: 10_000, windowsHide: true }).split("\0").filter(Boolean);
  const result = evaluateDocsStaleness(files);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.integrationAllowed ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({ schemaVersion: "mds.docs-staleness.v1", status: "BLOCKED_GIT_DIFF_UNAVAILABLE", integrationAllowed: false, fileContentsRead: false, error: String(error.message || "git diff unavailable").slice(0, 300) }, null, 2));
  process.exit(1);
}
