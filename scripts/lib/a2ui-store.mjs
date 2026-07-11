const TYPES = new Set(["heading", "text", "metric", "button", "input", "notice", "divider", "table"]);
const WIDTHS = new Set(["third", "half", "full"]);
const TONES = new Set(["neutral", "info", "success", "warning", "danger"]);
const UNSAFE_CONTENT = /<\/?[a-z]|javascript:|data:text\/html|https?:\/\/|on[a-z]+\s*=|\{\{|\}\}/i;

function safeText(value, max, fallback = "") {
  const text = String(value ?? fallback).trim().slice(0, max);
  if (UNSAFE_CONTENT.test(text)) throw new Error("A2UI text contains forbidden markup, URL, template, or event-handler content.");
  return text;
}

export function sanitizeA2UIComponent(component, index = 0) {
  const type = TYPES.has(component?.type) ? component.type : "text";
  const rows = Array.isArray(component?.rows)
    ? component.rows.slice(0, 8).map((row) => (Array.isArray(row) ? row.slice(0, 4).map((cell) => safeText(cell, 120)) : [])).filter((row) => row.length)
    : [];
  return {
    id: String(component?.id || `CMP-${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 48),
    type,
    label: safeText(component?.label, 120, type === "metric" ? "Metric" : "Label"),
    text: safeText(component?.text, 1000, type === "heading" ? "Untitled section" : ""),
    value: safeText(component?.value, 160, type === "metric" ? "UNKNOWN" : ""),
    tone: TONES.has(component?.tone) ? component.tone : "neutral",
    width: WIDTHS.has(component?.width) ? component.width : type === "divider" ? "full" : "half",
    rows,
  };
}

export function sanitizeA2UIDocument(document) {
  const now = new Date().toISOString();
  const components = Array.isArray(document?.components) ? document.components.slice(0, 40).map(sanitizeA2UIComponent) : [];
  if (new Set(components.map((component) => component.id)).size !== components.length) throw new Error("A2UI component IDs must be unique.");
  return {
    id: String(document?.id || `CANVAS-${Date.now().toString(36).toUpperCase()}`).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64),
    title: safeText(document?.title, 160, "Untitled canvas"),
    workspaceId: String(document?.workspaceId || "UNASSIGNED").replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64),
    status: document?.status === "SAVED_LOCAL" ? "SAVED_LOCAL" : "DRAFT_LOCAL",
    components,
    authority: "LOCAL_A2UI_DRAFT_ONLY",
    executionAllowed: false,
    createdAt: String(document?.createdAt || now).slice(0, 80),
    updatedAt: now,
  };
}

export function readA2UIDocuments(storePath, fs) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  return Array.isArray(records) ? records.map(sanitizeA2UIDocument).slice(0, 50) : [];
}

export function writeA2UIDocuments(storePath, records, fs) {
  if (!Array.isArray(records) || records.length > 50) throw new Error("A2UI store accepts at most 50 documents.");
  const sanitized = records.map(sanitizeA2UIDocument);
  if (new Set(sanitized.map((document) => document.id)).size !== sanitized.length) throw new Error("A2UI document IDs must be unique.");
  const payload = {
    schemaVersion: "mds.command-centre.a2ui-documents.v1",
    updatedAt: new Date().toISOString(),
    authority: "D-local A2UI drafts only. No agent code execution, arbitrary HTML, external assets, provider state, or live UI deployment.",
    records: sanitized,
  };
  const temp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, storePath);
  return payload;
}

export { TYPES, WIDTHS, TONES };
