import fs from "node:fs";
import path from "node:path";

const SECRET_PATH = /(^|[\\/])\.env|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/]|$)/i;

export function inspectGameProject(projectPath) {
  const root = path.resolve(projectPath);
  if (SECRET_PATH.test(root) || !fs.statSync(root).isDirectory()) throw new Error("GAME_PROJECT_PATH_INVALID");
  let engine = "UNKNOWN"; let manifest = "UNKNOWN"; let commands = [];
  if (fs.existsSync(path.join(root, "ProjectSettings", "ProjectVersion.txt"))) { engine = "UNITY"; manifest = "ProjectSettings/ProjectVersion.txt"; commands = ["Unity -batchmode -quit -projectPath <project> -executeMethod BuildScript.Build", "Unity -batchmode -quit -projectPath <project> -runTests -testPlatform EditMode"]; }
  else if (fs.existsSync(path.join(root, "project.godot"))) { engine = "GODOT"; manifest = "project.godot"; commands = ["godot --headless --path <project> --editor --quit", "godot --headless --path <project> --export-release <preset> <output>"]; }
  else { const uproject = fs.readdirSync(root, { withFileTypes: true }).find((entry) => entry.isFile() && entry.name.endsWith(".uproject")); if (uproject) { engine = "UNREAL"; manifest = uproject.name; commands = ["UnrealBuildTool <target> <platform> Development -Project=<uproject>", "RunUAT BuildCookRun -project=<uproject> -noP4"]; } }
  return { schemaVersion: "mds.game-adapter-receipt.v1", engine, manifest, projectRoot: root, compilePlan: commands, status: engine === "UNKNOWN" ? "UNKNOWN_ENGINE" : "LOCAL_MANIFEST_DETECTED", manifestBodyRead: false, assetsRead: false, executionStarted: false, engineAvailability: "UNKNOWN", authority: "Local manifest-path detection and command previews only. No engine, build, asset import, or compile process was started." };
}
