const state = {
  view: "today",
  snapshot: null,
  tickets: [],
  activity: [],
  decisions: [],
  runs: [],
  research: [],
  researchSources: [],
  deltaReviews: [],
  selectedTicketId: "",
  selectedActivityId: "",
  selectedDecisionId: "",
  selectedRunId: "",
  selectedResearchId: "",
  selectedDeltaReviewId: "",
  pendingDeltaStage: "",
  pendingCloseoutDraftEventId: "",
  selectedBoardId: "",
  reviewFilter: "all",
  closeoutImportRunId: "",
  promotionFilter: "all",
  decisionEventFilter: "reviewable",
  searchQuery: "",
  searchType: "all",
  searchLane: "all",
  searchSelectedKeys: [],
  searchViews: [],
  bulkDispatchTarget: "Codex",
  dispatchTarget: "Codex",
  health: null,
  ticketPersistence: "localStorage fallback",
  activityPersistence: "localStorage fallback",
  decisionPersistence: "localStorage fallback",
  runPersistence: "localStorage fallback",
  researchPersistence: "localStorage fallback",
  deltaPersistence: "localStorage fallback",
  lastSaveState: "not saved",
  localCaps: null,
  sourceTruth: null,
  adapterHealth: null,
  sourceEvidence: [],
  capabilityRequests: [],
  selectedSourceEvidenceId: "",
  selectedCapabilityRequestId: "",
  browsePath: ".",
  browseListing: null,
  browseNotice: "",
  evidencePersistence: "localStorage fallback",
  capabilityRequestPersistence: "localStorage fallback",
  adapterRefreshState: "",
  inboxEvents: [],
  selectedInboxEventId: "",
  inboxFilter: "all",
  inboxPersistence: "localStorage fallback",
  inboxPairingNotice: "",
  workspaces: [],
  selectedWorkspaceId: "",
  workspacePersistence: "local API unavailable",
  workspaceNotice: "",
  voiceRuntime: null,
  voiceCommands: [],
  voiceNotice: "",
  voiceListening: false,
  modelRouter: null,
  modelRouterNotice: "",
  canvasDocuments: [],
  selectedCanvasId: "",
  selectedCanvasComponentId: "",
  canvasPersistence: "local API unavailable",
  canvasNotice: "",
};
let voiceMediaRecorder = null;
let voiceMediaStream = null;

const storageKey = "mds-command-centre:tickets:v1";
const storageActivityKey = "mds-command-centre:activity:v1";
const storageDecisionKey = "mds-command-centre:decisions:v1";
const storageRunKey = "mds-command-centre:runs:v1";
const storageResearchKey = "mds-command-centre:research:v1";
const storageDeltaKey = "mds-command-centre:delta-reviews:v1";
const storageSearchViewsKey = "mds-command-centre:search-views:v1";
const storageInboxKey = "mds-command-centre:inbox:v1";
const targets = ["Codex", "Claude Code", "Antigravity", "NotebookLM", "GLM/Ollama", "Human"];
const validViews = new Set([
  "today",
  "search",
  "queue",
  "boards",
  "launch",
  "operator",
  "inbox",
  "workspaces",
  "voice",
  "canvas",
  "vcos",
  "files",
  "git",
  "sources",
  "capabilities",
  "providers",
  "models",
  "runtime",
  "runs",
  "tickets",
  "dispatch",
  "proof",
  "closeout",
  "review",
  "promote",
  "activity",
  "decisions",
  "benchmark",
  "health",
]);

function icon(name, size = 18) {
  const paths = {
    today: '<path d="m4 7 2 2 3-4"/><path d="M12 8h8"/><path d="m4 16 2 2 3-4"/><path d="M12 17h8"/>',
    queue: '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/><path d="M8 5v14"/><path d="m15 9 3 3-3 3"/>',
    boards: '<path d="M3 6h7l2 2h9v11H3V6Z"/><path d="M8 12v4"/><path d="M12 11v5"/><path d="M16 13v3"/>',
    launch: '<path d="M12 3 7 8l2 2-5 5 5 5 5-5 2 2 5-5-9-9Z"/><path d="M9 20h6"/><path d="M12 16v4"/>',
    tickets: '<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z"/><path d="M9 9v6"/>',
    dispatch: '<path d="M9 4h6l1 2h3v15H5V6h3l1-2Z"/><path d="M9 10h6"/><path d="M9 14h6"/>',
    runs: '<path d="M5 4h14v5H5z"/><path d="M5 15h14v5H5z"/><path d="M8 9v6"/><path d="M16 9v6"/><path d="m10 12 2 2 4-4"/>',
    research: '<path d="M4 5h9v14H4z"/><path d="M15 5h5v14h-5z"/><path d="M7 9h3"/><path d="M7 13h3"/><path d="M17 9h1"/><path d="M17 13h1"/>',
    closeout: '<path d="M5 4h14v16H5z"/><path d="M8 9h8"/><path d="M8 13h5"/><path d="m14 17 2 2 4-5"/>',
    review: '<path d="M4 4h16v16H4z"/><path d="M8 9h8"/><path d="M8 13h4"/><path d="m13 17 2 2 4-5"/>',
    promote: '<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4h14v-4"/>',
    activity: '<path d="M4 5h16"/><path d="M8 5v14"/><path d="M4 12h16"/><path d="M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="19" r="2"/>',
    decisions: '<path d="M6 4h12v16H6z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="m8 17 2 2 4-5"/>',
    runtime: '<path d="M4 5h16v5H4z"/><path d="M4 14h7v5H4z"/><path d="M15 14h5v5h-5z"/><path d="M8 10v4"/><path d="M17 10v4"/><path d="M11 16h4"/>',
    proof: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>',
    operator: '<path d="M4 5h7v7H4z"/><path d="M13 5h7v4h-7z"/><path d="M13 11h7v8h-7z"/><path d="M4 14h7v5H4z"/><path d="M11 8h2"/><path d="M8 12v2"/><path d="M16 9v2"/>',
    inbox: '<path d="M4 5h16v14H4z"/><path d="m4 13 4-4 4 4 4-4 4 4"/><path d="M8 17h8"/>',
    workspaces: '<path d="M3 5h8v6H3z"/><path d="M13 5h8v6h-8z"/><path d="M3 13h8v6H3z"/><path d="M13 13h8v6h-8z"/><path d="M11 8h2"/><path d="M7 11v2"/><path d="M17 11v2"/>',
    voice: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/><path d="M9 21h6"/>',
    canvas: '<path d="M3 4h18v16H3z"/><path d="M7 8h5v4H7z"/><path d="M14 8h3"/><path d="M14 12h3"/><path d="M7 16h10"/>',
    benchmark: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16V9"/><path d="M12 16V7"/><path d="M16 16v-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    vcos: '<path d="M12 3v4"/><path d="M5 21v-4"/><path d="M19 21v-4"/><path d="M12 21v-6"/><rect x="9" y="7" width="6" height="4" rx="1"/><rect x="2" y="13" width="6" height="4" rx="1"/><rect x="16" y="13" width="6" height="4" rx="1"/><path d="M12 11v2"/><path d="M5 13v-1h14v1"/>',
    files: '<path d="M3 6h6l2 2h10v12H3V6Z"/><path d="M3 10h18"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8.5v7"/><path d="M8 7.4C12 8 15.4 9.7 15.8 12"/>',
    sources: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z"/>',
    capabilities: '<path d="m14 3-1 6h6L10 21l1-7H5L14 3Z"/>',
    providers: '<path d="M4 6h16v12H4z"/><path d="M8 10h8"/><path d="M8 14h5"/><path d="M6 6V4h12v2"/><path d="M9 18v2h6v-2"/>',
    models: '<path d="M8 4h8v3h3v8h-3v5H8v-5H5V7h3V4Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 15h6"/><path d="M12 4V2"/><path d="M12 22v-2"/>',
    health: '<path d="M22 12h-4l-3 7-6-14-3 7H2"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    save: '<path d="M5 3h12l2 2v16H5V3Z"/><path d="M8 3v6h7V3"/><path d="M8 21v-7h8v7"/>',
    warning: '<path d="M12 3 22 20H2L12 3Z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    file: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="M8 12h8"/><path d="M8 16h6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.file}</svg>`;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(value) {
  const normalized = String(value).toUpperCase();
  if (normalized.includes("READY") || normalized.includes("PASS") || normalized.includes("GREEN")) return "status ready";
  if (normalized.includes("BLOCK") || normalized.includes("NO_GO") || normalized.includes("FORBIDDEN") || normalized.includes("GAP") || normalized.includes("QUARANTINED")) return "status blocked";
  if (normalized.includes("PARK")) return "status parked";
  if (normalized.includes("FIX") || normalized.includes("REVIEW") || normalized.includes("PARTIAL")) return "status fix";
  if (normalized.includes("UNKNOWN")) return "status unknown";
  if (normalized.includes("WAIVED")) return "status parked";
  return "status active";
}

function truncate(value, max = 180) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function nowIso() {
  return new Date().toISOString();
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Browser automation and locked-down contexts can deny direct clipboard access.
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

function blankTicket() {
  const now = nowIso();
  return {
    id: `MCC-${Date.now().toString(36).toUpperCase()}`,
    title: "Untitled local ticket",
    lane: "Command Centre",
    owner: "Codex Board",
    status: "ACTIVE",
    priority: "P1",
    sourceEvidence: "command-centre/war-room/",
    proofCondition: "",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, or secret read.",
    nextAction: "",
    closeoutRaw: "",
    closeoutSummary: "",
    evidencePaths: "",
    validationRun: "",
    unknownsPreserved: "",
    authorityConflicts: "",
    memoryRecommendation: "ledger_only",
    reviewerStatus: "NOT REVIEWED",
    reviewNotes: "",
    reviewedBy: "",
    reviewedAt: "",
    promotionStatus: "NOT STAGED",
    promotionNotes: "",
    stagedBy: "",
    stagedAt: "",
    closedBy: "",
    closeoutAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

function seedTickets() {
  const now = nowIso();
  return [
    {
      id: "MCC-001",
      title: "Command Centre Sprint 001 local shell",
      lane: "Command Centre",
      owner: "Codex Board",
      status: "ACTIVE",
      priority: "P0",
      sourceEvidence: "command-centre/war-room/README.md; product-readiness-board.csv",
      proofCondition: "Local app renders Today, Boards, Tickets, and Dispatch from D war-room snapshot.",
      stopCondition: "Do not deploy or mutate provider/payment/auth/database state.",
      nextAction: "Refresh snapshot, verify build, and capture local browser screenshots.",
      closeoutRaw: "",
      closeoutSummary: "",
      evidencePaths: "",
      validationRun: "",
      unknownsPreserved: "",
      authorityConflicts: "",
      memoryRecommendation: "ledger_only",
      reviewerStatus: "NOT REVIEWED",
      reviewNotes: "",
      reviewedBy: "",
      reviewedAt: "",
      promotionStatus: "NOT STAGED",
      promotionNotes: "",
      stagedBy: "",
      stagedAt: "",
      closedBy: "",
      closeoutAt: "",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`Local API ${path} returned ${response.status}.`);
  return response.json();
}

async function loadTickets() {
  try {
    const payload = await apiJson("/api/tickets");
    if (Array.isArray(payload.tickets) && payload.tickets.length) {
      state.ticketPersistence = `file-backed: ${payload.store || "src/data/localTickets.json"}`;
      localStorage.setItem(storageKey, JSON.stringify(payload.tickets));
      return payload.tickets;
    }
  } catch {
    state.ticketPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : seedTickets();
  } catch {
    return seedTickets();
  }
}

async function saveTickets() {
  localStorage.setItem(storageKey, JSON.stringify(state.tickets));
  try {
    const payload = await apiJson("/api/tickets", {
      method: "PUT",
      body: JSON.stringify({ tickets: state.tickets }),
    });
    state.ticketPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
    state.lastSaveState = "saved to D-local file";
  } catch {
    state.ticketPersistence = "localStorage fallback";
    state.lastSaveState = "saved to browser only";
  }
}

function blankActivityEvent(ticket = selectedTicket()) {
  const now = nowIso();
  return {
    id: `ACT-${Date.now().toString(36).toUpperCase()}`,
    timestamp: now,
    action: "activity_recorded",
    ticketId: ticket?.id || "UNKNOWN",
    title: ticket?.title || "",
    lane: ticket?.lane || "Command Centre",
    owner: ticket?.owner || "Codex Board",
    status: ticket?.status || "UNKNOWN",
    reviewStatus: ticket?.reviewerStatus || "UNKNOWN",
    promotionStatus: ticket?.promotionStatus || "UNKNOWN",
    memoryRecommendation: ticket?.memoryRecommendation || "ledger_only",
    evidencePaths: ticket?.evidencePaths || ticket?.sourceEvidence || "",
    validationRun: ticket?.validationRun || "",
    unknownsPreserved: ticket?.unknownsPreserved || "",
    authorityConflicts: ticket?.authorityConflicts || "",
    details: "",
    packet: "",
  };
}

function activityEvent(action, ticket, details = {}) {
  const event = blankActivityEvent(ticket);
  const detailText = typeof details === "string" ? details : details.details || details.summary || "";
  return {
    ...event,
    id: `ACT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    action,
    details: String(detailText || "").slice(0, 3000),
    packet: String(details.packet || "").slice(0, 12000),
  };
}

async function loadActivity() {
  try {
    const payload = await apiJson("/api/activity");
    if (Array.isArray(payload.events)) {
      state.activityPersistence = `file-backed: ${payload.store || "src/data/localActivityLog.json"}`;
      localStorage.setItem(storageActivityKey, JSON.stringify(payload.events));
      return payload.events;
    }
  } catch {
    state.activityPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageActivityKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveActivity() {
  state.activity = state.activity.slice(0, 200);
  localStorage.setItem(storageActivityKey, JSON.stringify(state.activity));
  try {
    const payload = await apiJson("/api/activity", {
      method: "PUT",
      body: JSON.stringify({ events: state.activity }),
    });
    state.activityPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.activityPersistence = "localStorage fallback";
  }
}

async function recordActivity(action, ticket, details = {}) {
  const event = activityEvent(action, ticket, details);
  state.activity = [event, ...state.activity.filter((item) => item.id !== event.id)].slice(0, 200);
  state.selectedActivityId = event.id;
  await saveActivity();
  return event;
}

function decisionSourceEvents() {
  const preferred = new Set(["review_accepted", "promotion_staged", "promotion_blocked", "ticket_deleted", "closeout_saved"]);
  const events = state.activity.filter((event) => preferred.has(event.action));
  return events.length ? events : state.activity;
}

function dispatchDecisionEvents() {
  return state.activity.filter((event) => event.action === "bulk_dispatch_staged");
}

function filteredDecisionSourceEvents() {
  const allEvents = state.activity;
  const reviewableEvents = decisionSourceEvents();
  if (state.decisionEventFilter === "all") return allEvents;
  if (state.decisionEventFilter === "dispatch") return dispatchDecisionEvents();
  if (state.decisionEventFilter === "accepted") return allEvents.filter((event) => event.reviewStatus === "ACCEPTED");
  if (state.decisionEventFilter === "staged") return allEvents.filter((event) => event.promotionStatus === "STAGED LOCAL");
  if (state.decisionEventFilter === "blocked") return allEvents.filter((event) => /BLOCK|NEEDS|UNKNOWN/i.test(`${event.reviewStatus} ${event.promotionStatus} ${event.authorityConflicts} ${event.unknownsPreserved}`));
  return reviewableEvents;
}

function uniqueEventText(events, field, fallback = "UNKNOWN") {
  const values = events.map((event) => event[field]).filter(Boolean);
  return [...new Set(values)].join("; ") || fallback;
}

function normalizeEventIds(value, fallbackId = "") {
  const values = Array.isArray(value) ? value : String(value || "").split(/[,\s]+/);
  const ids = values.map((item) => String(item || "").trim()).filter(Boolean);
  if (!ids.length && fallbackId) ids.push(fallbackId);
  return [...new Set(ids)].slice(0, 25);
}

function decisionEvents(decision) {
  const ids = normalizeEventIds(decision.sourceEventIds, decision.sourceEventId);
  const events = ids.map((id) => state.activity.find((event) => event.id === id)).filter(Boolean);
  const primary = state.activity.find((event) => event.id === decision.sourceEventId);
  if (!events.length && primary) events.push(primary);
  return events;
}

function blankDecisionExport(event = selectedActivityEvent()) {
  const now = nowIso();
  return {
    id: `DEC-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    sourceEventId: event?.id || "",
    sourceEventIds: event?.id ? [event.id] : [],
    sourceAction: event?.action || "UNKNOWN",
    ticketId: event?.ticketId || "UNKNOWN",
    title: event?.title || "Untitled director decision",
    decisionType: "ledger_append_candidate",
    disposition: "DRAFT",
    director: "Codex Strategic Board",
    authorityBasis: "D-local evidence reviewed under CEO.md, source-authority-matrix.yaml, and session closeout update contract. Providers remain live-state authority. GitHub remains committed-code authority.",
    evidencePaths: event?.evidencePaths || "",
    validationRun: event?.validationRun || "",
    unknownsPreserved: event?.unknownsPreserved || "UNKNOWN",
    authorityConflicts: event?.authorityConflicts || "UNKNOWN",
    memoryAction: event?.memoryRecommendation || "ledger_only",
    officialLedgerCandidate: event?.packet || "",
    bundleSummary: "",
    ledgerBundleCandidate: "",
    notes: "",
    packet: "",
  };
}

async function loadDecisions() {
  try {
    const payload = await apiJson("/api/decisions");
    if (Array.isArray(payload.decisions)) {
      state.decisionPersistence = `file-backed: ${payload.store || "src/data/localDecisionExports.json"}`;
      localStorage.setItem(storageDecisionKey, JSON.stringify(payload.decisions));
      return payload.decisions;
    }
  } catch {
    state.decisionPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageDecisionKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveDecisions() {
  state.decisions = state.decisions.slice(0, 150);
  localStorage.setItem(storageDecisionKey, JSON.stringify(state.decisions));
  try {
    const payload = await apiJson("/api/decisions", {
      method: "PUT",
      body: JSON.stringify({ decisions: state.decisions }),
    });
    state.decisionPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.decisionPersistence = "localStorage fallback";
  }
}

function blankAgentRun(ticket = selectedTicket(), target = state.dispatchTarget) {
  const now = nowIso();
  return {
    id: `RUN-${Date.now().toString(36).toUpperCase()}`,
    ticketId: ticket.id || "UNKNOWN",
    title: ticket.title || "Untitled local agent run",
    targetAgent: target || "Codex",
    owner: ticket.owner || "Codex Strategic Board",
    lane: ticket.lane || "Command Centre",
    status: "DRAFT",
    priority: ticket.priority || "P1",
    approvalClass: "LOCAL_ONLY",
    objective: ticket.title || "UNKNOWN",
    sourceEvidence: ticket.sourceEvidence || "D-local ticket evidence required before dispatch.",
    allowedActions: "Read D-local source evidence, edit local files within the scoped work order, create local artifacts, run local validation, and prepare closeout evidence.",
    forbiddenActions: "Do not deploy, mutate providers, move money, send external messages, read secrets, push GitHub, append the official ledger, promote memory, or claim live provider state.",
    evidenceRequirement: "Return changed files, evidence paths, validation commands/results, unknowns preserved, authority conflicts, and a memory/ledger recommendation.",
    proofCondition: ticket.proofCondition || "Local proof must show the scoped objective is satisfied without crossing forbidden actions.",
    stopCondition: ticket.stopCondition || "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    closeoutFormat: "what_changed; evidence_paths; validation_run; unknowns_preserved; authority_conflicts; files_changed; memory_recommendation; next_action",
    validationPlan: ticket.validationRun || "Run scoped local checks and browser proof when UI changes are made.",
    unknownsPreserved: ticket.unknownsPreserved || "Provider/payment/revenue/deployment/auth/schema/live-state remain UNKNOWN unless owning authority proves them.",
    authorityBasis: "D-local run-control record. GitHub remains committed-code authority. Provider dashboards remain live-state authority. Company memory promotion remains director/CEO/Board gated.",
    packet: "",
    createdAt: now,
    updatedAt: now,
  };
}

async function loadRuns() {
  try {
    const payload = await apiJson("/api/runs");
    if (Array.isArray(payload.runs)) {
      state.runPersistence = `file-backed: ${payload.store || "src/data/localAgentRuns.json"}`;
      localStorage.setItem(storageRunKey, JSON.stringify(payload.runs));
      return payload.runs;
    }
  } catch {
    state.runPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageRunKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveRuns() {
  state.runs = state.runs.slice(0, 150);
  localStorage.setItem(storageRunKey, JSON.stringify(state.runs));
  try {
    const payload = await apiJson("/api/runs", {
      method: "PUT",
      body: JSON.stringify({ runs: state.runs }),
    });
    state.runPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.runPersistence = "localStorage fallback";
  }
}

function blankResearchBrief() {
  const now = nowIso();
  return {
    id: `RES-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    sourceType: "NotebookLM",
    sourceTitle: "Untitled research-to-execution brief",
    sourceEvidence: "NotebookLM source pack, GitHub repository notes, or D-local research artifact path required.",
    sourceUrl: "",
    repoOrNotebook: "",
    researchSummary: "",
    proposedSlice: "Convert the highest-leverage research finding into one 15-30 minute local execution run.",
    leverageClaim: "Large-scope improvement claim remains a hypothesis until implemented and validated.",
    timeboxMinutes: "30",
    targetAgent: "Codex",
    owner: "Atlas / Research Studio",
    lane: "Research Studio",
    status: "DRAFT",
    expectedArtifact: "Local run packet plus changed files or evidence artifact.",
    evidenceRequirement: "Preserve source links/paths, quote no secrets, cite exact evidence, and name validation proof.",
    proofCondition: "A local run packet exists with source evidence, timebox, stop condition, validation plan, and closeout format.",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    validationPlan: "Run scoped local checks and browser proof when UI changes are made.",
    ipClassification: "private_ip",
    unknownsPreserved: "Research findings are evidence inputs only; provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN.",
    packet: "",
  };
}

async function loadResearch() {
  try {
    const payload = await apiJson("/api/research");
    if (Array.isArray(payload.briefs)) {
      state.researchPersistence = `file-backed: ${payload.store || "src/data/localResearchBriefs.json"}`;
      localStorage.setItem(storageResearchKey, JSON.stringify(payload.briefs));
      return payload.briefs;
    }
  } catch {
    state.researchPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageResearchKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveResearch() {
  state.research = state.research.slice(0, 150);
  localStorage.setItem(storageResearchKey, JSON.stringify(state.research));
  try {
    const payload = await apiJson("/api/research", {
      method: "PUT",
      body: JSON.stringify({ briefs: state.research }),
    });
    state.researchPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.researchPersistence = "localStorage fallback";
  }
}

async function loadResearchSources() {
  try {
    const payload = await apiJson("/api/research-sources");
    return Array.isArray(payload.sources) ? payload.sources : [];
  } catch {
    return [];
  }
}

function blankDeltaReview(source = {}) {
  const now = nowIso();
  return {
    id: `DELTA-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    sourceId: source.id || "UNKNOWN",
    title: source.title ? `Delta review: ${source.title}` : "Archive-vs-current delta review",
    archivedEvidence: source.sourceEvidence || "Archived/reference D-local source path required.",
    currentAuthority: "CEO.md; business/strategy/source-authority-matrix.yaml; business/strategy/source-of-truth-map.md; vcos/mds-kernel/state/current-state.md; Products/MDS-Command-Centre/src/data/localResearchSources.json",
    archivedClaim: source.researchSummary || "Archived pattern or claim needs extraction before reuse.",
    currentConstraint: "D canonical doctrine wins; no duplicate kernels/source maps; provider/GitHub/live-state remain UNKNOWN unless owning authority proves them.",
    decision: "REVISE",
    rationale: "Keep the useful pattern but revise it into current Command Centre controls with evidence, proof, stop condition, and director review.",
    owner: source.owner || "Codex Strategic Board",
    lane: source.lane || "VCOS Builder Studio",
    proofCondition: "Delta packet names archived evidence, current authority checked, reuse/revise/park decision, no-duplicate-kernel boundary, and UNKNOWN preservation.",
    nextAction: "Stage one local run or ticket only after director/CEO/Board review confirms the decision.",
    stopCondition: "Stop before treating archive as current doctrine, creating duplicate kernels, deploying, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, GitHub push, or live-state claim.",
    unknownsPreserved: "Archived material may be stale; live provider, payment, deployment, auth, schema, revenue, GitHub release, and promoted-memory status remain UNKNOWN until verified.",
    packet: "",
  };
}

async function loadDeltaReviews() {
  try {
    const payload = await apiJson("/api/delta-reviews");
    if (Array.isArray(payload.reviews)) {
      state.deltaPersistence = `file-backed: ${payload.store || "src/data/localDeltaReviews.json"}`;
      localStorage.setItem(storageDeltaKey, JSON.stringify(payload.reviews));
      return payload.reviews;
    }
  } catch {
    state.deltaPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageDeltaKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveDeltaReviews() {
  state.deltaReviews = state.deltaReviews.slice(0, 120);
  localStorage.setItem(storageDeltaKey, JSON.stringify(state.deltaReviews));
  try {
    const payload = await apiJson("/api/delta-reviews", {
      method: "PUT",
      body: JSON.stringify({ reviews: state.deltaReviews }),
    });
    state.deltaPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.deltaPersistence = "localStorage fallback";
  }
}

function loadSearchViews() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageSearchViewsKey) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveSearchViews() {
  state.searchViews = state.searchViews.slice(0, 20);
  localStorage.setItem(storageSearchViewsKey, JSON.stringify(state.searchViews));
}

function selectedTicket() {
  return state.tickets.find((ticket) => ticket.id === state.selectedTicketId) || state.tickets[0] || blankTicket();
}

function selectedActivityEvent() {
  return state.activity.find((event) => event.id === state.selectedActivityId) || state.activity[0] || blankActivityEvent(selectedTicket());
}

function isCloseoutDraftEvent(event) {
  return event?.action === "closeout_draft_saved" && Boolean(event.packet);
}

function closeoutDraftEventsForTicket(ticket) {
  if (!ticket?.id) return [];
  return state.activity
    .filter((event) => isCloseoutDraftEvent(event) && event.ticketId === ticket.id)
    .sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
}

function pendingCloseoutDraftEvent(ticket) {
  const events = closeoutDraftEventsForTicket(ticket);
  return events.find((event) => event.id === state.pendingCloseoutDraftEventId) || events[0] || null;
}

function selectedDecision() {
  return state.decisions.find((decision) => decision.id === state.selectedDecisionId) || state.decisions[0] || blankDecisionExport(selectedActivityEvent());
}

function selectedRun() {
  return state.runs.find((run) => run.id === state.selectedRunId) || state.runs[0] || blankAgentRun(selectedTicket(), state.dispatchTarget);
}

function selectedResearch() {
  return state.research.find((brief) => brief.id === state.selectedResearchId) || state.research[0] || blankResearchBrief();
}

function selectedDeltaReview() {
  return state.deltaReviews.find((review) => review.id === state.selectedDeltaReviewId) || state.deltaReviews[0] || blankDeltaReview();
}

function researchSourceById(id) {
  return state.researchSources.find((source) => source.id === id);
}

function briefFromResearchSource(source) {
  const brief = blankResearchBrief();
  return {
    ...brief,
    sourceType: source.sourceType || brief.sourceType,
    sourceTitle: source.title || brief.sourceTitle,
    sourceEvidence: source.sourceEvidence || source.sourcePath || brief.sourceEvidence,
    repoOrNotebook: source.sourcePath || "",
    researchSummary: source.researchSummary || brief.researchSummary,
    proposedSlice: source.proposedSlice || brief.proposedSlice,
    leverageClaim: source.leverageClaim || brief.leverageClaim,
    timeboxMinutes: source.timeboxMinutes || brief.timeboxMinutes,
    targetAgent: source.targetAgent || brief.targetAgent,
    owner: source.owner || brief.owner,
    lane: source.lane || brief.lane,
    status: "READY_TO_RUN_LOCAL",
    expectedArtifact: source.expectedArtifact || brief.expectedArtifact,
    evidenceRequirement: source.evidenceRequirement || brief.evidenceRequirement,
    proofCondition: source.proofCondition || brief.proofCondition,
    stopCondition: source.stopCondition || brief.stopCondition,
    validationPlan: source.validationPlan || brief.validationPlan,
    ipClassification: source.ipClassification || brief.ipClassification,
    unknownsPreserved: source.unknownsPreserved || brief.unknownsPreserved,
  };
}

function deltaFromResearchSource(source) {
  const review = blankDeltaReview(source);
  review.packet = buildDeltaPacket(review);
  return review;
}

function deltaReadiness(review) {
  const checks = [
    { label: "Archived evidence", ok: hasReviewText(review.archivedEvidence), detail: "Archived/reference evidence path required" },
    { label: "Current authority", ok: /CEO\.md|source-authority|source-of-truth|current-state/i.test(review.currentAuthority || ""), detail: "Current D authority files must be named" },
    { label: "Decision", ok: /^(REUSE|REVISE|PARK)$/i.test(String(review.decision || "")), detail: "Decision must be REUSE, REVISE, or PARK" },
    { label: "No duplicate kernel", ok: /duplicate kernel|source map|source-of-truth|kernel/i.test(`${review.currentConstraint || ""} ${review.stopCondition || ""}`), detail: "Duplicate-kernel boundary must be explicit" },
    { label: "Stop condition", ok: /deploy|provider|payment|secret|external|ledger|memory|GitHub/i.test(review.stopCondition || ""), detail: "Forbidden boundaries must be explicit" },
    { label: "UNKNOWN preservation", ok: /UNKNOWN/i.test(review.unknownsPreserved || ""), detail: "Archive/current uncertainty must stay explicit" },
  ];
  return { checks, passed: checks.filter((check) => check.ok).length, total: checks.length };
}

function deltaExecutionGate(review) {
  const readiness = deltaReadiness(review);
  const persisted = state.deltaReviews.some((item) => item.id === review.id);
  const executableDecision = /^(REUSE|REVISE)$/i.test(String(review.decision || ""));
  const checks = [
    { label: "Saved review", ok: persisted, detail: persisted ? "Review exists in local delta store" : "Save the delta review first" },
    { label: "Executable decision", ok: executableDecision, detail: executableDecision ? "REUSE/REVISE can stage work" : "PARK cannot create operator work" },
    { label: "Review readiness", ok: readiness.passed === readiness.total, detail: `${readiness.passed}/${readiness.total} delta checks passed` },
    { label: "Local-only next action", ok: /local|director|review|ticket|run|stage|Codex|Board/i.test(review.nextAction || ""), detail: "Next action must stay staged and local" },
  ];
  return {
    checks,
    passed: checks.filter((check) => check.ok).length,
    total: checks.length,
    canStage: checks.every((check) => check.ok),
  };
}

function deltaWorkKey(review) {
  return String(review.id || review.sourceId || "DELTA")
    .replace(/^DELTA-/, "")
    .replace(/[^A-Z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 42);
}

function ticketFromDeltaReview(review = selectedDeltaReview()) {
  const now = nowIso();
  const key = deltaWorkKey(review);
  return {
    ...blankTicket(),
    id: `MCC-DELTA-${key}`.slice(0, 80),
    title: `${review.decision || "REVISE"} archived MIDAS pattern: ${review.title || review.sourceId || "delta review"}`.slice(0, 180),
    lane: review.lane || "VCOS Builder Studio",
    owner: review.owner || "Codex Strategic Board",
    status: /PARK/i.test(review.decision || "") ? "PARKED" : "READY",
    priority: /REUSE/i.test(review.decision || "") ? "P1" : "P0",
    sourceEvidence: review.archivedEvidence || "UNKNOWN",
    proofCondition: review.proofCondition || "Delta-derived ticket preserves archived evidence, current authority, decision, stop condition, and UNKNOWN boundaries.",
    stopCondition: review.stopCondition || "Stop before treating archive as current doctrine, creating duplicate kernels, deploy, provider mutation, external action, payment action, secret read, GitHub push, official ledger append, memory promotion, or live-state claim.",
    nextAction: review.nextAction || "Stage one local run only after director/CEO/Board review confirms this archive/current decision.",
    evidencePaths: review.archivedEvidence || "",
    validationRun: "Pending local validation after execution. Delta review readiness must remain 6/6 before closeout.",
    unknownsPreserved: review.unknownsPreserved || "Archived material, provider state, payment/revenue/deployment/auth/schema state, GitHub release, and promoted-memory status remain UNKNOWN until verified.",
    authorityConflicts: `Delta decision ${review.decision || "UNKNOWN"} is D-local staging only. Current authority checked: ${review.currentAuthority || "UNKNOWN"}. No duplicate kernels/source maps allowed.`,
    memoryRecommendation: "ledger_only",
    reviewerStatus: "PENDING REVIEW",
    reviewNotes: `Source delta review: ${review.id || "UNKNOWN"}. Rationale: ${review.rationale || "UNKNOWN"}`,
    createdAt: now,
    updatedAt: now,
  };
}

function runFromDeltaReview(review = selectedDeltaReview()) {
  const now = nowIso();
  const ticket = ticketFromDeltaReview(review);
  const run = {
    ...blankAgentRun(ticket, "Codex"),
    id: `RUN-DELTA-${deltaWorkKey(review)}`.slice(0, 80),
    ticketId: ticket.id,
    title: `Execute ${review.decision || "REVISE"} delta: ${review.title || review.sourceId || "archive/current review"}`.slice(0, 180),
    targetAgent: "Codex",
    owner: review.owner || "Codex Strategic Board",
    lane: review.lane || "VCOS Builder Studio",
    status: "READY_LOCAL",
    priority: /REUSE/i.test(review.decision || "") ? "P1" : "P0",
    objective: `Convert the ${review.decision || "REVISE"} archive/current decision into one local Command Centre improvement without creating duplicate source-of-truth artifacts.`,
    sourceEvidence: review.archivedEvidence || "UNKNOWN",
    allowedActions: "Read D-local archived evidence and current authority files, edit only scoped local Command Centre files, create local tickets/runs/activity records, run no-secret local validation, and prepare closeout evidence.",
    forbiddenActions: "Do not deploy, mutate providers, move money, send external messages, read secrets, push GitHub, create duplicate kernels/source maps/CEO/Board/product registries, append the official ledger, promote memory, or claim live provider state.",
    evidenceRequirement: "Return delta review id, ticket id, changed files, evidence paths, validation commands/results, screenshots for UI work, unknowns preserved, authority conflicts, and one next action.",
    proofCondition: review.proofCondition || "The delta-derived local run produces a scoped artifact and preserves current D authority, no-duplicate-kernel boundaries, and UNKNOWN live-state boundaries.",
    stopCondition: review.stopCondition || "Stop before treating archive as current doctrine, duplicate kernel creation, deploy, provider mutation, external action, payment action, secret read, GitHub push, official ledger append, memory promotion, or live-state claim.",
    validationPlan: "Run node checks, static guard, build, browser desktop/mobile proof for UI changes, git diff --check for touched tracked files, and D source-of-truth verifier when doctrine/state is touched.",
    unknownsPreserved: review.unknownsPreserved || "Archived material, provider state, payment/revenue/deployment/auth/schema state, GitHub release, and promoted-memory status remain UNKNOWN until verified.",
    authorityBasis: `D-local delta review ${review.id || "UNKNOWN"} only. Current D doctrine wins. GitHub remains committed-code authority. Provider dashboards remain live-state authority. Official ledger and company memory remain director/CEO/Board gated.`,
    createdAt: now,
    updatedAt: now,
  };
  run.packet = buildRunPacket(run);
  return run;
}

function buildDeltaPacket(review) {
  const readiness = deltaReadiness(review);
  return [
    "# MDS Command Centre Archive-Vs-Current Delta Packet",
    "",
    "packet_status: LOCAL_DELTA_REVIEW_ONLY",
    `review_id: ${review.id || "UNKNOWN"}`,
    `source_id: ${review.sourceId || "UNKNOWN"}`,
    `title: ${review.title || "UNKNOWN"}`,
    `decision: ${review.decision || "REVISE"}`,
    `owner: ${review.owner || "Codex Strategic Board"}`,
    `lane: ${review.lane || "VCOS Builder Studio"}`,
    `readiness_score: ${readiness.passed}/${readiness.total}`,
    "",
    "## Archived Evidence",
    review.archivedEvidence || "UNKNOWN",
    "",
    "## Current Authority Checked",
    review.currentAuthority || "UNKNOWN",
    "",
    "## Archived Claim / Pattern",
    review.archivedClaim || "UNKNOWN",
    "",
    "## Current Constraint",
    review.currentConstraint || "UNKNOWN",
    "",
    "## Decision Rationale",
    review.rationale || "UNKNOWN",
    "",
    "## Proof Condition",
    review.proofCondition || "UNKNOWN",
    "",
    "## Next Action",
    review.nextAction || "UNKNOWN",
    "",
    "## Stop Condition",
    review.stopCondition || "UNKNOWN",
    "",
    "## Unknowns Preserved",
    review.unknownsPreserved || "UNKNOWN",
    "",
    "## Readiness Checks",
    ...readiness.checks.map((check) => `- ${check.ok ? "PASS" : "FIX"} | ${check.label}: ${check.detail}`),
    "",
    "## Forbidden Actions",
    "- Do not treat archived docs or session extracts as current doctrine.",
    "- Do not create duplicate kernels, source maps, CEO files, Board files, product registries, or source-of-truth files from this packet.",
    "- Do not deploy, mutate providers, move money, send external messages, read secrets, push GitHub, append the official ledger, or promote memory from this packet alone.",
  ].join("\n");
}

function runReadiness(run) {
  const checks = [
    {
      label: "Objective",
      ok: hasReviewText(run.objective),
      detail: hasReviewText(run.objective) ? "Objective present" : "Missing objective",
    },
    {
      label: "Evidence requirement",
      ok: hasReviewText(run.evidenceRequirement) && hasReviewText(run.sourceEvidence),
      detail: "Source evidence and return evidence are required",
    },
    {
      label: "Stop condition",
      ok: /deploy|provider|payment|secret|external|ledger|memory/i.test(run.stopCondition || ""),
      detail: "Stop condition must name forbidden boundary classes",
    },
    {
      label: "Forbidden actions",
      ok: /deploy|provider|payment|secret|GitHub|ledger|memory|external/i.test(run.forbiddenActions || ""),
      detail: "Forbidden action list must be explicit",
    },
    {
      label: "UNKNOWN preservation",
      ok: /UNKNOWN/i.test(run.unknownsPreserved || ""),
      detail: "Provider/live-state unknowns must stay explicit",
    },
    {
      label: "Authority basis",
      ok: /D-local|GitHub|Provider|authority/i.test(run.authorityBasis || ""),
      detail: "D/GitHub/provider authority separation must be named",
    },
  ];
  return {
    checks,
    passed: checks.filter((check) => check.ok).length,
    total: checks.length,
  };
}

function buildRunPacket(run) {
  const readiness = runReadiness(run);
  return [
    "# MDS Command Centre Agent Run Packet",
    "",
    "run_status: LOCAL_RUN_CONTROL_ONLY",
    `run_id: ${run.id || "UNKNOWN"}`,
    `ticket_id: ${run.ticketId || "UNKNOWN"}`,
    `title: ${run.title || "UNKNOWN"}`,
    `target_agent: ${run.targetAgent || "UNKNOWN"}`,
    `owner: ${run.owner || "UNKNOWN"}`,
    `lane: ${run.lane || "UNKNOWN"}`,
    `status: ${run.status || "DRAFT"}`,
    `priority: ${run.priority || "P1"}`,
    `approval_class: ${run.approvalClass || "LOCAL_ONLY"}`,
    `readiness_score: ${readiness.passed}/${readiness.total}`,
    "",
    "## Objective",
    run.objective || "UNKNOWN",
    "",
    "## Source Evidence",
    run.sourceEvidence || "UNKNOWN",
    "",
    "## Allowed Actions",
    run.allowedActions || "UNKNOWN",
    "",
    "## Forbidden Actions",
    run.forbiddenActions || "Do not deploy, mutate providers, move money, send external messages, read secrets, push GitHub, append official ledger, promote memory, or claim live state.",
    "",
    "## Evidence Requirement",
    run.evidenceRequirement || "UNKNOWN",
    "",
    "## Proof Condition",
    run.proofCondition || "UNKNOWN",
    "",
    "## Stop Condition",
    run.stopCondition || "UNKNOWN",
    "",
    "## Validation Plan",
    run.validationPlan || "UNKNOWN",
    "",
    "## Unknowns Preserved",
    run.unknownsPreserved || "UNKNOWN",
    "",
    "## Authority Basis",
    run.authorityBasis || "UNKNOWN",
    "",
    "## Readiness Checks",
    ...readiness.checks.map((check) => `- ${check.ok ? "PASS" : "FIX"} | ${check.label}: ${check.detail}`),
    "",
    "## Closeout Format",
    run.closeoutFormat || "what_changed; evidence_paths; validation_run; unknowns_preserved; authority_conflicts; files_changed; memory_recommendation; next_action",
  ].join("\n");
}

function runFromTicket(ticket = selectedTicket(), target = state.dispatchTarget) {
  const run = blankAgentRun(ticket, target);
  run.packet = buildRunPacket(run);
  return run;
}

function researchReadiness(brief) {
  const checks = [
    { label: "Source evidence", ok: hasReviewText(brief.sourceEvidence), detail: "NotebookLM/GitHub/D-local evidence must be named" },
    { label: "Research summary", ok: hasReviewText(brief.researchSummary), detail: "Finding summary required before execution" },
    { label: "15-30 minute slice", ok: /^(15|20|25|30)$/i.test(String(brief.timeboxMinutes || "")), detail: "Timebox must be 15, 20, 25, or 30 minutes" },
    { label: "High-leverage claim", ok: hasReviewText(brief.leverageClaim), detail: "State why this slice matters without overclaiming" },
    { label: "Expected artifact", ok: hasReviewText(brief.expectedArtifact), detail: "Execution must produce a concrete artifact" },
    { label: "Stop condition", ok: /deploy|provider|payment|secret|external|ledger|memory/i.test(brief.stopCondition || ""), detail: "Forbidden boundaries must be explicit" },
    { label: "UNKNOWN preservation", ok: /UNKNOWN/i.test(brief.unknownsPreserved || ""), detail: "Research cannot become live/provider truth by itself" },
  ];
  return { checks, passed: checks.filter((check) => check.ok).length, total: checks.length };
}

function buildResearchPacket(brief) {
  const readiness = researchReadiness(brief);
  return [
    "# MDS Command Centre Research-To-Execution Packet",
    "",
    "packet_status: LOCAL_RESEARCH_TO_RUN_ONLY",
    `brief_id: ${brief.id || "UNKNOWN"}`,
    `source_type: ${brief.sourceType || "UNKNOWN"}`,
    `source_title: ${brief.sourceTitle || "UNKNOWN"}`,
    `source_url: ${brief.sourceUrl || "UNKNOWN"}`,
    `repo_or_notebook: ${brief.repoOrNotebook || "UNKNOWN"}`,
    `target_agent: ${brief.targetAgent || "Codex"}`,
    `owner: ${brief.owner || "Atlas / Research Studio"}`,
    `lane: ${brief.lane || "Research Studio"}`,
    `status: ${brief.status || "DRAFT"}`,
    `timebox_minutes: ${brief.timeboxMinutes || "30"}`,
    `readiness_score: ${readiness.passed}/${readiness.total}`,
    "",
    "## Research Summary",
    brief.researchSummary || "UNKNOWN",
    "",
    "## Proposed 15-30 Minute Slice",
    brief.proposedSlice || "UNKNOWN",
    "",
    "## Leverage Claim",
    brief.leverageClaim || "UNKNOWN",
    "",
    "## Source Evidence",
    brief.sourceEvidence || "UNKNOWN",
    "",
    "## Expected Artifact",
    brief.expectedArtifact || "UNKNOWN",
    "",
    "## Evidence Requirement",
    brief.evidenceRequirement || "UNKNOWN",
    "",
    "## Proof Condition",
    brief.proofCondition || "UNKNOWN",
    "",
    "## Validation Plan",
    brief.validationPlan || "UNKNOWN",
    "",
    "## Stop Condition",
    brief.stopCondition || "UNKNOWN",
    "",
    "## IP / Publication Classification",
    brief.ipClassification || "private_ip",
    "",
    "## Unknowns Preserved",
    brief.unknownsPreserved || "UNKNOWN",
    "",
    "## Readiness Checks",
    ...readiness.checks.map((check) => `- ${check.ok ? "PASS" : "FIX"} | ${check.label}: ${check.detail}`),
    "",
    "## Forbidden Actions",
    "- Do not treat NotebookLM or GitHub repository research as live provider truth.",
    "- Do not deploy, mutate providers, move money, send external messages, read secrets, push GitHub, append the official ledger, or promote memory from this packet alone.",
  ].join("\n");
}

function runFromResearch(brief = selectedResearch()) {
  const now = nowIso();
  const run = {
    ...blankAgentRun(selectedTicket(), brief.targetAgent || "Codex"),
    id: `RUN-RES-${Date.now().toString(36).toUpperCase()}`,
    ticketId: brief.id || "RESEARCH",
    title: brief.proposedSlice || brief.sourceTitle || "Research-to-execution run",
    targetAgent: brief.targetAgent || "Codex",
    owner: brief.owner || "Atlas / Research Studio",
    lane: brief.lane || "Research Studio",
    priority: "P0",
    approvalClass: "LOCAL_ONLY",
    objective: brief.proposedSlice || "Convert research into one local execution slice.",
    sourceEvidence: brief.sourceEvidence || "UNKNOWN",
    evidenceRequirement: brief.evidenceRequirement || "Preserve source evidence and validation proof.",
    proofCondition: brief.proofCondition || "Research-derived local run packet exists and is validated.",
    stopCondition: brief.stopCondition || "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    validationPlan: brief.validationPlan || "Run scoped local checks and browser proof when UI changes are made.",
    unknownsPreserved: brief.unknownsPreserved || "Research is evidence input only; live/provider states remain UNKNOWN.",
    authorityBasis: "Research brief is D-local evidence input. NotebookLM/GitHub research does not override D doctrine, GitHub committed-code authority, provider live-state authority, official ledger, or company memory promotion gates.",
    createdAt: now,
    updatedAt: now,
  };
  run.packet = buildRunPacket(run);
  return run;
}

function pendingDirectorBundles() {
  return state.decisions
    .filter((decision) => decision.disposition === "READY_FOR_DIRECTOR_REVIEW")
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))
    .slice(0, 6);
}

function directorBundleNextAction(decision) {
  if (/memory/i.test(decision.memoryAction || decision.decisionType || "")) {
    return "Review evidence, validate the memory action, then promote through the director-led memory workflow outside this app.";
  }
  if (/ledger/i.test(decision.memoryAction || decision.decisionType || "")) {
    return "Review the packet, then decide whether to append the official ledger row manually or request more evidence.";
  }
  return "Review the local packet, keep UNKNOWNs intact, and either approve a manual closeout action or send it back for evidence.";
}

function decisionDispositionCounts() {
  return state.decisions.reduce(
    (counts, decision) => {
      const disposition = decision.disposition || "DRAFT";
      counts.total += 1;
      counts[disposition] = (counts[disposition] || 0) + 1;
      return counts;
    },
    { total: 0 },
  );
}

function hasReviewText(value) {
  const text = String(value || "").trim();
  return Boolean(text) && !/^UNKNOWN$/i.test(text);
}

function decisionReadiness(decision) {
  const sourceIds = normalizeEventIds(decision.sourceEventIds, decision.sourceEventId);
  const checks = [
    {
      label: "Source events",
      ok: sourceIds.length > 0,
      detail: `${sourceIds.length} linked local event${sourceIds.length === 1 ? "" : "s"}`,
    },
    {
      label: "Evidence paths",
      ok: hasReviewText(decision.evidencePaths),
      detail: hasReviewText(decision.evidencePaths) ? "Evidence paths saved" : "Missing evidence paths",
    },
    {
      label: "Validation",
      ok: hasReviewText(decision.validationRun),
      detail: hasReviewText(decision.validationRun) ? "Validation text saved" : "Validation remains missing",
    },
    {
      label: "UNKNOWN preservation",
      ok: /UNKNOWN|blocked|forbidden/i.test(decision.unknownsPreserved || ""),
      detail: /UNKNOWN/i.test(decision.unknownsPreserved || "") ? "UNKNOWN boundary explicit" : "Boundary needs explicit UNKNOWN text",
    },
    {
      label: "Authority basis",
      ok: /D-local|provider|GitHub|authority/i.test(decision.authorityBasis || ""),
      detail: /provider|GitHub/i.test(decision.authorityBasis || "") ? "Authority separation named" : "Authority separation needs review",
    },
    {
      label: "Manual gate",
      ok: /manual|official ledger|memory promotion|Forbidden Actions/i.test(`${decision.notes || ""} ${decision.packet || ""}`),
      detail: "App must not append official ledger or promote memory",
    },
  ];
  return {
    checks,
    passed: checks.filter((check) => check.ok).length,
    total: checks.length,
    sourceIds,
  };
}

function selectedBoard() {
  return state.snapshot.sources.find((source) => source.id === state.selectedBoardId) || state.snapshot.sources[0];
}

function queueItemById(id) {
  return (state.snapshot.workQueue || []).find((item) => item.id === id);
}

function ticketFromQueueItem(item) {
  const now = nowIso();
  const titlePart = String(item.id || "queue").replace(/^queue-/, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return {
    id: `MCC-${titlePart}`.slice(0, 80),
    title: item.title || "Source-derived work item",
    lane: item.lane || "Command Centre",
    owner: item.owner || "Codex Board",
    status: item.status?.includes("PARKED") ? "PARKED" : item.status?.includes("BLOCK") ? "BLOCKED" : "ACTIVE",
    priority: item.priority || "P1",
    sourceEvidence: item.sourceEvidence || "command-centre/war-room/",
    proofCondition: item.proofCondition || "Local proof exists and UNKNOWN states remain preserved.",
    stopCondition: item.stopCondition || "Stop before deploy, provider mutation, external message, payment action, or secret read.",
    nextAction: item.nextAction || item.objective || "Verify source evidence and route one next action.",
    closeoutRaw: "",
    closeoutSummary: "",
    evidencePaths: "",
    validationRun: "",
    unknownsPreserved: "",
    authorityConflicts: "",
    memoryRecommendation: "ledger_only",
    reviewerStatus: "NOT REVIEWED",
    reviewNotes: "",
    reviewedBy: "",
    reviewedAt: "",
    promotionStatus: "NOT STAGED",
    promotionNotes: "",
    stagedBy: "",
    stagedAt: "",
    closedBy: "",
    closeoutAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

function ticketFromControlWorkOrder(item) {
  return {
    ...ticketFromQueueItem(item),
    title: `CEO work order: ${item.title || "Source-derived work item"}`,
    sourceEvidence: item.sourceEvidence || "Products/MDS-Command-Centre/src/data/warRoomSnapshot.json#controlSurface.workOrders",
    proofCondition:
      item.proofCondition ||
      "CEO-created local work order names owner, evidence requirement, proof condition, stop condition, and next action.",
    stopCondition:
      item.stopCondition ||
      "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    nextAction: item.nextAction || "Assign the local work order to its owner and require evidence-bound closeout.",
  };
}

function searchText(value) {
  return String(value ?? "").toLowerCase();
}

function searchKey(item) {
  return `${item.type}:${item.id}`;
}

function commandSearchItems() {
  const sources = (state.snapshot?.sources || []).map((source) => ({
    id: source.id,
    type: "board",
    title: source.title || source.id,
    summary: source.summary || markdownPreview(source.content || "").join(" "),
    lane: "Command Centre",
    owner: "Codex Board",
    status: source.exists ? "LOADED" : "MISSING",
    priority: "P2",
    sourceEvidence: source.relativePath || "command-centre/war-room/",
    proofCondition: "Inspect loaded D-local War Room source before routing a ticket.",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, secret read, or live-state claim.",
    nextAction: `Open ${source.relativePath || source.title} and create a scoped local ticket only if a concrete action is present.`,
  }));
  const queue = (state.snapshot?.workQueue || []).map((item) => ({
    id: item.id,
    type: "work",
    title: item.title || item.objective || item.id,
    summary: item.objective || item.evidenceRequirement || "",
    lane: item.lane || "Command Centre",
    owner: item.owner || "Codex Board",
    status: item.status || "READY FOR LOCAL ROUTING",
    priority: item.priority || "P1",
    sourceEvidence: item.sourceEvidence || "command-centre/war-room/",
    proofCondition: item.proofCondition || "Local proof exists and UNKNOWN states remain preserved.",
    stopCondition: item.stopCondition || "Stop before deploy, provider mutation, external message, payment action, secret read, or live-state claim.",
    nextAction: item.nextAction || item.objective || "Verify source evidence and route one next action.",
  }));
  const products = (state.snapshot?.productReadiness || []).map((row) => ({
    id: row.product || row.source_path || "product",
    type: "product",
    title: row.product || "Product readiness row",
    summary: row.biggest_blocker || row.readiness || "",
    lane: "Product Ops Studio",
    owner: "Orion",
    status: row.readiness || "UNKNOWN",
    priority: String(row.readiness || "").includes("BLOCK") ? "P0" : "P1",
    sourceEvidence: row.source_path || "command-centre/war-room/product-readiness-board.csv",
    proofCondition: `Readiness: ${row.readiness || "UNKNOWN"}. Revenue: ${row.revenue_status || "UNKNOWN"}.`,
    stopCondition: "Stop before provider mutation, payment action, deploy, migration, public claim, external message, or secret read.",
    nextAction: row.one_next_action || "Name evidence and preserve UNKNOWN state.",
  }));
  const tickets = state.tickets.map((ticket) => ({
    id: ticket.id,
    type: "ticket",
    title: ticket.title || ticket.id,
    summary: ticket.nextAction || ticket.proofCondition || "",
    lane: ticket.lane || "Command Centre",
    owner: ticket.owner || "Codex Board",
    status: ticket.status || "ACTIVE",
    priority: ticket.priority || "P1",
    sourceEvidence: ticket.sourceEvidence || ticket.evidencePaths || "Products/MDS-Command-Centre/src/data/localTickets.json",
    proofCondition: ticket.proofCondition || "",
    stopCondition: ticket.stopCondition || "",
    nextAction: ticket.nextAction || "",
  }));
  const activity = state.activity.map((event) => ({
    id: event.id,
    type: "activity",
    title: `${event.action || "activity"} - ${event.title || event.ticketId || event.id}`,
    summary: event.details || event.packet || "",
    lane: event.lane || "Command Centre",
    owner: event.owner || "Codex Board",
    status: event.reviewStatus || event.promotionStatus || event.status || "LOCAL EVENT",
    priority: "P2",
    sourceEvidence: event.evidencePaths || "Products/MDS-Command-Centre/src/data/localActivityLog.json",
    proofCondition: event.validationRun || "Local activity event exists for review.",
    stopCondition: "This is local evidence only; do not treat it as official ledger, memory, GitHub, or provider truth.",
    nextAction: event.details || "Review event and create a director decision only if evidence is sufficient.",
  }));
  const decisions = state.decisions.map((decision) => ({
    id: decision.id,
    type: "decision",
    title: decision.title || decision.id,
    summary: decision.bundleSummary || decision.notes || decision.packet || "",
    lane: decision.decisionType || "Director Decision",
    owner: decision.director || "Codex Strategic Board",
    status: decision.disposition || "DRAFT",
    priority: decision.disposition === "READY_FOR_DIRECTOR_REVIEW" ? "P1" : "P2",
    sourceEvidence: decision.evidencePaths || "Products/MDS-Command-Centre/src/data/localDecisionExports.json",
    proofCondition: decision.validationRun || "Local decision packet exists for director review.",
    stopCondition: "This local decision does not append the official ledger, promote memory, mutate providers, push GitHub, or prove live state.",
    nextAction: decision.memoryAction || "Manual director/CEO/Board review required before promotion.",
  }));
  return [...queue, ...tickets, ...decisions, ...activity, ...products, ...sources].map((item) => ({
    ...item,
    key: searchKey(item),
    haystack: [
      item.type,
      item.id,
      item.title,
      item.summary,
      item.lane,
      item.owner,
      item.status,
      item.priority,
      item.sourceEvidence,
      item.proofCondition,
      item.stopCondition,
      item.nextAction,
    ]
      .map(searchText)
      .join(" "),
  }));
}

function commandSearchLanes(items = commandSearchItems()) {
  return [...new Set(items.map((item) => item.lane || "UNKNOWN"))].sort((a, b) => a.localeCompare(b));
}

function filteredCommandSearchItems() {
  const terms = searchText(state.searchQuery)
    .split(/\s+/)
    .filter(Boolean);
  return commandSearchItems().filter((item) => {
    const typeMatch = state.searchType === "all" || item.type === state.searchType;
    const laneMatch = state.searchLane === "all" || item.lane === state.searchLane;
    const termMatch = !terms.length || terms.every((term) => item.haystack.includes(term));
    return typeMatch && laneMatch && termMatch;
  });
}

function findSearchItem(key) {
  return commandSearchItems().find((item) => item.key === key);
}

function ticketFromSearchItem(item) {
  const now = nowIso();
  const slug = `${item.type}-${item.id || item.title || "search"}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return {
    ...blankTicket(),
    id: `MCC-${slug || Date.now().toString(36).toUpperCase()}`.slice(0, 80),
    title: item.title || "Search-derived local ticket",
    lane: item.lane || "Command Centre",
    owner: item.owner || "Codex Board",
    status: String(item.status || "").includes("PARKED") ? "PARKED" : String(item.status || "").includes("BLOCK") ? "BLOCKED" : "ACTIVE",
    priority: item.priority || "P1",
    sourceEvidence: item.sourceEvidence || "Products/MDS-Command-Centre/src/data/warRoomSnapshot.json",
    proofCondition: item.proofCondition || "Local source evidence reviewed and UNKNOWN states preserved.",
    stopCondition: item.stopCondition || "Stop before deploy, provider mutation, external message, payment action, secret read, or live-state claim.",
    nextAction: item.nextAction || item.summary || "Verify source evidence and route one next action.",
    createdAt: now,
    updatedAt: now,
  };
}

function routeSearchItem(item) {
  if (!item) return;
  if (item.type === "board") {
    state.selectedBoardId = item.id;
    state.view = "boards";
    return;
  }
  if (item.type === "work") {
    state.view = "queue";
    return;
  }
  if (item.type === "ticket") {
    state.selectedTicketId = item.id;
    state.view = "tickets";
    return;
  }
  if (item.type === "activity") {
    state.selectedActivityId = item.id;
    state.view = "activity";
    return;
  }
  if (item.type === "decision") {
    state.selectedDecisionId = item.id;
    state.view = "decisions";
    return;
  }
  state.view = "boards";
  state.selectedBoardId = "product-readiness";
}

function routingRollups(items = commandSearchItems()) {
  const map = new Map();
  items.forEach((item) => {
    const lane = item.lane || "UNKNOWN";
    const current = map.get(lane) || {
      lane,
      count: 0,
      blocked: 0,
      unknown: 0,
      ready: 0,
      owners: new Set(),
      priorities: new Set(),
      nextActions: [],
    };
    const status = `${item.status} ${item.summary} ${item.proofCondition}`.toUpperCase();
    current.count += 1;
    if (status.includes("BLOCK") || status.includes("NO_GO") || status.includes("FORBIDDEN")) current.blocked += 1;
    if (status.includes("UNKNOWN")) current.unknown += 1;
    if (status.includes("READY") || status.includes("PASS") || status.includes("ACTIVE")) current.ready += 1;
    current.owners.add(item.owner || "UNKNOWN");
    current.priorities.add(item.priority || "P2");
    if (item.nextAction) current.nextActions.push(item.nextAction);
    map.set(lane, current);
  });
  return [...map.values()]
    .map((item) => ({
      ...item,
      owners: [...item.owners].sort(),
      priorities: [...item.priorities].sort(),
      nextAction: item.nextActions[0] || "UNKNOWN",
    }))
    .sort((a, b) => b.blocked - a.blocked || b.unknown - a.unknown || b.count - a.count || a.lane.localeCompare(b.lane));
}

function operatorAuthorityCards() {
  const authority = state.snapshot?.authority || {};
  return [
    {
      label: "D local operating root",
      value: "ACTIVE",
      detail: authority.dRoot || "D:/Million Dollar AI Studio is the active operating root for local MDS doctrine and work-in-progress evidence.",
    },
    {
      label: "GitHub committed code",
      value: "AUTHORITY",
      detail: authority.github || "Committed/versioned code, branches, tags, releases, and deployment source commits.",
    },
    {
      label: "Provider dashboards",
      value: "LIVE TRUTH",
      detail: authority.providers || "Runtime, deployment, database, schema, billing, payment, auth, environment, and provider-owned state.",
    },
    {
      label: "E backup root",
      value: "BACKUP",
      detail: authority.eRoot || "Backup/recovery only; not active source.",
    },
    {
      label: "Unknown rule",
      value: "FAIL-CLOSED",
      detail: authority.unknownRule || "UNKNOWN stays UNKNOWN unless the owning authority proves the state.",
    },
  ];
}

function operatorProductRows() {
  return (state.snapshot?.productReadiness || []).slice(0, 8).map((row) => ({
    product: row.product || row.Product || "UNKNOWN",
    readiness: row.readiness || row.Readiness || "UNKNOWN",
    live: row.live_status || row.live || "UNKNOWN",
    revenue: row.revenue_status || row.revenue || "UNKNOWN",
    blocker: row.biggest_blocker || row.blocker || "UNKNOWN",
    nextAction: row.one_next_action || row.next_action || "UNKNOWN",
    sourcePath: row.source_path || row.sourcePath || "UNKNOWN",
  }));
}

function operatorAgentRoutes() {
  const framework = state.snapshot?.framework || {};
  const profiles = framework.agentProfiles?.profiles || [];
  return targets.map((target) => {
    const profile = profiles.find((item) => searchText(`${item.name} ${item.id}`).includes(searchText(target.split("/")[0])));
    const lower = target.toLowerCase();
    const allowed =
      lower.includes("notebook")
        ? "Research retrieval and synthesis with source preservation; no authority over live/provider truth."
        : lower.includes("glm") || lower.includes("ollama")
          ? "Validated, lower-risk, repeatable local work after Codex/Claude-class validation."
          : lower.includes("human")
            ? "Founder/director/CEO review, approvals, provider dashboards, payment gates, and external actions."
            : "Ambiguous, mission-critical, strategy, code, and proof-gated execution within MDS authority boundaries.";
    return {
      target,
      profile: profile?.name || "MDS dispatch target",
      allowed,
      evidence: "Objective, source evidence, proof condition, stop condition, forbidden actions, and closeout required.",
      stop: "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, or memory promotion unless separately authorized.",
    };
  });
}

function operatorGateSummary() {
  const rows = operatorProductRows();
  const sourceHealth = state.snapshot?.sourceHealth || state.snapshot?.sources || [];
  return {
    products: rows.length,
    unknownProducts: rows.filter((row) => /UNKNOWN/i.test(`${row.readiness} ${row.live} ${row.revenue} ${row.blocker}`)).length,
    blockedProducts: rows.filter((row) => /BLOCK|NO_GO|FORBIDDEN|PARKED/i.test(`${row.readiness} ${row.blocker}`)).length,
    sources: sourceHealth.length,
    missingSources: sourceHealth.filter((source) => source.exists === false).length,
    tickets: state.tickets.length,
    decisionsReady: pendingDirectorBundles().length,
  };
}

function buildOperatorSpinePacket() {
  const gates = operatorGateSummary();
  const products = operatorProductRows();
  const authority = operatorAuthorityCards();
  const routes = operatorAgentRoutes();
  return [
    "# MDS Command Centre Operator OS Packet",
    "",
    "packet_status: LOCAL_PACKET_ONLY",
    `created_at: ${nowIso()}`,
    `active_objective: ${state.snapshot?.today?.activeObjective || "UNKNOWN"}`,
    `next_safe_action: ${state.snapshot?.today?.nextSafeAction || "UNKNOWN"}`,
    `source_root: ${state.snapshot?.sourceRoot || "D:/Million Dollar AI Studio/command-centre/war-room/"}`,
    "",
    "## Local Gate Summary",
    `products_tracked: ${gates.products}`,
    `products_with_unknowns: ${gates.unknownProducts}`,
    `products_blocked_or_parked: ${gates.blockedProducts}`,
    `loaded_sources: ${gates.sources}`,
    `missing_sources: ${gates.missingSources}`,
    `local_tickets: ${gates.tickets}`,
    `director_packets_ready: ${gates.decisionsReady}`,
    "",
    "## Authority Ladder",
    ...authority.map((item) => `- ${item.label}: ${item.value} - ${item.detail}`),
    "",
    "## Product State Rows",
    ...products.map((row) => `- ${row.product}: readiness=${row.readiness}; live=${row.live}; revenue=${row.revenue}; next=${row.nextAction}`),
    "",
    "## Agent Dispatch Routes",
    ...routes.map((route) => `- ${route.target}: ${route.allowed} Evidence: ${route.evidence}`),
    "",
    "## Required Closeout",
    "- what_changed: UNKNOWN",
    "- evidence_paths: UNKNOWN",
    "- validation_run: UNKNOWN",
    "- unknowns_preserved: provider/payment/revenue/deploy/auth/schema remain UNKNOWN unless owning authority proves them",
    "- authority_conflicts: UNKNOWN",
    "- memory_recommendation: ledger_only until director/CEO/Board review",
    "",
    "## Forbidden Actions",
    "- Do not deploy.",
    "- Do not mutate providers, databases, auth, analytics, billing, payment, deployment state, or production systems.",
    "- Do not email, message clients, post externally, or send forms.",
    "- Do not read secrets or env contents.",
    "- Do not claim live provider state from this local packet.",
  ].join("\n");
}

function ticketFromOperatorSpine() {
  const now = nowIso();
  return {
    ...blankTicket(),
    id: `MCC-OPERATOR-OS-${Date.now().toString(36).toUpperCase()}`,
    title: "Operator OS next safe action",
    lane: "Command Centre",
    owner: "Codex Strategic Board",
    status: "ACTIVE",
    priority: "P0",
    sourceEvidence: "Products/MDS-Command-Centre/src/data/warRoomSnapshot.json; command-centre/war-room/",
    proofCondition: "Operator OS packet links active objective, authority ladder, product states, agent routes, and forbidden actions from current D-local sources.",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    nextAction: state.snapshot?.today?.nextSafeAction || "Review current D-local command packet and route one evidence-bound next action.",
    evidencePaths: "Products/MDS-Command-Centre/src/static-app.js; Products/MDS-Command-Centre/src/data/warRoomSnapshot.json",
    validationRun: "Generated from D-local Operator OS view; no provider, GitHub, payment, external, secret, official ledger, or memory action.",
    unknownsPreserved: "Provider/payment/deployment/auth/schema/revenue/live-state remain UNKNOWN unless owning authority proves them.",
    authorityConflicts: "None: local ticket staging only.",
    createdAt: now,
    updatedAt: now,
  };
}

function visibleSearchItems() {
  return filteredCommandSearchItems().slice(0, 80);
}

function selectedSearchKeySet() {
  return new Set(state.searchSelectedKeys || []);
}

function selectedSearchItems() {
  const selected = selectedSearchKeySet();
  return commandSearchItems().filter((item) => selected.has(item.key));
}

function recentBulkDispatchEvents() {
  return state.activity.filter((event) => event.action === "bulk_dispatch_staged").slice(0, 5);
}

function bulkDispatchActivityTicket(items) {
  const now = nowIso();
  const selected = items.length ? items : [];
  const lanes = [...new Set(selected.map((item) => item.lane || "UNKNOWN"))].join(", ") || "Command Centre";
  const owners = [...new Set(selected.map((item) => item.owner || "UNKNOWN"))].join(", ") || "UNKNOWN";
  const priority = selected.some((item) => String(item.priority || "").toUpperCase() === "P0")
    ? "P0"
    : selected.some((item) => String(item.priority || "").toUpperCase() === "P1")
      ? "P1"
      : "P2";
  return {
    ...blankTicket(),
    id: `MCC-BULK-DISPATCH-${Date.now().toString(36).toUpperCase()}`,
    title: `Bulk dispatch packet - ${selected.length} selected item${selected.length === 1 ? "" : "s"}`,
    lane: lanes,
    owner: `Dispatch target: ${state.bulkDispatchTarget}; source owners: ${owners}`,
    status: "STAGED LOCAL",
    priority,
    sourceEvidence: selected.map((item) => item.sourceEvidence || item.key).filter(Boolean).slice(0, 10).join("; ") || "D-local Command Centre Search selection",
    proofCondition: "Local Activity event records the generated dispatch packet; official execution still requires owner action and evidence-bound closeout.",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, secret read, official ledger append, memory promotion, or live-state claim.",
    nextAction: "Assign the staged packet to the named owner or agent and require evidence-bound closeout before any official ledger or memory decision.",
    evidencePaths: selected.map((item) => item.sourceEvidence || item.key).filter(Boolean).slice(0, 12).join("; "),
    validationRun: "Generated from current D-local Search index; no provider, GitHub, payment, external, secret, official ledger, or memory action.",
    unknownsPreserved: "Provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN unless owning authority proves them.",
    authorityConflicts: "None: local Activity staging only.",
    createdAt: now,
    updatedAt: now,
  };
}

function saveCurrentSearchView() {
  const now = nowIso();
  const terms = state.searchQuery.trim() || "all";
  const id = `SV-${Date.now().toString(36).toUpperCase()}`;
  const view = {
    id,
    title: `${terms} / ${state.searchType} / ${state.searchLane}`,
    query: state.searchQuery,
    type: state.searchType,
    lane: state.searchLane,
    selectedKeys: state.searchSelectedKeys.slice(0, 40),
    createdAt: now,
  };
  state.searchViews = [view, ...state.searchViews.filter((item) => item.id !== id)].slice(0, 20);
  saveSearchViews();
}

function applySearchView(id) {
  const view = state.searchViews.find((item) => item.id === id);
  if (!view) return;
  state.searchQuery = view.query || "";
  state.searchType = view.type || "all";
  state.searchLane = view.lane || "all";
  state.searchSelectedKeys = Array.isArray(view.selectedKeys) ? view.selectedKeys : [];
}

function dispatchFilePart(value) {
  return String(value || "bulk-dispatch")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function buildBulkDispatchPacket(items, target = state.bulkDispatchTarget) {
  const selected = items.length ? items : [];
  const lanes = [...new Set(selected.map((item) => item.lane || "UNKNOWN"))].join(", ") || "NONE";
  const owners = [...new Set(selected.map((item) => item.owner || "UNKNOWN"))].join(", ") || "NONE";
  const itemLines = selected
    .map(
      (item, index) => `${index + 1}. ${item.key} - ${item.title}
   lane: ${item.lane || "UNKNOWN"}
   owner: ${item.owner || "UNKNOWN"}
   status: ${item.status || "UNKNOWN"}
   priority: ${item.priority || "P2"}
   source evidence: ${item.sourceEvidence || "UNKNOWN"}
   proof condition: ${item.proofCondition || "UNKNOWN"}
   stop condition: ${item.stopCondition || "UNKNOWN"}
   next action: ${item.nextAction || "UNKNOWN"}`,
    )
    .join("\n\n");
  return `# MDS Command Centre Bulk Dispatch

target_agent: ${target}
created_at: ${nowIso()}
selected_item_count: ${selected.length}
lanes: ${lanes}
owners: ${owners}
source_surface: Products/MDS-Command-Centre Search

## Objective
Review the selected D-local Command Centre items, choose one safe next action, and produce evidence-bound closeout. Do not widen scope beyond the selected items without Shrish approval or a new work order.

## Authority Boundaries
- D:/Million Dollar AI Studio/ is active operating PROD for local doctrine, state, Command Centre, and work-in-progress evidence.
- GitHub is authority for committed/versioned code and committed/versioned memory.
- Provider dashboards are authority for live runtime, payment, auth, billing, deployment, database, schema, and environment state.
- E:/Million Dollar AI Studio/ is backup/recovery only.
- UNKNOWN stays UNKNOWN unless the owning authority is verified.

## Selected Items
${itemLines || "No items selected. Stop and select concrete evidence before dispatch."}

## Allowed Actions
- Read the listed D-local source evidence.
- Create or update local tickets, closeout fields, review packets, or director-ready staging packets.
- Run local lint, typecheck, tests, build, source verifier, or browser proof when scoped and non-mutating.
- Preserve evidence paths, validation commands, unknowns, authority conflicts, and one next action.

## Forbidden Actions
- No deploy, provider dashboard mutation, database/auth/schema/environment change, payment, checkout, refund, invoice, pricing change, external message, public post, file deletion, secret read, token read, credential read, or live-state claim.
- Do not treat this packet as official ledger append, company-memory promotion, GitHub truth, or provider live-state proof.

## Evidence Requirement
Return changed files, exact local commands/checks, screenshot or browser proof when UI changed, evidence paths, unknowns preserved, and authority conflicts.

## Stop Condition
Stop before any forbidden action, missing source evidence, live/provider claim without provider proof, cross-file destructive operation, or scope expansion.

## Closeout Format
task:
agent:
files_changed:
evidence:
validation:
unknowns_preserved:
authority_conflicts:
memory_action:
agent_task_log_recommendation:
next_action:
`;
}

function extractCloseoutLine(text, labels) {
  const lines = String(text || "").split(/\r?\n/);
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const match = lines.find((line) => {
    const normalized = line.trim().toLowerCase();
    return normalizedLabels.some((label) => normalized.startsWith(`${label}:`) || normalized.startsWith(`- ${label}:`));
  });
  return match ? match.replace(/^-?\s*[^:]+:\s*/, "").trim() : "";
}

function parseCloseout(raw) {
  const text = String(raw || "");
  const firstUsefulLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^[-#]+\s*/, ""))
      .find((line) => line && !line.includes(":")) || "";
  return {
    closeoutSummary: extractCloseoutLine(text, ["summary", "task_summary", "what changed", "what_changed"]) || firstUsefulLine.slice(0, 600),
    evidencePaths: extractCloseoutLine(text, ["evidence", "evidence paths", "evidence_paths"]),
    validationRun: extractCloseoutLine(text, ["validation", "validation run", "validation_run", "tests"]),
    unknownsPreserved: extractCloseoutLine(text, ["unknowns", "unknowns preserved", "unknowns_preserved"]),
    authorityConflicts: extractCloseoutLine(text, ["authority conflicts", "authority_conflicts"]),
    memoryRecommendation: extractCloseoutLine(text, ["memory", "memory recommendation", "memory_recommendation", "memory_promotion_recommendation"]) || "ledger_only",
  };
}

function applyCloseoutDraftEventToForm(event) {
  const draft = String(event?.packet || "");
  const parsed = parseCloseout(draft);
  const fields = {
    closeoutRaw: draft,
    closeoutSummary: parsed.closeoutSummary,
    evidencePaths: parsed.evidencePaths,
    validationRun: parsed.validationRun,
    unknownsPreserved: parsed.unknownsPreserved,
    authorityConflicts: parsed.authorityConflicts,
    memoryRecommendation: parsed.memoryRecommendation,
  };
  for (const [name, value] of Object.entries(fields)) {
    const inputElement = document.querySelector(`[name="${name}"]`);
    if (inputElement) inputElement.value = value;
  }
  return parsed;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildLedgerPreview(ticket) {
  const row = {
    log_id: `atl-${new Date().toISOString().slice(0, 10)}-${ticket.id.toLowerCase()}-closeout`,
    ticket_id: ticket.id || "UNKNOWN",
    timestamp: nowIso(),
    run_id: `run-${ticket.id.toLowerCase()}-local-closeout`,
    work_order_path: ticket.sourceEvidence || "Products/MDS-Command-Centre/src/data/localTickets.json",
    department_id: ticket.lane || "command-centre-ops",
    director: ticket.owner || "Codex Board",
    agent: ticket.closedBy || "UNKNOWN",
    tool: "MDS Command Centre local closeout",
    task_summary: ticket.closeoutSummary || ticket.title || "UNKNOWN",
    actions_taken: ticket.closeoutRaw || "Closeout text not pasted.",
    worked: ticket.proofCondition || "UNKNOWN",
    failed: ticket.authorityConflicts || "UNKNOWN",
    diagnosis: "Local ticket closeout captured for reviewer acceptance; not promoted to company memory by the app.",
    skills_or_patterns_learned: ticket.memoryRecommendation || "ledger_only",
    evidence_paths: ticket.evidencePaths || ticket.sourceEvidence || "UNKNOWN",
    files_changed: ticket.evidencePaths || "UNKNOWN",
    validation: ticket.validationRun || "UNKNOWN",
    unknowns_preserved: ticket.unknownsPreserved || "UNKNOWN",
    authority_conflicts: ticket.authorityConflicts || "UNKNOWN",
    memory_promotion_recommendation: ticket.memoryRecommendation || "ledger_only",
    director_review_status: ticket.reviewerStatus || "NOT REVIEWED",
    director_reviewed_by: ticket.reviewedBy || ticket.closedBy || "",
    memory_action: "ticket_closeout_only",
    notes: `Next action: ${ticket.nextAction || "UNKNOWN"}`,
  };
  const headers = Object.keys(row);
  return [headers.map(csvCell).join(","), headers.map((header) => csvCell(row[header])).join(",")].join("\n");
}

function sourceEvidenceMatch(ticket) {
  const sources = state.snapshot?.sourceHealth || state.snapshot?.sources || [];
  const evidence = [ticket.sourceEvidence, ticket.evidencePaths].join(" ");
  const matched = sources.filter((source) => evidence.includes(source.relativePath) || evidence.includes(source.relativePath?.replace("command-centre/war-room/", "")));
  return {
    matched,
    loaded: matched.length > 0 && matched.every((source) => source.exists !== false && source.status !== "MISSING_FAIL_CLOSED"),
  };
}

function reviewChecklist(ticket) {
  const validation = validateTicket(ticket);
  const sourceMatch = sourceEvidenceMatch(ticket);
  const noConflict = !ticket.authorityConflicts || /^(none|no conflict|no conflicts|n\/a)$/i.test(ticket.authorityConflicts.trim());
  const items = [
    {
      label: "Dispatch packet",
      ok: validation.missing.length === 0,
      detail: validation.missing.length ? `Missing ${validation.missing.join(", ")}` : "Required ticket fields present.",
    },
    {
      label: "Closeout captured",
      ok: Boolean(ticket.closeoutSummary && ticket.closeoutRaw),
      detail: ticket.closeoutSummary || "No closeout summary saved.",
    },
    {
      label: "Evidence paths",
      ok: Boolean(ticket.evidencePaths),
      detail: ticket.evidencePaths || "No evidence paths saved.",
    },
    {
      label: "Validation proof",
      ok: Boolean(ticket.validationRun),
      detail: ticket.validationRun || "No validation run saved.",
    },
    {
      label: "Unknowns preserved",
      ok: Boolean(ticket.unknownsPreserved),
      detail: ticket.unknownsPreserved || "Unknowns not explicitly recorded.",
    },
    {
      label: "Source health",
      ok: sourceMatch.loaded,
      detail: sourceMatch.matched.length
        ? sourceMatch.matched.map((source) => `${source.title}: ${source.status || "LOADED"}`).join("; ")
        : "No loaded War Room source matched the ticket evidence.",
    },
    {
      label: "Authority conflicts",
      ok: noConflict,
      detail: ticket.authorityConflicts || "No conflicts recorded.",
    },
  ];
  const ready = items.every((item) => item.ok);
  const accepted = ticket.reviewerStatus === "ACCEPTED";
  return {
    items,
    ready,
    accepted,
    status: accepted ? "ACCEPTED LOCAL" : ready ? "READY FOR REVIEW" : "NEEDS EVIDENCE",
  };
}

function isDeltaDerivedTicket(ticket) {
  return /^MCC-DELTA-/i.test(ticket.id || "") || /Source delta review|Delta decision|archive-vs-current|archived MIDAS/i.test(`${ticket.title || ""} ${ticket.reviewNotes || ""} ${ticket.authorityConflicts || ""}`);
}

function linkedRunsForTicket(ticket) {
  return state.runs
    .filter((run) => run.ticketId === ticket.id || (isDeltaDerivedTicket(ticket) && /^RUN-DELTA-/i.test(run.id || "")))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function selectedCloseoutRun(ticket) {
  const runs = linkedRunsForTicket(ticket);
  if (!runs.length) return null;
  return runs.find((run) => run.id === state.closeoutImportRunId) || runs[0];
}

function buildCloseoutDraftFromRun(ticket, run) {
  if (!run) {
    return [
      "summary: NEEDS OPERATOR EVIDENCE - no linked local run packet is available for this ticket.",
      `evidence_paths: ${ticket.evidencePaths || ticket.sourceEvidence || "UNKNOWN"}`,
      "validation_run: NEEDS OPERATOR EVIDENCE - run validation before saving closeout.",
      `unknowns_preserved: ${ticket.unknownsPreserved || "Provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN unless owning authorities prove them."}`,
      "authority_conflicts: NEEDS OPERATOR REVIEW - no linked run packet selected.",
      "memory_recommendation: ledger_only",
      `next_action: ${ticket.nextAction || "Create or link a local run packet before reviewer acceptance."}`,
    ].join("\n");
  }
  return [
    `summary: Draft local closeout scaffold from ${run.id} for ${ticket.id}. Operator must replace any NEEDS OPERATOR EVIDENCE fields with actual proof before review acceptance.`,
    `what_changed: ${run.objective || run.title || ticket.title || "Imported linked local run packet for closeout drafting."}`,
    `evidence_paths: ${run.sourceEvidence || ticket.evidencePaths || ticket.sourceEvidence || "UNKNOWN"}`,
    `validation_run: NEEDS OPERATOR EVIDENCE - ${run.validationPlan || "Run the scoped local validation before saving this closeout."}`,
    `unknowns_preserved: ${run.unknownsPreserved || ticket.unknownsPreserved || "Provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN unless owning authorities prove them."}`,
    `authority_conflicts: NEEDS OPERATOR REVIEW - import aid did not resolve conflicts. Existing ticket authority note: ${ticket.authorityConflicts || run.authorityBasis || "None recorded."}`,
    "memory_recommendation: ledger_only",
    `next_action: ${ticket.nextAction || "Save closeout only after proof fields are replaced with actual evidence, then route to Review."}`,
  ].join("\n");
}

function renderCloseoutImportAid(ticket) {
  const runs = linkedRunsForTicket(ticket);
  const run = selectedCloseoutRun(ticket);
  const draft = buildCloseoutDraftFromRun(ticket, run);
  return `<section class="closeout-import-panel">
    <header>
      <div>
        <span class="eyebrow">local closeout import aid</span>
        <strong>${esc(runs.length)} linked run packet${runs.length === 1 ? "" : "s"}</strong>
      </div>
      <em class="${statusClass(runs.length ? "READY" : "UNKNOWN")}">${esc(runs.length ? "DRAFT ONLY" : "NO RUN")}</em>
    </header>
    <p>This panel can prefill the closeout form from a D-local run packet. It does not save, approve, append the official ledger, promote memory, touch GitHub, touch providers, or turn draft placeholders into proof.</p>
    ${
      runs.length
        ? `<label>Run packet<select id="closeout-run-import">
            ${runs
              .map((item) => `<option value="${esc(item.id)}" ${item.id === run.id ? "selected" : ""}>${esc(item.id)} - ${esc(item.title || "Untitled run")}</option>`)
              .join("")}
          </select></label>`
        : `<div class="empty-state"><strong>No linked run packet.</strong><p>Create a local run from Research, Runs, or Delta staging before using closeout import.</p></div>`
    }
    <div class="dispatch-actions">
      <button type="button" data-action="insert-closeout-draft" ${run ? "" : "disabled"}>${icon("closeout", 16)} Insert draft into form</button>
      <button type="button" data-action="copy-closeout-draft">${icon("copy", 16)} Copy draft</button>
      <button type="button" data-action="download-closeout-draft">${icon("download", 16)} Download draft</button>
      <button type="button" data-action="save-closeout-draft-evidence" ${run ? "" : "disabled"}>${icon("activity", 16)} Save draft event</button>
    </div>
    <pre id="closeout-import-draft">${esc(draft)}</pre>
  </section>`;
}

function renderPendingCloseoutDraftPanel(ticket) {
  const events = closeoutDraftEventsForTicket(ticket);
  if (!events.length) return "";
  const event = pendingCloseoutDraftEvent(ticket);
  const packet = event?.packet || "";
  return `<section class="pending-closeout-draft-panel">
    <header>
      <div>
        <span class="eyebrow">saved activity draft</span>
        <strong>${esc(events.length)} local closeout draft event${events.length === 1 ? "" : "s"}</strong>
      </div>
      <em class="${statusClass("DRAFT ONLY")}">FORM APPLY ONLY</em>
    </header>
    <p>Apply a saved Activity draft into the visible Closeout fields for editing. This does not save the ticket, change reviewer status, append the official ledger, promote memory, touch GitHub, touch providers, or convert placeholders into proof.</p>
    <label>Draft event<select id="pending-closeout-draft-event">
      ${events
        .map((item) => `<option value="${esc(item.id)}" ${item.id === event.id ? "selected" : ""}>${esc(item.id)} - ${esc(item.timestamp || "UNKNOWN")}</option>`)
        .join("")}
    </select></label>
    <dl class="activity-fields">
      <dt>Event</dt><dd>${esc(event.id || "UNKNOWN")}</dd>
      <dt>Details</dt><dd>${esc(event.details || "No details saved.")}</dd>
      <dt>Evidence</dt><dd>${esc(event.evidencePaths || "UNKNOWN")}</dd>
      <dt>Validation</dt><dd>${esc(event.validationRun || "UNKNOWN")}</dd>
    </dl>
    <div class="dispatch-actions">
      <button type="button" data-action="apply-pending-closeout-draft">${icon("upload", 16)} Apply Activity draft to form</button>
      <button type="button" data-action="open-pending-closeout-activity">${icon("activity", 16)} Open Activity event</button>
      <button type="button" data-action="clear-pending-closeout-draft">${icon("warning", 16)} Clear draft selection</button>
    </div>
    <pre id="pending-closeout-draft-packet">${esc(packet)}</pre>
  </section>`;
}

function reviewQueueTickets() {
  const filter = state.reviewFilter || "all";
  return state.tickets.filter((ticket) => {
    const review = reviewChecklist(ticket);
    if (filter === "delta") return isDeltaDerivedTicket(ticket);
    if (filter === "ready") return review.status === "READY FOR REVIEW";
    if (filter === "needs") return review.status === "NEEDS EVIDENCE";
    if (filter === "accepted") return review.accepted;
    return true;
  });
}

function reviewQueueCounts() {
  return state.tickets.reduce(
    (counts, ticket) => {
      const review = reviewChecklist(ticket);
      counts.all += 1;
      if (isDeltaDerivedTicket(ticket)) counts.delta += 1;
      if (review.status === "READY FOR REVIEW") counts.ready += 1;
      if (review.status === "NEEDS EVIDENCE") counts.needs += 1;
      if (review.accepted) counts.accepted += 1;
      return counts;
    },
    { all: 0, delta: 0, ready: 0, needs: 0, accepted: 0 },
  );
}

function buildReviewPacket(ticket) {
  const review = reviewChecklist(ticket);
  const linkedRuns = linkedRunsForTicket(ticket);
  return [
    "# MDS Command Centre Reviewer Packet",
    "",
    `ticket_id: ${ticket.id}`,
    `title: ${ticket.title}`,
    `review_status: ${ticket.reviewerStatus || "NOT REVIEWED"}`,
    `reviewed_by: ${ticket.reviewedBy || "UNKNOWN"}`,
    `reviewed_at: ${ticket.reviewedAt || "UNKNOWN"}`,
    "",
    "## Checklist",
    ...review.items.map((item) => `- ${item.ok ? "PASS" : "NEEDS EVIDENCE"} - ${item.label}: ${item.detail}`),
    "",
    "## Review Notes",
    ticket.reviewNotes || "No review notes saved.",
    "",
    "## Linked Local Runs",
    ...(linkedRuns.length
      ? linkedRuns.map((run) => `- ${run.id}: status=${run.status || "UNKNOWN"}; approval=${run.approvalClass || "LOCAL_ONLY"}; authority=${run.authorityBasis || "UNKNOWN"}`)
      : ["No linked local run-control packet found."]),
    "",
    "## Closeout Summary",
    ticket.closeoutSummary || "No closeout summary saved.",
    "",
    "## Ledger Preview",
    buildLedgerPreview(ticket),
    "",
    "## Guardrail",
    "This packet is local review evidence only. It does not append the official ledger, promote memory, deploy, mutate providers, send external messages, or prove live provider state.",
  ].join("\n");
}

function promotionChecklist(ticket) {
  const review = reviewChecklist(ticket);
  const ledger = buildLedgerPreview(ticket);
  const memoryAction = ticket.memoryRecommendation || "ledger_only";
  const noConflict = !ticket.authorityConflicts || /^(none|no conflict|no conflicts|n\/a)$/i.test(ticket.authorityConflicts.trim());
  const unknownsSafe = /UNKNOWN|forbidden|blocked/i.test(ticket.unknownsPreserved || "");
  const items = [
    {
      label: "Director review",
      ok: review.accepted,
      detail: review.accepted ? `Accepted by ${ticket.reviewedBy || "UNKNOWN"}` : "Ticket must be locally accepted before staging.",
    },
    {
      label: "Ledger row",
      ok: Boolean(ticket.closeoutSummary && ticket.evidencePaths && ledger.includes(ticket.id || "")),
      detail: ticket.closeoutSummary || "No closeout summary available.",
    },
    {
      label: "Memory action",
      ok: Boolean(memoryAction),
      detail: memoryAction,
    },
    {
      label: "Unknowns preserved",
      ok: unknownsSafe,
      detail: ticket.unknownsPreserved || "UNKNOWN preservation not recorded.",
    },
    {
      label: "Authority conflicts",
      ok: noConflict,
      detail: ticket.authorityConflicts || "none",
    },
    {
      label: "Manual promotion only",
      ok: true,
      detail: "The app prepares local evidence only; official ledger append and memory updates stay outside the app.",
    },
  ];
  const ready = items.every((item) => item.ok);
  const staged = ticket.promotionStatus === "STAGED LOCAL";
  return {
    items,
    ready,
    staged,
    status: staged ? "STAGED LOCAL" : ready ? "READY TO STAGE" : "BLOCKED",
  };
}

function buildPromotionPreflight(ticket) {
  const promotion = promotionChecklist(ticket);
  const linkedRuns = linkedRunsForTicket(ticket);
  const deltaDerived = isDeltaDerivedTicket(ticket);
  const manualBoundary = /manual|official ledger|memory|outside this app/i.test(buildPromotionPacket(ticket));
  const sourceEvidence = Boolean(ticket.sourceEvidence || ticket.evidencePaths);
  const stopBoundary = /deploy|provider|payment|secret|external|ledger|memory|GitHub/i.test(ticket.stopCondition || "");
  const checks = [
    {
      label: "Promotion gate",
      ok: promotion.ready,
      detail: promotion.status,
    },
    {
      label: "Linked run context",
      ok: !deltaDerived || linkedRuns.length > 0,
      detail: linkedRuns.length ? linkedRuns.map((run) => run.id).join(", ") : "No linked run-control packet found.",
    },
    {
      label: "Source evidence",
      ok: sourceEvidence,
      detail: ticket.evidencePaths || ticket.sourceEvidence || "UNKNOWN",
    },
    {
      label: "Stop boundary",
      ok: stopBoundary,
      detail: ticket.stopCondition || "No stop condition recorded.",
    },
    {
      label: "Manual authority handoff",
      ok: manualBoundary,
      detail: "Official ledger append and company-memory promotion remain outside this app.",
    },
  ];
  const passed = checks.filter((check) => check.ok).length;
  const ready = checks.every((check) => check.ok);
  return {
    checks,
    linkedRuns,
    passed,
    total: checks.length,
    ready,
    status: ready ? "READY_FOR_DIRECTOR_REVIEW" : "NEEDS_MORE_EVIDENCE",
    decisionType: /memory/i.test(ticket.memoryRecommendation || "") ? "memory_promotion_candidate" : "ledger_append_candidate",
  };
}

function latestPromotionDecisionForTicket(ticket) {
  return state.decisions
    .filter((decision) => decision.ticketId === ticket.id && /promotion preflight|promotion_preflight/i.test(`${decision.title || ""} ${decision.sourceAction || ""} ${decision.packet || ""}`))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))[0];
}

function promotionEvidenceResolution(ticket) {
  const review = reviewChecklist(ticket);
  const promotion = promotionChecklist(ticket);
  const preflight = buildPromotionPreflight(ticket);
  const latestDecision = latestPromotionDecisionForTicket(ticket);
  const blockers = [
    ...review.items.filter((item) => !item.ok).map((item) => ({ source: "Review", label: item.label, detail: item.detail })),
    ...promotion.items.filter((item) => !item.ok).map((item) => ({ source: "Promote", label: item.label, detail: item.detail })),
    ...preflight.checks.filter((item) => !item.ok).map((item) => ({ source: "Preflight", label: item.label, detail: item.detail })),
  ];
  const deduped = [];
  const seen = new Set();
  blockers.forEach((item) => {
    const key = `${item.source}|${item.label}|${item.detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });
  return {
    review,
    promotion,
    preflight,
    latestDecision,
    blockers: deduped,
    status: preflight.ready ? "READY_FOR_DIRECTOR_REVIEW" : "NEEDS_MORE_EVIDENCE",
    nextAction: preflight.ready
      ? "Prepare a fresh local director preflight packet, then responsible director/CEO/Board/Shrish review decides any official action outside this app."
      : "Fill closeout evidence, run validation, resolve authority-conflict text, and mark Review accepted before preparing a fresh director packet.",
  };
}

function buildEvidenceResolutionPacket(ticket) {
  const resolution = promotionEvidenceResolution(ticket);
  return [
    "# MDS Command Centre Evidence Resolution Packet",
    "",
    `ticket_id: ${ticket.id || "UNKNOWN"}`,
    `title: ${ticket.title || "UNKNOWN"}`,
    `latest_decision_id: ${resolution.latestDecision?.id || "UNKNOWN"}`,
    `latest_decision_status: ${resolution.latestDecision?.disposition || "UNKNOWN"}`,
    `current_resolution_status: ${resolution.status}`,
    `review_status: ${resolution.review.status}`,
    `promotion_status: ${resolution.promotion.status}`,
    `preflight_status: ${resolution.preflight.status}`,
    "",
    "## Blocking Evidence",
    ...(resolution.blockers.length
      ? resolution.blockers.map((item) => `- ${item.source} / ${item.label}: ${item.detail}`)
      : ["No local evidence blockers remain in the current ticket state."]),
    "",
    "## Required Resolution Fields",
    `closeout_summary: ${ticket.closeoutSummary || "MISSING"}`,
    `closeout_raw: ${ticket.closeoutRaw ? "PRESENT" : "MISSING"}`,
    `evidence_paths: ${ticket.evidencePaths || "MISSING"}`,
    `validation_run: ${ticket.validationRun || "MISSING"}`,
    `unknowns_preserved: ${ticket.unknownsPreserved || "MISSING"}`,
    `authority_conflicts: ${ticket.authorityConflicts || "none"}`,
    `reviewer_status: ${ticket.reviewerStatus || "NOT REVIEWED"}`,
    "",
    "## Next Action",
    resolution.nextAction,
    "",
    "## Authority Boundary",
    "This packet is D-local evidence resolution only. It does not append the official ledger, promote company memory, push GitHub, deploy, mutate providers, send external messages, move money, read secrets, or prove live provider state.",
  ].join("\n");
}

function renderEvidenceResolutionPanel(ticket, context = "closeout") {
  const resolution = promotionEvidenceResolution(ticket);
  const packet = buildEvidenceResolutionPacket(ticket);
  return `<section class="evidence-resolution-panel">
    <header>
      <div>
        <span class="eyebrow">${esc(context)} evidence resolver</span>
        <strong>${esc(resolution.status)}</strong>
      </div>
      <em class="${statusClass(resolution.preflight.ready ? "READY" : "NEEDS_MORE_EVIDENCE")}">${esc(resolution.preflight.passed)}/${esc(resolution.preflight.total)} preflight checks</em>
    </header>
    <dl class="activity-fields">
      <dt>Latest decision</dt><dd>${esc(resolution.latestDecision ? `${resolution.latestDecision.id} / ${resolution.latestDecision.disposition || "UNKNOWN"}` : "No promotion preflight decision found.")}</dd>
      <dt>Review</dt><dd>${esc(resolution.review.status)}</dd>
      <dt>Promotion</dt><dd>${esc(resolution.promotion.status)}</dd>
      <dt>Next</dt><dd>${esc(resolution.nextAction)}</dd>
    </dl>
    <div class="readiness-check-list">
      ${
        resolution.blockers.length
          ? resolution.blockers
              .map(
                (item) => `<span class="fix">
                  <strong>FIX</strong>
                  ${esc(item.source)} / ${esc(item.label)} - ${esc(item.detail)}
                </span>`,
              )
              .join("")
          : `<span class="pass"><strong>PASS</strong>No local evidence blockers remain in the current ticket state.</span>`
      }
    </div>
    <p>This resolver shows why a local director packet is still blocked or ready. Preparing a fresh preflight only creates a local decision export; official ledger append and company-memory promotion remain outside this app.</p>
    <div class="dispatch-actions">
      <button type="button" data-action="copy-evidence-resolution">${icon("copy", 16)} Copy resolver</button>
      <button type="button" data-action="download-evidence-resolution">${icon("download", 16)} Download resolver</button>
      <button type="button" data-action="prepare-promotion-preflight">${icon("decisions", 16)} Re-run director preflight</button>
      <button type="button" data-action="open-promote">${icon("promote", 16)} Open promote</button>
    </div>
    <pre id="evidence-resolution-packet">${esc(packet)}</pre>
  </section>`;
}

function promotionQueueTickets() {
  const filter = state.promotionFilter || "all";
  return state.tickets.filter((ticket) => {
    const promotion = promotionChecklist(ticket);
    if (filter === "delta") return isDeltaDerivedTicket(ticket);
    if (filter === "ready") return promotion.ready && !promotion.staged;
    if (filter === "blocked") return !promotion.ready;
    if (filter === "staged") return promotion.staged;
    return true;
  });
}

function promotionQueueCounts() {
  return state.tickets.reduce(
    (counts, ticket) => {
      const promotion = promotionChecklist(ticket);
      counts.all += 1;
      if (isDeltaDerivedTicket(ticket)) counts.delta += 1;
      if (promotion.ready && !promotion.staged) counts.ready += 1;
      if (!promotion.ready) counts.blocked += 1;
      if (promotion.staged) counts.staged += 1;
      return counts;
    },
    { all: 0, delta: 0, ready: 0, blocked: 0, staged: 0 },
  );
}

function buildPromotionPacket(ticket) {
  const promotion = promotionChecklist(ticket);
  return [
    "# MDS Command Centre Promotion Packet",
    "",
    `ticket_id: ${ticket.id}`,
    `title: ${ticket.title}`,
    `promotion_status: ${ticket.promotionStatus || "NOT STAGED"}`,
    `staged_by: ${ticket.stagedBy || "UNKNOWN"}`,
    `staged_at: ${ticket.stagedAt || "UNKNOWN"}`,
    `memory_action: ${ticket.memoryRecommendation || "ledger_only"}`,
    "",
    "## Promotion Checklist",
    ...promotion.items.map((item) => `- ${item.ok ? "PASS" : "BLOCKED"} - ${item.label}: ${item.detail}`),
    "",
    "## Director Notes",
    ticket.promotionNotes || "No promotion notes saved.",
    "",
    "## Required Human Action",
    "A responsible director, CEO, Board reviewer, or Shrish must append the official ledger row or promote memory outside this app after reviewing evidence.",
    "",
    "## Official Ledger Row Candidate",
    buildLedgerPreview(ticket),
    "",
    "## Memory Promotion Boundary",
    `Recommended action: ${ticket.memoryRecommendation || "ledger_only"}`,
    "This packet is not company memory, not GitHub committed truth, and not provider live-state evidence.",
    "",
    "## Forbidden Actions",
    "No deploy, provider mutation, payment action, external message, secret read, live-state claim, or automatic memory promotion is authorized by this packet.",
  ].join("\n");
}

function buildPromotionPreflightPacket(ticket) {
  const preflight = buildPromotionPreflight(ticket);
  const promotion = promotionChecklist(ticket);
  return [
    "# MDS Command Centre Promote Preflight",
    "",
    `ticket_id: ${ticket.id || "UNKNOWN"}`,
    `title: ${ticket.title || "UNKNOWN"}`,
    `promotion_status: ${promotion.status}`,
    `preflight_status: ${preflight.status}`,
    `decision_type: ${preflight.decisionType}`,
    `memory_action: ${ticket.memoryRecommendation || "ledger_only"}`,
    "",
    "## Preflight Checklist",
    ...preflight.checks.map((check) => `- ${check.ok ? "PASS" : "NEEDS_EVIDENCE"} - ${check.label}: ${check.detail}`),
    "",
    "## Linked Local Runs",
    ...(preflight.linkedRuns.length
      ? preflight.linkedRuns.map((run) => `- ${run.id}: status=${run.status || "UNKNOWN"}; approval=${run.approvalClass || "LOCAL_ONLY"}; authority=${run.authorityBasis || "UNKNOWN"}`)
      : ["No linked local run-control packet found."]),
    "",
    "## Director Action",
    preflight.ready
      ? "Review the packet and decide whether a manual official-ledger append or company-memory workflow should happen outside this app."
      : "Request evidence or fixes before any manual official-ledger append or company-memory workflow.",
    "",
    "## Official Ledger Row Candidate",
    buildLedgerPreview(ticket),
    "",
    "## Promotion Packet Snapshot",
    buildPromotionPacket(ticket),
    "",
    "## Authority Boundary",
    "This is a D-local preflight packet only. It does not append the official ledger, promote company memory, push GitHub, deploy, mutate providers, send external messages, move money, read secrets, or prove live state.",
  ].join("\n");
}

async function preparePromotionDirectorPreflight() {
  const ticket = selectedTicket();
  const preflight = buildPromotionPreflight(ticket);
  const packet = buildPromotionPreflightPacket(ticket);
  const event = await recordActivity("promotion_preflight_prepared", ticket, {
    details: `Prepared local promotion preflight for ${ticket.id || "UNKNOWN"} with status ${preflight.status}.`,
    packet,
  });
  const decision = buildDirectorDecisionFromEvents([event], {
    title: `${ticket.id || "UNKNOWN"} promotion preflight`,
    decisionType: preflight.decisionType,
    disposition: preflight.status,
    memoryAction: ticket.memoryRecommendation || "ledger_only",
    authorityBasis: "D-local promotion preflight only. Official ledger append, company-memory promotion, GitHub updates, provider live-state claims, deploys, payments, and external messages require separate responsible-authority action.",
    officialLedgerCandidate: packet,
    notes: preflight.ready
      ? "Promotion preflight is locally ready for director review; manual action remains outside this app."
      : "Promotion preflight needs evidence or fixes before any director-approved manual action.",
  });
  state.decisions = [decision, ...state.decisions.filter((item) => item.id !== decision.id)];
  state.selectedDecisionId = decision.id;
  await saveDecisions();
  await recordActivity("promotion_director_preflight_created", ticket, {
    details: `Created local director decision ${decision.id} from promotion preflight ${preflight.status}.`,
    packet: decision.packet,
  });
  state.view = "decisions";
  render();
}

function buildActivityPacket(event) {
  return [
    "# MDS Command Centre Local Activity Event",
    "",
    `event_id: ${event.id || "UNKNOWN"}`,
    `timestamp: ${event.timestamp || "UNKNOWN"}`,
    `action: ${event.action || "UNKNOWN"}`,
    `ticket_id: ${event.ticketId || "UNKNOWN"}`,
    `title: ${event.title || "UNKNOWN"}`,
    `lane: ${event.lane || "UNKNOWN"}`,
    `owner: ${event.owner || "UNKNOWN"}`,
    `ticket_status: ${event.status || "UNKNOWN"}`,
    `review_status: ${event.reviewStatus || "UNKNOWN"}`,
    `promotion_status: ${event.promotionStatus || "UNKNOWN"}`,
    `memory_recommendation: ${event.memoryRecommendation || "ledger_only"}`,
    "",
    "## Evidence",
    event.evidencePaths || "UNKNOWN",
    "",
    "## Validation",
    event.validationRun || "UNKNOWN",
    "",
    "## Unknowns Preserved",
    event.unknownsPreserved || "UNKNOWN",
    "",
    "## Authority Conflicts",
    event.authorityConflicts || "UNKNOWN",
    "",
    "## Details",
    event.details || "No event details saved.",
    "",
    "## Packet Snapshot",
    event.packet || "No packet snapshot saved.",
    "",
    "## Boundary",
    "This event is D-local activity evidence only. It is not the official execution ledger, company memory, GitHub committed truth, or provider live-state proof.",
  ].join("\n");
}

function buildDecisionBundleSummary(decision, events = decisionEvents(decision)) {
  if (!events.length) return "No source events selected.";
  const actions = [...new Set(events.map((event) => event.action || "activity_recorded"))].join(", ");
  const tickets = [...new Set(events.map((event) => event.ticketId || "UNKNOWN"))].join(", ");
  const evidenceCount = events.filter((event) => event.evidencePaths).length;
  const validationCount = events.filter((event) => event.validationRun).length;
  const unknownCount = events.filter((event) => /UNKNOWN|forbidden|blocked/i.test(event.unknownsPreserved || "")).length;
  return `${events.length} local evidence events bundled for ${decision.disposition || "DRAFT"} ${decision.decisionType || "decision"}; actions: ${actions}; tickets: ${tickets}; evidence paths on ${evidenceCount}/${events.length}; validation on ${validationCount}/${events.length}; UNKNOWN/guardrail preservation on ${unknownCount}/${events.length}.`;
}

function buildDecisionLedgerCandidate(decision, events = decisionEvents(decision)) {
  const rows = events.length ? events : [selectedActivityEvent()];
  const headers = [
    "log_id",
    "ticket_id",
    "timestamp",
    "run_id",
    "work_order_path",
    "department_id",
    "director",
    "agent",
    "tool",
    "task_summary",
    "actions_taken",
    "worked",
    "failed",
    "diagnosis",
    "skills_or_patterns_learned",
    "evidence_paths",
    "files_changed",
    "validation",
    "unknowns_preserved",
    "authority_conflicts",
    "memory_promotion_recommendation",
    "director_review_status",
    "director_reviewed_by",
    "memory_action",
    "notes",
  ];
  const stamp = nowIso();
  const body = rows.map((event, index) => {
    const row = {
      log_id: `atl-${stamp.slice(0, 10)}-${(decision.id || "decision").toLowerCase()}-${index + 1}`,
      ticket_id: event.ticketId || decision.ticketId || "UNKNOWN",
      timestamp: stamp,
      run_id: `run-${(decision.id || "decision").toLowerCase()}-local-director-bundle`,
      work_order_path: event.evidencePaths || decision.evidencePaths || "Products/MDS-Command-Centre/src/data/localActivityLog.json",
      department_id: event.lane || "command-centre-ops",
      director: decision.director || "Codex Strategic Board",
      agent: "UNKNOWN",
      tool: "MDS Command Centre local director bundle",
      task_summary: event.title || decision.title || "UNKNOWN",
      actions_taken: `${event.action || "activity_recorded"}: ${event.details || "No details saved."}`,
      worked: event.packet ? "Local packet snapshot exists for director review." : "Local event exists for director review.",
      failed: event.authorityConflicts || "UNKNOWN",
      diagnosis: "Local evidence event staged for manual ledger review; not appended by the app.",
      skills_or_patterns_learned: decision.bundleSummary || buildDecisionBundleSummary(decision, rows),
      evidence_paths: event.evidencePaths || decision.evidencePaths || "UNKNOWN",
      files_changed: event.evidencePaths || "UNKNOWN",
      validation: event.validationRun || decision.validationRun || "UNKNOWN",
      unknowns_preserved: event.unknownsPreserved || decision.unknownsPreserved || "UNKNOWN",
      authority_conflicts: event.authorityConflicts || decision.authorityConflicts || "UNKNOWN",
      memory_promotion_recommendation: event.memoryRecommendation || decision.memoryAction || "ledger_only",
      director_review_status: decision.disposition || "DRAFT",
      director_reviewed_by: decision.director || "Codex Strategic Board",
      memory_action: decision.memoryAction || "ledger_only",
      notes: "Candidate row only; manual director/CEO/Board review required before official append.",
    };
    return headers.map((header) => csvCell(row[header])).join(",");
  });
  return [headers.map(csvCell).join(","), ...body].join("\n");
}

function buildDirectorDecisionPacket(decision) {
  const events = decisionEvents(decision);
  const sourceEventIds = normalizeEventIds(decision.sourceEventIds, decision.sourceEventId);
  const bundleSummary = decision.bundleSummary || buildDecisionBundleSummary(decision, events);
  const ledgerBundleCandidate = decision.ledgerBundleCandidate || buildDecisionLedgerCandidate(decision, events);
  return [
    "# MDS Command Centre Director Decision Export",
    "",
    `decision_id: ${decision.id || "UNKNOWN"}`,
    `created_at: ${decision.createdAt || "UNKNOWN"}`,
    `updated_at: ${decision.updatedAt || "UNKNOWN"}`,
    `source_event_id: ${decision.sourceEventId || "UNKNOWN"}`,
    `source_event_ids: ${sourceEventIds.length ? sourceEventIds.join(", ") : "UNKNOWN"}`,
    `source_action: ${decision.sourceAction || "UNKNOWN"}`,
    `ticket_id: ${decision.ticketId || "UNKNOWN"}`,
    `title: ${decision.title || "UNKNOWN"}`,
    `decision_type: ${decision.decisionType || "ledger_append_candidate"}`,
    `disposition: ${decision.disposition || "DRAFT"}`,
    `director: ${decision.director || "UNKNOWN"}`,
    `memory_action: ${decision.memoryAction || "ledger_only"}`,
    "",
    "## Bundled Evidence Summary",
    bundleSummary,
    "",
    "## Bundled Source Events",
    ...(events.length
      ? events.map((event) => `- ${event.id || "UNKNOWN"} | ${event.action || "activity"} | ${event.ticketId || "UNKNOWN"} | ${event.title || "Untitled"}`)
      : ["- UNKNOWN"]),
    "",
    "## Authority Basis",
    decision.authorityBasis || "UNKNOWN",
    "",
    "## Evidence Paths",
    decision.evidencePaths || "UNKNOWN",
    "",
    "## Validation",
    decision.validationRun || "UNKNOWN",
    "",
    "## Unknowns Preserved",
    decision.unknownsPreserved || "UNKNOWN",
    "",
    "## Authority Conflicts",
    decision.authorityConflicts || "UNKNOWN",
    "",
    "## Director Notes",
    decision.notes || "No director notes saved.",
    "",
    "## Official Ledger Candidate",
    decision.officialLedgerCandidate || "No candidate row or packet snapshot saved.",
    "",
    "## Local Ledger Bundle Candidate",
    ledgerBundleCandidate || "No local ledger bundle candidate saved.",
    "",
    "## Required Manual Closeout",
    "A responsible director, CEO, Board reviewer, or Shrish must still append any official ledger row and promote any company memory outside this app after evidence review.",
    "",
    "## Forbidden Actions",
    "This local export does not deploy, mutate providers, read secrets, send external messages, move money, update GitHub, append the official ledger, or promote company memory.",
  ].join("\n");
}

function buildAuthorityHandoffPacket(decision) {
  const events = decisionEvents(decision);
  const readiness = decisionReadiness({ ...decision, packet: decision.packet || buildDirectorDecisionPacket(decision) });
  const sourceEventIds = normalizeEventIds(decision.sourceEventIds, decision.sourceEventId);
  const ledgerBundleCandidate = decision.ledgerBundleCandidate || buildDecisionLedgerCandidate(decision, events);
  return [
    "# MDS Command Centre Manual Authority Handoff",
    "",
    "handoff_status: LOCAL_PACKET_ONLY",
    `handoff_created_at: ${nowIso()}`,
    `decision_id: ${decision.id || "UNKNOWN"}`,
    `title: ${decision.title || "UNKNOWN"}`,
    `disposition: ${decision.disposition || "DRAFT"}`,
    `responsible_director: ${decision.director || "UNKNOWN"}`,
    `readiness_score: ${readiness.passed}/${readiness.total}`,
    `source_event_ids: ${sourceEventIds.length ? sourceEventIds.join(", ") : "UNKNOWN"}`,
    "",
    "## Authority Boundaries",
    "- D local state is active operating context and work-in-progress evidence only.",
    "- GitHub is authoritative for committed/versioned code, branches, tags, releases, and deployment source commits.",
    "- Provider dashboards are authoritative for live runtime, deployment, database, schema, billing, payment, auth, environment, and provider-owned state.",
    "- MDS Company Memory is promoted knowledge only after validation and committed/pushed memory workflow.",
    "- E:/Million Dollar AI Studio is backup/reference only, not an active boot or mutation surface.",
    "",
    "## Readiness Checklist",
    ...readiness.checks.map((check) => `- ${check.ok ? "PASS" : "FIX"} | ${check.label}: ${check.detail}`),
    "",
    "## Source Events",
    ...(events.length
      ? events.map((event) => `- ${event.id || "UNKNOWN"} | ${event.action || "activity"} | ${event.ticketId || "UNKNOWN"} | ${event.title || "Untitled"}`)
      : ["- UNKNOWN"]),
    "",
    "## Evidence Paths",
    decision.evidencePaths || "UNKNOWN",
    "",
    "## Validation",
    decision.validationRun || "UNKNOWN",
    "",
    "## Unknowns Preserved",
    decision.unknownsPreserved || "UNKNOWN",
    "",
    "## Authority Conflicts",
    decision.authorityConflicts || "UNKNOWN",
    "",
    "## Manual Next Action",
    directorBundleNextAction(decision),
    "",
    "## Ledger Candidate Excerpt",
    truncate(ledgerBundleCandidate || decision.officialLedgerCandidate || "UNKNOWN", 3000),
    "",
    "## Memory Action Recommendation",
    decision.memoryAction || "ledger_only",
    "",
    "## Forbidden Actions",
    "- Do not deploy.",
    "- Do not mutate provider dashboards, databases, auth, analytics, billing, payment, deployment state, or production systems.",
    "- Do not pay, checkout, refund, bill, or activate payment rails.",
    "- Do not email, message clients, post externally, or send forms.",
    "- Do not read .env files, tokens, credentials, private keys, provider secrets, or customer-private data.",
    "- Do not push GitHub, append the official ledger, promote company memory, or claim live state from this packet alone.",
    "",
    "## Closeout Required From Responsible Authority",
    "- reviewer_name: UNKNOWN",
    "- reviewer_role: director_ceo_board_or_shrish",
    "- decision: APPROVE_MANUAL_ACTION | NEEDS_MORE_EVIDENCE | REJECT",
    "- evidence_reviewed: UNKNOWN",
    "- official_ledger_action: UNKNOWN",
    "- memory_promotion_action: UNKNOWN",
    "- live_provider_state_verified: UNKNOWN",
  ].join("\n");
}

function buildDirectorDecisionFromEvents(events, options = {}) {
  const selectedEvents = events.filter(Boolean).slice(0, 12);
  const firstEvent = selectedEvents[0] || selectedActivityEvent();
  const packetSnapshots = selectedEvents
    .map((event, index) => `## Source Packet ${index + 1}: ${event.id || "UNKNOWN"}\n${event.packet || "No packet snapshot saved."}`)
    .join("\n\n---\n\n")
    .slice(0, 24000);
  const decision = blankDecisionExport(firstEvent);
  const title = options.title || `${selectedEvents.length || 1} event director evidence bundle`;
  decision.sourceEventIds = selectedEvents.length ? selectedEvents.map((event) => event.id) : normalizeEventIds(firstEvent?.id);
  decision.sourceAction = uniqueEventText(selectedEvents, "action", firstEvent?.action || "UNKNOWN");
  decision.ticketId = selectedEvents.length === 1 ? firstEvent.ticketId || "UNKNOWN" : `${selectedEvents.length} local activity events`;
  decision.title = title;
  decision.decisionType = options.decisionType || "ledger_append_candidate";
  decision.disposition = options.disposition || "DRAFT";
  decision.director = options.director || decision.director || "Codex Strategic Board";
  decision.memoryAction = options.memoryAction || "ledger_only";
  decision.evidencePaths = uniqueEventText(selectedEvents, "evidencePaths", decision.evidencePaths || "UNKNOWN");
  decision.validationRun = uniqueEventText(selectedEvents, "validationRun", decision.validationRun || "UNKNOWN");
  decision.unknownsPreserved = uniqueEventText(selectedEvents, "unknownsPreserved", decision.unknownsPreserved || "UNKNOWN");
  decision.authorityConflicts = uniqueEventText(selectedEvents, "authorityConflicts", decision.authorityConflicts || "UNKNOWN");
  decision.authorityBasis = options.authorityBasis || decision.authorityBasis;
  decision.notes = options.notes || decision.notes || "";
  decision.bundleSummary = buildDecisionBundleSummary(decision, selectedEvents);
  decision.ledgerBundleCandidate = buildDecisionLedgerCandidate(decision, selectedEvents);
  decision.officialLedgerCandidate = options.officialLedgerCandidate || packetSnapshots;
  decision.packet = buildDirectorDecisionPacket(decision);
  return decision;
}

async function saveDecisionForm() {
  const formElement = document.querySelector("#decision-form");
  if (!formElement) return null;
  const form = new FormData(formElement);
  const eventSource = state.activity.find((item) => item.id === form.get("sourceEventId")) || selectedActivityEvent();
  const visibleEventIds = new Set(filteredDecisionSourceEvents().map((event) => event.id));
  const existingEventIds = normalizeEventIds(selectedDecision().sourceEventIds, selectedDecision().sourceEventId);
  const hiddenSelectedEventIds = existingEventIds.filter((id) => !visibleEventIds.has(id));
  const checkedEventIds = normalizeEventIds(form.getAll("sourceEventIds"), eventSource?.id || "");
  const sourceEventIds = [...new Set([...hiddenSelectedEventIds, ...checkedEventIds])].slice(0, 25);
  const next = {
    ...blankDecisionExport(eventSource),
    ...selectedDecision(),
    ...Object.fromEntries(form.entries()),
    sourceEventIds,
  };
  next.createdAt = selectedDecision().createdAt || next.createdAt;
  next.updatedAt = nowIso();
  const bundledEvents = sourceEventIds.map((id) => state.activity.find((event) => event.id === id)).filter(Boolean);
  next.bundleSummary = buildDecisionBundleSummary(next, bundledEvents);
  next.ledgerBundleCandidate = buildDecisionLedgerCandidate(next, bundledEvents);
  next.packet = buildDirectorDecisionPacket(next);
  state.decisions = state.decisions.some((decision) => decision.id === next.id)
    ? state.decisions.map((decision) => (decision.id === next.id ? next : decision))
    : [next, ...state.decisions];
  state.selectedDecisionId = next.id;
  await saveDecisions();
  await recordActivity("director_decision_export_saved", selectedTicket(), {
    details: `Saved local director decision export ${next.id} with disposition ${next.disposition}.`,
    packet: next.packet,
  });
  return next;
}

async function updateSelectedDecisionDisposition(disposition) {
  const current = selectedDecision();
  const events = decisionEvents(current);
  const next = {
    ...current,
    disposition,
    updatedAt: nowIso(),
  };
  next.bundleSummary = buildDecisionBundleSummary(next, events);
  next.ledgerBundleCandidate = buildDecisionLedgerCandidate(next, events);
  next.packet = buildDirectorDecisionPacket(next);
  state.decisions = state.decisions.some((decision) => decision.id === next.id)
    ? state.decisions.map((decision) => (decision.id === next.id ? next : decision))
    : [next, ...state.decisions];
  state.selectedDecisionId = next.id;
  await saveDecisions();
  await recordActivity("director_decision_disposition_updated", selectedTicket(), {
    details: `Updated local director decision ${next.id} disposition to ${disposition}. This is not an official ledger append or memory promotion.`,
    packet: next.packet,
  });
  return next;
}

function validateTicket(ticket) {
  const required = [
    ["title", "Title"],
    ["sourceEvidence", "Source evidence"],
    ["proofCondition", "Proof condition"],
    ["stopCondition", "Stop condition"],
    ["nextAction", "Next action"],
  ];
  const missing = required.filter(([field]) => !String(ticket[field] || "").trim()).map(([, label]) => label);
  const combined = [
    ticket.title,
    ticket.sourceEvidence,
    ticket.proofCondition,
    ticket.stopCondition,
    ticket.nextAction,
  ]
    .join(" ")
    .toLowerCase();
  const redFlagRules = [
    ["deploy", "Deployment requires explicit approval."],
    ["payment", "Payment or money movement requires explicit approval."],
    ["checkout", "Checkout creation requires explicit approval."],
    ["refund", "Refunds require explicit approval."],
    ["email", "External messages require explicit approval."],
    ["post externally", "Public/external posting requires explicit approval."],
    ["provider dashboard", "Provider mutation requires owning-authority proof and approval."],
    ["secret", "Secret access is forbidden by default."],
    ["credential", "Credential access is forbidden by default."],
  ];
  const redFlags = redFlagRules.filter(([needle]) => combined.includes(needle)).map(([, message]) => message);
  return {
    missing,
    redFlags,
    status: missing.length || redFlags.length ? "NEEDS REVIEW" : "READY FOR LOCAL DISPATCH",
  };
}

function markdownPreview(markdown) {
  return String(markdown || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("---") && !line.startsWith("|---"))
    .slice(0, 28);
}

function buildDispatchPacket(ticket, target) {
  const validation = validateTicket(ticket);
  const runControl = state.snapshot?.framework?.runControls?.profiles?.find((profile) =>
    target === "NotebookLM" ? profile.id === "external-action-review" : profile.id === "focused-run",
  );
  const agentProfile = state.snapshot?.framework?.agentProfiles?.profiles?.find((profile) => {
    if (target === "Antigravity" || target === "NotebookLM") return profile.id === "reviewer" || profile.id === "researcher";
    return profile.id === "builder";
  });
  return [
    "# MDS Command Centre Dispatch Packet",
    "",
    `target_agent: ${target}`,
    `ticket_id: ${ticket.id}`,
    `objective: ${ticket.title || "UNKNOWN"}`,
    `lane: ${ticket.lane}`,
    `owner: ${ticket.owner}`,
    `priority: ${ticket.priority}`,
    `status: ${ticket.status}`,
    "",
    "## Authority Boundaries",
    "- D:/Million Dollar AI Studio/ is the active MDS operating PROD root.",
    "- GitHub is committed/versioned code authority.",
    "- Provider dashboards are authority for live runtime, deployment, database, auth, billing, payment, schema, and environment state.",
    "- E:/Million Dollar AI Studio/ is backup/recovery only.",
    "- UNKNOWN stays UNKNOWN without owning-authority proof.",
    "",
    "## Runtime Contract",
    `recommended_profile: ${agentProfile?.id || "UNKNOWN"}`,
    `run_control: ${runControl?.id || "focused-run"}`,
    `max_iterations: ${runControl?.scope?.maxIterations ?? "UNKNOWN"}`,
    `requires_stop_condition: ${runControl?.scope?.requiresStopCondition ?? true}`,
    `secrets_allowed: ${runControl?.sandbox?.secretsAllowed ?? false}`,
    `external_actions_allowed: ${runControl?.sandbox?.externalActions ?? false}`,
    "",
    "## Evidence Requirement",
    ticket.sourceEvidence || "Name exact D/GitHub/provider evidence before claiming completion.",
    "",
    "## Local Readiness Gate",
    `status: ${validation.status}`,
    `missing_fields: ${validation.missing.length ? validation.missing.join(", ") : "none"}`,
    `red_flags: ${validation.redFlags.length ? validation.redFlags.join(" | ") : "none"}`,
    "",
    "## Proof Condition",
    ticket.proofCondition || "Define a concrete proof condition before execution.",
    "",
    "## Stop Condition",
    ticket.stopCondition || "Stop before unsafe, external, provider-mutating, money-moving, secret-handling, or unapproved public action.",
    "",
    "## Allowed Actions",
    "- Read whitelisted D-root docs and local repo files needed for this ticket.",
    "- Create local draft artifacts or code changes inside the named scope.",
    "- Run local no-secret verification and record evidence paths.",
    "- Prepare approval packets for Red actions instead of executing them.",
    "",
    "## Forbidden Actions",
    "- Do not deploy.",
    "- Do not read or print .env files, tokens, credentials, private keys, or provider secrets.",
    "- Do not mutate provider dashboards, databases, auth, billing, payment, deployment, analytics, or production systems.",
    "- Do not send external messages, forms, posts, or client commitments.",
    "- Do not create checkout, invoice, payment link, charge, refund, subscription, pricing, or billing artifacts.",
    "",
    "## Next Action",
    ticket.nextAction || "UNKNOWN",
    "",
    "## Closeout Format",
    "Return: files changed, evidence paths, validation run, unknowns preserved, authority conflicts, memory-promotion recommendation, and one next action.",
  ].join("\n");
}

function renderShell(content) {
  document.querySelector("#root").innerHTML = `
    <div class="app-shell">
      <aside class="side-nav" aria-label="Primary navigation">
        <div class="brand-lockup">
          <div class="mark">M</div>
          <div><strong>MDS Command Centre</strong><span>Local-first Sprint 001</span></div>
        </div>
        <nav>
          ${navGroup("Operate", ["today", "inbox", "workspaces", "voice", "canvas", "launch", "search", "queue", "boards", "operator"])}
          ${navGroup("System", ["vcos", "files", "git", "sources", "capabilities", "providers", "models"])}
          ${navGroup("Execution", ["runtime", "runs", "tickets", "dispatch", "proof"])}
          ${navGroup("Govern", ["closeout", "review", "promote", "activity", "decisions", "benchmark", "health"])}
        </nav>
        <div class="authority-box">${icon("lock", 16)}<p>D root local shell. Providers remain live-state authority.</p></div>
      </aside>
      <main class="workspace">
        <header class="top-strip">
          <div><span class="eyebrow">Snapshot ${state.snapshot.generatedAt}</span><h1>${esc(navLabels[state.view] || titleCase(state.view))}</h1></div>
          <div class="strip-actions"><span class="timestamp">${new Date().toLocaleString()}</span><button class="primary" data-action="new-ticket">${icon("plus", 16)} New ticket</button></div>
        </header>
        <section class="guardrail-strip" aria-label="Authority model">
          ${guard("D PROD", "ACTIVE")}
          ${guard("MRR", "UNKNOWN")}
          ${guard("Provider state", "UNKNOWN")}
          ${guard("Deploy", "FORBIDDEN", "blocked")}
          ${guard("Secrets", "FAIL-CLOSED", "blocked")}
        </section>
        ${commandReadinessBand()}
        ${content}
      </main>
    </div>`;
}

const navLabels = {
  today: "Today",
  inbox: "Inbox",
  workspaces: "Workspaces",
  voice: "Voice",
  canvas: "Live Canvas",
  search: "Search",
  queue: "Queue",
  boards: "Boards",
  launch: "Launch OS",
  operator: "Operator OS",
  vcos: "VCOS",
  files: "Files",
  git: "Git Truth",
  sources: "Sources",
  capabilities: "Capabilities",
  providers: "Providers",
  models: "Models",
  runtime: "Runtime",
  runs: "Runs",
  tickets: "Tickets",
  dispatch: "Dispatch",
  proof: "Proof",
  closeout: "Closeout",
  review: "Review",
  promote: "Promote",
  activity: "Activity",
  decisions: "Decisions",
  benchmark: "Benchmark",
  health: "Health",
};

function navGroup(label, views) {
  return `<div class="nav-group"><span>${esc(label)}</span>${views.map((view) => navButton(view, navLabels[view] || titleCase(view))).join("")}</div>`;
}

function navButton(view, label) {
  return `<button class="${state.view === view ? "active" : ""}" data-view="${view}">${icon(view)} ${label}</button>`;
}

function guard(label, value, tone = "") {
  return `<div class="guard ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function commandReadinessBand() {
  const adapters = state.adapterHealth?.adapters || [];
  const ok = adapters.filter((adapter) => adapter.status === "ok").length;
  const degraded = adapters.filter((adapter) => adapter.status && adapter.status !== "ok").length;
  const sourceStamp = state.sourceTruth?.generatedAt || state.localCaps?.generatedAt || state.adapterHealth?.generatedAt || "UNKNOWN";
  const providerClis = state.localCaps?.providerClis?.clis || [];
  const modelRuntimes = state.localCaps?.modelProviders?.runtimes || [];
  const presentCliCount = providerClis.filter((cli) => cli.present).length;
  const presentModelCount = modelRuntimes.filter((runtime) => runtime.present).length;
  return `<section class="os-readiness-band" aria-label="Command Centre readiness">
    ${readinessItem("Adapter spine", adapters.length ? `${ok}/${adapters.length} ok` : "UNKNOWN", degraded ? "blocked" : "ready")}
    ${readinessItem("Local roots", state.sourceTruth?.allowlistedRoots?.roots?.length || "UNKNOWN", "active")}
    ${readinessItem("Provider CLIs", `${presentCliCount}/${providerClis.length || "UNKNOWN"} present`, "unknown")}
    ${readinessItem("Model runtimes", `${presentModelCount}/${modelRuntimes.length || "UNKNOWN"} present`, "unknown")}
    ${readinessItem("Snapshot", sourceStamp, sourceStamp === "UNKNOWN" ? "blocked" : "ready")}
  </section>`;
}

function readinessItem(label, value, tone) {
  return `<div class="readiness-item ${esc(tone || "active")}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function metric(name, value, iconName) {
  return `<div class="metric">${icon(iconName)}<span>${esc(name)}</span><strong>${esc(value)}</strong></div>`;
}

function sourceAgeLabel(modifiedAt) {
  if (!modifiedAt) return "UNKNOWN";
  const ageMs = Date.now() - new Date(modifiedAt).getTime();
  if (!Number.isFinite(ageMs)) return "UNKNOWN";
  const hours = Math.max(0, Math.round(ageMs / 36e5));
  if (hours < 1) return "<1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function controlSurface() {
  return (
    state.snapshot?.controlSurface || {
      status: "LEGACY_SNAPSHOT",
      claimCeiling:
        "Legacy snapshot lacks controlSurface. Use productReadiness, workQueue, local tickets, and local decisions only; provider/live/payment/deploy claims remain UNKNOWN.",
      revenue: {
        mrr: "$0 unless verified payment evidence proves otherwise",
        status: "UNKNOWN",
        sourceEvidence: "command-centre/war-room/revenue-board.md",
        safeNextAction: state.snapshot?.today?.nextSafeAction || "UNKNOWN",
        lanes: [],
        paymentReadiness: [],
      },
      gates: {},
      productVcos: operatorProductRows().slice(1, 6).map((row) => ({
        product: row.product,
        sourcePath: row.sourcePath,
        readiness: row.readiness,
        frontendGate: "UNKNOWN",
        backendGate: "UNKNOWN",
        paymentGate: "UNKNOWN",
        deployGate: "UNKNOWN",
        providerGate: "UNKNOWN",
        securityGate: "UNKNOWN",
        contentGate: "UNKNOWN",
        biggestBlocker: row.blocker,
        nextAction: row.nextAction,
        evidence: row.sourcePath,
        claimCeiling: "Legacy fallback row; verify source evidence before claim.",
      })),
      approvals: { shrishRequired: [], standingRedGates: [], sourceEvidence: "command-centre/war-room/approval-board.md" },
      workOrders: { active: state.snapshot?.workQueue || [], sourceEvidence: "command-centre/war-room/" },
      agentAssignments: { routes: [], sourceEvidence: "Derived from local workQueue." },
      failures: [],
      releases: [],
      contentQueue: [],
      boardDecisions: [],
      ceoActions: [],
      nextAction: { title: state.snapshot?.today?.nextSafeAction || "UNKNOWN", sourceEvidence: "vcos/mds-kernel/state/next-actions.md" },
      nightlyCloseout: { status: "UNKNOWN", summary: "UNKNOWN", sourceEvidence: "vcos/mds-kernel/state/last-run-summary.md" },
      openItems: [],
    }
  );
}

function gateSummary(label, gate = {}) {
  const total = gate.total || 0;
  if (!total) return `${label}: UNKNOWN`;
  return `${gate.evidenced || 0} evidenced / ${gate.blocked || 0} blocked / ${gate.unknown || 0} unknown`;
}

function gateStatusFromCounts(gate = {}) {
  if ((gate.blocked || 0) > 0) return "BLOCKED_OR_NEEDS_PROOF";
  if ((gate.unknown || 0) > 0) return "UNKNOWN";
  if ((gate.evidenced || 0) > 0) return "EVIDENCED_PARTIAL";
  return "UNKNOWN";
}

function renderGateCards(control) {
  const gates = [
    ["Frontend", control.gates.frontend],
    ["Backend", control.gates.backend],
    ["Payment", control.gates.payment],
    ["Deploy", control.gates.deploy],
    ["Provider", control.gates.provider],
  ];
  return `<div class="gate-grid">
    ${gates
      .map(
        ([label, gate]) => `<article class="gate-card">
          <header><strong>${esc(label)}</strong><em class="${statusClass(gateStatusFromCounts(gate))}">${esc(gateStatusFromCounts(gate))}</em></header>
          <p>${esc(gateSummary(label, gate))}</p>
        </article>`,
      )
      .join("")}
  </div>`;
}

function renderProductVcosFeed(rows) {
  return `<div class="product-vcos-grid">
    ${rows
      .map(
        (row) => `<article class="vcos-card">
          <header>
            <div><span class="eyebrow">${esc(row.sourcePath || "UNKNOWN")}</span><strong>${esc(row.product || "UNKNOWN")}</strong></div>
            <em class="${statusClass(row.readiness)}">${esc(truncate(row.readiness || "UNKNOWN", 54))}</em>
          </header>
          <div class="gate-strip">
            <span><strong>FE</strong>${esc(row.frontendGate || "UNKNOWN")}</span>
            <span><strong>BE</strong>${esc(row.backendGate || "UNKNOWN")}</span>
            <span><strong>Pay</strong>${esc(row.paymentGate || "UNKNOWN")}</span>
            <span><strong>Deploy</strong>${esc(row.deployGate || "UNKNOWN")}</span>
            <span><strong>Provider</strong>${esc(row.providerGate || "UNKNOWN")}</span>
          </div>
          <p>${esc(truncate(row.biggestBlocker || "UNKNOWN", 220))}</p>
          <dl class="queue-proof">
            <dt>Next</dt><dd>${esc(row.nextAction || "UNKNOWN")}</dd>
            <dt>Evidence</dt><dd>${esc(row.evidence || "UNKNOWN")}</dd>
            <dt>Claim ceiling</dt><dd>${esc(row.claimCeiling || "UNKNOWN")}</dd>
          </dl>
        </article>`,
      )
      .join("")}
  </div>`;
}

function renderShrishQueue(control) {
  const approvals = control.approvals?.shrishRequired || [];
  return `<div class="compact-list">
    ${
      approvals.length
        ? approvals
            .map(
              (item) => `<article>
                <header><strong>${esc(item.item || "UNKNOWN")}</strong><em class="${statusClass(item.status)}">${esc(item.status || "UNKNOWN")}</em></header>
                <p>${esc(truncate(item.why || "UNKNOWN", 160))}</p>
                <span>${esc(item.safeNextStep || "UNKNOWN")}</span>
              </article>`,
            )
            .join("")
        : `<article class="empty-card"><strong>No Shrish-specific approval rows loaded.</strong><p>Standing red gates still apply.</p></article>`
    }
  </div>`;
}

function renderCeoWorkOrders(control) {
  const items = control.workOrders?.active || [];
  return `<div class="work-order-list">
    ${
      items.length
        ? items
            .slice(0, 6)
            .map(
              (item) => `<article class="work-order-card">
                <header>
                  <div><span class="eyebrow">${esc(item.id || "UNKNOWN")} / ${esc(item.source || "source-derived")}</span><strong>${esc(item.title || "Untitled work order")}</strong></div>
                  <em class="${statusClass(item.status)}">${esc(item.status || "UNKNOWN")}</em>
                </header>
                <div class="assignment-strip compact">
                  <span><strong>Owner</strong>${esc(item.owner || "UNKNOWN")}</span>
                  <span><strong>Lane</strong>${esc(item.lane || "UNKNOWN")}</span>
                  <span><strong>Agent</strong>${esc(item.targetAgent || "UNKNOWN")}</span>
                  <span><strong>Priority</strong>${esc(item.priority || "P1")}</span>
                </div>
                <p>${esc(truncate(item.objective || item.nextAction || "UNKNOWN", 190))}</p>
                <div class="queue-actions">
                  <button class="primary" type="button" data-control-work-order="${esc(item.id)}">${icon("plus", 16)} Create CEO work order</button>
                  <button type="button" data-queue-dispatch="${esc(item.id)}">${icon("dispatch", 16)} Dispatch</button>
                </div>
              </article>`,
            )
            .join("")
        : `<article class="empty-card"><strong>No active work orders loaded.</strong><p>Refresh snapshot or inspect War Room work-order pack.</p></article>`
    }
  </div>`;
}

function renderStatusList(items = [], emptyText = "No records loaded.") {
  return `<div class="compact-list">
    ${
      items.length
        ? items
            .map(
              (item) => `<article>
                <header><strong>${esc(item.title || item.item || "UNKNOWN")}</strong><em class="${statusClass(item.status)}">${esc(item.status || "LOCAL")}</em></header>
                <p>${esc(truncate(item.detail || item.nextAction || item.sourceEvidence || "UNKNOWN", 180))}</p>
                <span>${esc(item.sourceEvidence || "UNKNOWN")}</span>
              </article>`,
            )
            .join("")
        : `<article class="empty-card"><strong>${esc(emptyText)}</strong></article>`
    }
  </div>`;
}

function renderAgentAssignments(control) {
  const routes = control.agentAssignments?.routes || [];
  return `<div class="compact-list">
    ${
      routes.length
        ? routes
            .map(
              (route) => `<article>
                <header><strong>${esc(route.targetAgent || "UNKNOWN")}</strong><em>${esc(route.count || 0)} items</em></header>
                <p>${esc((route.lanes || []).join(", ") || "UNKNOWN lanes")}</p>
                <span>${esc((route.owners || []).join(", ") || "UNKNOWN owners")} / ${esc(route.highestPriority || "P3")}</span>
              </article>`,
            )
            .join("")
        : `<article class="empty-card"><strong>No route assignments loaded.</strong></article>`
    }
  </div>`;
}

const launchScoreRows = [
  ["Landing/public surface", 3, 6, 6, 6, 7, 2, 4, 2, 2, "GAP"],
  ["Onboarding and auth", 2, 5, 4, 5, 6, 1, 3, 1, 3, "GAP"],
  ["Today cockpit", 8, 8, 9, 7, 8, 5, 8, 6, 4, "PARTIAL"],
  ["Core run-control workflow", 8, 9, 8, 7, 7, 4, 8, 6, 4, "PARTIAL"],
  ["Proof/review/promote loop", 8, 9, 8, 7, 7, 4, 8, 6, 5, "PARTIAL"],
  ["Provider/model/source boundaries", 9, 9, 8, 7, 8, 3, 8, 5, 4, "PARTIAL"],
  ["Revenue/pricing path", 5, 7, 5, 6, 7, 4, 4, 2, 3, "GAP"],
  ["Mobile operator access", 7, 7, 7, 6, 7, 3, 6, 4, 4, "PARTIAL"],
  ["Backend/API assumptions", 6, 8, 7, 5, 7, 2, 5, 4, 5, "PARTIAL"],
  ["Docs and deploy readiness", 7, 8, 6, 5, 7, 3, 6, 3, 4, "PARTIAL"],
];

const launchComponents = [
  ["Positioning", "PARTIAL", "Local AI operating system for VCOS work, not a public SaaS dashboard yet."],
  ["Pricing state", "UNKNOWN", "No live checkout, price object, invoice route, or buyer-facing offer evidence in this product."],
  ["Onboarding", "GAP", "No account creation path. Current mode is local founder/operator only."],
  ["Demo flow", "PARTIAL", "Local demo works through Today -> Launch OS -> Queue -> Runs -> Closeout -> Review -> Promote."],
  ["Support path", "GAP", "No user support channel, contact surface, or escalation SLA in app."],
  ["Legal/safety copy", "PARTIAL", "Strong local guardrails exist; public-facing legal/payment claims are not ready."],
  ["Analytics plan", "UNKNOWN", "No provider telemetry is verified. Do not infer usage."],
  ["Telemetry plan", "GAP", "Local activity exists; product analytics/observability are not wired."],
  ["Feedback loop", "PARTIAL", "Activity and Decisions can stage evidence, but no customer feedback intake exists."],
  ["Incident response", "GAP", "No incident workflow beyond local tickets and guardrail copy."],
  ["Release notes", "PARTIAL", "README and local commits exist; no public release channel yet."],
  ["Rollback plan", "PARTIAL", "Git history exists; no deployed rollback path because live deploy is UNKNOWN."],
  ["Product VCOS updates", "PARTIAL", "War Room/Product VCOS data feeds the app; promotion remains manual."],
];

const revenuePathRows = [
  ["ICP", "Founder/operators building governed AI companies or client VCOS pilots."],
  ["Offer", "Private local operating cockpit plus setup advisory for one product/company operating system."],
  ["Free/demo tier", "Local demo with seeded evidence, no provider/live claims, no payments."],
  ["Paid tier", "Managed setup and training after proof of value; pricing not live inside product."],
  ["Professional tier", "Custom VCOS cockpit, product proof gates, local run-control, and closeout workflows."],
  ["Enterprise path", "Security-reviewed deployment, SSO/provider integrations, audit retention, and support SLA."],
  ["CTA strategy", "Schedule/manual review first. No checkout until provider/payment/legal evidence is complete."],
  ["Trust before payment", "GitHub source, local build proof, screenshots, support path, legal copy, and provider boundaries."],
];

function launchAverage(row) {
  const scores = row.slice(1, 10).map(Number);
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function renderLaunchScoreTable(rows) {
  return `<div class="launch-score-table">
    <div class="launch-score-head"><span>Surface</span><span>Avg</span><span>Clarity</span><span>Trust</span><span>Useful</span><span>Beauty</span><span>Speed</span><span>Convert</span><span>Demo</span><span>Launch</span><span>Risk</span><span>Status</span></div>
    ${rows
      .map(
        (row) => `<div class="launch-score-row">
          <strong>${esc(row[0])}</strong>
          <em>${esc(launchAverage(row))}</em>
          ${row.slice(1, 10).map((score) => `<span>${esc(score)}</span>`).join("")}
          <b class="${statusClass(row[10])}">${esc(row[10])}</b>
        </div>`,
      )
      .join("")}
  </div>`;
}

function renderLaunchComponentGrid(items) {
  return `<div class="launch-component-grid">
    ${items
      .map(
        ([label, status, detail]) => `<article>
          <header><strong>${esc(label)}</strong><em class="${statusClass(status)}">${esc(status)}</em></header>
          <p>${esc(detail)}</p>
        </article>`,
      )
      .join("")}
  </div>`;
}

function renderDefinitionList(rows) {
  return `<dl class="launch-definition-list">
    ${rows.map(([term, detail]) => `<dt>${esc(term)}</dt><dd>${esc(detail)}</dd>`).join("")}
  </dl>`;
}

function renderLaunchOs() {
  const control = controlSurface();
  const adapterCount = state.adapterHealth?.adapters?.length || 0;
  const adapterOk = state.adapterHealth?.adapters?.filter((adapter) => adapter.status === "ok").length || 0;
  const activeTickets = state.tickets.filter((ticket) => !/CLOSED|DONE|PARKED/i.test(ticket.status || "")).length;
  const pendingDirector = pendingDirectorBundles().length;
  renderShell(`
    <div class="launch-grid">
      <section class="objective-panel launch-hero wide">
        <div class="panel-title">${icon("launch")}<span>Launch operating brief</span></div>
        <h2>MDS Command Centre is a local AI operating system for governing product execution, evidence, and agent work before public/live claims.</h2>
        <p>It should own the category of founder-grade VCOS cockpit: local-first, proof-gated, source-aware, agent-ready, and honest about UNKNOWN provider/payment/live state.</p>
        <div class="launch-truth-strip">
          <span><strong>Primary user</strong>Shrish / MDS operator</span>
          <span><strong>Workflow</strong>Evidence -> ticket -> run -> proof -> review -> promote</span>
          <span><strong>Promise</strong>Less chaos, more governed shipping</span>
          <span><strong>Risk</strong>Pretending local proof is live proof</span>
        </div>
      </section>
      <section class="metrics-panel launch-metrics wide">
        ${metric("Adapter health", adapterCount ? `${adapterOk}/${adapterCount}` : "UNKNOWN", "health")}
        ${metric("Active tickets", activeTickets, "tickets")}
        ${metric("Director packets", pendingDirector, "review")}
        ${metric("Revenue mode", "MANUAL", "warning")}
        ${metric("Live state", "UNKNOWN", "lock")}
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Section truth and category</span></div>
        ${renderDefinitionList([
          ["One-sentence truth", "A local proof-gated command cockpit that turns MDS source evidence into accountable agent work without crossing provider, payment, deploy, or live-state boundaries."],
          ["Category definition", "Founder VCOS operating cockpit: part command center, part proof ledger, part agent run-control desk."],
          ["Primary user", "The founder/operator who needs one governed surface for product execution."],
          ["Secondary user", "Director, reviewer, or builder agent receiving scoped packets and closeout requirements."],
          ["Primary workflow", "Inspect source truth, route one work item, create run-control, collect proof, review, stage promotion."],
          ["Revenue path", "Private demo and managed VCOS setup first; public self-serve checkout only after trust, support, legal, and provider/payment evidence are ready."],
          ["Strongest wedge", "Local truth and approval boundaries that agentic coding tools and issue trackers do not own."],
          ["Biggest delusion/risk", "Calling it deployable SaaS before auth, support, payment, telemetry, and provider evidence exist."],
        ])}
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("proof")}<span>Whole-section scorecard</span></div>
        ${renderLaunchScoreTable(launchScoreRows)}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("runtime")}<span>Ideal architecture</span></div>
        <div class="launch-flow">
          ${["Source intake", "Local ticket", "Run control", "Proof closeout", "Review", "Promotion draft", "Manual authority"].map((step) => `<span>${esc(step)}</span>`).join("")}
        </div>
        ${renderDefinitionList([
          ["Routes", "Today, Launch OS, Search, Queue, Boards, Operator OS, System lanes, Execution lanes, Govern lanes."],
          ["Roles", "Founder/operator, director/reviewer, builder agent, auditor, future client admin."],
          ["Permission model", "Local write to app state only; red/provider/payment/deploy actions become request packets."],
          ["State model", "Snapshot JSON plus local tickets, activity, decisions, runs, research, evidence, requests."],
          ["Provider mode", "UNKNOWN/request-only until provider dashboard evidence is intentionally collected."],
        ])}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("operator")}<span>UX journey</span></div>
        ${renderDefinitionList([
          ["First visit", "See current truth, next safe action, blockers, and why live claims are capped."],
          ["First value moment", "Create a local ticket or run packet from real source evidence."],
          ["Repeat loop", "Search, dispatch, close out, review, and promote evidence."],
          ["Power loop", "Bundle decisions, route to directors, harvest reusable VCOS patterns."],
          ["Failure path", "Stop, preserve UNKNOWN, create resolver packet, do not fake green state."],
        ])}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("warning")}<span>Revenue path</span></div>
        ${renderDefinitionList(revenuePathRows)}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("check")}<span>Launch package</span></div>
        ${renderLaunchComponentGrid(launchComponents)}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Deterministic spine</span></div>
        ${renderDefinitionList([
          ["Rules", "UNKNOWN preservation, source evidence, stop conditions, red action gates, local-only state writes."],
          ["Validators", "Static checks, capability validator, studio readiness validator, build, browser proof."],
          ["State machines", "Ticket status, run readiness, review acceptance, promotion preflight, decision disposition."],
          ["Unsafe AI zones", "Provider truth, payments, legal/public claims, deploy decisions, secrets, official ledger promotion."],
          ["AI assist zones", "Draft packets, summarize source evidence, propose next actions, identify missing proof."],
        ])}
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("promote")}<span>30 / 90 / 365 day product arc</span></div>
        ${renderDefinitionList([
          ["30 days", "Private founder cockpit with clean proof loops, one product launch lane, and GitHub source parity."],
          ["90 days", "Client-ready VCOS pilot package with auth/support/legal/payment readiness or explicit managed-service fallback."],
          ["1 year", "Governed AI company OS with configurable departments, provider connectors, audit retention, and paid deployments."],
        ])}
      </section>
      <section class="objective-panel wide">
        <div class="panel-title">${icon("lock")}<span>Current claim ceiling</span></div>
        <p>${esc(control.claimCeiling || "Local Command Centre evidence only. Live provider/payment/auth/schema/deploy states remain UNKNOWN.")}</p>
      </section>
    </div>`);
}

function renderDashboardProofStrip({ control, queueCount, activeTickets, openRuns, directorBundles, unknownCount }) {
  const nextAction = control.nextAction?.title || state.snapshot.today.nextSafeAction || "UNKNOWN";
  const revenueMode = control.revenue?.status || "UNKNOWN";
  return `<section class="dashboard-proof-strip wide" aria-label="Dashboard proof handoff">
    <div>
      <span class="eyebrow">Dashboard proof handoff</span>
      <h2>Local operating proof before agent or live claims.</h2>
      <p>Today can stage tickets, runs, decisions, and evidence packets. It cannot prove provider, payment, deploy, auth, schema, revenue, or live state.</p>
    </div>
    <div class="dashboard-proof-grid">
      <span><strong>Next</strong>${esc(nextAction)}</span>
      <span><strong>Work</strong>${esc(queueCount)} orders / ${esc(activeTickets)} tickets / ${esc(openRuns)} runs</span>
      <span><strong>Review</strong>${esc(directorBundles.length)} director packets</span>
      <span><strong>Unknowns</strong>${esc(unknownCount)} rows / ${esc(revenueMode)}</span>
    </div>
  </section>`;
}

async function loadInboxEvents() {
  try {
    const payload = await apiJson("/api/inbox");
    if (Array.isArray(payload.events)) {
      state.inboxPersistence = `file-backed: ${payload.store || "src/data/localInboxEvents.json"}`;
      localStorage.setItem(storageInboxKey, JSON.stringify(payload.events));
      return payload.events;
    }
  } catch {
    state.inboxPersistence = "localStorage fallback";
  }
  try {
    const stored = JSON.parse(localStorage.getItem(storageInboxKey) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

async function loadWorkspaces() {
  try {
    const payload = await apiJson("/api/workspaces");
    state.workspacePersistence = `file-backed: ${payload.store || "src/data/localWorkspaces.json"}`;
    return Array.isArray(payload.records) ? payload.records : [];
  } catch {
    state.workspacePersistence = "local API unavailable";
    return [];
  }
}

async function loadVoiceState() {
  try {
    const [runtime, commands] = await Promise.all([apiJson("/api/voice/status"), apiJson("/api/voice/commands")]);
    state.voiceRuntime = runtime;
    state.voiceCommands = Array.isArray(commands.records) ? commands.records : [];
  } catch {
    state.voiceRuntime = { status: "BLOCKED_LOCAL_API_OFFLINE", continuousCaptureAllowed: false, engine: "UNKNOWN", model: "UNKNOWN", wakeWord: "Midas" };
    state.voiceCommands = [];
  }
}

async function loadModelRouter() {
  try {
    state.modelRouter = await apiJson("/api/model-router/status");
  } catch {
    state.modelRouter = { state: { authProfiles: [], failures: [], receipts: [] }, inventory: [], chains: {}, credentialValuesRead: false, status: "LOCAL_API_OFFLINE" };
  }
}

function blankCanvasDocument() {
  const now = nowIso();
  return {
    id: `CANVAS-${Date.now().toString(36).toUpperCase()}`,
    title: "Operator canvas",
    workspaceId: "UNASSIGNED",
    status: "DRAFT_LOCAL",
    authority: "LOCAL_A2UI_DRAFT_ONLY",
    executionAllowed: false,
    createdAt: now,
    updatedAt: now,
    components: [
      { id: `CMP-${Date.now().toString(36).toUpperCase()}-H`, type: "heading", label: "Heading", text: "Workspace command brief", value: "", tone: "neutral", width: "full", rows: [] },
      { id: `CMP-${Date.now().toString(36).toUpperCase()}-N`, type: "notice", label: "Authority", text: "Local draft only. Operator review required.", value: "", tone: "info", width: "full", rows: [] },
    ],
  };
}

async function loadCanvasDocuments() {
  try {
    const payload = await apiJson("/api/canvas");
    state.canvasPersistence = `file-backed: ${payload.store || "src/data/localCanvasDocuments.json"}`;
    return Array.isArray(payload.records) && payload.records.length ? payload.records : [blankCanvasDocument()];
  } catch {
    state.canvasPersistence = "browser session draft";
    return [blankCanvasDocument()];
  }
}

async function saveCanvasDocuments() {
  const payload = await apiJson("/api/canvas", { method: "PUT", body: JSON.stringify({ records: state.canvasDocuments }) });
  if (Array.isArray(payload.records)) state.canvasDocuments = payload.records;
  state.canvasPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
}

function selectedCanvasDocument() {
  return state.canvasDocuments.find((document) => document.id === state.selectedCanvasId) || state.canvasDocuments[0] || blankCanvasDocument();
}

function selectedCanvasComponent() {
  const document = selectedCanvasDocument();
  return document.components.find((component) => component.id === state.selectedCanvasComponentId) || document.components[0] || null;
}

function canvasComponent(type) {
  const id = `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const defaults = {
    heading: ["Section heading", "Untitled section", "", "full"],
    text: ["Text", "Add operator context.", "", "half"],
    metric: ["Metric", "", "UNKNOWN", "third"],
    button: ["Command", "Review draft", "", "third"],
    input: ["Input", "Operator supplied value", "", "half"],
    notice: ["Notice", "Local draft only.", "", "full"],
    divider: ["Divider", "", "", "full"],
    table: ["Table", "", "", "full"],
  }[type] || ["Text", "", "", "half"];
  return { id, type, label: defaults[0], text: defaults[1], value: defaults[2], tone: type === "notice" ? "info" : "neutral", width: defaults[3], rows: type === "table" ? [["Field", "Value"], ["Status", "UNKNOWN"]] : [] };
}

function renderCanvasComponent(component, selected) {
  let content = "";
  if (component.type === "heading") content = `<h2>${esc(component.text || component.label)}</h2>`;
  if (component.type === "text") content = `<p>${esc(component.text)}</p>`;
  if (component.type === "metric") content = `<span>${esc(component.label)}</span><strong>${esc(component.value)}</strong>`;
  if (component.type === "button") content = `<button type="button" disabled>${esc(component.text || component.label)}</button>`;
  if (component.type === "input") content = `<label>${esc(component.label)}<input type="text" value="${esc(component.value)}" placeholder="${esc(component.text)}" disabled></label>`;
  if (component.type === "notice") content = `<strong>${esc(component.label)}</strong><p>${esc(component.text)}</p>`;
  if (component.type === "divider") content = `<hr>`;
  if (component.type === "table") content = `<strong>${esc(component.label)}</strong><div class="canvas-mini-table">${(component.rows || []).map((row) => `<div>${row.map((cell) => `<span>${esc(cell)}</span>`).join("")}</div>`).join("")}</div>`;
  return `<article draggable="true" class="canvas-node ${esc(component.type)} ${esc(component.tone)} width-${esc(component.width)} ${selected ? "selected" : ""}" data-canvas-component="${esc(component.id)}"><div class="canvas-node-chrome"><span>${icon("canvas", 14)} ${esc(component.type)}</span><div><button type="button" title="Move up" data-canvas-move="up" data-component-id="${esc(component.id)}">↑</button><button type="button" title="Move down" data-canvas-move="down" data-component-id="${esc(component.id)}">↓</button></div></div><div class="canvas-node-body">${content}</div></article>`;
}

function renderCanvas() {
  const document = selectedCanvasDocument();
  const selected = selectedCanvasComponent();
  const workspaceOptions = ["UNASSIGNED", ...state.workspaces.map((workspace) => workspace.id)];
  renderShell(`
    <div class="a2ui-shell">
      <aside class="canvas-palette">
        <div class="panel-title">${icon("plus")}<span>Components</span></div>
        <div class="canvas-palette-grid">${["heading", "text", "metric", "button", "input", "notice", "divider", "table"].map((type) => `<button type="button" data-canvas-add="${type}">${icon(type === "button" ? "check" : type === "notice" ? "warning" : "canvas", 16)} ${esc(type)}</button>`).join("")}</div>
        <div class="canvas-document-list"><div class="panel-title">${icon("file")}<span>Documents</span></div>${state.canvasDocuments.map((item) => `<button type="button" class="${item.id === document.id ? "active" : ""}" data-canvas-document="${esc(item.id)}"><strong>${esc(item.title)}</strong><span>${esc(item.status)}</span></button>`).join("")}</div>
        <div class="dispatch-actions"><button type="button" data-action="new-canvas">${icon("plus", 16)} New</button><button type="button" class="primary" data-action="save-canvas">${icon("save", 16)} Save</button></div>
        <p class="unknown-note">${esc(state.canvasPersistence)}</p>
      </aside>
      <main class="canvas-stage-panel">
        <header class="canvas-toolbar"><div><span class="eyebrow">${esc(document.workspaceId)}</span><h2>${esc(document.title)}</h2></div><div><em class="${statusClass(document.status)}">${esc(document.status)}</em><span>${esc(document.components.length)} components</span></div></header>
        ${state.canvasNotice ? `<div class="pairing-notice" role="status"><strong>Canvas status</strong><code>${esc(state.canvasNotice)}</code></div>` : ""}
        <section class="canvas-stage" aria-label="A2UI canvas">${document.components.length ? document.components.map((component) => renderCanvasComponent(component, selected?.id === component.id)).join("") : `<div class="canvas-empty"><strong>Empty canvas</strong><p>Add an allowlisted component from the palette.</p></div>`}</section>
        <footer class="canvas-statusbar"><span>authority: LOCAL_A2UI_DRAFT_ONLY</span><span>executionAllowed=false</span><span>agent imports require sanitization</span></footer>
      </main>
      <aside class="canvas-inspector">
        <form id="canvas-document-form" class="canvas-inspector-form"><div class="panel-title">${icon("canvas")}<span>Document</span></div>${input("Title", "title", document.title)}${select("Workspace", "workspaceId", document.workspaceId, workspaceOptions)}<button type="submit">${icon("save", 16)} Apply document</button></form>
        ${selected ? `<form id="canvas-component-form" class="canvas-inspector-form"><div class="panel-title">${icon("review")}<span>Selected component</span></div><input type="hidden" name="id" value="${esc(selected.id)}">${input("Label", "label", selected.label)}${textarea("Text", "text", selected.text)}${input("Value", "value", selected.value)}${select("Tone", "tone", selected.tone, ["neutral", "info", "success", "warning", "danger"])}${select("Width", "width", selected.width, ["third", "half", "full"])}<div class="dispatch-actions"><button type="submit">${icon("check", 16)} Apply</button><button type="button" data-action="delete-canvas-component">${icon("warning", 16)} Delete</button></div></form>` : `<section class="empty-card"><strong>No component selected.</strong><p>Select a canvas component to edit it.</p></section>`}
        <form id="canvas-import-form" class="canvas-inspector-form"><div class="panel-title">${icon("upload")}<span>Agent A2UI import</span></div><p>Allowlisted JSON only. Server sanitization runs before preview.</p>${textarea("A2UI JSON", "payload", '{"title":"Agent draft","components":[{"type":"heading","text":"Review queue"}]}')}<button type="submit">${icon("upload", 16)} Sanitize and import</button></form>
      </aside>
    </div>`);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Audio encoding failed."));
    reader.readAsDataURL(blob);
  });
}

async function submitVoiceChunk(blob) {
  if (!blob.size) return;
  try {
    const payload = await apiJson("/api/voice/audio", { method: "POST", body: JSON.stringify({ mimeType: blob.type.split(";")[0], audioBase64: await blobToBase64(blob) }) });
    state.voiceCommands = Array.isArray(payload.records) ? payload.records : state.voiceCommands;
    state.voiceNotice = `${payload.record?.status || "DRAFT_RECORDED"}: ${payload.record?.command || "wake audio processed"}`;
  } catch (error) {
    state.voiceNotice = `Voice chunk blocked: ${error.message}`;
    stopVoiceCapture();
  }
  render();
}

async function startVoiceCapture() {
  if (!state.voiceRuntime?.continuousCaptureAllowed || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    state.voiceNotice = "Continuous capture is blocked until the local offline engine, model, browser microphone API, and loopback service are ready.";
    render();
    return;
  }
  voiceMediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
  voiceMediaRecorder = new MediaRecorder(voiceMediaStream, { mimeType: "audio/webm" });
  voiceMediaRecorder.addEventListener("dataavailable", (event) => submitVoiceChunk(event.data));
  voiceMediaRecorder.start(5000);
  state.voiceListening = true;
  state.voiceNotice = `Listening locally for “${state.voiceRuntime.wakeWord || "Midas"}”. Five-second chunks are sent only to this loopback service.`;
  render();
}

function stopVoiceCapture() {
  if (voiceMediaRecorder && voiceMediaRecorder.state !== "inactive") voiceMediaRecorder.stop();
  if (voiceMediaStream) voiceMediaStream.getTracks().forEach((track) => track.stop());
  voiceMediaRecorder = null;
  voiceMediaStream = null;
  state.voiceListening = false;
}

async function saveInboxEvents() {
  state.inboxEvents = state.inboxEvents.slice(0, 300);
  localStorage.setItem(storageInboxKey, JSON.stringify(state.inboxEvents));
  try {
    const payload = await apiJson("/api/inbox", { method: "PUT", body: JSON.stringify({ events: state.inboxEvents }) });
    if (Array.isArray(payload.events)) state.inboxEvents = payload.events;
    state.inboxPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  } catch {
    state.inboxPersistence = "localStorage fallback";
  }
}

async function intakeInboxEvent(event) {
  const payload = await apiJson("/api/inbox/intake", { method: "POST", body: JSON.stringify({ event }) });
  if (Array.isArray(payload.events)) state.inboxEvents = payload.events;
  state.selectedInboxEventId = payload.event?.id || state.inboxEvents[0]?.id || "";
  state.inboxPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
  state.inboxPairingNotice = payload.pairingKey
    ? `Pairing key ${payload.pairingKey} issued once for ${payload.event.streamId}. Approve locally with: midas pairing approve ${payload.pairingKey}`
    : `${payload.event?.streamId || "Stream"} remains ${payload.event?.pairingStatus || "QUARANTINED"}.`;
  localStorage.setItem(storageInboxKey, JSON.stringify(state.inboxEvents));
  return payload.event;
}

function selectedInboxEvent() {
  return state.inboxEvents.find((event) => event.id === state.selectedInboxEventId) || state.inboxEvents[0] || null;
}

function inboxRoutingPacket(event) {
  if (!event) return "No inbox event selected.";
  return [
    "# MDS Local Inbox Routing Preview",
    "status: LOCAL_PACKET_ONLY",
    `event_id: ${event.id}`,
    `channel: ${event.channel}`,
    `sender_label: ${event.senderLabel}`,
    `subject: ${event.subject}`,
    `triage_status: ${event.status}`,
    `risk: ${event.risk}`,
    `route_target: ${event.routeTarget || "UNASSIGNED"}`,
    `provenance: ${event.provenance}`,
    `stream_id: ${event.streamId || "UNKNOWN"}`,
    `pairing_status: ${event.pairingStatus || "QUARANTINED"}`,
    `code_execution_allowed: ${event.executionAllowed === true ? "PAIRED_STREAM_ONLY" : "NO"}`,
    "external_channel_state: UNKNOWN",
    "stop_condition: Do not run a code-execution model unless pairing_status is PAIRED and a separate governed run authorizes execution. Never send, reply, connect a provider, read credentials, or treat sender identity as verified.",
  ].join("\n");
}

function renderInbox() {
  const counts = Object.fromEntries(["NEW", "TRIAGED", "ROUTED", "CLOSED"].map((status) => [status, state.inboxEvents.filter((event) => event.status === status).length]));
  const visible = state.inboxFilter === "all" ? state.inboxEvents : state.inboxEvents.filter((event) => event.status === state.inboxFilter);
  const selected = selectedInboxEvent();
  renderShell(`
    <div class="inbox-grid">
      <section class="objective-panel wide inbox-brief">
        <div class="panel-title">${icon("inbox")}<span>Local intake boundary</span></div>
        <h2>One queue for customer inquiries, system notifications, and operator signals.</h2>
        <p>Manual and synthetic records only. WhatsApp, Telegram, iMessage, and Feishu connectivity, sender identity, delivery, and live provider state remain UNKNOWN.</p>
        ${state.inboxPairingNotice ? `<div class="pairing-notice" role="status"><strong>Pairing gate</strong><code>${esc(state.inboxPairingNotice)}</code></div>` : ""}
        <div class="inbox-counts">${["NEW", "TRIAGED", "ROUTED", "CLOSED"].map((status) => `<span><strong>${counts[status]}</strong>${status}</span>`).join("")}</div>
      </section>
      <form class="research-form inbox-compose" id="inbox-intake-form">
        <div class="panel-title">${icon("plus")}<span>Record local signal</span></div>
        <div class="form-grid two">
          ${select("Source", "channel", "manual", ["manual", "synthetic", "system"])}
          ${select("Risk", "risk", "UNKNOWN", ["UNKNOWN", "LOW", "MEDIUM", "HIGH"])}
        </div>
        ${input("Sender label", "senderLabel", "", "Operator, customer label, or system")}
        ${input("Subject", "subject", "", "What needs attention?")}
        ${textarea("Signal", "body", "")}
        ${select("Route target", "routeTarget", "UNASSIGNED", ["UNASSIGNED", "Customer Care", "Product Ops", "DevOps", "Sales", "Founder Review"])}
        <div class="dispatch-actions"><button class="primary" type="submit">${icon("save", 16)} Add to inbox</button><button type="button" data-action="seed-inbox-event">${icon("plus", 16)} Add synthetic sample</button></div>
      </form>
      <section class="list-panel inbox-list">
        <div class="panel-title">${icon("inbox")}<span>Intake queue</span><em>${esc(state.inboxPersistence)}</em></div>
        <div class="review-filter-bar">${["all", "NEW", "TRIAGED", "ROUTED", "CLOSED"].map((filter) => `<button type="button" class="${state.inboxFilter === filter ? "active" : ""}" data-inbox-filter="${filter}">${esc(filter)}</button>`).join("")}</div>
        <div class="inbox-event-list">${visible.length ? visible.map((event) => `<button type="button" class="inbox-event ${selected?.id === event.id ? "selected" : ""}" data-inbox-event="${esc(event.id)}"><span class="inbox-event-top"><em class="${statusClass(event.status)}">${esc(event.status)}</em><time>${esc(new Date(event.receivedAt).toLocaleString())}</time></span><strong>${esc(event.subject)}</strong><span>${esc(event.senderLabel)} · ${esc(event.channel)} · ${esc(event.risk)}</span></button>`).join("") : `<article class="empty-card"><strong>No ${esc(state.inboxFilter === "all" ? "local" : state.inboxFilter)} signals.</strong><p>Record a manual event or add a synthetic sample.</p></article>`}</div>
      </section>
      <section class="table-panel inbox-detail">
        <div class="panel-title">${icon("dispatch")}<span>Routing preview</span></div>
        ${selected ? `<header><div><em class="${statusClass(selected.status)}">${esc(selected.status)}</em><h2>${esc(selected.subject)}</h2><p>${esc(selected.body || "No signal body supplied.")}</p></div></header><dl class="launch-definition-list"><dt>Sender</dt><dd>${esc(selected.senderLabel)}</dd><dt>Source</dt><dd>${esc(selected.channel)} / ${esc(selected.provenance)}</dd><dt>Risk</dt><dd>${esc(selected.risk)}</dd><dt>Route</dt><dd>${esc(selected.routeTarget || "UNASSIGNED")}</dd><dt>Pairing</dt><dd><em class="${statusClass(selected.pairingStatus)}">${esc(selected.pairingStatus || "QUARANTINED")}</em></dd><dt>Workspace</dt><dd>${esc(state.workspaces.find((workspace) => workspace.streamId === selected.streamId)?.id || "UNASSIGNED")}</dd><dt>Code execution</dt><dd>${selected.executionAllowed === true ? "Pairing gate passed; separate run approval still required" : "BLOCKED"}</dd><dt>External state</dt><dd>UNKNOWN</dd></dl><div class="inbox-state-actions">${["NEW", "TRIAGED", "ROUTED", "CLOSED"].map((status) => `<button type="button" data-inbox-status="${status}" ${selected.status === status ? "disabled" : ""}>${esc(status)}</button>`).join("")}</div><pre class="inbox-packet">${esc(inboxRoutingPacket(selected))}</pre><div class="dispatch-actions"><button type="button" data-action="route-inbox-workspace" ${selected.pairingStatus === "PAIRED" ? "" : "disabled"}>${icon("workspaces", 16)} Route to workspace</button><button type="button" data-action="copy-inbox-packet">${icon("file", 16)} Copy routing preview</button></div>` : `<article class="empty-card"><strong>No event selected.</strong><p>Add or select a local signal to review its routing packet.</p></article>`}
      </section>
    </div>`);
}

function renderWorkspaces() {
  const selected = state.workspaces.find((workspace) => workspace.id === state.selectedWorkspaceId) || state.workspaces[0] || null;
  renderShell(`
    <div class="workspace-router-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("workspaces")}<span>Isolated local workspace router</span></div>
        <h2>One paired stream, one contained workspace.</h2>
        <p>Workspace paths are generated under <code>output/workspaces/</code>. Routing cannot select arbitrary paths, grant execution authority, connect provider accounts, or prove external identity.</p>
        ${state.workspaceNotice ? `<div class="pairing-notice" role="status"><strong>Router status</strong><code>${esc(state.workspaceNotice)}</code></div>` : ""}
      </section>
      <section class="list-panel workspace-list">
        <div class="panel-title">${icon("workspaces")}<span>Workspace registry</span><em>${esc(state.workspacePersistence)}</em></div>
        <div class="inbox-event-list">${state.workspaces.length ? state.workspaces.map((workspace) => `<button type="button" class="inbox-event ${selected?.id === workspace.id ? "selected" : ""}" data-workspace="${esc(workspace.id)}"><span class="inbox-event-top"><em class="${statusClass(workspace.status)}">${esc(workspace.status)}</em><time>${esc(new Date(workspace.updatedAt).toLocaleString())}</time></span><strong>${esc(workspace.label)}</strong><span>${esc(workspace.id)} · ${esc(workspace.agents.join(", "))}</span></button>`).join("") : `<article class="empty-card"><strong>No isolated workspaces.</strong><p>Pair an Inbox stream, then route it from the Inbox detail panel.</p></article>`}</div>
      </section>
      <section class="table-panel workspace-detail">
        <div class="panel-title">${icon("proof")}<span>Workspace boundary</span></div>
        ${selected ? `<h2>${esc(selected.label)}</h2><dl class="launch-definition-list"><dt>Workspace ID</dt><dd>${esc(selected.id)}</dd><dt>Stream ID</dt><dd>${esc(selected.streamId)}</dd><dt>Runtime path</dt><dd>${esc(selected.relativePath)}</dd><dt>Agents</dt><dd>${esc(selected.agents.join(", "))}</dd><dt>Context</dt><dd>${esc(selected.contextNotes)}</dd><dt>Execution authority</dt><dd>${esc(selected.executionAuthority)}</dd><dt>External state</dt><dd>${esc(selected.externalState)}</dd></dl><div class="stack-list"><article><strong>manifest.json</strong><p>Workspace identity, paired stream, allowlisted agents, and authority ceiling.</p></article><article><strong>context.md</strong><p>Bounded local context notes with explicit execution and external-state limits.</p></article><article><strong>inbox-events.json</strong><p>Event references only; no provider payload archive or credential material.</p></article></div>` : `<article class="empty-card"><strong>No workspace selected.</strong><p>Workspace artifacts appear after a paired stream is routed.</p></article>`}
      </section>
    </div>`);
}

function renderVoice() {
  const runtime = state.voiceRuntime || { status: "UNKNOWN", continuousCaptureAllowed: false };
  renderShell(`
    <div class="voice-grid">
      <section class="objective-panel wide voice-hero">
        <div class="panel-title">${icon("voice")}<span>Local voice wake service</span></div>
        <h2>Say “Midas” to prepare a command draft.</h2>
        <p>Audio and transcripts stay on this loopback service. Voice cannot execute code, approve pairing, mutate providers, deploy, move money, read secrets, or send messages.</p>
        <div class="voice-runtime-strip">
          <span><strong>Runtime</strong><em class="${statusClass(runtime.status)}">${esc(runtime.status)}</em></span>
          <span><strong>STT engine</strong>${esc(runtime.engine || "UNKNOWN")}</span>
          <span><strong>Model</strong>${esc(runtime.model || "UNKNOWN")}</span>
          <span><strong>Wake word</strong>${esc(runtime.wakeWord || "Midas")}</span>
        </div>
        ${state.voiceNotice ? `<div class="pairing-notice" role="status"><strong>Voice status</strong><code>${esc(state.voiceNotice)}</code></div>` : ""}
        <div class="dispatch-actions"><button type="button" class="primary" data-action="start-voice" ${runtime.continuousCaptureAllowed && !state.voiceListening ? "" : "disabled"}>${icon("voice", 16)} Start listening</button><button type="button" data-action="stop-voice" ${state.voiceListening ? "" : "disabled"}>${icon("lock", 16)} Stop</button></div>
      </section>
      <form class="research-form voice-test-form" id="voice-transcript-form">
        <div class="panel-title">${icon("file")}<span>Wake-gate test</span></div>
        <p>Test the deterministic command gate without microphone access or STT execution.</p>
        ${textarea("Local transcript", "transcript", "Midas open inbox")}
        <div class="dispatch-actions"><button type="submit">${icon("check", 16)} Evaluate transcript</button></div>
      </form>
      <section class="list-panel voice-command-list">
        <div class="panel-title">${icon("activity")}<span>Command drafts</span><em>${esc(state.voiceCommands.length)} local</em></div>
        <div class="stack-list">${state.voiceCommands.length ? state.voiceCommands.map((command) => `<article><header><strong>${esc(command.command || command.status)}</strong><em class="${statusClass(command.status)}">${esc(command.status)}</em></header><p>${esc(command.transcript)}</p><span>${esc(command.action)} · executionAllowed=false</span>${command.action === "OPEN_VIEW" ? `<button type="button" data-voice-view="${esc(command.targetView)}">Open ${esc(command.targetView)} manually</button>` : ""}</article>`).join("") : `<article class="empty-card"><strong>No voice drafts.</strong><p>Use the transcript gate or install the supported local engine and model.</p></article>`}</div>
      </section>
    </div>`);
}

function renderToday() {
  const control = controlSurface();
  const rows = state.snapshot.productReadiness.slice(0, 7);
  const productVcos = control.productVcos || [];
  const queueCount = control.workOrders?.active?.length || state.snapshot.workQueue?.length || 0;
  const directorBundles = pendingDirectorBundles();
  const activeTickets = state.tickets.filter((ticket) => !/CLOSED|DONE|PARKED/i.test(ticket.status || "")).length;
  const openRuns = state.runs.filter((run) => !/CLOSED|DONE|BLOCKED/i.test(run.status || "")).length;
  const blockedCount = rows.filter((row) => `${row.readiness} ${row.biggest_blocker}`.toUpperCase().includes("BLOCK")).length;
  const unknownCount = rows.filter((row) => Object.values(row).some((value) => String(value).toUpperCase().includes("UNKNOWN"))).length;
  const blockers = state.snapshot.today.blockers.length ? state.snapshot.today.blockers : ["Provider/payment/deploy/schema states remain UNKNOWN unless verified."];
  const approvals = state.snapshot.today.approvals.length ? state.snapshot.today.approvals : ["Deploys, payment actions, external messages, provider mutations, and secret handling require approval."];

  renderShell(`
    <div class="control-grid">
      <section class="objective-panel control-hero">
        <div class="panel-title">${icon("check")}<span>One active objective</span></div>
        <h2>${esc(state.snapshot.today.activeObjective)}</h2>
        <p>${esc(state.snapshot.today.status)}</p>
        <div class="next-action"><span>Next safe action</span><strong>${esc(control.nextAction?.title || state.snapshot.today.nextSafeAction)}</strong></div>
        <p class="claim-ceiling">${icon("lock", 16)} ${esc(control.claimCeiling)}</p>
      </section>
      ${renderDashboardProofStrip({ control, queueCount, activeTickets, openRuns, directorBundles, unknownCount })}
      <section class="metrics-panel control-metrics">
        ${metric("Revenue claim", control.revenue?.mrr || "$0/UNKNOWN", "warning")}
        ${metric("Product VCOS", productVcos.length, "boards")}
        ${metric("Unknown rows", unknownCount, "warning")}
        ${metric("Active work orders", queueCount, "queue")}
        ${metric("Active tickets", activeTickets, "tickets")}
        ${metric("Open runs", openRuns, "runs")}
        ${metric("Director review", directorBundles.length, "review")}
        ${metric("Ticket store", state.ticketPersistence.includes("file-backed") ? "FILE" : "BROWSER", "save")}
      </section>
      <section class="control-card revenue-card">
        <div class="panel-title">${icon("warning")}<span>Revenue and payment truth</span></div>
        <h2>${esc(control.revenue?.status || "UNKNOWN")}</h2>
        <p>${esc(control.revenue?.safeNextAction || "UNKNOWN")}</p>
        <dl class="queue-proof">
          <dt>MRR</dt><dd>${esc(control.revenue?.mrr || "$0 unless verified payment evidence proves otherwise")}</dd>
          <dt>Evidence</dt><dd>${esc(control.revenue?.sourceEvidence || "command-centre/war-room/revenue-board.md")}</dd>
        </dl>
      </section>
      <section class="control-card shrish-panel">
        <div class="panel-title">${icon("lock")}<span>Shrish decisions and approvals only</span></div>
        ${renderShrishQueue(control)}
      </section>
      <section class="control-card wide">
        <div class="panel-title">${icon("proof")}<span>Frontend / backend / payment / deploy / provider gates</span></div>
        ${renderGateCards(control)}
      </section>
      <section class="control-card wide">
        <div class="panel-title">${icon("boards")}<span>Five Product VCOS feed</span></div>
        ${renderProductVcosFeed(productVcos)}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("queue")}<span>CEO work-order control</span></div>
        ${renderCeoWorkOrders(control)}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("dispatch")}<span>Agent assignments</span></div>
        ${renderAgentAssignments(control)}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("warning")}<span>Failures and blockers</span></div>
        ${renderStatusList(control.failures, "No failure records loaded.")}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("promote")}<span>Releases</span></div>
        ${renderStatusList((control.releases || []).map((item) => ({ ...item, status: "LOCAL_RELEASE_RECORD" })), "No release records loaded.")}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("activity")}<span>Content queue</span></div>
        ${renderStatusList(control.contentQueue, "No content queue rows loaded.")}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("decisions")}<span>Board decisions</span></div>
        ${renderStatusList(control.boardDecisions, "No Board decision rows loaded.")}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("runtime")}<span>CEO actions</span></div>
        ${renderStatusList(control.ceoActions, "No CEO action rows loaded.")}
      </section>
      <section class="control-card">
        <div class="panel-title">${icon("closeout")}<span>Nightly closeout</span></div>
        <article class="closeout-card">
          <em class="${statusClass(control.nightlyCloseout?.status || "UNKNOWN")}">${esc(control.nightlyCloseout?.status || "UNKNOWN")}</em>
          <p>${esc(control.nightlyCloseout?.summary || "UNKNOWN")}</p>
          <span>${esc(control.nightlyCloseout?.sourceEvidence || "UNKNOWN")}</span>
        </article>
      </section>
      <section class="list-panel wide">
        <div class="panel-title">${icon("review")}<span>Pending director review</span></div>
        <p class="local-only-note">READY_FOR_DIRECTOR_REVIEW packets are D-local review candidates only. Official ledger append, memory promotion, provider state, GitHub state, and live claims stay outside this app until the owning authority verifies them.</p>
        <div class="director-review-list">
          ${
            directorBundles.length
              ? directorBundles
                  .slice(0, 3)
                  .map(
                    (decision) => `<article class="director-review-card">
                      <header>
                        <div>
                          <span class="eyebrow">${esc(decision.disposition || "READY_FOR_DIRECTOR_REVIEW")} / ${esc(decision.id)}</span>
                          <strong>${esc(decision.title || decision.decisionType || "Director review bundle")}</strong>
                        </div>
                        <button type="button" data-open-decision="${esc(decision.id)}">${icon("review", 16)} Open decision</button>
                      </header>
                      <div class="assignment-strip compact">
                        <span><strong>Type</strong>${esc(decision.decisionType || "UNKNOWN")}</span>
                        <span><strong>Sources</strong>${esc(normalizeEventIds(decision.sourceEventIds, decision.sourceEventId).length || "0")}</span>
                        <span><strong>Memory</strong>${esc(decision.memoryAction || "UNKNOWN")}</span>
                        <span><strong>Manual next action</strong>${esc(directorBundleNextAction(decision))}</span>
                      </div>
                    </article>`,
                  )
                  .join("")
              : `<article class="director-review-card muted"><p>No local director packets are currently marked READY_FOR_DIRECTOR_REVIEW.</p></article>`
          }
        </div>
      </section>
      <section class="list-panel"><div class="panel-title">${icon("warning")}<span>Legacy blockers</span></div>${blockers.map((item) => `<p>${esc(item)}</p>`).join("")}</section>
      <section class="list-panel"><div class="panel-title">${icon("lock")}<span>Standing approval gates</span></div>${approvals.map((item) => `<p>${esc(item)}</p>`).join("")}</section>
    </div>`);
}

function renderQueue() {
  const items = state.snapshot.workQueue || [];
  const directorBundles = pendingDirectorBundles();
  renderShell(`
    <div class="queue-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("queue")}<span>Source-derived work queue</span></div>
        <h2>Route existing War Room work into accountable local tickets before any agent run.</h2>
        <p>Items are derived from command-centre/war-room/index.md and work-order-pack.md. Routing labels are local recommendations; D doctrine, GitHub, and provider authority still outrank the app.</p>
      </section>
      <section class="objective-panel wide">
        <div class="panel-title">${icon("review")}<span>Director review queue</span></div>
        <h2>${esc(directorBundles.length)} local packet${directorBundles.length === 1 ? "" : "s"} pending manual review.</h2>
        <p>These rows come from Products/MDS-Command-Centre/src/data/localDecisionExports.json. They do not append the official execution ledger, promote memory, mutate providers, send messages, deploy, push GitHub, or prove live state.</p>
        <div class="director-review-list">
          ${
            directorBundles.length
              ? directorBundles
                  .map(
                    (decision) => `<article class="director-review-card">
                      <header>
                        <div>
                          <span class="eyebrow">${esc(decision.decisionType || "director decision")} / ${esc(decision.id)}</span>
                          <strong>${esc(decision.title || "Director review bundle")}</strong>
                        </div>
                        <button type="button" data-open-decision="${esc(decision.id)}">${icon("review", 16)} Open decision</button>
                      </header>
                      <p>${esc(truncate(decision.bundleSummary || decision.notes || decision.packet || "Local packet awaits director review.", 220))}</p>
                      <dl class="queue-proof">
                        <dt>Evidence</dt><dd>${esc(decision.evidencePaths || "Products/MDS-Command-Centre/src/data/localDecisionExports.json")}</dd>
                        <dt>Proof</dt><dd>${esc(decision.validationRun || "Local decision packet exists for director review.")}</dd>
                        <dt>Next</dt><dd>${esc(directorBundleNextAction(decision))}</dd>
                      </dl>
                    </article>`,
                  )
                  .join("")
              : `<article class="director-review-card muted"><p>No READY_FOR_DIRECTOR_REVIEW packets are waiting. Create one from Decisions after staging local evidence.</p></article>`
          }
        </div>
      </section>
      ${items
        .map(
          (item) => `<article class="queue-card">
            <header>
              <div>
                <span class="eyebrow">${esc(item.source)} / ${esc(item.id)}</span>
                <h2>${esc(item.title)}</h2>
              </div>
              <em class="${statusClass(item.status)}">${esc(item.status)}</em>
            </header>
            <p>${esc(truncate(item.objective, 260))}</p>
            <div class="assignment-strip">
              <span><strong>Lane</strong>${esc(item.lane)}</span>
              <span><strong>Owner</strong>${esc(item.owner)}</span>
              <span><strong>Review</strong>${esc(item.reviewer)}</span>
              <span><strong>Agent</strong>${esc(item.targetAgent)}</span>
              <span><strong>Risk</strong>${esc(item.risk)}</span>
            </div>
            <dl class="queue-proof">
              <dt>Evidence</dt><dd>${esc(item.sourceEvidence)}</dd>
              <dt>Proof</dt><dd>${esc(item.proofCondition)}</dd>
              <dt>Stop</dt><dd>${esc(item.stopCondition)}</dd>
            </dl>
            <div class="queue-actions">
              <button class="primary" data-queue-ticket="${esc(item.id)}">${icon("plus", 16)} Create ticket</button>
              <button data-queue-dispatch="${esc(item.id)}">${icon("dispatch", 16)} Dispatch view</button>
            </div>
          </article>`,
        )
        .join("")}
    </div>`);
}

function renderSearch() {
  const allItems = commandSearchItems();
  const results = filteredCommandSearchItems();
  const visibleResults = visibleSearchItems();
  const selectedKeys = selectedSearchKeySet();
  const selectedItems = selectedSearchItems();
  const selectedVisibleCount = visibleResults.filter((item) => selectedKeys.has(item.key)).length;
  const bulkPacket = buildBulkDispatchPacket(selectedItems, state.bulkDispatchTarget);
  const bulkHistory = recentBulkDispatchEvents();
  const lanes = commandSearchLanes(allItems);
  const rollups = routingRollups(results.length ? results : allItems).slice(0, 8);
  const blockedCount = results.filter((item) => /BLOCK|NO_GO|FORBIDDEN/i.test(`${item.status} ${item.summary}`)).length;
  const unknownCount = results.filter((item) => /UNKNOWN/i.test(`${item.status} ${item.summary} ${item.proofCondition}`)).length;
  renderShell(`
    <div class="search-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("search")}<span>Command search</span></div>
        <h2>Search boards, work orders, tickets, evidence events, decisions, and product state from one local surface.</h2>
        <p>Results are D-local routing evidence only. Creating a ticket from a result creates local file-backed ticket state; it does not append the official ledger, mutate providers, deploy, push GitHub, send messages, or prove live state.</p>
        <div class="search-controls">
          <label>Search<input id="command-search-query" value="${esc(state.searchQuery)}" placeholder="Try provider UNKNOWN, Orion, payment, launch, P0, DEC..."></label>
          <label>Type<select id="command-search-type">
            ${["all", "work", "ticket", "activity", "decision", "product", "board"].map((value) => `<option value="${value}" ${state.searchType === value ? "selected" : ""}>${value}</option>`).join("")}
          </select></label>
          <label>Lane<select id="command-search-lane">
            <option value="all" ${state.searchLane === "all" ? "selected" : ""}>all</option>
            ${lanes.map((lane) => `<option value="${esc(lane)}" ${state.searchLane === lane ? "selected" : ""}>${esc(lane)}</option>`).join("")}
          </select></label>
        </div>
        <div class="search-actions">
          <button type="button" data-action="select-visible-search">${icon("check", 16)} Select visible</button>
          <button type="button" data-action="clear-search-selection">${icon("warning", 16)} Clear selection</button>
          <button type="button" data-action="save-search-view">${icon("save", 16)} Save view</button>
          <label>Dispatch target<select id="bulk-dispatch-target">
            ${targets.map((target) => `<option value="${esc(target)}" ${target === state.bulkDispatchTarget ? "selected" : ""}>${esc(target)}</option>`).join("")}
          </select></label>
        </div>
      </section>
      <section class="metrics-panel search-metrics">
        ${metric("Indexed items", allItems.length, "search")}
        ${metric("Matches", results.length, "check")}
        ${metric("Blocked matches", blockedCount, "warning")}
        ${metric("UNKNOWN matches", unknownCount, "warning")}
        ${metric("Selected", selectedItems.length, "dispatch")}
      </section>
      <section class="saved-view-panel">
        <div class="panel-title">${icon("save")}<span>Saved local search views</span></div>
        <p>Saved views live only in this browser's localStorage. They are operator shortcuts, not a source of truth.</p>
        <div class="saved-view-list">
          ${
            state.searchViews.length
              ? state.searchViews
                  .map(
                    (view) => `<article>
                      <div>
                        <strong>${esc(view.title || view.id)}</strong>
                        <em>${esc(view.createdAt || "UNKNOWN")} / ${esc((view.selectedKeys || []).length)} selected</em>
                      </div>
                      <span>
                        <button type="button" data-search-view-load="${esc(view.id)}">${icon("file", 14)} Load</button>
                        <button type="button" data-search-view-delete="${esc(view.id)}">${icon("warning", 14)} Delete</button>
                      </span>
                    </article>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No saved views.</strong><p>Filter Search, select evidence items, then save a browser-local view.</p></div>`
          }
        </div>
      </section>
      <section class="bulk-dispatch-panel">
        <div class="panel-title">${icon("dispatch")}<span>Bulk dispatch packet</span></div>
        <p>${esc(selectedItems.length)} selected items across ${esc(new Set(selectedItems.map((item) => item.lane)).size || 0)} lanes. ${esc(selectedVisibleCount)} are visible in the current result window.</p>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-bulk-dispatch">${icon("file", 16)} Copy packet</button>
          <button type="button" data-action="download-bulk-dispatch">${icon("download", 16)} Download packet</button>
          <button type="button" data-action="save-bulk-dispatch" ${selectedItems.length ? "" : "disabled"}>${icon("activity", 16)} Save packet to Activity</button>
        </div>
        <pre id="bulk-dispatch-packet">${esc(bulkPacket)}</pre>
        <div class="bulk-history">
          <h3>Recent local bulk dispatch history</h3>
          <div class="bulk-history-list">
            ${
              bulkHistory.length
                ? bulkHistory
                    .map(
                      (event) => `<article>
                        <div>
                          <strong>${esc(event.title || event.ticketId || event.id)}</strong>
                          <em>${esc(event.timestamp || "UNKNOWN")} / ${esc(event.owner || "UNKNOWN")}</em>
                        </div>
                        <button type="button" data-bulk-activity="${esc(event.id)}">${icon("activity", 14)} Open Activity</button>
                      </article>`,
                    )
                    .join("")
                : `<div class="empty-state"><strong>No bulk dispatch history.</strong><p>Save a selected packet to Activity to create local review evidence.</p></div>`
            }
          </div>
        </div>
      </section>
      <section class="rollup-panel">
        <div class="panel-title">${icon("runtime")}<span>Lane and owner rollups</span></div>
        <div class="rollup-list">
          ${rollups
            .map(
              (item) => `<article class="rollup-card">
                <header><strong>${esc(item.lane)}</strong><em>${esc(item.count)} items</em></header>
                <div class="rollup-stats">
                  <span><strong>${esc(item.blocked)}</strong> blocked</span>
                  <span><strong>${esc(item.unknown)}</strong> unknown</span>
                  <span><strong>${esc(item.ready)}</strong> ready/pass/active</span>
                </div>
                <p><span>Owners</span>${esc(item.owners.join(", "))}</p>
                <p><span>Top next action</span>${esc(truncate(item.nextAction, 150))}</p>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="search-results">
        <div class="panel-title">${icon("search")}<span>Search results</span></div>
        <div class="result-list">
          ${
            results.length
              ? visibleResults
                  .map(
                    (item) => `<article class="result-card">
                      <header>
                        <div>
                          <span class="eyebrow">${esc(item.type)} / ${esc(item.id)}</span>
                          <h2>${esc(item.title)}</h2>
                        </div>
                        <em class="${statusClass(item.status)}">${esc(truncate(item.status, 44))}</em>
                      </header>
                      <label class="result-select">
                        <input type="checkbox" data-search-select="${esc(item.key)}" ${selectedKeys.has(item.key) ? "checked" : ""}>
                        <span>Select for dispatch packet</span>
                      </label>
                      <p>${esc(truncate(item.summary || item.nextAction || item.proofCondition, 280))}</p>
                      <div class="assignment-strip compact">
                        <span><strong>Lane</strong>${esc(item.lane)}</span>
                        <span><strong>Owner</strong>${esc(item.owner)}</span>
                        <span><strong>Priority</strong>${esc(item.priority)}</span>
                        <span><strong>Evidence</strong>${esc(truncate(item.sourceEvidence, 80))}</span>
                      </div>
                      <dl class="queue-proof">
                        <dt>Proof</dt><dd>${esc(item.proofCondition || "UNKNOWN")}</dd>
                        <dt>Stop</dt><dd>${esc(item.stopCondition || "UNKNOWN")}</dd>
                        <dt>Next</dt><dd>${esc(item.nextAction || "UNKNOWN")}</dd>
                      </dl>
                      <div class="queue-actions">
                        <button type="button" data-search-open="${esc(item.key)}">${icon("file", 16)} Open source view</button>
                        <button class="primary" type="button" data-search-ticket="${esc(item.key)}">${icon("plus", 16)} Create local ticket</button>
                      </div>
                    </article>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No matches.</strong><p>Clear filters or search for a broader product, owner, lane, approval, UNKNOWN, or blocker term.</p></div>`
          }
        </div>
      </section>
    </div>`);
}

function renderProductTable(rows) {
  return `<div class="product-table" role="table" aria-label="Product readiness">
    <div class="product-head" role="row"><span>Product</span><span>Readiness</span><span>Revenue</span><span>Next action</span></div>
    ${rows
      .map(
        (row) => `<div class="product-row" role="row">
          <strong>${esc(row.product)}</strong>
          <em class="${statusClass(row.readiness)}">${esc(truncate(row.readiness, 48))}</em>
          <em class="${statusClass(row.revenue_status)}">${esc(row.revenue_status)}</em>
          <span>${esc(truncate(row.one_next_action, 110))}</span>
        </div>`,
      )
      .join("")}
  </div>`;
}

function renderBoards() {
  const board = selectedBoard();
  renderShell(`
    <div class="boards-grid">
      <section class="board-list">
        ${state.snapshot.sources
          .map(
            (source) => `<button class="${state.selectedBoardId === source.id ? "selected" : ""}" data-board="${esc(source.id)}">
              ${icon("file", 16)}<span>${esc(source.title)}</span><small>${source.exists ? "loaded" : "missing"}</small>
            </button>`,
          )
          .join("")}
      </section>
      <section class="board-preview">
        <div class="panel-title">${icon("file")}<span>${esc(board?.title || "Board")}</span></div>
        <p class="source-path">${esc(board?.relativePath || "")}</p>
        <p class="board-summary">${esc(board?.summary || "")}</p>
        <div class="markdown-lines">${markdownPreview(board?.content || "").map((line) => `<p>${esc(line)}</p>`).join("")}</div>
      </section>
    </div>`);
}

function averageDimensionScore(component) {
  const dimensions = Array.isArray(component?.dimensions) ? component.dimensions : [];
  if (!dimensions.length) return "UNKNOWN";
  const total = dimensions.reduce((sum, dimension) => sum + Number(dimension.score || 0), 0);
  return Math.round(total / dimensions.length);
}

function renderRuntime() {
  const framework = state.snapshot.framework || {};
  const profiles = framework.agentProfiles?.profiles || [];
  const runControls = framework.runControls?.profiles || [];
  const gateways = framework.gatewayContracts?.gateways || [];
  const modules = framework.modules || [];
  renderShell(`
    <div class="runtime-grid">
      <section class="table-panel wide">
        <div class="panel-title">${icon("runtime")}<span>Agent company runtime contracts</span></div>
        <div class="runtime-cards">
          ${profiles
            .map(
              (profile) => `<article class="contract-card">
                <div><strong>${esc(profile.id)}</strong><em>${esc(profile.mode)}</em></div>
                <p>${esc(profile.description)}</p>
                <dl><dt>Max steps</dt><dd>${esc(profile.maxSteps)}</dd><dt>Edit</dt><dd>${esc(profile.permissions?.edit || "UNKNOWN")}</dd><dt>Web</dt><dd>${esc(profile.permissions?.web || "UNKNOWN")}</dd></dl>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Run controls</span></div>
        <div class="stack-list">
          ${runControls
            .map(
              (control) => `<article>
                <strong>${esc(control.name || control.id)}</strong>
                <p>${esc(control.purpose)}</p>
                <span class="status blocked">blocks ${esc((control.sandbox?.blockedMutation || []).slice(0, 4).join(", "))}</span>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("dispatch")}<span>Gateways</span></div>
        <div class="stack-list">
          ${gateways
            .map(
              (gateway) => `<article>
                <strong>${esc(gateway.name)}</strong>
                <p>${esc(gateway.purpose)}</p>
                <span class="${statusClass(gateway.transport?.exposure || "UNKNOWN")}">${esc(gateway.transport?.exposure || "UNKNOWN")}</span>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>MIDAS framework modules</span></div>
        <div class="module-table">
          <div class="module-head"><span>Module</span><span>Purpose</span><span>Version</span></div>
          ${modules
            .map(
              (module) => `<div class="module-row">
                <strong>${esc(module.id || module.name || "UNKNOWN")}</strong>
                <span>${esc(truncate(module.purpose || module.description || "No purpose field.", 170))}</span>
                <em>${esc(module.version || module.schemaVersion || "local")}</em>
              </div>`,
            )
            .join("")}
        </div>
      </section>
    </div>`);
}

function renderProof() {
  const framework = state.snapshot.framework || {};
  const constitution = framework.authority || {};
  const invariants = constitution.protectedInvariants || [];
  const scorecard = framework.qualityScorecard || {};
  const components = scorecard.components || [];
  const packs = framework.knowledgePacks?.packs || [];
  renderShell(`
    <div class="proof-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("proof")}<span>Proof gates</span></div>
        <h2>Evidence before claim, approval before red action, UNKNOWN before inference.</h2>
        <p>${esc(scorecard.policy?.scoreScale ? `Quality score scale ${scorecard.policy.scoreScale}; public release minimum ${scorecard.policy.publicReleaseMinScore}; public release requires approval.` : "Quality policy unavailable; remain fail-closed.")}</p>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Protected invariants</span></div>
        <div class="stack-list">
          ${invariants
            .map(
              (item) => `<article>
                <strong>${esc(item.id)}</strong>
                <p>${esc(item.statement)}</p>
                <span class="status active">${esc(item.owner)}</span>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("check")}<span>Quality components</span></div>
        <div class="stack-list">
          ${components
            .map(
              (component) => `<article>
                <strong>${esc(component.id)}</strong>
                <p>${esc(component.purpose)}</p>
                <span class="${statusClass(component.releaseGate?.publicReleaseReady ? "READY" : "BLOCKED")}">avg ${esc(averageDimensionScore(component))}; public ${esc(component.releaseGate?.publicReleaseReady ? "ready" : "blocked")}</span>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("file")}<span>Knowledge packs</span></div>
        <div class="runtime-cards">
          ${packs
            .map(
              (pack) => `<article class="contract-card">
                <div><strong>${esc(pack.name)}</strong><em>${esc(pack.id)}</em></div>
                <p>${esc(pack.purpose)}</p>
                <dl><dt>Citation</dt><dd>${esc(pack.sourcePolicy?.citationRequired ? "required" : "UNKNOWN")}</dd><dt>Secrets</dt><dd>${esc(pack.sourcePolicy?.secretsAllowed ? "allowed" : "blocked")}</dd><dt>Exposure</dt><dd>${esc(pack.appExposure?.enabled ? "enabled" : "disabled")}</dd></dl>
              </article>`,
            )
            .join("")}
        </div>
      </section>
    </div>`);
}

function renderOperator() {
  const gates = operatorGateSummary();
  const packet = buildOperatorSpinePacket();
  const products = operatorProductRows();
  const authority = operatorAuthorityCards();
  const routes = operatorAgentRoutes();
  renderShell(`
    <div class="operator-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("operator")}<span>Operator OS spine</span></div>
        <h2>${esc(state.snapshot.today.activeObjective || "Build the local-first MDS Command Centre spine.")}</h2>
        <p>This surface joins D-local War Room state, authority boundaries, product blockers, agent routes, memory gates, and one next safe action. It does not replace CEO.md, company memory, GitHub, providers, or the official execution ledger.</p>
        <div class="next-action"><span>Next safe action</span><strong>${esc(state.snapshot.today.nextSafeAction || "UNKNOWN")}</strong></div>
        <div class="operator-metrics">
          ${metric("Tracked products", gates.products, "boards")}
          ${metric("Unknown products", gates.unknownProducts, "warning")}
          ${metric("Blocked/Parked", gates.blockedProducts, "lock")}
          ${metric("Ready decisions", gates.decisionsReady, "decisions")}
        </div>
        <div class="dispatch-actions">
          <button class="primary" type="button" data-action="create-spine-ticket">${icon("plus", 16)} Create operator ticket</button>
          <button type="button" data-action="copy-spine-packet">${icon("file", 16)} Copy OS packet</button>
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Authority ladder</span></div>
        <div class="authority-ladder">
          ${authority
            .map(
              (item) => `<article>
                <span>${esc(item.label)}</span>
                <strong class="${statusClass(item.value)}">${esc(item.value)}</strong>
                <p>${esc(item.detail)}</p>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Product operating rows</span></div>
        <div class="operator-product-table">
          <div class="operator-product-head"><span>Product</span><span>Readiness</span><span>Live / Revenue</span><span>Blocker</span><span>Next action</span></div>
          ${products
            .map(
              (row) => `<div class="operator-product-row">
                <strong>${esc(row.product)}</strong>
                <em class="${statusClass(row.readiness)}">${esc(row.readiness)}</em>
                <span>${esc(row.live)} / ${esc(row.revenue)}</span>
                <span>${esc(row.blocker)}</span>
                <span>${esc(row.nextAction)}</span>
              </div>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("dispatch")}<span>Agent route controls</span></div>
        <div class="operator-route-list">
          ${routes
            .map(
              (route) => `<article>
                <header><strong>${esc(route.target)}</strong><span>${esc(route.profile)}</span></header>
                <p>${esc(route.allowed)}</p>
                <em>${esc(route.evidence)}</em>
              </article>`,
            )
            .join("")}
        </div>
      </section>
      <section class="packet-preview wide">
        <div class="panel-title">${icon("file")}<span>Operator OS packet</span></div>
        <p class="packet-note">Copyable local packet for routing. It is not official ledger, memory, GitHub, provider, payment, deployment, or live-state proof.</p>
        <pre id="operator-spine-packet">${esc(packet)}</pre>
      </section>
    </div>`);
}

function renderBenchmark() {
  const rows = state.snapshot.matrixBenchmark || [];
  renderShell(`
    <div class="benchmark-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("benchmark")}<span>Matrix benchmark response</span></div>
        <h2>MDS should not copy autonomous-revenue theatrics; it should win on founder authority, proof gates, and local operating truth.</h2>
        <p>Comparison is bounded to public positioning and user-provided competitive context. Revenue, provider, deployment, and payment states remain UNKNOWN until owning authority proves them.</p>
      </section>
      <section class="table-panel wide">
        <div class="comparison-table">
          <div class="comparison-head"><span>Capability</span><span>Matrix positioning</span><span>MDS control</span><span>Status</span></div>
          ${rows
            .map(
              (row) => `<div class="comparison-row">
                <strong>${esc(row.capability)}</strong>
                <span>${esc(row.matrixPositioning)}</span>
                <span>${esc(row.mdsControl)}</span>
                <em class="${statusClass(row.sprint001Status)}">${esc(row.sprint001Status)}</em>
              </div>`,
            )
            .join("")}
        </div>
      </section>
    </div>`);
}

function renderHealth() {
  const health = state.health || {};
  const sources = state.snapshot.sourceHealth || state.snapshot.sources || [];
  const missing = sources.filter((source) => !source.exists).length;
  renderShell(`
    <div class="health-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("health")}<span>Local source health</span></div>
        <h2>Command Centre reads whitelisted D files, writes local tickets, and fails closed when sources are missing.</h2>
        <p>Ticket persistence: ${esc(state.ticketPersistence)}. Last save: ${esc(state.lastSaveState)}. Missing sources: ${esc(missing)}.</p>
        <div class="dispatch-actions">
          <button class="primary" data-action="refresh-snapshot">${icon("health", 16)} Refresh local snapshot</button>
          <button data-action="reload-health">${icon("check", 16)} Recheck health</button>
        </div>
      </section>
      <section class="table-panel wide">
        <div class="health-table">
          <div class="health-head"><span>Source</span><span>Status</span><span>Age</span><span>Size</span><span>Path</span></div>
          ${sources
            .map(
              (source) => `<div class="health-row">
                <strong>${esc(source.title || source.id)}</strong>
                <em class="${statusClass(source.status || (source.exists ? "LOADED" : "BLOCKED"))}">${esc(source.status || (source.exists ? "LOADED" : "MISSING"))}</em>
                <span>${esc(sourceAgeLabel(source.modifiedAt))}</span>
                <span>${esc(source.sizeBytes || 0)} bytes</span>
                <span>${esc(source.relativePath)}</span>
              </div>`,
            )
            .join("")}
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("save")}<span>Local stores</span></div>
        <div class="stack-list">
          <article><strong>Ticket store</strong><p>${esc(health.ticketStore || "src/data/localTickets.json")}</p><span class="${statusClass(health.ticketStoreExists ? "READY" : "UNKNOWN")}">${esc(health.ticketStoreExists ? "exists" : "not created")}</span></article>
          <article><strong>Activity store</strong><p>${esc(health.activityStore || "src/data/localActivityLog.json")}</p><span class="${statusClass(health.activityStoreExists ? "READY" : "UNKNOWN")}">${esc(health.activityStoreExists ? `${health.activityEvents || 0} events` : "not created")}</span></article>
          <article><strong>Decision exports</strong><p>${esc(health.decisionStore || "src/data/localDecisionExports.json")}</p><span class="${statusClass(health.decisionStoreExists ? "READY" : "UNKNOWN")}">${esc(health.decisionStoreExists ? `${health.decisionExports || 0} exports` : "not created")}</span></article>
          <article><strong>Agent runs</strong><p>${esc(health.runStore || "src/data/localAgentRuns.json")}</p><span class="${statusClass(health.runStoreExists ? "READY" : "UNKNOWN")}">${esc(health.runStoreExists ? `${health.agentRuns || 0} runs` : "not created")}</span></article>
          <article><strong>Research briefs</strong><p>${esc(health.researchStore || "src/data/localResearchBriefs.json")}</p><span class="${statusClass(health.researchStoreExists ? "READY" : "UNKNOWN")}">${esc(health.researchStoreExists ? `${health.researchBriefs || 0} briefs` : "not created")}</span></article>
          <article><strong>Snapshot</strong><p>${esc(health.snapshotGeneratedAt || state.snapshot.generatedAt)}</p><span class="${statusClass(health.snapshotExists ? "READY" : "UNKNOWN")}">${esc(health.snapshotExists ? "exists" : "missing")}</span></article>
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Fail-closed limits</span></div>
        <div class="stack-list">
          <article><strong>No provider mutation</strong><p>Health checks read local files and refresh local JSON only.</p><span class="status blocked">providers untouched</span></article>
          <article><strong>No secret reads</strong><p>Source ingestion refuses paths containing env, secret, token, credential, or private-key markers.</p><span class="status blocked">secret reads blocked</span></article>
        </div>
      </section>
    </div>`);
}

function renderTickets() {
  const ticket = selectedTicket();
  const validation = validateTicket(ticket);
  renderShell(`
    <div class="tickets-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("tickets")}<span>Local tickets</span></div>
        <div class="ticket-tools">
          <button data-action="export-tickets">${icon("download", 16)} Export JSON</button>
          <button data-action="trigger-import">${icon("upload", 16)} Import JSON</button>
          <input id="ticket-import" type="file" accept="application/json,.json" hidden>
        </div>
        <div class="ticket-list">
          ${state.tickets
            .map(
              (item) => `<button class="${item.id === ticket.id ? "selected ticket-row" : "ticket-row"}" data-ticket="${esc(item.id)}">
                <span>${esc(item.id)}</span><strong>${esc(item.title || "Untitled ticket")}</strong><em class="${statusClass(item.status)}">${esc(item.status)}</em>
              </button>`,
            )
            .join("")}
        </div>
      </section>
      <form class="ticket-form" id="ticket-form">
        <div class="panel-title">${icon("save")}<span>Edit ticket</span></div>
        ${input("ID", "id", ticket.id)}
        ${input("Title", "title", ticket.title, "One accountable work item")}
        <div class="form-grid three">
          ${input("Lane", "lane", ticket.lane)}
          ${input("Owner", "owner", ticket.owner)}
          ${select("Status", "status", ticket.status, ["ACTIVE", "READY", "BLOCKED", "UNKNOWN", "NEEDS FIX", "PARKED"])}
        </div>
        <div class="form-grid two">
          ${select("Priority", "priority", ticket.priority, ["P0", "P1", "P2", "P3"])}
          ${input("Updated", "updatedAt", ticket.updatedAt)}
        </div>
        ${textarea("Source evidence", "sourceEvidence", ticket.sourceEvidence)}
        ${textarea("Proof condition", "proofCondition", ticket.proofCondition)}
        ${textarea("Stop condition", "stopCondition", ticket.stopCondition)}
        ${textarea("Next action", "nextAction", ticket.nextAction)}
        <div class="validation-panel">
          <strong>${esc(validation.status)}</strong>
          <p>Missing: ${esc(validation.missing.length ? validation.missing.join(", ") : "none")}</p>
          <p>Red flags: ${esc(validation.redFlags.length ? validation.redFlags.join(" | ") : "none")}</p>
        </div>
        <div class="form-actions">
          <button class="primary" type="submit">${icon("save", 16)} Save local ticket</button>
          <button class="danger" type="button" data-action="delete-ticket">${icon("warning", 16)} Delete ticket</button>
        </div>
      </form>
    </div>`);
}

function input(label, name, value, placeholder = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
}

function textarea(label, name, value) {
  return `<label>${esc(label)}<textarea name="${esc(name)}">${esc(value)}</textarea></label>`;
}

function select(label, name, value, options) {
  return `<label>${esc(label)}<select name="${esc(name)}">${options.map((option) => `<option value="${esc(option)}" ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
}

function renderDispatch() {
  const ticket = selectedTicket();
  const packet = buildDispatchPacket(ticket, state.dispatchTarget);
  const validation = validateTicket(ticket);
  renderShell(`
    <div class="dispatch-grid">
      <section class="dispatch-controls">
        <div class="panel-title">${icon("dispatch")}<span>Agent dispatch</span></div>
        <label>Ticket<select id="dispatch-ticket">${state.tickets.map((item) => `<option value="${esc(item.id)}" ${item.id === ticket.id ? "selected" : ""}>${esc(item.id)} - ${esc(item.title || "Untitled")}</option>`).join("")}</select></label>
        <label>Target<select id="dispatch-target">${targets.map((target) => `<option value="${esc(target)}" ${target === state.dispatchTarget ? "selected" : ""}>${esc(target)}</option>`).join("")}</select></label>
        <div class="validation-panel">
          <strong>${esc(validation.status)}</strong>
          <p>Missing: ${esc(validation.missing.length ? validation.missing.join(", ") : "none")}</p>
          <p>Red flags: ${esc(validation.redFlags.length ? validation.redFlags.join(" | ") : "none")}</p>
        </div>
        <div class="dispatch-actions">
          <button class="primary" data-action="copy-packet">${icon("dispatch", 16)} Generate dispatch packet</button>
          <button data-action="download-packet">${icon("download", 16)} Download</button>
        </div>
      </section>
      <section class="packet-preview"><pre id="packet-preview">${esc(packet)}</pre></section>
    </div>`);
}

function renderRuns() {
  const run = selectedRun();
  const readiness = runReadiness(run);
  const packet = buildRunPacket(run);
  renderShell(`
    <div class="runs-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("runs")}<span>Agent runs</span></div>
        <div class="activity-meta">
          <strong>${esc(state.runs.length)} local runs</strong>
          <span>${esc(state.runPersistence)}</span>
        </div>
        <div class="dispatch-actions">
          <button class="primary" type="button" data-action="new-run-from-ticket">${icon("plus", 16)} New from ticket</button>
          <button type="button" data-action="copy-run-packet">${icon("file", 16)} Copy packet</button>
        </div>
        <div class="activity-list">
          ${
            state.runs.length
              ? state.runs
                  .map(
                    (item) => `<button type="button" class="${item.id === run.id ? "selected activity-row" : "activity-row"}" data-run="${esc(item.id)}">
                      <span>${esc(item.status || "DRAFT")} - ${esc(item.targetAgent || "UNKNOWN")}</span>
                      <strong>${esc(item.title || item.id)}</strong>
                      <em>${esc(item.ticketId || "UNKNOWN")} - ${esc(item.approvalClass || "LOCAL_ONLY")}</em>
                    </button>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No local runs yet.</strong><p>Create one from the current ticket to stage a fail-closed 15-30 minute execution packet.</p></div>`
          }
        </div>
      </section>
      <form class="run-form" id="run-form">
        <div class="panel-title">${icon("runs")}<span>Run control</span></div>
        <section class="decision-readiness-panel">
          <header>
            <div>
              <span class="eyebrow">Local run readiness</span>
              <strong>${esc(readiness.passed)}/${esc(readiness.total)} checks ready for ${esc(run.status || "DRAFT")}</strong>
            </div>
            <em class="${statusClass(readiness.passed === readiness.total ? "READY" : "NEEDS FIX")}">${esc(readiness.passed === readiness.total ? "LOCAL RUN READY" : "NEEDS FIX")}</em>
          </header>
          <div class="readiness-check-list">
            ${readiness.checks
              .map(
                (check) => `<span class="${check.ok ? "pass" : "fix"}">
                  <strong>${check.ok ? "PASS" : "FIX"}</strong>
                  ${esc(check.label)} - ${esc(check.detail)}
                </span>`,
              )
              .join("")}
          </div>
          <p>Runs are local control records only. They do not execute agents, deploy, mutate providers, send external messages, move money, append the official ledger, promote memory, or prove live state.</p>
        </section>
        ${input("Run ID", "id", run.id)}
        <div class="form-grid three">
          ${select("Ticket", "ticketId", run.ticketId || selectedTicket().id, state.tickets.map((ticket) => ticket.id))}
          ${select("Target agent", "targetAgent", run.targetAgent || "Codex", targets)}
          ${select("Status", "status", run.status || "DRAFT", ["DRAFT", "READY_LOCAL", "IN_PROGRESS_LOCAL", "WAITING_ON_CLOSEOUT", "NEEDS_EVIDENCE", "BLOCKED", "CLOSED_LOCAL"])}
        </div>
        <div class="form-grid three">
          ${input("Owner", "owner", run.owner || "Codex Strategic Board")}
          ${input("Lane", "lane", run.lane || "Command Centre")}
          ${select("Approval class", "approvalClass", run.approvalClass || "LOCAL_ONLY", ["LOCAL_ONLY", "NEEDS_SHRISH_APPROVAL", "PROVIDER_DASHBOARD_REQUIRED", "GITHUB_REQUIRED", "FORBIDDEN_UNTIL_APPROVED"])}
        </div>
        ${input("Title", "title", run.title || "")}
        ${textarea("Objective", "objective", run.objective || "")}
        ${textarea("Source evidence", "sourceEvidence", run.sourceEvidence || "")}
        ${textarea("Allowed actions", "allowedActions", run.allowedActions || "")}
        ${textarea("Forbidden actions", "forbiddenActions", run.forbiddenActions || "")}
        ${textarea("Evidence requirement", "evidenceRequirement", run.evidenceRequirement || "")}
        ${textarea("Proof condition", "proofCondition", run.proofCondition || "")}
        ${textarea("Stop condition", "stopCondition", run.stopCondition || "")}
        ${textarea("Validation plan", "validationPlan", run.validationPlan || "")}
        ${textarea("Unknowns preserved", "unknownsPreserved", run.unknownsPreserved || "")}
        ${textarea("Authority basis", "authorityBasis", run.authorityBasis || "")}
        ${textarea("Closeout format", "closeoutFormat", run.closeoutFormat || "")}
        <div class="form-actions">
          <button class="primary" type="submit">${icon("save", 16)} Save local run</button>
          <button type="button" data-action="new-run-from-ticket">${icon("plus", 16)} Reset from selected ticket</button>
        </div>
      </form>
      <section class="packet-preview wide">
        <div class="panel-title">${icon("file")}<span>Run packet preview</span></div>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-run-packet">${icon("file", 16)} Copy run packet</button>
          <button type="button" data-action="download-run-packet">${icon("download", 16)} Download run packet</button>
        </div>
        <pre id="run-packet">${esc(packet)}</pre>
      </section>
    </div>`);
}

function renderResearch() {
  const brief = selectedResearch();
  const delta = selectedDeltaReview();
  const readiness = researchReadiness(brief);
  const deltaReadinessState = deltaReadiness(delta);
  const deltaGate = deltaExecutionGate(delta);
  const packet = buildResearchPacket(brief);
  const deltaPacket = buildDeltaPacket(delta);
  renderShell(`
    <div class="research-grid">
      <section class="table-panel research-source-panel">
        <div class="panel-title">${icon("research")}<span>Source intake</span></div>
        <div class="activity-meta">
          <strong>${esc(state.researchSources.length)} D-local source sets</strong>
          <span>Evidence pointers only</span>
        </div>
        <div class="research-source-list">
          ${
            state.researchSources.length
              ? state.researchSources
                  .map(
                    (source) => `<article class="research-source-card">
                      <div>
                        <span class="eyebrow">${esc(source.sourceType || "Source")} - ${esc(source.authorityStatus || "EVIDENCE_ONLY")}</span>
                        <strong>${esc(source.title || source.id)}</strong>
                        <p>${esc(source.freshness || "Freshness UNKNOWN until verified.")}</p>
                        <code>${esc(source.sourcePath || source.sourceEvidence || "UNKNOWN")}</code>
                      </div>
                      <div class="research-source-actions">
                        <button type="button" data-research-source="${esc(source.id)}">${icon("plus", 16)} Brief</button>
                        <button type="button" data-delta-source="${esc(source.id)}">${icon("decisions", 16)} Delta</button>
                      </div>
                    </article>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No source packs loaded.</strong><p>Add D-local source pointers in the local research-source seed file before creating source-backed briefs.</p></div>`
          }
        </div>
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("research")}<span>Research briefs</span></div>
        <div class="activity-meta">
          <strong>${esc(state.research.length)} local briefs</strong>
          <span>${esc(state.researchPersistence)}</span>
        </div>
        <div class="dispatch-actions">
          <button class="primary" type="button" data-action="new-research-brief">${icon("plus", 16)} New brief</button>
          <button type="button" data-action="create-run-from-research">${icon("runs", 16)} Create run</button>
        </div>
        <div class="activity-list">
          ${
            state.research.length
              ? state.research
                  .map(
                    (item) => `<button type="button" class="${item.id === brief.id ? "selected activity-row" : "activity-row"}" data-research="${esc(item.id)}">
                      <span>${esc(item.sourceType || "Research")} - ${esc(item.timeboxMinutes || "30")}m</span>
                      <strong>${esc(item.sourceTitle || item.id)}</strong>
                      <em>${esc(item.status || "DRAFT")} - ${esc(item.targetAgent || "Codex")}</em>
                    </button>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No research briefs yet.</strong><p>Create one from NotebookLM or GitHub repo research, then convert it into a local run-control packet.</p></div>`
          }
        </div>
      </section>
      <form class="research-form" id="research-form">
        <div class="panel-title">${icon("research")}<span>Research-to-execution brief</span></div>
        <section class="decision-readiness-panel">
          <header>
            <div>
              <span class="eyebrow">15-30 minute slice readiness</span>
              <strong>${esc(readiness.passed)}/${esc(readiness.total)} checks ready for ${esc(brief.status || "DRAFT")}</strong>
            </div>
            <em class="${statusClass(readiness.passed === readiness.total ? "READY" : "NEEDS FIX")}">${esc(readiness.passed === readiness.total ? "READY TO RUN LOCALLY" : "NEEDS FIX")}</em>
          </header>
          <div class="readiness-check-list">
            ${readiness.checks
              .map(
                (check) => `<span class="${check.ok ? "pass" : "fix"}">
                  <strong>${check.ok ? "PASS" : "FIX"}</strong>
                  ${esc(check.label)} - ${esc(check.detail)}
                </span>`,
              )
              .join("")}
          </div>
          <p>NotebookLM and GitHub research are evidence inputs only. This desk converts them into local run packets without claiming live state or taking external action.</p>
        </section>
        ${input("Brief ID", "id", brief.id)}
        <div class="form-grid three">
          ${select("Source type", "sourceType", brief.sourceType || "NotebookLM", ["NotebookLM", "GitHub repo", "D-local docs", "Market research", "User chat extract"])}
          ${select("Timebox", "timeboxMinutes", brief.timeboxMinutes || "30", ["15", "20", "25", "30"])}
          ${select("Target agent", "targetAgent", brief.targetAgent || "Codex", targets)}
        </div>
        <div class="form-grid three">
          ${input("Owner", "owner", brief.owner || "Atlas / Research Studio")}
          ${input("Lane", "lane", brief.lane || "Research Studio")}
          ${select("Status", "status", brief.status || "DRAFT", ["DRAFT", "READY_TO_RUN_LOCAL", "RUN_STAGED", "NEEDS_SOURCE", "BLOCKED"])}
        </div>
        ${input("Source title", "sourceTitle", brief.sourceTitle || "")}
        ${input("Source URL", "sourceUrl", brief.sourceUrl || "")}
        ${input("Repo or notebook", "repoOrNotebook", brief.repoOrNotebook || "")}
        ${textarea("Source evidence", "sourceEvidence", brief.sourceEvidence || "")}
        ${textarea("Research summary", "researchSummary", brief.researchSummary || "")}
        ${textarea("Proposed 15-30 minute slice", "proposedSlice", brief.proposedSlice || "")}
        ${textarea("Leverage claim", "leverageClaim", brief.leverageClaim || "")}
        ${textarea("Expected artifact", "expectedArtifact", brief.expectedArtifact || "")}
        ${textarea("Evidence requirement", "evidenceRequirement", brief.evidenceRequirement || "")}
        ${textarea("Proof condition", "proofCondition", brief.proofCondition || "")}
        ${textarea("Stop condition", "stopCondition", brief.stopCondition || "")}
        ${textarea("Validation plan", "validationPlan", brief.validationPlan || "")}
        ${select("IP / publication class", "ipClassification", brief.ipClassification || "private_ip", ["private_ip", "operational_memory", "product_knowledge", "skill_workflow", "research", "publication_candidate", "open_source_candidate"])}
        ${textarea("Unknowns preserved", "unknownsPreserved", brief.unknownsPreserved || "")}
        <div class="form-actions">
          <button class="primary" type="submit">${icon("save", 16)} Save research brief</button>
          <button type="button" data-action="create-run-from-research">${icon("runs", 16)} Create local run</button>
        </div>
      </form>
      <section class="packet-preview wide">
        <div class="panel-title">${icon("file")}<span>Research packet preview</span></div>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-research-packet">${icon("file", 16)} Copy packet</button>
          <button type="button" data-action="download-research-packet">${icon("download", 16)} Download packet</button>
        </div>
        <pre id="research-packet">${esc(packet)}</pre>
      </section>
      <section class="delta-review-panel wide">
        <div class="panel-title">${icon("decisions")}<span>Archive-vs-current delta review</span></div>
        <div class="activity-meta">
          <strong>${esc(state.deltaReviews.length)} local delta reviews</strong>
          <span>${esc(state.deltaPersistence)}</span>
        </div>
        <div class="delta-review-grid">
          <div class="activity-list">
            ${
              state.deltaReviews.length
                ? state.deltaReviews
                    .map(
                      (item) => `<button type="button" class="${item.id === delta.id ? "selected activity-row" : "activity-row"}" data-delta-review="${esc(item.id)}">
                        <span>${esc(item.decision || "REVISE")} - ${esc(item.lane || "VCOS Builder Studio")}</span>
                        <strong>${esc(item.title || item.id)}</strong>
                        <em>${esc(item.sourceId || "UNKNOWN")} - local review only</em>
                      </button>`,
                    )
                    .join("")
                : `<div class="empty-state"><strong>No delta reviews yet.</strong><p>Use a source card Delta action to stage an archive-vs-current reuse, revise, or park decision.</p></div>`
            }
          </div>
          <form class="delta-form" id="delta-form">
            <section class="decision-readiness-panel">
              <header>
                <div>
                  <span class="eyebrow">archive/current decision readiness</span>
                  <strong>${esc(deltaReadinessState.passed)}/${esc(deltaReadinessState.total)} checks ready for ${esc(delta.decision || "REVISE")}</strong>
                </div>
                <em class="${statusClass(deltaReadinessState.passed === deltaReadinessState.total ? "READY" : "NEEDS FIX")}">${esc(deltaReadinessState.passed === deltaReadinessState.total ? "READY FOR DIRECTOR REVIEW" : "NEEDS FIX")}</em>
              </header>
              <div class="readiness-check-list">
                ${deltaReadinessState.checks
                  .map(
                    (check) => `<span class="${check.ok ? "pass" : "fix"}">
                      <strong>${check.ok ? "PASS" : "FIX"}</strong>
                      ${esc(check.label)} - ${esc(check.detail)}
                    </span>`,
                  )
                  .join("")}
              </div>
            </section>
            ${input("Review ID", "id", delta.id)}
            ${input("Source ID", "sourceId", delta.sourceId || "")}
            ${input("Title", "title", delta.title || "")}
            <div class="form-grid three">
              ${select("Decision", "decision", delta.decision || "REVISE", ["REUSE", "REVISE", "PARK"])}
              ${input("Owner", "owner", delta.owner || "Codex Strategic Board")}
              ${input("Lane", "lane", delta.lane || "VCOS Builder Studio")}
            </div>
            ${textarea("Archived evidence", "archivedEvidence", delta.archivedEvidence || "")}
            ${textarea("Current authority checked", "currentAuthority", delta.currentAuthority || "")}
            ${textarea("Archived claim / pattern", "archivedClaim", delta.archivedClaim || "")}
            ${textarea("Current constraint", "currentConstraint", delta.currentConstraint || "")}
            ${textarea("Decision rationale", "rationale", delta.rationale || "")}
            ${textarea("Proof condition", "proofCondition", delta.proofCondition || "")}
            ${textarea("Next action", "nextAction", delta.nextAction || "")}
            ${textarea("Stop condition", "stopCondition", delta.stopCondition || "")}
            ${textarea("Unknowns preserved", "unknownsPreserved", delta.unknownsPreserved || "")}
            <div class="form-actions">
              <button class="primary" type="submit">${icon("save", 16)} Save delta review</button>
              <button type="button" data-action="copy-delta-packet">${icon("file", 16)} Copy delta packet</button>
              <button type="button" data-action="download-delta-packet">${icon("download", 16)} Download delta packet</button>
            </div>
            <section class="delta-execution-panel">
              <header>
                <div>
                  <span class="eyebrow">local operator staging gate</span>
                  <strong>${esc(deltaGate.passed)}/${esc(deltaGate.total)} checks before ticket/run creation</strong>
                </div>
                <em class="${statusClass(deltaGate.canStage ? "READY" : "BLOCKED")}">${esc(deltaGate.canStage ? "LOCAL STAGING READY" : "STAGING BLOCKED")}</em>
              </header>
              <div class="readiness-check-list">
                ${deltaGate.checks
                  .map(
                    (check) => `<span class="${check.ok ? "pass" : "fix"}">
                      <strong>${check.ok ? "PASS" : "FIX"}</strong>
                      ${esc(check.label)} - ${esc(check.detail)}
                    </span>`,
                  )
                  .join("")}
              </div>
              <p>Only saved REUSE or REVISE decisions can create local operator work. PARK preserves the archive/current finding without creating execution pressure.</p>
              <div class="dispatch-actions">
                <button type="submit" name="deltaStage" value="ticket" data-delta-stage-submit="ticket" ${deltaGate.canStage ? "" : "disabled"}>${icon("tickets", 16)} Create local ticket</button>
                <button type="submit" name="deltaStage" value="run" data-delta-stage-submit="run" ${deltaGate.canStage ? "" : "disabled"}>${icon("runs", 16)} Create local run</button>
              </div>
            </section>
          </form>
          <section class="packet-preview">
            <pre id="delta-packet">${esc(deltaPacket)}</pre>
          </section>
        </div>
      </section>
    </div>`);
}

function renderCloseout() {
  const ticket = selectedTicket();
  const preview = buildLedgerPreview(ticket);
  renderShell(`
    <div class="closeout-grid">
      <form class="closeout-form" id="closeout-form">
        <div class="panel-title">${icon("closeout")}<span>Agent closeout intake</span></div>
        <label>Ticket<select id="closeout-ticket">${state.tickets.map((item) => `<option value="${esc(item.id)}" ${item.id === ticket.id ? "selected" : ""}>${esc(item.id)} - ${esc(item.title || "Untitled")}</option>`).join("")}</select></label>
        ${textarea("Paste agent closeout", "closeoutRaw", ticket.closeoutRaw || "")}
        <div class="dispatch-actions">
          <button type="button" data-action="parse-closeout">${icon("check", 16)} Parse closeout</button>
          <button class="primary" type="submit">${icon("save", 16)} Save closeout to ticket</button>
        </div>
        ${renderCloseoutImportAid(ticket)}
        ${renderPendingCloseoutDraftPanel(ticket)}
        ${textarea("Closeout summary", "closeoutSummary", ticket.closeoutSummary || "")}
        ${textarea("Evidence paths", "evidencePaths", ticket.evidencePaths || "")}
        ${textarea("Validation run", "validationRun", ticket.validationRun || "")}
        ${textarea("Unknowns preserved", "unknownsPreserved", ticket.unknownsPreserved || "")}
        ${textarea("Authority conflicts", "authorityConflicts", ticket.authorityConflicts || "")}
        <div class="form-grid three">
          ${select("Reviewer status", "reviewerStatus", ticket.reviewerStatus || "NOT REVIEWED", ["NOT REVIEWED", "PENDING REVIEW", "ACCEPTED", "NEEDS FIX", "REJECTED"])}
          ${select("Memory recommendation", "memoryRecommendation", ticket.memoryRecommendation || "ledger_only", ["ledger_only", "add_promotion_candidate", "memory_promotion_candidate", "memory_update_required", "add_release", "add_error", "none_needed"])}
          ${input("Closed by", "closedBy", ticket.closedBy || "")}
        </div>
        ${input("Closeout at", "closeoutAt", ticket.closeoutAt || "")}
        <div class="validation-panel">
          <strong>${esc(ticket.reviewerStatus || "NOT REVIEWED")}</strong>
          <p>Closeout saves only to the D-local ticket file. A responsible director, CEO, Board, or Shrish still reviews before ledger promotion or memory action.</p>
        </div>
        ${renderEvidenceResolutionPanel(ticket, "closeout")}
      </form>
      <section class="packet-preview">
        <div class="panel-title">${icon("file")}<span>Ledger-ready preview</span></div>
        <div class="dispatch-actions">
          <button class="primary" data-action="copy-ledger-preview">${icon("copy", 16)} Copy CSV row</button>
          <button data-action="download-ledger-preview">${icon("download", 16)} Download CSV</button>
        </div>
        <pre id="ledger-preview">${esc(preview)}</pre>
      </section>
    </div>`);
}

function renderReview() {
  const queue = reviewQueueTickets();
  if (queue.length && !queue.some((item) => item.id === state.selectedTicketId)) state.selectedTicketId = queue[0].id;
  const ticket = selectedTicket();
  const review = reviewChecklist(ticket);
  const packet = buildReviewPacket(ticket);
  const counts = reviewQueueCounts();
  const linkedRuns = linkedRunsForTicket(ticket);
  renderShell(`
    <div class="review-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("review")}<span>Reviewer acceptance queue</span></div>
        <div class="review-filter-bar">
          ${[
            ["all", "All", counts.all],
            ["delta", "Delta work", counts.delta],
            ["ready", "Ready", counts.ready],
            ["needs", "Needs evidence", counts.needs],
            ["accepted", "Accepted", counts.accepted],
          ]
            .map(
              ([id, label, count]) => `<button type="button" class="${state.reviewFilter === id ? "active" : ""}" data-review-filter="${esc(id)}">
                <span>${esc(label)}</span><strong>${esc(count)}</strong>
              </button>`,
            )
            .join("")}
        </div>
        <div class="ticket-list">
          ${
            queue.length
              ? queue
                  .map((item) => {
                    const itemReview = reviewChecklist(item);
                    const deltaTag = isDeltaDerivedTicket(item) ? "Delta" : item.lane || "Ticket";
                    return `<button class="${item.id === ticket.id ? "selected ticket-row" : "ticket-row"}" data-ticket="${esc(item.id)}">
                <span>${esc(item.id)}</span><strong>${esc(item.title || "Untitled ticket")}</strong><em class="${statusClass(itemReview.status)}">${esc(itemReview.status)}</em>
                <small>${esc(deltaTag)}</small>
              </button>`;
                  })
                  .join("")
              : `<div class="empty-state"><strong>No tickets match this review filter.</strong><p>Switch filters or create a local ticket from Research, Queue, Search, or Operator OS.</p></div>`
          }
        </div>
      </section>
      <section class="review-detail">
        <div class="panel-title">${icon("review")}<span>${esc(ticket.id)} review gate</span></div>
        <div class="review-summary">
          <strong class="${statusClass(review.status)}">${esc(review.status)}</strong>
          <p>${esc(ticket.title)}</p>
        </div>
        <section class="linked-run-panel">
          <header>
            <div>
              <span class="eyebrow">${esc(isDeltaDerivedTicket(ticket) ? "delta-derived work" : "linked run context")}</span>
              <strong>${esc(linkedRuns.length)} local run-control packet${linkedRuns.length === 1 ? "" : "s"}</strong>
            </div>
            <em class="${statusClass(linkedRuns.length ? "READY" : "UNKNOWN")}">${esc(linkedRuns.length ? "RUN LINKED" : "NO RUN")}</em>
          </header>
          ${
            linkedRuns.length
              ? linkedRuns
                  .map(
                    (run) => `<article>
                      <span>${esc(run.id)} - ${esc(run.status || "UNKNOWN")}</span>
                      <strong>${esc(run.title || "Untitled local run")}</strong>
                      <p>${esc(run.authorityBasis || "D-local run-control packet; live/provider states remain UNKNOWN.")}</p>
                      <button type="button" data-open-run="${esc(run.id)}">${icon("runs", 16)} Open run</button>
                    </article>`,
                  )
                  .join("")
              : `<p>No run-control packet is linked yet. Create one from Research or Runs before accepting high-risk work.</p>`
          }
        </section>
        ${renderEvidenceResolutionPanel(ticket, "review")}
        <div class="review-checklist">
          ${review.items
            .map(
              (item) => `<article class="${item.ok ? "pass" : "needs"}">
                <strong>${esc(item.ok ? "PASS" : "NEEDS EVIDENCE")}</strong>
                <span>${esc(item.label)}</span>
                <p>${esc(item.detail)}</p>
              </article>`,
            )
            .join("")}
        </div>
        <label class="review-notes">Review notes<textarea id="review-notes">${esc(ticket.reviewNotes || "")}</textarea></label>
        <div class="form-grid two">
          ${input("Reviewed by", "reviewedBy", ticket.reviewedBy || ticket.closedBy || "Codex Strategic Board")}
          ${input("Reviewed at", "reviewedAt", ticket.reviewedAt || "")}
        </div>
        <div class="dispatch-actions">
          <button class="primary" data-action="mark-accepted">${icon("check", 16)} Mark accepted local</button>
          <button data-action="mark-needs-fix">${icon("warning", 16)} Needs fix</button>
          <button data-action="open-closeout">${icon("closeout", 16)} Open closeout</button>
          <button data-action="open-promote">${icon("promote", 16)} Open promote</button>
          <button data-action="copy-review-packet">${icon("file", 16)} Copy packet</button>
        </div>
      </section>
      <section class="packet-preview">
        <div class="panel-title">${icon("file")}<span>Review packet preview</span></div>
        <button data-action="download-review-packet">${icon("download", 16)} Download packet</button>
        <pre id="review-packet">${esc(packet)}</pre>
      </section>
    </div>`);
}

function renderPromote() {
  const queue = promotionQueueTickets();
  if (queue.length && !queue.some((item) => item.id === state.selectedTicketId)) state.selectedTicketId = queue[0].id;
  const ticket = selectedTicket();
  const promotion = promotionChecklist(ticket);
  const preflight = buildPromotionPreflight(ticket);
  const packet = buildPromotionPacket(ticket);
  const preflightPacket = buildPromotionPreflightPacket(ticket);
  const counts = promotionQueueCounts();
  renderShell(`
    <div class="promotion-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("promote")}<span>Promotion staging queue</span></div>
        <div class="review-filter-bar">
          ${[
            ["all", "All", counts.all],
            ["delta", "Delta work", counts.delta],
            ["ready", "Ready", counts.ready],
            ["blocked", "Blocked", counts.blocked],
            ["staged", "Staged", counts.staged],
          ]
            .map(
              ([id, label, count]) => `<button type="button" class="${state.promotionFilter === id ? "active" : ""}" data-promotion-filter="${esc(id)}">
                <span>${esc(label)}</span><strong>${esc(count)}</strong>
              </button>`,
            )
            .join("")}
        </div>
        <div class="ticket-list">
          ${
            queue.length
              ? queue
                  .map((item) => {
                    const itemPromotion = promotionChecklist(item);
                    const deltaTag = isDeltaDerivedTicket(item) ? "Delta" : item.lane || "Ticket";
                    return `<button class="${item.id === ticket.id ? "selected ticket-row" : "ticket-row"}" data-ticket="${esc(item.id)}">
                <span>${esc(item.id)}</span><strong>${esc(item.title || "Untitled ticket")}</strong><em class="${statusClass(itemPromotion.status)}">${esc(itemPromotion.status)}</em>
                <small>${esc(deltaTag)}</small>
              </button>`;
                  })
                  .join("")
              : `<div class="empty-state"><strong>No tickets match this promotion filter.</strong><p>Switch filters or complete Review and Closeout evidence before staging.</p></div>`
          }
        </div>
      </section>
      <section class="promotion-detail">
        <div class="panel-title">${icon("promote")}<span>${esc(ticket.id)} promotion gate</span></div>
        <div class="promotion-summary">
          <strong class="${statusClass(promotion.status)}">${esc(promotion.status)}</strong>
          <p>${esc(ticket.title)}</p>
        </div>
        <div class="promotion-checklist">
          ${promotion.items
            .map(
              (item) => `<article class="${item.ok ? "pass" : "needs"}">
                <strong>${esc(item.ok ? "PASS" : "BLOCKED")}</strong>
                <span>${esc(item.label)}</span>
                <em>${esc(item.detail)}</em>
              </article>`,
            )
            .join("")}
        </div>
        <section class="promotion-preflight-panel">
          <header>
            <div>
              <span class="eyebrow">manual authority preflight</span>
              <strong>${esc(preflight.passed)}/${esc(preflight.total)} checks before director packet</strong>
            </div>
            <em class="${statusClass(preflight.ready ? "READY" : "NEEDS_MORE_EVIDENCE")}">${esc(preflight.status)}</em>
          </header>
          <div class="readiness-check-list">
            ${preflight.checks
              .map(
                (check) => `<span class="${check.ok ? "pass" : "fix"}">
                  <strong>${check.ok ? "PASS" : "FIX"}</strong>
                  ${esc(check.label)} - ${esc(check.detail)}
                </span>`,
              )
              .join("")}
          </div>
          <p>Preparing a director preflight creates a local decision export only. It does not append the official ledger, promote memory, push GitHub, deploy, mutate providers, or prove live state.</p>
        </section>
        <label class="review-notes">Promotion notes<textarea id="promotion-notes">${esc(ticket.promotionNotes || "")}</textarea></label>
        <div class="form-grid two">
          ${input("Staged by", "stagedBy", ticket.stagedBy || ticket.reviewedBy || "Codex Strategic Board")}
          ${input("Staged at", "stagedAt", ticket.stagedAt || "")}
        </div>
        <div class="dispatch-actions">
          <button class="primary" type="button" data-action="mark-promotion-staged">${icon("check", 16)} Stage packet local</button>
          <button type="button" data-action="mark-promotion-blocked">${icon("warning", 16)} Block staging</button>
          <button type="button" data-action="open-review">${icon("review", 16)} Open review</button>
          <button type="button" data-action="copy-promotion-packet">${icon("file", 16)} Copy packet</button>
          <button type="button" data-action="prepare-promotion-preflight">${icon("decisions", 16)} Prepare director preflight</button>
        </div>
        <div class="validation-panel">
          <strong>Manual authority boundary</strong>
          <p>Staging saves only to the local ticket. It does not append the official ledger or update company memory.</p>
        </div>
      </section>
      <section class="packet-preview">
        <div class="panel-title">${icon("file")}<span>Promotion packet preview</span></div>
        <div class="dispatch-actions">
          <button type="button" data-action="download-promotion-packet">${icon("download", 16)} Download packet</button>
          <button type="button" data-action="copy-promotion-preflight">${icon("copy", 16)} Copy preflight</button>
          <button type="button" data-action="download-promotion-preflight">${icon("download", 16)} Download preflight</button>
        </div>
        <pre id="promotion-packet">${esc(packet)}</pre>
        <pre id="promotion-preflight-packet">${esc(preflightPacket)}</pre>
      </section>
    </div>`);
}

function renderActivity() {
  const event = selectedActivityEvent();
  const packet = buildActivityPacket(event);
  renderShell(`
    <div class="activity-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("activity")}<span>Local activity trail</span></div>
        <div class="activity-meta">
          <strong>${esc(state.activity.length)} events</strong>
          <span>${esc(state.activityPersistence)}</span>
        </div>
        <div class="dispatch-actions">
          <button type="button" data-action="export-activity">${icon("download", 16)} Export log</button>
        </div>
        <div class="activity-list">
          ${
            state.activity.length
              ? state.activity
                  .map(
                    (item) => `<button type="button" class="${item.id === event.id ? "selected activity-row" : "activity-row"}" data-activity="${esc(item.id)}">
                      <span>${esc(item.timestamp || "UNKNOWN")}</span>
                      <strong>${esc(item.action || "activity")}</strong>
                      <em>${esc(item.ticketId || "UNKNOWN")} - ${esc(item.title || "Untitled")}</em>
                    </button>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No activity recorded yet.</strong><p>Create, save, review, stage, or delete a ticket to append a local evidence event.</p></div>`
          }
        </div>
      </section>
      <section class="activity-detail">
        <div class="panel-title">${icon("file")}<span>Event detail</span></div>
        <div class="activity-summary">
          <strong class="${statusClass(event.action || "UNKNOWN")}">${esc(event.action || "UNKNOWN")}</strong>
          <p>${esc(event.details || "No event details saved.")}</p>
        </div>
        <dl class="activity-fields">
          <dt>Ticket</dt><dd>${esc(event.ticketId || "UNKNOWN")} - ${esc(event.title || "UNKNOWN")}</dd>
          <dt>Lane</dt><dd>${esc(event.lane || "UNKNOWN")}</dd>
          <dt>Owner</dt><dd>${esc(event.owner || "UNKNOWN")}</dd>
          <dt>Status</dt><dd>${esc(event.status || "UNKNOWN")}</dd>
          <dt>Review</dt><dd>${esc(event.reviewStatus || "UNKNOWN")}</dd>
          <dt>Promotion</dt><dd>${esc(event.promotionStatus || "UNKNOWN")}</dd>
          <dt>Memory</dt><dd>${esc(event.memoryRecommendation || "ledger_only")}</dd>
          <dt>Evidence</dt><dd>${esc(event.evidencePaths || "UNKNOWN")}</dd>
          <dt>Validation</dt><dd>${esc(event.validationRun || "UNKNOWN")}</dd>
          <dt>Unknowns</dt><dd>${esc(event.unknownsPreserved || "UNKNOWN")}</dd>
          <dt>Conflicts</dt><dd>${esc(event.authorityConflicts || "UNKNOWN")}</dd>
        </dl>
        <div class="validation-panel">
          <strong>Local evidence boundary</strong>
          <p>Activity persists after ticket cleanup, but it does not append the official ledger, promote company memory, prove GitHub release state, or verify provider live state.</p>
        </div>
        ${
          isCloseoutDraftEvent(event)
            ? `<div class="dispatch-actions">
                <button type="button" data-action="route-closeout-draft" ${state.tickets.some((ticket) => ticket.id === event.ticketId) ? "" : "disabled"}>${icon("closeout", 16)} Open in Closeout form</button>
              </div>`
            : ""
        }
      </section>
      <section class="packet-preview">
        <div class="panel-title">${icon("activity")}<span>Activity packet preview</span></div>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-activity-packet">${icon("file", 16)} Copy packet</button>
          <button type="button" data-action="download-activity-packet">${icon("download", 16)} Download packet</button>
        </div>
        <pre id="activity-packet">${esc(packet)}</pre>
      </section>
    </div>`);
}

function renderDecisions() {
  const decision = selectedDecision();
  const sourceEvents = filteredDecisionSourceEvents();
  const dispatchEvents = dispatchDecisionEvents();
  const pendingBundles = pendingDirectorBundles();
  const dispositionCounts = decisionDispositionCounts();
  const event = state.activity.find((item) => item.id === decision.sourceEventId) || selectedActivityEvent();
  const selectedEventIds = normalizeEventIds(decision.sourceEventIds, event.id);
  const bundledEvents = selectedEventIds.map((id) => state.activity.find((item) => item.id === id)).filter(Boolean);
  const bundleSummary = decision.bundleSummary || buildDecisionBundleSummary(decision, bundledEvents);
  const ledgerBundleCandidate = decision.ledgerBundleCandidate || buildDecisionLedgerCandidate(decision, bundledEvents);
  const packet = buildDirectorDecisionPacket(decision);
  const authorityHandoffPacket = buildAuthorityHandoffPacket({ ...decision, packet });
  const readiness = decisionReadiness({ ...decision, packet });
  renderShell(`
    <div class="decisions-grid">
      <section class="table-panel">
        <div class="panel-title">${icon("decisions")}<span>Director decisions</span></div>
        <div class="activity-meta">
          <strong>${esc(state.decisions.length)} exports</strong>
          <span>${esc(state.decisionPersistence)}</span>
        </div>
        <div class="dispatch-actions">
          <button type="button" data-action="new-decision">${icon("plus", 16)} New from event</button>
          <button type="button" data-action="new-decision-bundle">${icon("plus", 16)} New from visible</button>
          <button type="button" data-action="new-dispatch-decision-bundle" ${dispatchEvents.length ? "" : "disabled"}>${icon("dispatch", 16)} New dispatch bundle</button>
          <button type="button" data-action="export-decisions">${icon("download", 16)} Export JSON</button>
        </div>
        <label class="compact-filter">Event filter<select id="decision-event-filter">
          ${["reviewable", "dispatch", "accepted", "staged", "blocked", "all"].map((value) => `<option value="${value}" ${state.decisionEventFilter === value ? "selected" : ""}>${value}</option>`).join("")}
        </select></label>
        <div class="decision-signal-strip">
          <span><strong>${esc(dispatchEvents.length)}</strong> staged dispatch events</span>
          <span><strong>${esc(sourceEvents.length)}</strong> visible source events</span>
          <span>Official ledger and memory promotion stay manual.</span>
        </div>
        <div class="decision-inbox-panel">
          <div class="panel-title mini">${icon("review", 16)}<span>Director review inbox</span></div>
          <div class="decision-count-strip">
            <span><strong>${esc(dispositionCounts.READY_FOR_DIRECTOR_REVIEW || 0)}</strong> ready</span>
            <span><strong>${esc(dispositionCounts.NEEDS_MORE_EVIDENCE || 0)}</strong> needs evidence</span>
            <span><strong>${esc(dispositionCounts.DRAFT || 0)}</strong> draft</span>
            <span><strong>${esc(dispositionCounts.APPROVED_LOCAL || 0)}</strong> local approved</span>
          </div>
          <p>Inbox rows are local review packets only. A director still decides any official ledger append or memory promotion outside this app.</p>
          <div class="decision-inbox-list">
            ${
              pendingBundles.length
                ? pendingBundles
                    .map((item) => {
                      const itemReadiness = decisionReadiness(item);
                      return `<button type="button" class="${item.id === decision.id ? "selected decision-inbox-row" : "decision-inbox-row"}" data-decision="${esc(item.id)}">
                        <span>${esc(item.disposition || "READY_FOR_DIRECTOR_REVIEW")}</span>
                        <strong>${esc(item.title || item.id)}</strong>
                        <em>${esc(itemReadiness.passed)}/${esc(itemReadiness.total)} readiness - ${esc(directorBundleNextAction(item))}</em>
                      </button>`;
                    })
                    .join("")
                : `<div class="empty-state"><strong>No ready packets.</strong><p>Create a dispatch bundle or mark a local decision READY_FOR_DIRECTOR_REVIEW.</p></div>`
            }
          </div>
        </div>
        <div class="activity-list">
          ${
            state.decisions.length
              ? state.decisions
                  .map(
                    (item) => `<button type="button" class="${item.id === decision.id ? "selected activity-row" : "activity-row"}" data-decision="${esc(item.id)}">
                      <span>${esc(item.updatedAt || item.createdAt || "UNKNOWN")}</span>
                      <strong>${esc(item.disposition || "DRAFT")} - ${esc(item.decisionType || "decision")}</strong>
                      <em>${esc(item.ticketId || "UNKNOWN")} - ${esc(item.title || "Untitled")}</em>
                    </button>`,
                  )
                  .join("")
              : `<div class="empty-state"><strong>No decision exports yet.</strong><p>Choose an activity event and save a local director decision export.</p></div>`
          }
        </div>
      </section>
      <form class="decision-form" id="decision-form">
        <div class="panel-title">${icon("decisions")}<span>Signed local export</span></div>
        <section class="decision-readiness-panel">
          <header>
            <div>
              <span class="eyebrow">Local director readiness</span>
              <strong>${esc(readiness.passed)}/${esc(readiness.total)} checks ready for ${esc(decision.disposition || "DRAFT")}</strong>
            </div>
            <em class="${statusClass(readiness.passed === readiness.total ? "READY" : "NEEDS_MORE_EVIDENCE")}">${esc(readiness.passed === readiness.total ? "LOCAL CHECKS READY" : "NEEDS EVIDENCE")}</em>
          </header>
          <div class="readiness-check-list">
            ${readiness.checks
              .map(
                (check) => `<span class="${check.ok ? "pass" : "fix"}">
                  <strong>${check.ok ? "PASS" : "FIX"}</strong>
                  ${esc(check.label)} - ${esc(check.detail)}
                </span>`,
              )
              .join("")}
          </div>
          <div class="decision-quick-actions">
            <button type="button" data-decision-disposition="READY_FOR_DIRECTOR_REVIEW">${icon("review", 16)} Mark ready</button>
            <button type="button" data-decision-disposition="NEEDS_MORE_EVIDENCE">${icon("warning", 16)} Needs evidence</button>
            <button type="button" data-decision-disposition="REJECTED_LOCAL">${icon("lock", 16)} Reject local</button>
          </div>
          <p>These buttons update the local decision export only. They do not append the official execution ledger, promote memory, mutate providers, push GitHub, or prove live state.</p>
        </section>
        ${input("Decision ID", "id", decision.id)}
        <label>Source event<select id="decision-source-event" name="sourceEventId">${
          sourceEvents.length
            ? sourceEvents
                .map((item) => `<option value="${esc(item.id)}" ${item.id === event.id ? "selected" : ""}>${esc(item.action)} - ${esc(item.ticketId)} - ${esc(truncate(item.title, 70))}</option>`)
                .join("")
            : `<option value="">No activity events available</option>`
        }</select></label>
        <div class="event-bundle-panel">
          <div class="panel-title mini">${icon("activity", 16)}<span>Bundled evidence events</span></div>
          <p>Select multiple local activity events to stage one director bundle. This does not append the official ledger.</p>
          <div class="event-bundle-list">
            ${
              sourceEvents.length
                ? sourceEvents
                    .map(
                      (item) => `<label class="event-check">
                        <input type="checkbox" name="sourceEventIds" value="${esc(item.id)}" ${selectedEventIds.includes(item.id) ? "checked" : ""}>
                        <span><strong>${esc(item.action || "activity")}</strong><em>${esc(item.ticketId || "UNKNOWN")} - ${esc(truncate(item.title, 80))}</em></span>
                      </label>`,
                    )
                    .join("")
                : `<div class="empty-state"><strong>No filter matches.</strong><p>Switch to All events or create local activity first.</p></div>`
            }
          </div>
        </div>
        <div class="form-grid two">
          ${select("Decision type", "decisionType", decision.decisionType || "ledger_append_candidate", ["ledger_append_candidate", "memory_promotion_candidate", "release_note_candidate", "needs_more_evidence", "blocked_no_authority", "none_needed"])}
          ${select("Disposition", "disposition", decision.disposition || "DRAFT", ["DRAFT", "READY_FOR_DIRECTOR_REVIEW", "APPROVED_LOCAL", "NEEDS_MORE_EVIDENCE", "REJECTED_LOCAL"])}
        </div>
        <div class="form-grid two">
          ${input("Director / reviewer", "director", decision.director || "Codex Strategic Board")}
          ${input("Updated at", "updatedAt", decision.updatedAt || nowIso())}
        </div>
        ${input("Ticket ID", "ticketId", decision.ticketId || event.ticketId || "UNKNOWN")}
        ${input("Title", "title", decision.title || event.title || "Untitled director decision")}
        ${textarea("Authority basis", "authorityBasis", decision.authorityBasis || "")}
        ${textarea("Evidence paths", "evidencePaths", decision.evidencePaths || event.evidencePaths || "")}
        ${textarea("Validation run", "validationRun", decision.validationRun || event.validationRun || "")}
        ${textarea("Unknowns preserved", "unknownsPreserved", decision.unknownsPreserved || event.unknownsPreserved || "UNKNOWN")}
        ${textarea("Authority conflicts", "authorityConflicts", decision.authorityConflicts || event.authorityConflicts || "UNKNOWN")}
        ${select("Memory action", "memoryAction", decision.memoryAction || event.memoryRecommendation || "ledger_only", ["ledger_only", "none_needed", "add_promotion_candidate", "memory_update_required", "add_release", "add_error", "mark_stale"])}
        ${textarea("Official ledger candidate or source packet", "officialLedgerCandidate", decision.officialLedgerCandidate || event.packet || "")}
        ${textarea("Bundle summary", "bundleSummary", bundleSummary)}
        ${textarea("Local ledger bundle candidate", "ledgerBundleCandidate", ledgerBundleCandidate)}
        ${textarea("Director notes", "notes", decision.notes || "")}
        <div class="validation-panel">
          <strong>Director gate</strong>
          <p>Saving here creates a D-local export only. Official ledger append, memory validation, GitHub push, or provider-state claims remain separate authority-gated actions.</p>
        </div>
        <div class="form-actions">
          <button class="primary" type="button" data-action="save-decision">${icon("save", 16)} Save decision export</button>
        </div>
      </form>
      <section class="packet-preview">
        <div class="panel-title">${icon("file")}<span>Decision packet preview</span></div>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-decision-packet">${icon("file", 16)} Copy packet</button>
          <button type="button" data-action="download-decision-packet">${icon("download", 16)} Download packet</button>
        </div>
        <pre id="decision-packet">${esc(packet)}</pre>
      </section>
      <section class="packet-preview authority-handoff-panel">
        <div class="panel-title">${icon("lock")}<span>Manual authority handoff</span></div>
        <p>This handoff is a local packet for a responsible director, CEO, Board reviewer, or Shrish. It is not an official ledger append, memory promotion, GitHub action, provider proof, deployment, payment, or external send.</p>
        <div class="handoff-summary">
          <span><strong>${esc(readiness.passed)}/${esc(readiness.total)}</strong> readiness</span>
          <span><strong>${esc(decision.disposition || "DRAFT")}</strong> disposition</span>
          <span><strong>LOCAL_PACKET_ONLY</strong> handoff_status</span>
        </div>
        <div class="dispatch-actions">
          <button type="button" data-action="copy-authority-handoff">${icon("file", 16)} Copy handoff</button>
          <button type="button" data-action="download-authority-handoff">${icon("download", 16)} Download handoff</button>
        </div>
        <pre id="authority-handoff-packet">${esc(authorityHandoffPacket)}</pre>
      </section>
    </div>`);
}

// ---- F5-MV-18: local adapter surfaces (VCOS / Files / Git Truth / Sources / Capabilities) ----

const storageEvidenceKey = "mds-command-centre:source-evidence:v1";
const storageCapReqKey = "mds-command-centre:capability-requests:v1";
const CLIENT_SECRET_PATH_PATTERN =
  /(^|[\\/])\.env[^\\/]*$|\.pem$|\.p12$|\.pfx$|(^|[\\/])id_rsa[^\\/]*$|\.key$|(^|[\\/])(secrets?|tokens?|credentials?|cookies?)([\\/.]|$)|authinfo|(^|[\\/])hosts\.ya?ml$|\.npmrc$|(^|[\\/])\.aws([\\/]|$)|(^|[\\/])\.ssh([\\/]|$)/i;

async function fetchLocalJson(fileName) {
  try {
    const response = await fetch(`/src/data/${fileName}?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function loadAdapterSnapshots() {
  state.localCaps = await fetchLocalJson("localCapabilitySnapshot.json");
  state.sourceTruth = await fetchLocalJson("localSourceTruthSnapshot.json");
  state.adapterHealth = await fetchLocalJson("localAdapterHealth.json");
}

async function loadSourceEvidence() {
  try {
    const payload = await apiJson("/api/source-evidence");
    if (Array.isArray(payload.records)) {
      state.evidencePersistence = `file-backed: ${payload.store || "src/data/localSourceEvidence.json"}`;
      localStorage.setItem(storageEvidenceKey, JSON.stringify(payload.records));
      return payload.records;
    }
  } catch {
    state.evidencePersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageEvidenceKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSourceEvidence() {
  localStorage.setItem(storageEvidenceKey, JSON.stringify(state.sourceEvidence));
  try {
    const payload = await apiJson("/api/source-evidence", {
      method: "PUT",
      body: JSON.stringify({ records: state.sourceEvidence }),
    });
    state.evidencePersistence = `file-backed: ${payload.updatedAt || "saved"}`;
    state.browseNotice = "";
    return true;
  } catch (error) {
    state.evidencePersistence = "localStorage fallback";
    state.browseNotice = String(error.message || "save failed");
    return false;
  }
}

async function loadCapabilityRequests() {
  try {
    const payload = await apiJson("/api/capability-requests");
    if (Array.isArray(payload.records)) {
      state.capabilityRequestPersistence = `file-backed: ${payload.store || "src/data/localCapabilityRequests.json"}`;
      localStorage.setItem(storageCapReqKey, JSON.stringify(payload.records));
      return payload.records;
    }
  } catch {
    state.capabilityRequestPersistence = "localStorage fallback";
  }
  try {
    const stored = localStorage.getItem(storageCapReqKey);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCapabilityRequests() {
  localStorage.setItem(storageCapReqKey, JSON.stringify(state.capabilityRequests));
  try {
    const payload = await apiJson("/api/capability-requests", {
      method: "PUT",
      body: JSON.stringify({ records: state.capabilityRequests }),
    });
    state.capabilityRequestPersistence = `file-backed: ${payload.updatedAt || "saved"}`;
    return true;
  } catch (error) {
    state.capabilityRequestPersistence = "localStorage fallback";
    state.browseNotice = String(error.message || "save failed");
    return false;
  }
}

async function browseTo(relativePath) {
  state.browsePath = relativePath || ".";
  state.browseNotice = "";
  try {
    const listing = await apiJson(`/api/browse?path=${encodeURIComponent(state.browsePath)}`);
    state.browseListing = listing;
    if (listing.refused) state.browseNotice = listing.reason || "Refused.";
  } catch (error) {
    state.browseListing = null;
    state.browseNotice = String(error.message || "browse unavailable (API offline)");
  }
}

function adapterStatusCards() {
  const adapters = state.adapterHealth?.adapters || [];
  if (!adapters.length) {
    return `<article class="empty-card"><strong>No adapter health snapshot.</strong><p>Run "Refresh adapters" to generate localAdapterHealth.json.</p></article>`;
  }
  return adapters
    .map(
      (adapter) => `<article>
        <header><strong>${esc(adapter.adapter_id)}</strong><em class="${statusClass(adapter.status === "ok" ? "READY" : adapter.status === "degraded" ? "NEEDS FIX" : "BLOCKED")}">${esc(adapter.status)}</em></header>
        <p>${esc(truncate(adapter.authority, 140))}</p>
        <span>risk: ${esc(adapter.risk_class)} | ${esc(adapter.duration_ms)}ms | ${esc(adapter.last_checked_at || "")}</span>
        ${(adapter.unknowns || []).length ? `<p class="unknown-note">UNKNOWN: ${esc(truncate((adapter.unknowns || []).join("; "), 180))}</p>` : ""}
      </article>`,
    )
    .join("");
}

function snapshotBanner(snapshotObject, label) {
  if (snapshotObject) return "";
  return `<section class="objective-panel wide degraded-banner">
    <div class="panel-title">${icon("warning")}<span>${esc(label)} snapshot missing</span></div>
    <p>Local adapter snapshot not generated yet or the API is offline. Use "Refresh adapters" (requires npm run dev server). Fail-closed: nothing is assumed.</p>
    <div class="dispatch-actions"><button class="primary" data-action="refresh-adapters">${icon("health", 16)} Refresh adapters</button></div>
  </section>`;
}

function renderVcosView() {
  const vcos = state.sourceTruth?.vcos || null;
  const runtime = state.sourceTruth?.midasRuntime || null;
  const broker = state.localCaps?.capabilityBroker || null;
  const conflict = vcos?.midasPathConflict || "UNKNOWN";
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.sourceTruth, "VCOS")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("vcos")}<span>VCOS end-to-end readiness</span></div>
        <h2>${esc(vcos ? `${vcos.departmentCount} departments with DIRECTOR.md on disk` : "Department roster UNKNOWN until refresh")}</h2>
        <p class="${/CONFLICT/i.test(conflict) ? "status blocked" : "status unknown"}">MIDAS path: ${esc(conflict)}</p>
        <p>Studio readiness validator: ${esc(broker?.validators?.studioReadiness?.status || "UNKNOWN")}. Capability validator: ${esc(broker?.validators?.capabilities?.status || "UNKNOWN")}.</p>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Departments</span></div>
        <div class="stack-list">
          ${(vcos?.departments || [])
            .map((dept) => `<article><strong>${esc(dept.slug)}</strong><p>${esc(dept.directorHeading)}</p><span class="status ready">DIRECTOR.md present</span></article>`)
            .join("") || `<article class="empty-card"><strong>No department data. Refresh adapters.</strong></article>`}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("runtime")}<span>MIDAS runtime surfaces</span></div>
        <div class="stack-list">
          ${(runtime?.surfaces || [])
            .map(
              (surface) => `<article><strong>${esc(surface.id)}</strong><p>${esc(surface.relativePath)}</p><span class="${statusClass(surface.exists ? "READY" : "UNKNOWN")}">${esc(surface.exists ? `${surface.artifactCount} artifacts` : "missing")}</span></article>`,
            )
            .join("") || `<article class="empty-card"><strong>No runtime data. Refresh adapters.</strong></article>`}
        </div>
      </section>
    </div>`);
}

function renderFilesView() {
  const drives = state.sourceTruth?.drives?.drives || [];
  const listing = state.browseListing;
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.sourceTruth, "Files")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("files")}<span>Local system and drives (allowlisted)</span></div>
        <h2>Browse allowlisted D roots. Secret-shaped paths are refused, never read.</h2>
        <p>${drives.map((drive) => `${esc(drive.drive)} ${esc(drive.role)}: ${drive.present ? "present" : "absent"}`).join(" | ") || "Drive roles UNKNOWN until refresh."}</p>
        ${state.browseNotice ? `<p class="status blocked">${esc(state.browseNotice)}</p>` : ""}
        <div class="dispatch-actions">
          ${["Products", "vcos", "command-centre", "output/playwright", "."].map((rootPath) => `<button data-browse="${esc(rootPath)}">${icon("files", 16)} ${esc(rootPath === "." ? "D root" : rootPath)}</button>`).join("")}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>${esc(listing?.relativePath || state.browsePath)}</span></div>
        ${
          listing?.ok && listing.kind === "dir"
            ? `<p>${esc(listing.total)} entries; ${esc(listing.refusedSecretShaped || 0)} secret-shaped name(s) refused from listing.</p>
               <div class="stack-list">
                 ${listing.relativePath !== "." ? `<article><button data-browse="${esc(listing.relativePath.split("/").slice(0, -1).join("/") || ".")}">${icon("upload", 14)} up one level</button></article>` : ""}
                 ${(listing.entries || [])
                   .map(
                     (entry) =>
                       `<article><strong>${entry.kind === "dir" ? `<button data-browse="${esc(`${listing.relativePath === "." ? "" : `${listing.relativePath}/`}${entry.name}`)}">${esc(entry.name)}/</button>` : esc(entry.name)}</strong><p>${esc(entry.kind)} ${entry.sizeBytes ? `| ${esc(entry.sizeBytes)} bytes` : ""}</p><span>${esc(entry.modifiedAt || "")}</span></article>`,
                   )
                   .join("")}
               </div>`
            : listing?.ok && listing.kind === "file"
              ? `<div class="stack-list"><article><strong>${esc(listing.relativePath)}</strong><p>${esc(listing.sizeBytes)} bytes | ${esc(listing.modifiedAt)}</p><span>${esc(listing.note)}</span></article></div>`
              : `<article class="empty-card"><strong>${esc(state.browseNotice || "Pick an allowlisted root to browse (requires local API).")}</strong></article>`
        }
      </section>
      <section class="table-panel">
        <div class="panel-title">${icon("lock")}<span>Refusal policy</span></div>
        <div class="stack-list">
          <article><strong>Secret-shaped paths</strong><p>.env*, keys, tokens, credentials, cookies, auth stores refused at server and adapter level.</p><span class="status blocked">never read</span></article>
          <article><strong>Escape attempts</strong><p>Paths outside D allowlisted roots are refused.</p><span class="status blocked">403</span></article>
          <article><strong>E drive</strong><p>Backup-only role; never written by Command Centre.</p><span class="status parked">read role only</span></article>
        </div>
      </section>
    </div>`);
}

function renderGitTruthView() {
  const gitLocal = state.sourceTruth?.gitLocal || null;
  const github = state.sourceTruth?.github || null;
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.sourceTruth, "Git")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("git")}<span>Git and GitHub source truth</span></div>
        <h2>Local git metadata is read-only evidence; GitHub remains committed-code authority.</h2>
        <p>gh CLI: ${esc(github ? (github.ghPresent ? "present" : "absent") : "UNKNOWN")}. Auth: ${esc(github?.authState || "UNKNOWN")}${github?.account && github.account !== "UNKNOWN" ? ` (account ${esc(github.account)})` : ""}. No push, PR, or mutation from this surface.</p>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Local repositories</span></div>
        <div class="health-table">
          <div class="health-head"><span>Repo</span><span>Branch</span><span>HEAD</span><span>Dirty</span><span>Remote</span></div>
          ${(gitLocal?.repos || [])
            .map(
              (repo) => `<div class="health-row">
                <strong>${esc(repo.relativePath)}</strong>
                <em class="${statusClass(repo.status === "ok" ? "READY" : "UNKNOWN")}">${esc(repo.branch)}</em>
                <span>${esc(repo.head)}</span>
                <span>${esc(repo.dirty)}</span>
                <span>${esc(truncate(repo.remote, 60))}</span>
              </div>`,
            )
            .join("") || `<div class="health-row"><strong>No git snapshot. Refresh adapters.</strong><em class="status unknown">UNKNOWN</em><span></span><span></span><span></span></div>`}
        </div>
      </section>
    </div>`);
}

function renderSourcesView() {
  const records = state.sourceEvidence || [];
  renderShell(`
    <div class="health-grid">
      <section class="objective-panel wide">
        <div class="panel-title">${icon("sources")}<span>Web and source intake</span></div>
        <h2>Record source evidence (URL, D-path, GitHub ref, NotebookLM note, session extract) as evidence inputs only.</h2>
        <p>Persistence: ${esc(state.evidencePersistence)}. No login scraping, no cookie/session reads, no external posting. Public URL fetch happens only through a separately approved request packet, never from this form.</p>
        ${state.browseNotice ? `<p class="status blocked">${esc(state.browseNotice)}</p>` : ""}
      </section>
      <form class="research-form" id="source-evidence-form">
        <div class="panel-title">${icon("plus")}<span>New source evidence record</span></div>
        <div class="form-grid three">
          ${select("Source type", "sourceType", "url", ["url", "d-path", "github-repo-ref", "notebooklm-note", "session-extract"])}
          ${input("Pointer (URL / path / ref)", "pointer", "", "https://... or vcos/... or repo#ref")}
          ${select("Authority class", "authorityClass", "evidence-input-until-verified", ["evidence-input-until-verified", "committed-code-authority-ref", "provider-evidence-candidate", "reference-only"])}
        </div>
        ${textarea("Evidence note", "evidenceNote", "")}
        ${textarea("Expected use", "expectedUse", "")}
        ${textarea("Unknowns preserved", "unknownsPreserved", "Live provider/payment/deploy/auth/schema states remain UNKNOWN.")}
        <div class="dispatch-actions"><button class="primary" type="submit">${icon("save", 16)} Record source evidence</button></div>
      </form>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Source evidence records (${esc(records.length)})</span></div>
        <div class="stack-list">
          ${records
            .slice(0, 60)
            .map(
              (record) => `<article>
                <strong>${esc(record.id)} - ${esc(record.sourceType)}</strong>
                <p>${esc(truncate(record.pointer, 140))}</p>
                <p>${esc(truncate(record.evidenceNote, 160))}</p>
                <span>${esc(record.authorityClass)} | ${esc(record.status)} | ${esc(record.createdAt)}</span>
              </article>`,
            )
            .join("") || `<article class="empty-card"><strong>No source evidence yet.</strong><p>Record the first source above.</p></article>`}
        </div>
      </section>
    </div>`);
}

function renderCapabilitiesView() {
  const broker = state.localCaps?.capabilityBroker || null;
  const clis = state.localCaps?.providerClis?.clis || [];
  const models = state.localCaps?.modelProviders || null;
  const requests = state.capabilityRequests || [];
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.localCaps, "Capabilities")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("capabilities")}<span>Capability broker</span></div>
        <h2>Provider records, risk classes, and request-only states. Red/provider actions never execute from here.</h2>
        <p>Capability validator: ${esc(broker?.validators?.capabilities?.status || "UNKNOWN")}. Studio readiness: ${esc(broker?.validators?.studioReadiness?.status || "UNKNOWN")}. Request persistence: ${esc(state.capabilityRequestPersistence)}.</p>
        <div class="dispatch-actions">
          <button class="primary" data-action="refresh-adapters">${icon("health", 16)} Refresh adapters</button>
          ${state.adapterRefreshState ? `<span class="status unknown">${esc(state.adapterRefreshState)}</span>` : ""}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Capability providers (${esc((broker?.providers || []).length)})</span></div>
        <div class="stack-list">
          ${(broker?.providers || [])
            .slice(0, 40)
            .map(
              (provider) => `<article>
                <strong>${esc(provider.provider_id || provider.id || "unnamed")}</strong>
                <p>${esc(truncate(provider.description || provider.authority || "", 150))}</p>
                <span class="${statusClass(String(provider.status || provider.live_state || "UNKNOWN"))}">${esc(provider.status || provider.live_state || "UNKNOWN")}</span>
              </article>`,
            )
            .join("") || `<article class="empty-card"><strong>No capability provider records loaded.</strong></article>`}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("dispatch")}<span>Provider CLIs and model runtimes</span></div>
        <div class="health-table">
          <div class="health-head"><span>Tool</span><span>Present</span><span>Live state</span><span>Forbidden</span><span></span></div>
          ${clis
            .map(
              (cli) => `<div class="health-row">
                <strong>${esc(cli.provider)} (${esc(cli.command)})</strong>
                <em class="${statusClass(cli.present ? "READY" : "UNKNOWN")}">${esc(cli.present ? "present" : "absent")}</em>
                <span>${esc(cli.liveState)}</span>
                <span>${esc((cli.forbiddenActions || []).join(", "))}</span>
                <span></span>
              </div>`,
            )
            .join("")}
          ${(models?.runtimes || [])
            .map(
              (runtime) => `<div class="health-row">
                <strong>${esc(runtime.id)} (${esc(runtime.kind)})</strong>
                <em class="${statusClass(runtime.present ? "READY" : "UNKNOWN")}">${esc(runtime.present ? "present" : "absent")}</em>
                <span>${esc(runtime.notes)}</span>
                <span>no server start, no downloads, no API calls</span>
                <span></span>
              </div>`,
            )
            .join("")}
          ${(models?.paidApiAdapters || [])
            .map(
              (adapter) => `<div class="health-row">
                <strong>${esc(adapter.id)}</strong>
                <em class="status blocked">${esc(adapter.riskClass)} / ${esc(adapter.status)}</em>
                <span>${esc(adapter.liveState)}</span>
                <span>${esc(adapter.note)}</span>
                <span></span>
              </div>`,
            )
            .join("")}
        </div>
      </section>
      <form class="research-form" id="capability-request-form">
        <div class="panel-title">${icon("plus")}<span>New local request packet</span></div>
        <div class="form-grid three">
          ${select("Request kind", "requestKind", "capability", ["capability", "file-action", "app-action", "provider-metadata-read", "model-run", "web-fetch"])}
          ${input("Target", "target", "", "provider/path/app/model")}
          ${select("Risk class", "riskClass", "green_readonly", ["green_readonly", "yellow_local_write", "yellow_local_app", "red_provider_mutation", "red_secret_or_payment"])}
        </div>
        ${input("Action requested", "action", "", "one concrete action")}
        ${textarea("Evidence required", "evidenceRequired", "")}
        ${textarea("Stop condition", "stopCondition", "Stop before any side effect not named in allowed actions.")}
        ${textarea("Validation commands", "validationCommands", "")}
        <div class="dispatch-actions"><button class="primary" type="submit">${icon("save", 16)} Create request packet</button></div>
      </form>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Local request packets (${esc(requests.length)})</span></div>
        <div class="stack-list">
          ${requests
            .slice(0, 60)
            .map(
              (request) => `<article>
                <strong>${esc(request.id)} - ${esc(request.requestKind)}</strong>
                <p>${esc(truncate(`${request.action} -> ${request.target}`, 150))}</p>
                <span class="${statusClass(request.riskClass.startsWith("red") ? "BLOCKED" : request.status)}">${esc(request.riskClass)} | ${esc(request.status)}</span>
              </article>`,
            )
            .join("") || `<article class="empty-card"><strong>No request packets yet.</strong></article>`}
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("health")}<span>Adapter health</span></div>
        <div class="stack-list">${adapterStatusCards()}</div>
      </section>
    </div>`);
}

function renderProvidersView() {
  const clis = state.localCaps?.providerClis?.clis || [];
  const github = state.sourceTruth?.github || null;
  const providers = [
    {
      id: "github",
      status: github?.authState || "UNKNOWN",
      authority: "GitHub committed/versioned code authority. This surface reads metadata only.",
      allowed: "safe CLI/account metadata, local request packets",
      forbidden: "push, PR, branch rule, secret, token, repo setting, billing",
    },
    ...clis.map((cli) => ({
      id: cli.provider,
      status: cli.present ? "metadata tool present" : "UNKNOWN",
      authority: `${cli.command} CLI presence only; provider dashboard remains live-state authority.`,
      allowed: "command presence/version evidence, request packets",
      forbidden: (cli.forbiddenActions || []).join(", ") || "provider mutation, deploy, env read",
    })),
  ];
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.localCaps, "Providers")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("providers")}<span>Provider control plane</span></div>
        <h2>Cloud providers are visible, typed, and request-only until approved provider evidence exists.</h2>
        <p>Vercel, Supabase, Cloudflare, Railway, GitHub, and related CLIs remain metadata-only here. This lane never deploys, reads env values, changes billing/auth/schema, or logs into dashboards.</p>
        <div class="dispatch-actions"><button class="primary" data-action="refresh-adapters">${icon("health", 16)} Refresh adapters</button>${state.adapterRefreshState ? `<span class="status unknown">${esc(state.adapterRefreshState)}</span>` : ""}</div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("boards")}<span>Provider records</span></div>
        <div class="health-table provider-table">
          <div class="health-head"><span>Provider</span><span>Status</span><span>Authority</span><span>Allowed</span><span>Forbidden</span></div>
          ${providers
            .map(
              (provider) => `<div class="health-row">
                <strong>${esc(provider.id)}</strong>
                <em class="${statusClass(provider.status)}">${esc(provider.status)}</em>
                <span>${esc(provider.authority)}</span>
                <span>${esc(provider.allowed)}</span>
                <span>${esc(provider.forbidden)}</span>
              </div>`,
            )
            .join("") || `<div class="health-row"><strong>No provider records loaded.</strong><em class="status unknown">UNKNOWN</em><span></span><span></span><span></span></div>`}
        </div>
      </section>
      <form class="research-form" id="capability-request-form">
        <div class="panel-title">${icon("plus")}<span>Provider metadata request packet</span></div>
        <div class="form-grid three">
          ${select("Request kind", "requestKind", "provider-metadata-read", ["provider-metadata-read", "capability", "web-fetch"])}
          ${input("Target provider", "target", "", "github/vercel/supabase/cloudflare/railway")}
          ${select("Risk class", "riskClass", "green_readonly", ["green_readonly", "red_provider_mutation", "red_secret_or_payment"])}
        </div>
        ${input("Action requested", "action", "", "read safe metadata only")}
        ${textarea("Evidence required", "evidenceRequired", "Provider-owned live claims require provider evidence. Metadata-only requests must not reveal secrets.")}
        ${textarea("Stop condition", "stopCondition", "Stop before deploy, env read, schema/auth/billing/payment mutation, external send, or dashboard mutation.")}
        ${textarea("Validation commands", "validationCommands", "")}
        <div class="dispatch-actions"><button class="primary" type="submit">${icon("save", 16)} Create provider request</button></div>
      </form>
    </div>`);
}

function renderModelsView() {
  const models = state.localCaps?.modelProviders || {};
  const runtimes = models.runtimes || [];
  const paid = models.paidApiAdapters || [];
  const router = state.modelRouter || { state: { authProfiles: [], failures: [], receipts: [] }, inventory: [], chains: {} };
  const latestReceipt = router.state?.receipts?.[0];
  renderShell(`
    <div class="health-grid">
      ${snapshotBanner(state.localCaps, "Models")}
      <section class="objective-panel wide">
        <div class="panel-title">${icon("models")}<span>Model provider contract</span></div>
        <h2>Model choices are adapter records until safe local availability proves otherwise.</h2>
        <p>Local OSS runtimes are detected only by cheap command metadata. Paid API providers stay disabled/unconfigured unless explicit safe evidence exists. No model server starts, downloads, paid API calls, or env-value reads happen here.</p>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("runtime")}<span>Local OSS runtime metadata</span></div>
        <div class="health-table model-table">
          <div class="health-head"><span>Runtime</span><span>Presence</span><span>Kind</span><span>Evidence</span><span>Boundary</span></div>
          ${runtimes
            .map(
              (runtime) => `<div class="health-row">
                <strong>${esc(runtime.id)}</strong>
                <em class="${statusClass(runtime.present ? "READY" : "UNKNOWN")}">${esc(runtime.present ? "present" : "absent/UNKNOWN")}</em>
                <span>${esc(runtime.kind)}</span>
                <span>${esc(runtime.version || runtime.notes || "UNKNOWN")}</span>
                <span>no server start, no downloads, no API calls</span>
              </div>`,
            )
            .join("") || `<div class="health-row"><strong>No local model runtime records.</strong><em class="status unknown">UNKNOWN</em><span></span><span></span><span></span></div>`}
        </div>
      </section>
      <section class="objective-panel wide model-router-panel">
        <div class="panel-title">${icon("models")}<span>Failover resolver</span></div>
        <h2>Credential-blind routing across verified profiles, local models, and offline fallback.</h2>
        <p>Provider auth profiles contain names and verification state only. Circuit breakers react to explicit local failure signals. Every receipt is a routing decision, not proof that a model executed successfully.</p>
        ${state.modelRouterNotice ? `<div class="pairing-notice" role="status"><strong>Router result</strong><code>${esc(state.modelRouterNotice)}</code></div>` : ""}
        <div class="voice-runtime-strip">
          <span><strong>Local models</strong>${esc(router.inventory?.filter((item) => item.local).length || 0)}</span>
          <span><strong>Auth profiles</strong>${esc(router.state?.authProfiles?.length || 0)} names only</span>
          <span><strong>Open circuits</strong>${esc(router.state?.failures?.length || 0)}</span>
          <span><strong>Credentials read</strong>${router.credentialValuesRead === false ? "NO" : "UNKNOWN"}</span>
        </div>
        <div class="model-router-layout">
          <form class="research-form" id="model-route-form">
            <div class="panel-title">${icon("dispatch")}<span>Resolve route</span></div>
            ${select("Task class", "taskClass", "general", ["general", "coding", "multimodal"])}
            <div class="dispatch-actions"><button type="submit" class="primary">${icon("check", 16)} Resolve without execution</button></div>
          </form>
          <form class="research-form" id="model-failure-form">
            <div class="panel-title">${icon("warning")}<span>Record failure signal</span></div>
            ${input("Target ID", "targetId", latestReceipt?.targetId || "", "profile or model id")}
            ${select("Reason", "reason", "rate_limit", ["rate_limit", "quota_exhausted", "auth_unavailable", "runtime_unavailable"])}
            ${select("Task class", "taskClass", latestReceipt?.taskClass || "general", ["general", "coding", "multimodal"])}
            <div class="dispatch-actions"><button type="submit">${icon("warning", 16)} Open circuit and re-resolve</button></div>
          </form>
        </div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("runtime")}<span>Verified local inventory</span></div>
        <div class="stack-list">${router.inventory?.length ? router.inventory.map((item) => `<article><strong>${esc(item.name)}</strong><p>${esc(item.evidence)}</p><em class="${statusClass(item.local ? "READY LOCAL" : "UNKNOWN")}">${item.local ? "LOCAL" : "CLOUD/EXCLUDED"}</em></article>`).join("") : `<article class="empty-card"><strong>No verified local model inventory.</strong><p>Resolver will terminate at manual offline handoff.</p></article>`}</div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("proof")}<span>Route receipts</span></div>
        <div class="stack-list">${router.state?.receipts?.length ? router.state.receipts.map((receipt) => `<article><header><strong>${esc(receipt.targetId)}</strong><em class="${statusClass(receipt.layer === "local" ? "READY" : receipt.layer === "offline" ? "PARTIAL" : "UNKNOWN")}">${esc(receipt.layer)}</em></header><p>${esc(receipt.taskClass)} · ${esc(receipt.reason)}</p><span>executionStarted=false · credentialValuesRead=false</span></article>`).join("") : `<article class="empty-card"><strong>No route receipts.</strong><p>Resolve a task class to create a local decision receipt.</p></article>`}</div>
      </section>
      <section class="table-panel wide">
        <div class="panel-title">${icon("lock")}<span>Paid API adapters</span></div>
        <div class="stack-list">
          ${paid
            .map(
              (adapter) => `<article>
                <strong>${esc(adapter.id)}</strong>
                <p>${esc(adapter.note)}</p>
                <span class="status blocked">${esc(adapter.riskClass)} | ${esc(adapter.status)} | ${esc(adapter.liveState)}</span>
              </article>`,
            )
            .join("") || `<article class="empty-card"><strong>Paid API provider state UNKNOWN.</strong><p>No env values or provider secrets were read.</p></article>`}
        </div>
      </section>
      <form class="research-form" id="capability-request-form">
        <div class="panel-title">${icon("plus")}<span>Model adapter request packet</span></div>
        <div class="form-grid three">
          ${select("Request kind", "requestKind", "model-run", ["model-run", "capability"])}
          ${input("Target model/provider", "target", "", "ollama/local-runtime/provider-record")}
          ${select("Risk class", "riskClass", "green_readonly", ["green_readonly", "red_secret_or_payment"])}
        </div>
        ${input("Action requested", "action", "", "verify command metadata only")}
        ${textarea("Evidence required", "evidenceRequired", "Command existence/version evidence only unless a future approval expands scope.")}
        ${textarea("Stop condition", "stopCondition", "Stop before starting a model server, downloading models, calling paid APIs, or reading env values.")}
        ${textarea("Validation commands", "validationCommands", "")}
        <div class="dispatch-actions"><button class="primary" type="submit">${icon("save", 16)} Create model request</button></div>
      </form>
    </div>`);
}

function wireMv18Events() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.browse !== undefined) {
      event.preventDefault();
      await browseTo(button.dataset.browse || ".");
      state.view = "files";
      render();
      return;
    }
    if (button.dataset.action === "refresh-adapters") {
      event.preventDefault();
      state.adapterRefreshState = "refreshing (runs local adapters; may take a minute)...";
      render();
      try {
        await apiJson("/api/refresh-adapters", { method: "POST" });
        await loadAdapterSnapshots();
        state.adapterRefreshState = "adapter snapshots refreshed";
      } catch (error) {
        state.adapterRefreshState = `refresh failed: ${String(error.message || "API offline")}`;
      }
      render();
    }
  });

  document.addEventListener("submit", async (event) => {
    const modelRouteForm = event.target?.closest?.("#model-route-form");
    if (modelRouteForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(modelRouteForm).entries());
      const payload = await apiJson("/api/model-router/resolve", { method: "POST", body: JSON.stringify(values) });
      state.modelRouterNotice = `${payload.receipt.layer}: ${payload.receipt.targetId} (${payload.receipt.reason}); executionStarted=false.`;
      await loadModelRouter();
      render();
      return;
    }
    const modelFailureForm = event.target?.closest?.("#model-failure-form");
    if (modelFailureForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(modelFailureForm).entries());
      if (!String(values.targetId || "").trim()) {
        state.modelRouterNotice = "Failure target ID is required.";
        render();
        return;
      }
      const payload = await apiJson("/api/model-router/failure", { method: "POST", body: JSON.stringify(values) });
      state.modelRouterNotice = `Circuit opened for ${values.targetId}; next route ${payload.receipt.layer}: ${payload.receipt.targetId}.`;
      await loadModelRouter();
      render();
      return;
    }
    const formElement = event.target?.closest?.("#source-evidence-form, #capability-request-form");
    if (!formElement) return;
    event.preventDefault();
    const form = new FormData(formElement);
    const values = Object.fromEntries(form.entries());
    if (formElement.id === "source-evidence-form") {
      if (!String(values.pointer || "").trim()) {
        state.browseNotice = "Pointer is required.";
        render();
        return;
      }
      if (CLIENT_SECRET_PATH_PATTERN.test(String(values.pointer || ""))) {
        state.browseNotice = "Refused: secret-shaped pointer. Command Centre never records env/keys/tokens/cookies/auth-store paths as sources.";
        render();
        return;
      }
      const record = { ...values, id: `SRC-${Date.now().toString(36).toUpperCase()}`, status: "RECORDED", createdAt: nowIso() };
      state.sourceEvidence = [record, ...state.sourceEvidence];
      const saved = await saveSourceEvidence();
      if (!saved) {
        state.sourceEvidence = state.sourceEvidence.filter((item) => item.id !== record.id);
        state.browseNotice = `Refused by local store: ${state.browseNotice || "save failed"}. Record was not kept.`;
      }
      await recordActivity("source_evidence_recorded", selectedTicket(), {
        details: `Recorded source evidence ${record.id} (${record.sourceType}).`,
      });
      render();
      return;
    }
    if (formElement.id === "capability-request-form") {
      if (CLIENT_SECRET_PATH_PATTERN.test(String(values.target || ""))) {
        state.browseNotice = "Refused: secret-shaped target. Capability requests cannot point at env/keys/tokens/cookies/auth-store paths.";
        render();
        return;
      }
      if (values.riskClass === "red_secret_or_payment") {
        state.browseNotice = "Blocked: red_secret_or_payment is always blocked in Slice 1. No request packet was created.";
        render();
        return;
      }
      const record = {
        ...values,
        id: `CAPREQ-${Date.now().toString(36).toUpperCase()}`,
        status: values.riskClass === "red_provider_mutation" ? "APPROVAL_REQUIRED" : "REQUESTED",
        owner: "shrish",
        createdAt: nowIso(),
      };
      state.capabilityRequests = [record, ...state.capabilityRequests];
      await saveCapabilityRequests();
      await recordActivity("capability_request_created", selectedTicket(), {
        details: `Created local request packet ${record.id}: ${record.requestKind} -> ${record.target}. Request-only; no execution authority.`,
      });
      render();
    }
  });
}

function render() {
  if (state.view === "today") renderToday();
  if (state.view === "inbox") renderInbox();
  if (state.view === "workspaces") renderWorkspaces();
  if (state.view === "voice") renderVoice();
  if (state.view === "canvas") renderCanvas();
  if (state.view === "search") renderSearch();
  if (state.view === "queue") renderQueue();
  if (state.view === "boards") renderBoards();
  if (state.view === "launch") renderLaunchOs();
  if (state.view === "runtime") renderRuntime();
  if (state.view === "vcos") renderVcosView();
  if (state.view === "files") renderFilesView();
  if (state.view === "git") renderGitTruthView();
  if (state.view === "sources") renderSourcesView();
  if (state.view === "capabilities") renderCapabilitiesView();
  if (state.view === "providers") renderProvidersView();
  if (state.view === "models") renderModelsView();
  if (state.view === "proof") renderProof();
  if (state.view === "operator") renderOperator();
  if (state.view === "research") renderResearch();
  if (state.view === "runs") renderRuns();
  if (state.view === "tickets") renderTickets();
  if (state.view === "dispatch") renderDispatch();
  if (state.view === "closeout") renderCloseout();
  if (state.view === "review") renderReview();
  if (state.view === "promote") renderPromote();
  if (state.view === "activity") renderActivity();
  if (state.view === "decisions") renderDecisions();
  if (state.view === "benchmark") renderBenchmark();
  if (state.view === "health") renderHealth();
}

async function stageDeltaWork(kind) {
  const review = selectedDeltaReview();
  const gate = deltaExecutionGate(review);
  if (!gate.canStage) {
    await recordActivity(kind === "run" ? "delta_run_blocked" : "delta_ticket_blocked", selectedTicket(), {
      details: `Blocked local ${kind === "run" ? "run" : "ticket"} creation from delta review ${review.id || "UNKNOWN"} because gate status was ${gate.passed}/${gate.total}.`,
      evidencePaths: review.archivedEvidence || "UNKNOWN",
      unknownsPreserved: review.unknownsPreserved || "UNKNOWN",
      authorityConflicts: `No mutation occurred. PARK or unsaved delta reviews cannot create local ${kind === "run" ? "runs" : "operator work"}.`,
      packet: buildDeltaPacket(review),
    });
    render();
    return;
  }
  const ticket = ticketFromDeltaReview(review);
  state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
  state.selectedTicketId = ticket.id;
  if (kind === "ticket") {
    await saveTickets();
    await recordActivity("delta_ticket_staged", ticket, {
      details: `Created local ticket ${ticket.id} from archive-vs-current delta review ${review.id || "UNKNOWN"} with decision ${review.decision || "UNKNOWN"}.`,
      evidencePaths: ticket.sourceEvidence,
      unknownsPreserved: ticket.unknownsPreserved,
      authorityConflicts: ticket.authorityConflicts,
      packet: buildDispatchPacket(ticket, "Codex"),
    });
    state.view = "tickets";
    render();
    return;
  }
  const run = runFromDeltaReview(review);
  state.runs = [run, ...state.runs.filter((item) => item.id !== run.id)];
  state.selectedRunId = run.id;
  await saveTickets();
  await saveRuns();
  await recordActivity("delta_run_staged", ticket, {
    details: `Created local run ${run.id} and ticket ${ticket.id} from archive-vs-current delta review ${review.id || "UNKNOWN"} with decision ${review.decision || "UNKNOWN"}.`,
    evidencePaths: run.sourceEvidence,
    unknownsPreserved: run.unknownsPreserved,
    authorityConflicts: run.authorityBasis,
    packet: run.packet,
  });
  state.view = "runs";
  render();
}

async function loadSnapshot() {
  const response = await fetch(`/src/data/warRoomSnapshot.json?ts=${Date.now()}`, { cache: "no-store" });
  state.snapshot = await response.json();
}

async function loadHealth() {
  try {
    state.health = await apiJson("/api/health");
  } catch {
    state.health = {
      api: false,
      ticketStoreExists: false,
      activityStoreExists: false,
      activityEvents: state.activity?.length || 0,
      decisionStoreExists: false,
      decisionExports: state.decisions?.length || 0,
      snapshotExists: true,
      snapshotGeneratedAt: state.snapshot?.generatedAt || null,
      sources: state.snapshot?.sourceHealth || [],
    };
  }
}

function wireEvents() {
  document.addEventListener("click", async (event) => {
    const canvasNode = event.target.closest?.("[data-canvas-component]");
    if (canvasNode && !event.target.closest?.("[data-canvas-move]")) {
      state.selectedCanvasComponentId = canvasNode.dataset.canvasComponent;
      render();
      return;
    }
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.deltaStageSubmit) state.pendingDeltaStage = button.dataset.deltaStageSubmit;
    if (button.dataset.action) event.preventDefault();
    if (button.dataset.view) {
      state.view = button.dataset.view;
      if (validViews.has(state.view)) {
        const url = new URL(window.location.href);
        url.searchParams.set("view", state.view);
        window.history.replaceState({}, "", url);
      }
      render();
    }
    if (button.dataset.inboxFilter) {
      state.inboxFilter = button.dataset.inboxFilter;
      render();
    }
    if (button.dataset.inboxEvent) {
      state.selectedInboxEventId = button.dataset.inboxEvent;
      render();
    }
    if (button.dataset.workspace) {
      state.selectedWorkspaceId = button.dataset.workspace;
      render();
    }
    if (button.dataset.canvasDocument) {
      state.selectedCanvasId = button.dataset.canvasDocument;
      state.selectedCanvasComponentId = selectedCanvasDocument().components[0]?.id || "";
      render();
    }
    if (button.dataset.canvasComponent) {
      state.selectedCanvasComponentId = button.dataset.canvasComponent;
      render();
    }
    if (button.dataset.canvasAdd) {
      const document = selectedCanvasDocument();
      const component = canvasComponent(button.dataset.canvasAdd);
      document.components.push(component);
      document.status = "DRAFT_LOCAL";
      state.selectedCanvasComponentId = component.id;
      render();
    }
    if (button.dataset.canvasMove) {
      const document = selectedCanvasDocument();
      const index = document.components.findIndex((component) => component.id === button.dataset.componentId);
      const target = button.dataset.canvasMove === "up" ? index - 1 : index + 1;
      if (index >= 0 && target >= 0 && target < document.components.length) [document.components[index], document.components[target]] = [document.components[target], document.components[index]];
      document.status = "DRAFT_LOCAL";
      render();
    }
    if (button.dataset.voiceView) {
      state.view = validViews.has(button.dataset.voiceView) ? button.dataset.voiceView : "voice";
      render();
    }
    if (button.dataset.inboxStatus) {
      const item = selectedInboxEvent();
      if (!item) return;
      item.status = button.dataset.inboxStatus;
      item.updatedAt = nowIso();
      await saveInboxEvents();
      await recordActivity("inbox_status_changed", selectedTicket(), { details: `${item.id} moved to ${item.status}. Local intake only; no external action.` });
      render();
    }
    if (button.dataset.action === "seed-inbox-event") {
      const now = nowIso();
      const item = { id: `INBOX-SYN-${Date.now().toString(36).toUpperCase()}`, receivedAt: now, channel: "synthetic", senderLabel: "Synthetic system monitor", subject: "Review failed local readiness check", body: "Synthetic fixture: one local readiness check requires operator triage.", status: "NEW", risk: "MEDIUM", provenance: "synthetic_fixture", routeTarget: "Product Ops", externalState: "UNKNOWN", updatedAt: now };
      await intakeInboxEvent(item);
      render();
    }
    if (button.dataset.action === "copy-inbox-packet") await copyTextToClipboard(inboxRoutingPacket(selectedInboxEvent()));
    if (button.dataset.action === "route-inbox-workspace") {
      const item = selectedInboxEvent();
      if (!item) return;
      try {
        const payload = await apiJson("/api/workspaces/route", { method: "POST", body: JSON.stringify({ eventId: item.id, label: item.senderLabel, contextNotes: `Local workspace for ${item.senderLabel}. Source channel: ${item.channel}.`, agents: ["Human", "Codex"] }) });
        state.workspaces = await loadWorkspaces();
        state.selectedWorkspaceId = payload.workspace?.id || state.workspaces[0]?.id || "";
        state.workspaceNotice = payload.created ? `Created ${payload.workspace.id} for paired stream ${item.streamId}.` : `${payload.workspace.id} already owns stream ${item.streamId}.`;
        state.view = "workspaces";
      } catch (error) {
        state.workspaceNotice = `Routing blocked: ${error.message}`;
      }
      render();
    }
    if (button.dataset.action === "start-voice") {
      try {
        await startVoiceCapture();
      } catch (error) {
        state.voiceNotice = `Microphone start blocked: ${error.message}`;
        stopVoiceCapture();
        render();
      }
    }
    if (button.dataset.action === "stop-voice") {
      stopVoiceCapture();
      state.voiceNotice = "Listening stopped. No background microphone capture remains.";
      render();
    }
    if (button.dataset.action === "new-canvas") {
      const document = blankCanvasDocument();
      state.canvasDocuments = [document, ...state.canvasDocuments];
      state.selectedCanvasId = document.id;
      state.selectedCanvasComponentId = document.components[0]?.id || "";
      state.canvasNotice = "New local canvas draft created.";
      render();
    }
    if (button.dataset.action === "save-canvas") {
      const document = selectedCanvasDocument();
      document.status = "SAVED_LOCAL";
      try {
        await saveCanvasDocuments();
        state.canvasNotice = "Canvas saved to the D-local A2UI store. No deployment or execution occurred.";
      } catch (error) {
        document.status = "DRAFT_LOCAL";
        state.canvasNotice = `Save blocked: ${error.message}`;
      }
      render();
    }
    if (button.dataset.action === "delete-canvas-component") {
      const document = selectedCanvasDocument();
      document.components = document.components.filter((component) => component.id !== state.selectedCanvasComponentId);
      state.selectedCanvasComponentId = document.components[0]?.id || "";
      document.status = "DRAFT_LOCAL";
      render();
    }
    if (button.dataset.board) {
      state.selectedBoardId = button.dataset.board;
      render();
    }
    if (button.dataset.searchOpen) {
      routeSearchItem(findSearchItem(button.dataset.searchOpen));
      render();
    }
    if (button.dataset.searchTicket) {
      const item = findSearchItem(button.dataset.searchTicket);
      if (!item) return;
      const ticket = ticketFromSearchItem(item);
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.selectedTicketId = ticket.id;
      await saveTickets();
      await recordActivity("search_ticket_created", ticket, {
        details: `Created local ticket from command search result ${item.key}.`,
        packet: buildDispatchPacket(ticket, state.dispatchTarget),
      });
      state.view = "tickets";
      render();
    }
    if (button.dataset.searchViewLoad) {
      applySearchView(button.dataset.searchViewLoad);
      render();
    }
    if (button.dataset.searchViewDelete) {
      state.searchViews = state.searchViews.filter((view) => view.id !== button.dataset.searchViewDelete);
      saveSearchViews();
      render();
    }
    if (button.dataset.ticket) {
      state.selectedTicketId = button.dataset.ticket;
      render();
    }
    if (button.dataset.reviewFilter) {
      state.reviewFilter = button.dataset.reviewFilter;
      const queue = reviewQueueTickets();
      if (queue.length) state.selectedTicketId = queue[0].id;
      render();
    }
    if (button.dataset.promotionFilter) {
      state.promotionFilter = button.dataset.promotionFilter;
      const queue = promotionQueueTickets();
      if (queue.length) state.selectedTicketId = queue[0].id;
      render();
    }
    if (button.dataset.openRun) {
      state.selectedRunId = button.dataset.openRun;
      state.view = "runs";
      render();
    }
    if (button.dataset.activity) {
      state.selectedActivityId = button.dataset.activity;
      render();
    }
    if (button.dataset.decision) {
      state.selectedDecisionId = button.dataset.decision;
      render();
    }
    if (button.dataset.run) {
      state.selectedRunId = button.dataset.run;
      render();
    }
    if (button.dataset.research) {
      state.selectedResearchId = button.dataset.research;
      render();
    }
    if (button.dataset.deltaReview) {
      state.selectedDeltaReviewId = button.dataset.deltaReview;
      render();
    }
    if (button.dataset.deltaStage) {
      await stageDeltaWork(button.dataset.deltaStage);
      return;
    }
    if (button.dataset.researchSource) {
      const source = researchSourceById(button.dataset.researchSource);
      if (!source) return;
      const brief = briefFromResearchSource(source);
      brief.packet = buildResearchPacket(brief);
      state.research = [brief, ...state.research.filter((item) => item.id !== brief.id)];
      state.selectedResearchId = brief.id;
      state.view = "research";
      render();
      await saveResearch();
      await recordActivity("research_source_brief_created", selectedTicket(), {
        details: `Created local research brief ${brief.id} from source intake ${source.id || "UNKNOWN"}.`,
        evidencePaths: source.sourceEvidence || source.sourcePath || "UNKNOWN",
        unknownsPreserved: source.unknownsPreserved || "Research source is evidence input only; live/provider state remains UNKNOWN.",
        authorityConflicts: "None introduced. Source intake is D-local and does not promote memory, append the official ledger, push GitHub, or prove provider state.",
        packet: brief.packet,
      });
    }
    if (button.dataset.deltaSource) {
      const source = researchSourceById(button.dataset.deltaSource);
      if (!source) return;
      const review = deltaFromResearchSource(source);
      state.deltaReviews = [review, ...state.deltaReviews.filter((item) => item.id !== review.id)];
      state.selectedDeltaReviewId = review.id;
      state.view = "research";
      render();
      await saveDeltaReviews();
      await recordActivity("delta_review_created", selectedTicket(), {
        details: `Created local archive-vs-current delta review ${review.id} from source ${source.id || "UNKNOWN"}.`,
        evidencePaths: source.sourceEvidence || source.sourcePath || "UNKNOWN",
        unknownsPreserved: review.unknownsPreserved,
        authorityConflicts: "None introduced. Delta review is D-local only and cannot create duplicate kernels, append the official ledger, promote memory, push GitHub, or prove provider state.",
        packet: review.packet,
      });
    }
    if (button.dataset.openDecision) {
      state.selectedDecisionId = button.dataset.openDecision;
      state.view = "decisions";
      render();
    }
    if (button.dataset.decisionDisposition) {
      await updateSelectedDecisionDisposition(button.dataset.decisionDisposition);
      render();
    }
    if (button.dataset.controlWorkOrder) {
      const item = queueItemById(button.dataset.controlWorkOrder);
      if (!item) return;
      const ticket = ticketFromControlWorkOrder(item);
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.selectedTicketId = ticket.id;
      await saveTickets();
      await recordActivity("ceo_work_order_created", ticket, {
        details: `Created local CEO work order ticket from control-surface item ${item.id || "UNKNOWN"}.`,
        evidencePaths: ticket.sourceEvidence,
        unknownsPreserved: "Provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN unless owning authority proves them.",
        authorityConflicts: "None introduced. This is local ticket state only, not official ledger, memory promotion, GitHub truth, provider proof, deploy, payment, or external action.",
        packet: buildDispatchPacket(ticket, item.targetAgent || state.dispatchTarget),
      });
      state.view = "tickets";
      render();
    }
    if (button.dataset.queueTicket || button.dataset.queueDispatch) {
      const item = queueItemById(button.dataset.queueTicket || button.dataset.queueDispatch);
      if (!item) return;
      const ticket = ticketFromQueueItem(item);
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.selectedTicketId = ticket.id;
      await saveTickets();
      await recordActivity("queue_ticket_created", ticket, {
        details: `Created local ticket from source-derived queue item ${item.id || "UNKNOWN"}.`,
        packet: buildDispatchPacket(ticket, item.targetAgent || state.dispatchTarget),
      });
      state.view = button.dataset.queueDispatch ? "dispatch" : "tickets";
      render();
    }
    if (button.dataset.action === "new-ticket") {
      const ticket = blankTicket();
      state.tickets = [ticket, ...state.tickets];
      state.selectedTicketId = ticket.id;
      state.lastSaveState = "draft not saved";
      await recordActivity("ticket_draft_created", ticket, "Draft local ticket created in browser state; save is still required for ticket-file persistence.");
      state.view = "tickets";
      render();
    }
    if (button.dataset.action === "copy-packet") {
      await copyTextToClipboard(document.querySelector("#packet-preview").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "create-spine-ticket") {
      const ticket = ticketFromOperatorSpine();
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.selectedTicketId = ticket.id;
      await saveTickets();
      await recordActivity("operator_spine_ticket_created", ticket, {
        details: "Created local Operator OS ticket from current D-local authority/product/agent spine.",
        packet: buildOperatorSpinePacket(),
      });
      state.view = "tickets";
      render();
    }
    if (button.dataset.action === "copy-spine-packet") {
      await copyTextToClipboard(document.querySelector("#operator-spine-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "new-run-from-ticket") {
      const run = runFromTicket(selectedTicket(), state.dispatchTarget);
      state.runs = [run, ...state.runs.filter((item) => item.id !== run.id)];
      state.selectedRunId = run.id;
      await saveRuns();
      await recordActivity("agent_run_draft_created", selectedTicket(), {
        details: `Created local ${run.targetAgent} run-control packet ${run.id} from ticket ${run.ticketId}.`,
        packet: run.packet,
      });
      state.view = "runs";
      render();
    }
    if (button.dataset.action === "copy-run-packet") {
      await copyTextToClipboard(document.querySelector("#run-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-run-packet") {
      const blob = new Blob([document.querySelector("#run-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedRun().id.toLowerCase()}-run-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "new-research-brief") {
      const brief = blankResearchBrief();
      brief.packet = buildResearchPacket(brief);
      state.research = [brief, ...state.research.filter((item) => item.id !== brief.id)];
      state.selectedResearchId = brief.id;
      state.view = "research";
      render();
      await saveResearch();
      await recordActivity("research_brief_created", selectedTicket(), {
        details: `Created local research-to-execution brief ${brief.id}.`,
        packet: brief.packet,
      });
    }
    if (button.dataset.action === "create-run-from-research") {
      const brief = selectedResearch();
      const run = runFromResearch(brief);
      state.runs = [run, ...state.runs.filter((item) => item.id !== run.id)];
      state.selectedRunId = run.id;
      state.research = state.research.map((item) => (item.id === brief.id ? { ...item, status: "RUN_STAGED", updatedAt: nowIso(), packet: buildResearchPacket({ ...item, status: "RUN_STAGED" }) } : item));
      state.view = "runs";
      render();
      await saveRuns();
      await saveResearch();
      await recordActivity("research_run_staged", selectedTicket(), {
        details: `Converted research brief ${brief.id || "UNKNOWN"} into local run-control packet ${run.id}.`,
        packet: run.packet,
      });
    }
    if (button.dataset.action === "copy-research-packet") {
      await copyTextToClipboard(document.querySelector("#research-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-research-packet") {
      const blob = new Blob([document.querySelector("#research-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedResearch().id.toLowerCase()}-research-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "copy-delta-packet") {
      await copyTextToClipboard(document.querySelector("#delta-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-delta-packet") {
      const blob = new Blob([document.querySelector("#delta-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedDeltaReview().id.toLowerCase()}-delta-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "create-ticket-from-delta") {
      const review = selectedDeltaReview();
      const gate = deltaExecutionGate(review);
      if (!gate.canStage) {
        await recordActivity("delta_ticket_blocked", selectedTicket(), {
          details: `Blocked local ticket creation from delta review ${review.id || "UNKNOWN"} because gate status was ${gate.passed}/${gate.total}.`,
          evidencePaths: review.archivedEvidence || "UNKNOWN",
          unknownsPreserved: review.unknownsPreserved || "UNKNOWN",
          authorityConflicts: "No mutation occurred. PARK or unsaved delta reviews cannot create operator work.",
          packet: buildDeltaPacket(review),
        });
        render();
        return;
      }
      const ticket = ticketFromDeltaReview(review);
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.selectedTicketId = ticket.id;
      await saveTickets();
      await recordActivity("delta_ticket_staged", ticket, {
        details: `Created local ticket ${ticket.id} from archive-vs-current delta review ${review.id || "UNKNOWN"} with decision ${review.decision || "UNKNOWN"}.`,
        evidencePaths: ticket.sourceEvidence,
        unknownsPreserved: ticket.unknownsPreserved,
        authorityConflicts: ticket.authorityConflicts,
        packet: buildDispatchPacket(ticket, "Codex"),
      });
      state.view = "tickets";
      render();
    }
    if (button.dataset.action === "create-run-from-delta") {
      const review = selectedDeltaReview();
      const gate = deltaExecutionGate(review);
      if (!gate.canStage) {
        await recordActivity("delta_run_blocked", selectedTicket(), {
          details: `Blocked local run creation from delta review ${review.id || "UNKNOWN"} because gate status was ${gate.passed}/${gate.total}.`,
          evidencePaths: review.archivedEvidence || "UNKNOWN",
          unknownsPreserved: review.unknownsPreserved || "UNKNOWN",
          authorityConflicts: "No mutation occurred. PARK or unsaved delta reviews cannot create local runs.",
          packet: buildDeltaPacket(review),
        });
        render();
        return;
      }
      const ticket = ticketFromDeltaReview(review);
      const run = runFromDeltaReview(review);
      state.tickets = [ticket, ...state.tickets.filter((existing) => existing.id !== ticket.id)];
      state.runs = [run, ...state.runs.filter((item) => item.id !== run.id)];
      state.selectedTicketId = ticket.id;
      state.selectedRunId = run.id;
      await saveTickets();
      await saveRuns();
      await recordActivity("delta_run_staged", ticket, {
        details: `Created local run ${run.id} and ticket ${ticket.id} from archive-vs-current delta review ${review.id || "UNKNOWN"} with decision ${review.decision || "UNKNOWN"}.`,
        evidencePaths: run.sourceEvidence,
        unknownsPreserved: run.unknownsPreserved,
        authorityConflicts: run.authorityBasis,
        packet: run.packet,
      });
      state.view = "runs";
      render();
    }
    if (button.dataset.action === "select-visible-search") {
      const selected = selectedSearchKeySet();
      visibleSearchItems().forEach((item) => selected.add(item.key));
      state.searchSelectedKeys = [...selected];
      render();
    }
    if (button.dataset.action === "clear-search-selection") {
      state.searchSelectedKeys = [];
      render();
    }
    if (button.dataset.action === "save-search-view") {
      saveCurrentSearchView();
      render();
    }
    if (button.dataset.action === "copy-bulk-dispatch") {
      await copyTextToClipboard(document.querySelector("#bulk-dispatch-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-bulk-dispatch") {
      const blob = new Blob([document.querySelector("#bulk-dispatch-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${dispatchFilePart(state.bulkDispatchTarget)}-${dispatchFilePart(state.searchQuery || "search")}-bulk-dispatch.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "save-bulk-dispatch") {
      const items = selectedSearchItems();
      if (!items.length) return;
      const packet = buildBulkDispatchPacket(items, state.bulkDispatchTarget);
      const ticket = bulkDispatchActivityTicket(items);
      const event = await recordActivity("bulk_dispatch_staged", ticket, {
        details: `Saved ${items.length} selected Search items as a ${state.bulkDispatchTarget} dispatch packet. Query: ${state.searchQuery || "all"}. Type: ${state.searchType}. Lane: ${state.searchLane}.`,
        packet,
      });
      state.selectedActivityId = event.id;
      state.view = "activity";
      render();
    }
    if (button.dataset.bulkActivity) {
      state.selectedActivityId = button.dataset.bulkActivity;
      state.view = "activity";
      render();
    }
    if (button.dataset.action === "parse-closeout") {
      const raw = document.querySelector('[name="closeoutRaw"]')?.value || "";
      const parsed = parseCloseout(raw);
      for (const [field, value] of Object.entries(parsed)) {
        const inputElement = document.querySelector(`[name="${field}"]`);
        if (inputElement && value) inputElement.value = value;
      }
    }
    if (button.dataset.action === "copy-ledger-preview") {
      await copyTextToClipboard(document.querySelector("#ledger-preview").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-ledger-preview") {
      const blob = new Blob([document.querySelector("#ledger-preview").textContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-ledger-preview.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "insert-closeout-draft") {
      const ticket = selectedTicket();
      const draft = buildCloseoutDraftFromRun(ticket, selectedCloseoutRun(ticket));
      applyCloseoutDraftEventToForm({ packet: draft });
      button.textContent = "Draft inserted";
    }
    if (button.dataset.action === "copy-closeout-draft") {
      await copyTextToClipboard(document.querySelector("#closeout-import-draft").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-closeout-draft") {
      const blob = new Blob([document.querySelector("#closeout-import-draft").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-closeout-draft.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "save-closeout-draft-evidence") {
      const ticket = selectedTicket();
      const run = selectedCloseoutRun(ticket);
      const draft = buildCloseoutDraftFromRun(ticket, run);
      const eventTicket = {
        ...ticket,
        evidencePaths: run?.sourceEvidence || ticket.evidencePaths || ticket.sourceEvidence || "UNKNOWN",
        validationRun: "DRAFT ONLY - saved from local run packet; operator validation still required.",
        unknownsPreserved: run?.unknownsPreserved || ticket.unknownsPreserved || "Provider/payment/deploy/auth/schema/revenue/live-state remain UNKNOWN.",
        authorityConflicts: "DRAFT ONLY - local Activity event does not resolve authority conflicts or approve closeout.",
      };
      await recordActivity("closeout_draft_saved", eventTicket, {
        details: `Saved local closeout draft event from ${run?.id || "NO_RUN"} for ${ticket.id}. This does not update ticket closeout fields, reviewer status, official ledger, memory, GitHub, provider, payment, deploy, or external state.`,
        packet: draft,
      });
      button.textContent = "Saved draft event";
    }
    if (button.dataset.action === "route-closeout-draft") {
      const activity = selectedActivityEvent();
      if (!isCloseoutDraftEvent(activity)) return;
      const ticket = state.tickets.find((item) => item.id === activity.ticketId);
      if (!ticket) return;
      state.selectedTicketId = ticket.id;
      state.pendingCloseoutDraftEventId = activity.id;
      state.view = "closeout";
      render();
    }
    if (button.dataset.action === "apply-pending-closeout-draft") {
      const activity = pendingCloseoutDraftEvent(selectedTicket());
      if (!activity) return;
      state.pendingCloseoutDraftEventId = activity.id;
      applyCloseoutDraftEventToForm(activity);
      button.textContent = "Draft applied to form";
    }
    if (button.dataset.action === "open-pending-closeout-activity") {
      const activity = pendingCloseoutDraftEvent(selectedTicket());
      if (!activity) return;
      state.selectedActivityId = activity.id;
      state.view = "activity";
      render();
    }
    if (button.dataset.action === "clear-pending-closeout-draft") {
      state.pendingCloseoutDraftEventId = "";
      render();
    }
    if (button.dataset.action === "open-closeout") {
      state.view = "closeout";
      render();
    }
    if (button.dataset.action === "open-review") {
      state.view = "review";
      render();
    }
    if (button.dataset.action === "open-promote") {
      state.view = "promote";
      render();
    }
    if (button.dataset.action === "mark-accepted" || button.dataset.action === "mark-needs-fix") {
      const ticket = selectedTicket();
      const now = nowIso();
      const reviewedBy = document.querySelector('[name="reviewedBy"]')?.value || ticket.closedBy || "Codex Strategic Board";
      const next = {
        ...ticket,
        reviewerStatus: button.dataset.action === "mark-accepted" ? "ACCEPTED" : "NEEDS FIX",
        reviewNotes: document.querySelector("#review-notes")?.value || "",
        reviewedBy,
        reviewedAt: document.querySelector('[name="reviewedAt"]')?.value || now,
        updatedAt: now,
      };
      state.tickets = state.tickets.map((item) => (item.id === next.id ? next : item));
      await saveTickets();
      await recordActivity(button.dataset.action === "mark-accepted" ? "review_accepted" : "review_needs_fix", next, {
        details: `Local review marked ${next.reviewerStatus} by ${next.reviewedBy || "UNKNOWN"}.`,
        packet: buildReviewPacket(next),
      });
      render();
    }
    if (button.dataset.action === "mark-promotion-staged" || button.dataset.action === "mark-promotion-blocked") {
      const ticket = selectedTicket();
      const now = nowIso();
      const stagedBy = document.querySelector('[name="stagedBy"]')?.value || ticket.reviewedBy || "Codex Strategic Board";
      const next = {
        ...ticket,
        promotionStatus: button.dataset.action === "mark-promotion-staged" ? "STAGED LOCAL" : "BLOCKED",
        promotionNotes: document.querySelector("#promotion-notes")?.value || "",
        stagedBy,
        stagedAt: document.querySelector('[name="stagedAt"]')?.value || now,
        updatedAt: now,
      };
      state.tickets = state.tickets.map((item) => (item.id === next.id ? next : item));
      await saveTickets();
      await recordActivity(button.dataset.action === "mark-promotion-staged" ? "promotion_staged" : "promotion_blocked", next, {
        details: `Local promotion packet marked ${next.promotionStatus} by ${next.stagedBy || "UNKNOWN"}.`,
        packet: buildPromotionPacket(next),
      });
      render();
    }
    if (button.dataset.action === "copy-review-packet") {
      await copyTextToClipboard(document.querySelector("#review-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "copy-promotion-packet") {
      await copyTextToClipboard(document.querySelector("#promotion-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "copy-promotion-preflight") {
      await copyTextToClipboard(document.querySelector("#promotion-preflight-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "copy-evidence-resolution") {
      await copyTextToClipboard(document.querySelector("#evidence-resolution-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-review-packet") {
      const blob = new Blob([document.querySelector("#review-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-review-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "download-promotion-packet") {
      const blob = new Blob([document.querySelector("#promotion-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-promotion-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "download-promotion-preflight") {
      const blob = new Blob([document.querySelector("#promotion-preflight-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-promotion-preflight.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "download-evidence-resolution") {
      const blob = new Blob([document.querySelector("#evidence-resolution-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-evidence-resolution.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "prepare-promotion-preflight") {
      await preparePromotionDirectorPreflight();
      return;
    }
    if (button.dataset.action === "copy-activity-packet") {
      await copyTextToClipboard(document.querySelector("#activity-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-activity-packet") {
      const blob = new Blob([document.querySelector("#activity-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedActivityEvent().id.toLowerCase()}-activity-packet.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "new-decision") {
      const event = selectedActivityEvent();
      const decision = blankDecisionExport(event);
      decision.officialLedgerCandidate = event.packet || "";
      decision.bundleSummary = buildDecisionBundleSummary(decision, [event]);
      decision.ledgerBundleCandidate = buildDecisionLedgerCandidate(decision, [event]);
      decision.packet = buildDirectorDecisionPacket(decision);
      state.decisions = [decision, ...state.decisions.filter((item) => item.id !== decision.id)];
      state.selectedDecisionId = decision.id;
      await saveDecisions();
      await recordActivity("director_decision_draft_created", selectedTicket(), {
        details: `Created local director decision export ${decision.id} from event ${event.id || "UNKNOWN"}.`,
        packet: decision.packet,
      });
      state.view = "decisions";
      render();
    }
    if (button.dataset.action === "new-decision-bundle") {
      const events = filteredDecisionSourceEvents().slice(0, 12);
      const decision = buildDirectorDecisionFromEvents(events, {
        title: `${events.length || 1} event director evidence bundle`,
      });
      state.decisions = [decision, ...state.decisions.filter((item) => item.id !== decision.id)];
      state.selectedDecisionId = decision.id;
      await saveDecisions();
      await recordActivity("director_decision_bundle_created", selectedTicket(), {
        details: `Created local director bundle ${decision.id} from ${events.length} filtered activity events.`,
        packet: decision.packet,
      });
      state.view = "decisions";
      render();
    }
    if (button.dataset.action === "new-dispatch-decision-bundle") {
      const events = dispatchDecisionEvents().slice(0, 12);
      if (!events.length) return;
      state.decisionEventFilter = "dispatch";
      const decision = buildDirectorDecisionFromEvents(events, {
        title: `${events.length} staged dispatch event director bundle`,
        disposition: "READY_FOR_DIRECTOR_REVIEW",
        decisionType: "ledger_append_candidate",
        memoryAction: "ledger_only",
        notes: "Built from local bulk_dispatch_staged events only. Review manually before official ledger append or memory promotion.",
      });
      state.decisions = [decision, ...state.decisions.filter((item) => item.id !== decision.id)];
      state.selectedDecisionId = decision.id;
      await saveDecisions();
      await recordActivity("director_dispatch_bundle_created", selectedTicket(), {
        details: `Created local director dispatch bundle ${decision.id} from ${events.length} bulk_dispatch_staged events.`,
        packet: decision.packet,
      });
      state.view = "decisions";
      render();
    }
    if (button.dataset.action === "save-decision") {
      await saveDecisionForm();
      render();
    }
    if (button.dataset.action === "copy-decision-packet") {
      await copyTextToClipboard(document.querySelector("#decision-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-decision-packet") {
      const blob = new Blob([document.querySelector("#decision-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedDecision().id.toLowerCase()}-director-decision.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "copy-authority-handoff") {
      await copyTextToClipboard(document.querySelector("#authority-handoff-packet").textContent);
      button.textContent = "Copied";
      setTimeout(render, 900);
    }
    if (button.dataset.action === "download-authority-handoff") {
      const blob = new Blob([document.querySelector("#authority-handoff-packet").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedDecision().id.toLowerCase()}-authority-handoff.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "download-packet") {
      const blob = new Blob([document.querySelector("#packet-preview").textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedTicket().id.toLowerCase()}-${state.dispatchTarget.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dispatch.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "export-activity") {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: nowIso(),
              authority: "D-local activity evidence only; not official ledger, company memory, GitHub truth, or provider live-state proof.",
              events: state.activity,
            },
            null,
            2,
          ),
        ],
        { type: "application/json;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mds-command-centre-activity-log.json";
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "export-decisions") {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: nowIso(),
              authority: "D-local director decision exports only; not official ledger, company memory, GitHub truth, or provider live-state proof.",
              decisions: state.decisions,
            },
            null,
            2,
          ),
        ],
        { type: "application/json;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mds-command-centre-director-decisions.json";
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "export-tickets") {
      const blob = new Blob([JSON.stringify({ exportedAt: nowIso(), tickets: state.tickets }, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "mds-command-centre-tickets.json";
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (button.dataset.action === "trigger-import") {
      document.querySelector("#ticket-import")?.click();
    }
    if (button.dataset.action === "delete-ticket") {
      const ticket = selectedTicket();
      state.tickets = state.tickets.filter((item) => item.id !== ticket.id);
      if (!state.tickets.length) state.tickets = seedTickets();
      state.selectedTicketId = state.tickets[0]?.id || "";
      await saveTickets();
      await recordActivity("ticket_deleted", ticket, "Deleted local ticket from ticket store; activity event retained as local evidence.");
      render();
    }
    if (button.dataset.action === "reload-health") {
      await loadHealth();
      render();
    }
    if (button.dataset.action === "refresh-snapshot") {
      await apiJson("/api/refresh-snapshot", { method: "POST" });
      await loadSnapshot();
      await loadHealth();
      render();
    }
  });

  document.addEventListener("submit", async (event) => {
    const documentForm = event.target?.closest?.("#canvas-document-form");
    if (documentForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(documentForm).entries());
      const document = selectedCanvasDocument();
      document.title = String(values.title || "Untitled canvas").slice(0, 160);
      document.workspaceId = String(values.workspaceId || "UNASSIGNED").slice(0, 64);
      document.status = "DRAFT_LOCAL";
      render();
      return;
    }
    const componentForm = event.target?.closest?.("#canvas-component-form");
    if (componentForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(componentForm).entries());
      const component = selectedCanvasComponent();
      if (!component || component.id !== values.id) return;
      component.label = String(values.label || "Label").slice(0, 120);
      component.text = String(values.text || "").slice(0, 1000);
      component.value = String(values.value || "").slice(0, 160);
      component.tone = values.tone;
      component.width = values.width;
      selectedCanvasDocument().status = "DRAFT_LOCAL";
      render();
      return;
    }
    const importForm = event.target?.closest?.("#canvas-import-form");
    if (importForm) {
      event.preventDefault();
      try {
        const payload = JSON.parse(String(new FormData(importForm).get("payload") || "{}"));
        const result = await apiJson("/api/canvas/import", { method: "POST", body: JSON.stringify({ document: payload }) });
        state.canvasDocuments = [result.document, ...state.canvasDocuments.filter((document) => document.id !== result.document.id)];
        state.selectedCanvasId = result.document.id;
        state.selectedCanvasComponentId = result.document.components[0]?.id || "";
        state.canvasNotice = "Agent A2UI draft sanitized. Operator save is still required.";
      } catch (error) {
        state.canvasNotice = `Import blocked: ${error.message}`;
      }
      render();
      return;
    }
    const voiceForm = event.target?.closest?.("#voice-transcript-form");
    if (voiceForm) {
      event.preventDefault();
      const transcript = String(new FormData(voiceForm).get("transcript") || "");
      const payload = await apiJson("/api/voice/transcript", { method: "POST", body: JSON.stringify({ transcript }) });
      state.voiceCommands = Array.isArray(payload.records) ? payload.records : state.voiceCommands;
      state.voiceNotice = `${payload.record.status}: ${payload.record.command || "No command after wake word."}`;
      render();
      return;
    }
    const inboxForm = event.target?.closest?.("#inbox-intake-form");
    if (inboxForm) {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(inboxForm).entries());
      if (!String(values.subject || "").trim()) return;
      const now = nowIso();
      const item = { ...values, id: `INBOX-${Date.now().toString(36).toUpperCase()}`, receivedAt: now, status: "NEW", provenance: `${values.channel || "manual"}_local_intake`, externalState: "UNKNOWN", updatedAt: now };
      await intakeInboxEvent(item);
      await recordActivity("inbox_event_recorded", selectedTicket(), { details: `Recorded local inbox event ${item.id} from ${item.channel}. No external channel action.` });
      render();
      return;
    }
    const targetFormId = event.target?.getAttribute?.("id");
    const formElement =
      targetFormId === "ticket-form" ||
      targetFormId === "closeout-form" ||
      targetFormId === "decision-form" ||
      targetFormId === "run-form" ||
      targetFormId === "research-form" ||
      targetFormId === "delta-form"
        ? event.target
        : event.target?.closest?.("#ticket-form, #closeout-form, #decision-form, #run-form, #research-form, #delta-form");
    if (!formElement) return;
    const formId = formElement.getAttribute("id");
    event.preventDefault();
    const form = new FormData(formElement);
    if (formId === "decision-form") {
      await saveDecisionForm();
      render();
      return;
    }
    if (formId === "run-form") {
      const next = {
        ...selectedRun(),
        ...Object.fromEntries(form.entries()),
        updatedAt: nowIso(),
      };
      next.packet = buildRunPacket(next);
      state.runs = state.runs.some((run) => run.id === next.id) ? state.runs.map((run) => (run.id === next.id ? next : run)) : [next, ...state.runs];
      state.selectedRunId = next.id;
      await saveRuns();
      await recordActivity("agent_run_saved", selectedTicket(), {
        details: `Saved local run-control packet ${next.id} for ${next.targetAgent || "UNKNOWN"}.`,
        packet: next.packet,
      });
      render();
      return;
    }
    if (formId === "research-form") {
      const next = {
        ...selectedResearch(),
        ...Object.fromEntries(form.entries()),
        updatedAt: nowIso(),
      };
      next.packet = buildResearchPacket(next);
      state.research = state.research.some((brief) => brief.id === next.id) ? state.research.map((brief) => (brief.id === next.id ? next : brief)) : [next, ...state.research];
      state.selectedResearchId = next.id;
      await saveResearch();
      await recordActivity("research_brief_saved", selectedTicket(), {
        details: `Saved local research-to-execution brief ${next.id} from ${next.sourceType || "UNKNOWN"}.`,
        packet: next.packet,
      });
      render();
      return;
    }
    if (formId === "delta-form") {
      const deltaStage = event.submitter?.dataset?.deltaStageSubmit || state.pendingDeltaStage || "";
      state.pendingDeltaStage = "";
      const next = {
        ...selectedDeltaReview(),
        ...Object.fromEntries(form.entries()),
        updatedAt: nowIso(),
      };
      delete next.deltaStage;
      next.packet = buildDeltaPacket(next);
      state.deltaReviews = state.deltaReviews.some((review) => review.id === next.id)
        ? state.deltaReviews.map((review) => (review.id === next.id ? next : review))
        : [next, ...state.deltaReviews];
      state.selectedDeltaReviewId = next.id;
      await saveDeltaReviews();
      await recordActivity("delta_review_saved", selectedTicket(), {
        details: `Saved local archive-vs-current delta review ${next.id} with decision ${next.decision || "UNKNOWN"}.`,
        evidencePaths: next.archivedEvidence || "UNKNOWN",
        unknownsPreserved: next.unknownsPreserved || "UNKNOWN",
        authorityConflicts: "None introduced. Delta review remains local staging only and does not change doctrine, source truth, official ledger, memory, GitHub, or provider state.",
        packet: next.packet,
      });
      if (deltaStage) {
        await stageDeltaWork(deltaStage);
        return;
      }
      render();
      return;
    }
    const next = formId === "closeout-form" ? { ...selectedTicket(), ...Object.fromEntries(form.entries()) } : Object.fromEntries(form.entries());
    next.updatedAt = nowIso();
    if (formId === "closeout-form" && !next.closeoutAt) next.closeoutAt = next.updatedAt;
    next.createdAt = selectedTicket().createdAt || next.updatedAt;
    state.tickets = state.tickets.some((ticket) => ticket.id === next.id)
      ? state.tickets.map((ticket) => (ticket.id === next.id ? next : ticket))
      : [next, ...state.tickets];
    state.selectedTicketId = next.id;
    await saveTickets();
    await recordActivity(formId === "closeout-form" ? "closeout_saved" : "ticket_saved", next, {
      details:
        formId === "closeout-form"
          ? "Agent closeout fields saved to local ticket with ledger-preview candidate."
          : "Local ticket fields saved to D-local ticket store or browser fallback.",
      packet: formId === "closeout-form" ? buildLedgerPreview(next) : buildDispatchPacket(next, state.dispatchTarget),
    });
    render();
  });

  document.addEventListener("change", async (event) => {
    if (event.target.id === "dispatch-ticket") {
      state.selectedTicketId = event.target.value;
      render();
    }
    if (event.target.id === "dispatch-target") {
      state.dispatchTarget = event.target.value;
      render();
    }
    if (event.target.name === "ticketId" && event.target.closest("#run-form")) {
      const ticket = state.tickets.find((item) => item.id === event.target.value);
      if (ticket) {
        const run = { ...runFromTicket(ticket, selectedRun().targetAgent || state.dispatchTarget), id: selectedRun().id, createdAt: selectedRun().createdAt || nowIso() };
        state.runs = state.runs.some((item) => item.id === run.id) ? state.runs.map((item) => (item.id === run.id ? run : item)) : [run, ...state.runs];
        state.selectedRunId = run.id;
        render();
      }
    }
    if (event.target.id === "bulk-dispatch-target") {
      state.bulkDispatchTarget = event.target.value;
      render();
    }
    if (event.target.id === "closeout-ticket") {
      state.selectedTicketId = event.target.value;
      state.closeoutImportRunId = "";
      state.pendingCloseoutDraftEventId = "";
      render();
    }
    if (event.target.id === "closeout-run-import") {
      state.closeoutImportRunId = event.target.value;
      render();
    }
    if (event.target.id === "pending-closeout-draft-event") {
      state.pendingCloseoutDraftEventId = event.target.value;
      render();
    }
    if (event.target.id === "decision-source-event") {
      const eventSource = state.activity.find((item) => item.id === event.target.value) || selectedActivityEvent();
      const decision = {
        ...blankDecisionExport(eventSource),
        id: selectedDecision().id || `DEC-${Date.now().toString(36).toUpperCase()}`,
        createdAt: selectedDecision().createdAt || nowIso(),
        sourceEventIds: [eventSource.id],
      };
      decision.bundleSummary = buildDecisionBundleSummary(decision, [eventSource]);
      decision.ledgerBundleCandidate = buildDecisionLedgerCandidate(decision, [eventSource]);
      state.decisions = state.decisions.some((item) => item.id === decision.id)
        ? state.decisions.map((item) => (item.id === decision.id ? decision : item))
        : [decision, ...state.decisions];
      state.selectedDecisionId = decision.id;
      await saveDecisions();
      render();
    }
    if (event.target.id === "decision-event-filter") {
      state.decisionEventFilter = event.target.value;
      render();
    }
    if (event.target.id === "command-search-type") {
      state.searchType = event.target.value;
      render();
    }
    if (event.target.id === "command-search-lane") {
      state.searchLane = event.target.value;
      render();
    }
    if (event.target.dataset.searchSelect) {
      const selected = selectedSearchKeySet();
      if (event.target.checked) selected.add(event.target.dataset.searchSelect);
      else selected.delete(event.target.dataset.searchSelect);
      state.searchSelectedKeys = [...selected];
      render();
    }
    if (event.target.id === "ticket-import") {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = JSON.parse(text);
      const tickets = Array.isArray(parsed) ? parsed : parsed.tickets;
      if (!Array.isArray(tickets)) throw new Error("Imported file does not contain a tickets array.");
      state.tickets = tickets.map((ticket) => ({
        ...blankTicket(),
        ...ticket,
        updatedAt: ticket.updatedAt || nowIso(),
      }));
      state.selectedTicketId = state.tickets[0]?.id || "";
      await saveTickets();
      await recordActivity("tickets_imported", state.tickets[0] || blankTicket(), `Imported ${state.tickets.length} local tickets from JSON file.`);
      render();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "command-search-query") {
      state.searchQuery = event.target.value;
      render();
      const inputElement = document.querySelector("#command-search-query");
      inputElement?.focus();
      inputElement?.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
    }
  });

  document.addEventListener("dragstart", (event) => {
    const node = event.target.closest?.("[data-canvas-component]");
    if (node && event.dataTransfer) event.dataTransfer.setData("text/plain", node.dataset.canvasComponent);
  });
  document.addEventListener("dragover", (event) => {
    if (event.target.closest?.("[data-canvas-component]")) event.preventDefault();
  });
  document.addEventListener("drop", (event) => {
    const targetNode = event.target.closest?.("[data-canvas-component]");
    const sourceId = event.dataTransfer?.getData("text/plain");
    if (!targetNode || !sourceId || sourceId === targetNode.dataset.canvasComponent) return;
    event.preventDefault();
    const document = selectedCanvasDocument();
    const sourceIndex = document.components.findIndex((component) => component.id === sourceId);
    const targetIndex = document.components.findIndex((component) => component.id === targetNode.dataset.canvasComponent);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = document.components.splice(sourceIndex, 1);
    document.components.splice(targetIndex, 0, moved);
    document.status = "DRAFT_LOCAL";
    render();
  });
}

async function boot() {
  await loadSnapshot();
  state.tickets = await loadTickets();
  state.activity = await loadActivity();
  state.decisions = await loadDecisions();
  state.runs = await loadRuns();
  state.research = await loadResearch();
  state.researchSources = await loadResearchSources();
  state.deltaReviews = await loadDeltaReviews();
  state.searchViews = loadSearchViews();
  await loadHealth();
  await loadAdapterSnapshots();
  state.sourceEvidence = await loadSourceEvidence();
  state.capabilityRequests = await loadCapabilityRequests();
  state.inboxEvents = await loadInboxEvents();
  state.workspaces = await loadWorkspaces();
  await loadVoiceState();
  await loadModelRouter();
  state.canvasDocuments = await loadCanvasDocuments();
  wireMv18Events();
  state.selectedTicketId = state.tickets[0]?.id || "";
  state.selectedActivityId = state.activity[0]?.id || "";
  state.selectedDecisionId = state.decisions[0]?.id || "";
  state.selectedRunId = state.runs[0]?.id || "";
  state.selectedResearchId = state.research[0]?.id || "";
  state.selectedDeltaReviewId = state.deltaReviews[0]?.id || "";
  state.selectedInboxEventId = state.inboxEvents[0]?.id || "";
  state.selectedWorkspaceId = state.workspaces[0]?.id || "";
  state.selectedCanvasId = state.canvasDocuments[0]?.id || "";
  state.selectedCanvasComponentId = state.canvasDocuments[0]?.components?.[0]?.id || "";
  state.selectedBoardId = state.snapshot.sources[0]?.id || "";
  const initialView = new URLSearchParams(window.location.search).get("view");
  if (initialView && validViews.has(initialView)) state.view = initialView;
  wireEvents();
  render();
}

boot().catch((error) => {
  document.querySelector("#root").innerHTML = `<main class="workspace"><section class="objective-panel"><h1>MDS Command Centre</h1><p>Fail-closed: ${esc(error.message)}</p></section></main>`;
});
