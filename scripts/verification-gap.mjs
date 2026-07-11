#!/usr/bin/env node
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { evaluateVerificationGaps } from "./lib/verification-gap.mjs";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2); const rangeIndex = args.indexOf("--range");
let gitArgs;
if (args.includes("--staged")) gitArgs = ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"];
else if (rangeIndex >= 0 && args[rangeIndex + 1]) gitArgs = ["diff", "--name-only", "--diff-filter=ACMR", "-z", args[rangeIndex + 1]];
else { console.error("Usage: node scripts/verification-gap.mjs --staged | --range <git-range>"); process.exit(2); }
try { const changedFiles = execFileSync("git", gitArgs, { cwd: appRoot, encoding: "utf8", timeout: 10_000, windowsHide: true }).split("\0").filter(Boolean); const result = evaluateVerificationGaps({ appRoot, changedFiles }); console.log(JSON.stringify(result, null, 2)); process.exit(result.integrationAllowed ? 0 : 1); } catch (error) { console.error(JSON.stringify({ schemaVersion: "mds.verification-gap.v1", status: "BLOCKED_DIFF_UNAVAILABLE", integrationAllowed: false, error: String(error.message).slice(0, 300) }, null, 2)); process.exit(1); }
