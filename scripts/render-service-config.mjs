import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(appRoot, "output", "daemon", "service-config");
const replacements = new Map([
  ["@@APP_ROOT@@", appRoot.replace(/\\/g, "/")],
  ["@@NODE_PATH@@", process.execPath.replace(/\\/g, "/")],
]);

function render(sourceRelative, targetName) {
  let contents = fs.readFileSync(path.join(appRoot, sourceRelative), "utf8");
  for (const [token, value] of replacements) contents = contents.replaceAll(token, value);
  if (/@@[A-Z_]+@@/.test(contents)) throw new Error(`Unresolved service token in ${sourceRelative}.`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, targetName), contents);
  return path.relative(appRoot, path.join(outputDir, targetName));
}

const files = [
  render("service/systemd/mds-command-centre.service", "mds-command-centre.service"),
  render("service/launchd/com.mds.command-centre.plist", "com.mds.command-centre.plist"),
];
console.log(JSON.stringify({ ok: true, installed: false, files }, null, 2));
