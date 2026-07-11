export const DOC_RULES = Object.freeze([
  { id: "loopback-api", source: /^scripts\/serve\.mjs$/, docs: ["README.md"] },
  { id: "daemon-api", source: /^scripts\/daemon\.mjs$/, docs: ["README.md"] },
  { id: "cli-api", source: /^scripts\/midas\.mjs$/, docs: ["README.md"] },
  { id: "runtime-contracts", source: /^scripts\/lib\/(a2ui-store|checklist-workflow|declarative-customizer|doctor|docs-staleness|frontmatter-order|game-dev-adapter|git-release-audit|harness-adapter|help-companion|midas-loop|mobile-node-intake|model-router|orchestration-graph|pairing-store|party-room|persona-memory|plugin-eval|sandbox-runner|skill-validator|ssrf-guard|subagent-engine|subagent-worker-thread|task-restructurer|team-signaling|user-profile-modeler|verification-gap|voice-gate|workspace-store)\.mjs$/, docs: ["README.md"] },
  { id: "windows-desktop", source: /^desktop\/.*\.ps1$/, docs: ["desktop/README.md"] },
  { id: "android-companion", source: /^mobile\/android\/.*\.(java|xml|gradle)$/, docs: ["mobile/android/README.md"] },
]);

const SECRET_PATH = /(^|\/)\.env[^/]*$|\.(pem|p12|pfx|key)$|(^|\/)(secrets?|tokens?|credentials?|cookies?)(\/|$)|\.npmrc$/i;

export function evaluateDocsStaleness(changedFiles) {
  const files = [...new Set((changedFiles || []).map((file) => String(file).replace(/\\/g, "/")).filter(Boolean))];
  const changed = new Set(files);
  const triggered = DOC_RULES.filter((rule) => files.some((file) => rule.source.test(file)));
  const violations = triggered.flatMap((rule) => {
    const missing = rule.docs.filter((doc) => !changed.has(doc));
    return missing.length ? [{ ruleId: rule.id, requiredDocs: missing }] : [];
  });
  const sensitiveCount = files.filter((file) => SECRET_PATH.test(file)).length;
  return {
    schemaVersion: "mds.docs-staleness.v1",
    status: violations.length ? "BLOCKED_DOCS_STALE" : "PASS",
    changedFileCount: files.length,
    sensitivePathCount: sensitiveCount,
    changedFiles: sensitiveCount ? "WITHHELD_DUE_TO_SECRET_SHAPED_PATH" : files,
    triggeredRules: triggered.map((rule) => rule.id),
    violations,
    integrationAllowed: violations.length === 0,
    fileContentsRead: false,
    authority: "Filename-diff documentation gate only. Passing does not prove documentation accuracy, runtime state, provider state, or release readiness.",
  };
}
