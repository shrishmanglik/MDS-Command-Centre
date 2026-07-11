import assert from "node:assert/strict";
import { runMidasLoop } from "./lib/midas-loop.mjs";

const room = { id: "PARTY-ABCDEF12", status: "HANDOFF_READY", decision: { disposition: "APPROVED" } };
const pass = runMidasLoop({ room, scripts: ["lint", "test:verification-gap"], cwd: ".", runner: (script) => `${script} passed` });
assert.equal(pass.status, "VERIFICATION_PASS");
assert.equal(pass.steps.length, 2);
assert.equal(pass.codeModified, false);
const stopped = runMidasLoop({ room, scripts: ["lint", "test:verification-gap"], cwd: ".", runner: (script) => { if (script === "lint") throw new Error("failed"); } });
assert.equal(stopped.status, "STOPPED_ON_FAILURE");
assert.equal(stopped.steps.length, 1);
assert.throws(() => runMidasLoop({ room, scripts: ["build"], cwd: "." }), /SCRIPT_NOT_ALLOWED/);
assert.throws(() => runMidasLoop({ room: { status: "DELIBERATING" }, scripts: ["lint"], cwd: "." }), /APPROVED_HANDOFF_REQUIRED/);
console.log("MIDAS loop checks passed.");
