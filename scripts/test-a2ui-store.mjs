import { sanitizeA2UIDocument } from "./lib/a2ui-store.mjs";

const clean = sanitizeA2UIDocument({ title: "Operator brief", components: [{ id: "metric-1", type: "metric", label: "Open runs", value: "3", width: "third" }, { type: "table", rows: [["A", "B"], ["1", "2"]] }] });
if (clean.components.length !== 2 || clean.components[0].width !== "third" || clean.executionAllowed !== false) throw new Error("Clean A2UI document did not sanitize correctly.");
const fallback = sanitizeA2UIDocument({ components: [{ type: "iframe", width: "999", tone: "neon" }] });
if (fallback.components[0].type !== "text" || fallback.components[0].width !== "half" || fallback.components[0].tone !== "neutral") throw new Error("Unknown A2UI fields did not fail closed.");
for (const unsafe of ["<script>alert(1)</script>", "javascript:alert(1)", "https://example.com", "onclick=run()"]) {
  let blocked = false;
  try { sanitizeA2UIDocument({ components: [{ type: "text", text: unsafe }] }); } catch { blocked = true; }
  if (!blocked) throw new Error(`Unsafe A2UI content was accepted: ${unsafe}`);
}
console.log("A2UI store checks passed.");
