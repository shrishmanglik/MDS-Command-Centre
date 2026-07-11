import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CATEGORIES = new Set(["coding_style", "tooling", "verification", "communication", "workflow"]);
const POLARITIES = new Set(["SUPPORT", "CONTRADICT"]);
const SENSITIVE = /\b(?:race|ethnicity|religion|politic(?:al|s)?|health|medical|disability|sexual|gender|biometric|financial account|credit card|social insurance|passport|home address)\b/i;

function clean(value, limit, label) {
  const text = String(value || "").trim();
  if (!text || text.length > limit || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text) || SENSITIVE.test(text)) throw new Error(`PROFILE_${label}_INVALID`);
  return text;
}

function readLedger(storePath) {
  if (!fs.existsSync(storePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return Array.isArray(parsed.observations) ? parsed.observations.slice(0, 1000) : [];
}

export function recordProfileObservation(storePath, input) {
  if (!CATEGORIES.has(input?.category)) throw new Error("PROFILE_CATEGORY_INVALID");
  if (!POLARITIES.has(input?.polarity)) throw new Error("PROFILE_POLARITY_INVALID");
  const claimKey = String(input.claimKey || "");
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(claimKey)) throw new Error("PROFILE_CLAIM_KEY_INVALID");
  const observation = {
    id: `OBS-${crypto.randomUUID().slice(0, 12).toUpperCase()}`, category: input.category, claimKey,
    statement: clean(input.statement, 500, "STATEMENT"), polarity: input.polarity,
    sourceRef: clean(input.sourceRef, 240, "SOURCE_REF"), recordedAt: new Date().toISOString(),
    explicitDeveloperEvidence: input.explicitDeveloperEvidence === true,
  };
  if (!observation.explicitDeveloperEvidence) throw new Error("PROFILE_EXPLICIT_EVIDENCE_REQUIRED");
  const observations = [observation, ...readLedger(storePath)].slice(0, 1000);
  const payload = { schemaVersion: "mds.user-profile-evidence.v1", updatedAt: new Date().toISOString(), authority: "Explicit local developer-preference evidence only. No sensitive traits, hidden tracking, provider data, or automatic agent mutation.", observations };
  fs.mkdirSync(path.dirname(storePath), { recursive: true }); const temporary = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 }); fs.renameSync(temporary, storePath);
  return { observation, profile: buildDialecticProfile(observations) };
}

export function buildDialecticProfile(observations) {
  const groups = new Map();
  for (const observation of observations || []) {
    if (!CATEGORIES.has(observation.category) || !POLARITIES.has(observation.polarity)) continue;
    const key = `${observation.category}:${observation.claimKey}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(observation);
  }
  const claims = [...groups.values()].map((evidence) => {
    const support = evidence.filter((item) => item.polarity === "SUPPORT"); const contradict = evidence.filter((item) => item.polarity === "CONTRADICT");
    const uniqueSupportSources = new Set(support.map((item) => item.sourceRef)).size;
    const status = contradict.length >= support.length && contradict.length ? "DISPUTED" : uniqueSupportSources >= 2 ? "ACCEPTED_REVIEWABLE" : "PROVISIONAL";
    return { category: evidence[0].category, claimKey: evidence[0].claimKey, statement: support[0]?.statement || evidence[0].statement, status, supportCount: support.length, contradictionCount: contradict.length, sourceRefs: [...new Set(evidence.map((item) => item.sourceRef))].slice(0, 20), confidence: status === "ACCEPTED_REVIEWABLE" ? Math.min(0.9, 0.5 + uniqueSupportSources * 0.1 - contradict.length * 0.1) : null, autoApplied: false };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.claimKey.localeCompare(b.claimKey));
  return { schemaVersion: "mds.dialectic-user-profile.v1", status: claims.some((claim) => claim.status === "DISPUTED") ? "REVIEW_DISPUTES" : "REVIEWABLE", claims, sensitiveAttributesModeled: false, hiddenTelemetryUsed: false, autoApplied: false, authority: "Local reviewable preference model only. Claims must not override work orders, safety rules, or explicit current instructions." };
}

export function readDialecticProfile(storePath) { return buildDialecticProfile(readLedger(storePath)); }
