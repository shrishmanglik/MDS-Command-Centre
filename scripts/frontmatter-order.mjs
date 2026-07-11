#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFrontmatterCollections } from "./lib/frontmatter-order.mjs";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.join(appRoot, "generated-docs");
const result = validateFrontmatterCollections(target);
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
