#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDoctor } from "./lib/doctor.mjs";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = runDoctor({ appRoot });
console.log(JSON.stringify(result, null, 2));
if (result.blockers) process.exitCode = 1;
