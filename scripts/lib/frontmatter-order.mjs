import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

export const FRONTMATTER_KEYS = Object.freeze(["documentType", "title", "slug", "navIndex", "status", "updatedAt", "authority"]);
const COLLECTIONS = Object.freeze({ "product-briefs": "product-brief", "user-journeys": "user-journey" });
const SECRET_PATH = /(^|[\\/])\.env[^\\/]*$|\.(pem|p12|pfx|key)$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|\.npmrc$/i;
const STATUSES = new Set(["DRAFT", "REVIEW", "APPROVED", "ARCHIVED"]);

function problem(code, file, detail) { return { code, file, detail }; }
function parseFrontmatter(file, root, fsApi) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (SECRET_PATH.test(relative)) return { error: problem("SECRET_PATH_REFUSED", "WITHHELD", "Secret-shaped document path refused without reading contents.") };
  if (fsApi.statSync(file).size > 256 * 1024) return { error: problem("FILE_SIZE", relative, "Document exceeds 256 KiB.") };
  const source = fsApi.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  if (lines[0] !== "---") return { error: problem("FRONTMATTER_MISSING", relative, "Document must start with YAML frontmatter.") };
  const end = lines.slice(1, 42).indexOf("---");
  if (end < 0) return { error: problem("FRONTMATTER_UNCLOSED", relative, "Frontmatter must close within 40 lines.") };
  const yaml = lines.slice(1, end + 1).join("\n");
  const document = parseDocument(yaml, { maxAliasCount: 0, strict: true, uniqueKeys: true, schema: "core", keepSourceTokens: true });
  if (document.errors.length || document.warnings.length) return { error: problem("FRONTMATTER_YAML", relative, [...document.errors, ...document.warnings].map((item) => item.message).join("; ")) };
  const data = document.toJS({ maxAliasCount: 0 });
  const keys = document.contents?.items?.map((item) => String(item.key?.value ?? "")) || [];
  return { relative, data, keys };
}

export function validateFrontmatterCollections(rootPath, fsApi = fs) {
  const root = path.resolve(rootPath);
  const errors = [];
  const documents = [];
  for (const [folder, documentType] of Object.entries(COLLECTIONS)) {
    const directory = path.join(root, folder);
    if (!fsApi.existsSync(directory) || !fsApi.statSync(directory).isDirectory()) { errors.push(problem("COLLECTION_MISSING", folder, "Required generated-document collection is missing.")); continue; }
    const files = fsApi.readdirSync(directory).filter((name) => name.endsWith(".md") && name !== "README.md").sort().map((name) => path.join(directory, name));
    if (!files.length) { errors.push(problem("COLLECTION_EMPTY", folder, "Collection must contain at least one document.")); continue; }
    const indexes = [];
    for (const file of files) {
      const parsed = parseFrontmatter(file, root, fsApi);
      if (parsed.error) { errors.push(parsed.error); continue; }
      const { data, keys, relative } = parsed;
      if (JSON.stringify(keys) !== JSON.stringify(FRONTMATTER_KEYS)) errors.push(problem("KEY_ORDER", relative, `Expected exact order: ${FRONTMATTER_KEYS.join(", ")}.`));
      if (data.documentType !== documentType) errors.push(problem("DOCUMENT_TYPE", relative, `Expected ${documentType}.`));
      if (!String(data.title || "").trim() || String(data.title).length > 140) errors.push(problem("TITLE", relative, "Title is required and limited to 140 characters."));
      if (!/^[a-z][a-z0-9-]{2,80}$/.test(String(data.slug || ""))) errors.push(problem("SLUG", relative, "Slug must be lowercase kebab-case."));
      if (!Number.isInteger(data.navIndex) || data.navIndex < 1 || data.navIndex > 999) errors.push(problem("NAV_INDEX", relative, "navIndex must be an integer from 1 to 999."));
      if (!STATUSES.has(data.status)) errors.push(problem("STATUS", relative, "Status must be DRAFT, REVIEW, APPROVED, or ARCHIVED."));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.updatedAt || ""))) errors.push(problem("UPDATED_AT", relative, "updatedAt must use YYYY-MM-DD."));
      if (data.authority !== "LOCAL_DRAFT_ONLY") errors.push(problem("AUTHORITY", relative, "authority must remain LOCAL_DRAFT_ONLY."));
      const expectedName = `${String(data.navIndex).padStart(2, "0")}-${data.slug}.md`;
      if (path.basename(file) !== expectedName) errors.push(problem("FILENAME_ALIGNMENT", relative, `Expected filename ${expectedName}.`));
      indexes.push(data.navIndex); documents.push({ file: relative, documentType, navIndex: data.navIndex, slug: data.slug });
    }
    const sorted = [...indexes].sort((a, b) => a - b);
    if (new Set(indexes).size !== indexes.length) errors.push(problem("NAV_DUPLICATE", folder, "navIndex values must be unique within the collection."));
    if (sorted.some((value, index) => value !== index + 1)) errors.push(problem("NAV_SEQUENCE", folder, "navIndex values must be contiguous from 1."));
  }
  return { schemaVersion: "mds.frontmatter-order.v1", status: errors.length ? "INVALID" : "VALID", valid: errors.length === 0, root, canonicalOrder: FRONTMATTER_KEYS, documents: documents.sort((a, b) => a.file.localeCompare(b.file)), errors, fileBodiesEvaluated: false, secretFilesRead: false, authority: "Generated-document metadata alignment only. Validation does not approve content, claims, publication, or live state." };
}
