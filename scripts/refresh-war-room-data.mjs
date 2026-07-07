import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const warRoomRoot = path.join(repoRoot, "command-centre", "war-room");
const frameworkRoot = path.join(repoRoot, "open-source", "midas-framework", "framework");
const outDir = path.join(appRoot, "src", "data");
const outFile = path.join(outDir, "warRoomSnapshot.json");

const sourceFiles = [
  ["index", "Today", "index.md", "markdown"],
  ["product-readiness", "Product readiness", "product-readiness-board.md", "markdown"],
  ["product-readiness-csv", "Product readiness CSV", "product-readiness-board.csv", "csv"],
  ["revenue", "Revenue", "revenue-board.md", "markdown"],
  ["security", "Security", "security-board.md", "markdown"],
  ["lanes", "Lanes", "lane-board.md", "markdown"],
  ["approvals", "Approvals", "approval-board.md", "markdown"],
  ["work-orders", "Work orders", "work-order-pack.md", "markdown"],
  ["frontend-completion-csv", "Frontend completion CSV", "frontend-completion-board.csv", "csv"],
  ["product-vcos-instances-csv", "Product VCOS instances CSV", "product-vcos-instance-board.csv", "csv"],
  ["product-vcos-instances", "Product VCOS instances", "product-vcos-instance-board.md", "markdown"],
];

const repoSourceFiles = [
  ["next-actions", "Kernel next actions", "vcos/mds-kernel/state/next-actions.md", "markdown"],
  ["open-items", "Open items", "vcos/mds-kernel/state/open-items.md", "markdown"],
  ["blocked-items", "Blocked items", "vcos/mds-kernel/state/blocked-items.md", "markdown"],
  ["last-run-summary", "Last run summary", "vcos/mds-kernel/state/last-run-summary.md", "markdown"],
  ["decision-log", "Decision log", "vcos/mds-kernel/state/decision-log.md", "markdown"],
  ["message-ledger", "Message ledger", "command-centre/war-room/communications/message-ledger.csv", "csv"],
  ["execution-runs", "Execution runs", "command-centre/war-room/execution-tracker/execution-runs.csv", "csv"],
  ["access-failures", "Access failure tickets", "ops/audits/access/2026-07-01-tool-cli-readiness/harness-access-failure-tickets.csv", "csv"],
];

function assertInside(child, parent) {
  const relative = path.relative(parent, child);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside ${parent}: ${child}`);
  }
}

function readAllowed(relativePath) {
  if (relativePath.includes(".env") || relativePath.match(/secret|token|credential|private-key/i)) {
    throw new Error(`Refusing unsafe source path: ${relativePath}`);
  }
  const absolute = path.join(warRoomRoot, relativePath);
  assertInside(absolute, warRoomRoot);
  if (!fs.existsSync(absolute)) {
    return { exists: false, content: "" };
  }
  return { exists: true, content: fs.readFileSync(absolute, "utf8") };
}

function readRepoAllowed(relativePath) {
  if (relativePath.includes(".env") || relativePath.match(/secret|token|credential|private-key/i)) {
    throw new Error(`Refusing unsafe source path: ${relativePath}`);
  }
  const absolute = path.join(repoRoot, relativePath);
  assertInside(absolute, repoRoot);
  if (!fs.existsSync(absolute)) {
    return { exists: false, content: "" };
  }
  return { exists: true, content: fs.readFileSync(absolute, "utf8") };
}

function readFrameworkJson(relativePath, fallback) {
  if (relativePath.includes(".env") || relativePath.match(/secret|token|credential|private-key/i)) {
    throw new Error(`Refusing unsafe framework source path: ${relativePath}`);
  }
  const absolute = path.join(frameworkRoot, relativePath);
  assertInside(absolute, frameworkRoot);
  if (!fs.existsSync(absolute)) return fallback;
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted && char === '"' && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()])),
  );
}

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`## ${escaped}\\s*\\n([\\s\\S]*?)(\\n## |$)`, "i"));
  return match ? match[1].trim() : "";
}

function firstNonEmptyLine(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("|")) ?? "";
}

function markdownSummary(text) {
  const candidates = [
    extractSection(text, "STATUS"),
    extractSection(text, "Current Immediate Next Action"),
    extractSection(text, "NEXT ACTION"),
    extractSection(text, "Top Blockers"),
    firstNonEmptyLine(text),
  ].filter(Boolean);
  return candidates[0]?.replace(/\s+/g, " ").slice(0, 320) ?? "No summary available.";
}

function bulletsFromSection(text, heading, limit = 6) {
  return extractSection(text, heading)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-+\s*/, ""))
    .filter((line) => line && !line.startsWith("|"))
    .slice(0, limit);
}

function markdownTables(text) {
  const lines = String(text || "").split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index].trim();
    const separator = lines[index + 1].trim();
    if (!header.startsWith("|") || !separator.match(/^\|?\s*:?-{3,}/)) continue;
    const headers = header
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      const cells = lines[index]
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim());
      rows.push(Object.fromEntries(headers.map((name, cellIndex) => [name, cells[cellIndex] || ""])));
      index += 1;
    }
    tables.push(rows);
  }
  return tables;
}

function linesMatching(text, pattern, limit = 8) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && pattern.test(line))
    .slice(0, limit);
}

function latestFiles(relativeDir, limit = 8) {
  const absolute = path.join(repoRoot, relativeDir);
  assertInside(absolute, repoRoot);
  if (!fs.existsSync(absolute)) return [];
  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
      const stats = fs.statSync(path.join(absolute, entry.name));
      return {
        title: entry.name.replace(/\.(md|yaml|csv)$/i, ""),
        sourceEvidence: relativePath,
        modifiedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
    .slice(0, limit);
}

function normalizeStatus(...values) {
  const text = values.join(" ").toUpperCase();
  if (!text.trim() || text.includes("UNKNOWN")) return "UNKNOWN";
  if (/(BLOCK|NO_GO|FORBIDDEN|MISSING|FAIL|ERROR|RISK|REQUIRED|TIMEOUT|NEEDS|NO_SEND|UNLINKED)/.test(text)) {
    return "BLOCKED_OR_NEEDS_PROOF";
  }
  if (/(PASS|READY|DEPLOYED|REACHABLE|COMPLETE|COMPLETED|APPLIED|PRESENT)/.test(text)) return "EVIDENCED_PARTIAL";
  return "EVIDENCE_INPUT";
}

function claimCeilingForProduct(row) {
  const live = row.live_status || "UNKNOWN";
  const revenue = row.revenue_status || "UNKNOWN";
  const deploy = row.deployment_status || "UNKNOWN";
  if (/UNKNOWN/i.test(`${live} ${revenue}`)) {
    return "Source/local readiness only; do not claim live revenue, payment, booking, provider, auth, schema, or deployment state beyond named evidence.";
  }
  if (/PASS|reachable|DEPLOYED/i.test(`${live} ${deploy}`) && /UNKNOWN/i.test(revenue)) {
    return "Public/deploy evidence exists as named, but revenue/payment readiness remains UNKNOWN.";
  }
  return "Use only the exact statuses in the source row; provider dashboards still own live state.";
}

function productVcosRows(productRows, frontendRows, productVcosInstanceRows = []) {
  const five = new Set(["Astro AI Studio", "Prep AI Studio", "Pathway AI Studio", "ATLAS", "NestIQ"]);
  const byName = new Map(productVcosInstanceRows.map((row) => [row.product_name, row]));
  const bySlug = new Map(productVcosInstanceRows.map((row) => [row.product_slug, row]));
  const matched = productRows.filter((row) => five.has(row.product));
  if (!matched.length) {
    // Fail-closed degradation (F5-MV-18): the readiness board is missing from
    // the war room (untracked file loss). The five-product registry is stable
    // doctrine, but every gate is UNKNOWN until the board is restored through a
    // governed source. Nothing is fabricated.
    const missingEvidence =
      "command-centre/war-room/product-readiness-board.csv MISSING; all gates UNKNOWN until the board is restored from a governed source";
    return [...five].map((product) => ({
      product,
      sourcePath: "UNKNOWN",
      frontendPath: "UNKNOWN",
      productVcosInstancePath: "UNKNOWN",
      productVcosInstanceStatus: "UNKNOWN",
      readiness: "UNKNOWN",
      frontendGate: "UNKNOWN",
      backendGate: "UNKNOWN",
      paymentGate: "UNKNOWN",
      deployGate: "UNKNOWN",
      providerGate: "UNKNOWN",
      securityGate: "UNKNOWN",
      productMemory: "UNKNOWN",
      releaseManagement: "UNKNOWN",
      telemetry: "UNKNOWN",
      support: "UNKNOWN",
      aiCostMonitoring: "UNKNOWN",
      churn: "UNKNOWN",
      upsellTriggers: "UNKNOWN",
      weeklyReview: "UNKNOWN",
      knowledgePromotion: "UNKNOWN",
      nexusCandidateExtraction: "UNKNOWN",
      contentGate: "UNKNOWN",
      biggestBlocker: "Readiness board missing from war room; restore it before trusting any gate.",
      nextAction: "Restore command-centre/war-room/product-readiness-board.csv via a governed work order.",
      evidence: missingEvidence,
      claimCeiling: "No public claims; revenue and live states remain UNKNOWN without verified payment evidence.",
    }));
  }
  return matched
    .map((row) => {
      const frontend = frontendRows.find((item) => item.product === row.product) || {};
      const instance = byName.get(row.product) || bySlug.get(String(row.product || "").toLowerCase().replace(/\s+/g, "-")) || {};
      return {
        product: row.product,
        sourcePath: row.source_path || frontend.source_path || "UNKNOWN",
        frontendPath: frontend.frontend_path || "UNKNOWN",
        productVcosInstancePath: instance.instance_path || "UNKNOWN",
        productVcosInstanceStatus: instance.instance_status || "UNKNOWN",
        readiness: row.readiness || frontend.status || "UNKNOWN",
        frontendGate: normalizeStatus(frontend.current_state, frontend.build_test_smoke_result, frontend.frontend_blockers),
        backendGate: normalizeStatus(row.database_backend_status, frontend.backend_dependencies),
        paymentGate: normalizeStatus(row.payment_booking_status, row.revenue_status),
        deployGate: normalizeStatus(row.deployment_status, row.live_status),
        providerGate: normalizeStatus(row.auth_status, row.database_backend_status, row.payment_booking_status, row.live_status),
        securityGate: normalizeStatus(row.security_status),
        productMemory: instance.product_memory || "UNKNOWN",
        releaseManagement: instance.release_management || "UNKNOWN",
        telemetry: instance.telemetry || "UNKNOWN",
        support: instance.support || "UNKNOWN",
        aiCostMonitoring: instance.ai_cost_monitoring || "UNKNOWN",
        churn: instance.churn || "UNKNOWN",
        upsellTriggers: instance.upsell_triggers || "UNKNOWN",
        weeklyReview: instance.weekly_review || "UNKNOWN",
        knowledgePromotion: instance.knowledge_promotion || "UNKNOWN",
        nexusCandidateExtraction: instance.nexus_candidate_extraction || "UNKNOWN",
        contentGate: normalizeStatus(row.content_marketing_status),
        biggestBlocker: row.biggest_blocker || frontend.frontend_blockers || "UNKNOWN",
        nextAction: instance.next_action || row.one_next_action || frontend.next_action || "UNKNOWN",
        evidence: [
          "command-centre/war-room/product-readiness-board.csv",
          frontend.product ? "command-centre/war-room/frontend-completion-board.csv" : "",
          instance.instance_path ? "command-centre/war-room/product-vcos-instance-board.csv" : "",
        ]
          .filter(Boolean)
          .join("; "),
        claimCeiling: instance.claim_ceiling || claimCeilingForProduct(row),
      };
    });
}

function buildControlSurface({ loadedSources, repoSources, productRows, frontendRows, productVcosInstanceRows, workQueue }) {
  const sourceById = new Map([...loadedSources, ...repoSources].map((source) => [source.id, source]));
  const revenueContent = sourceById.get("revenue")?.content || "";
  const approvalContent = sourceById.get("approvals")?.content || "";
  const blockedContent = sourceById.get("blocked-items")?.content || "";
  const openContent = sourceById.get("open-items")?.content || "";
  const nextActionsContent = sourceById.get("next-actions")?.content || "";
  const lastRunContent = sourceById.get("last-run-summary")?.content || "";
  const decisionContent = sourceById.get("decision-log")?.content || "";
  const accessTickets = parseCsv(sourceById.get("access-failures")?.content || "");
  const revenueTables = markdownTables(revenueContent);
  const approvalTables = markdownTables(approvalContent);
  const revenueLanes = revenueTables.find((rows) => rows.some((row) => "Lane" in row && "Readiness" in row)) || [];
  const paymentReadiness = revenueTables.find((rows) => rows.some((row) => "Area" in row && "Status" in row)) || [];
  const activeApprovals = approvalTables.find((rows) => rows.some((row) => "Item" in row && "Status" in row)) || [];
  const productVcos = productVcosRows(productRows, frontendRows, productVcosInstanceRows);
  const productGateCounts = productVcos.reduce(
    (counts, row) => {
      ["frontendGate", "backendGate", "paymentGate", "deployGate", "providerGate"].forEach((key) => {
        counts[key] ||= { unknown: 0, blocked: 0, evidenced: 0, total: 0 };
        counts[key].total += 1;
        if (/UNKNOWN/.test(row[key])) counts[key].unknown += 1;
        else if (/BLOCKED/.test(row[key])) counts[key].blocked += 1;
        else if (/EVIDENCED/.test(row[key])) counts[key].evidenced += 1;
      });
      return counts;
    },
    {},
  );
  const approvalNeedsShrish = activeApprovals
    .filter((row) => /(pending|open|required|approval|manual|not approved|waiting|UNKNOWN)/i.test(`${row.Status} ${row["Safe next step"]}`))
    .map((row) => ({
      item: row.Item || "UNKNOWN",
      status: row.Status || "UNKNOWN",
      why: row["Why it matters"] || "UNKNOWN",
      safeNextStep: row["Safe next step"] || "UNKNOWN",
      sourceEvidence: "command-centre/war-room/approval-board.md#Active Approval / Decision Items",
    }))
    .slice(0, 10);
  const revenueTruth = extractSection(revenueContent, "Revenue Truth") || "MRR and revenue readiness remain UNKNOWN unless verified payment evidence proves otherwise.";
  const failures = [
    ...productRows
      .filter((row) => /UNKNOWN|BLOCK|FAIL|RISK|NEEDS|MISSING|NO_SEND/i.test(`${row.revenue_status} ${row.payment_booking_status} ${row.deployment_status} ${row.security_status} ${row.biggest_blocker}`))
      .map((row) => ({
        title: row.product,
        status: normalizeStatus(row.revenue_status, row.payment_booking_status, row.deployment_status, row.security_status),
        detail: row.biggest_blocker || "UNKNOWN",
        sourceEvidence: "command-centre/war-room/product-readiness-board.csv",
      })),
    ...accessTickets.map((row) => ({
      title: row.id || row.ticket_id || row.tool || "Access failure",
      status: row.status || "OPEN",
      detail: row.failure || row.blocker || row.next_action || JSON.stringify(row),
      sourceEvidence: "ops/audits/access/2026-07-01-tool-cli-readiness/harness-access-failure-tickets.csv",
    })),
    ...bulletsFromSection(blockedContent, "Blocked Items", 4).map((item) => ({
      title: "Kernel blocked item",
      status: "BLOCKED",
      detail: item,
      sourceEvidence: "vcos/mds-kernel/state/blocked-items.md",
    })),
  ].slice(0, 14);
  const routeMap = new Map();
  workQueue.forEach((item) => {
    const key = item.targetAgent || "UNKNOWN";
    const current = routeMap.get(key) || { targetAgent: key, count: 0, lanes: new Set(), owners: new Set(), highestPriority: "P3" };
    current.count += 1;
    current.lanes.add(item.lane || "UNKNOWN");
    current.owners.add(item.owner || "UNKNOWN");
    if (["P0", "P1", "P2", "P3"].indexOf(item.priority) < ["P0", "P1", "P2", "P3"].indexOf(current.highestPriority)) {
      current.highestPriority = item.priority;
    }
    routeMap.set(key, current);
  });

  return {
    status: "LOCAL_CONTROL_SURFACE_ONLY",
    claimCeiling:
      "This dashboard reads D-local structured state and local files. Provider dashboards remain authority for live runtime/payment/auth/schema/deploy/billing. GitHub remains committed-code authority. UNKNOWN stays UNKNOWN.",
    revenue: {
      mrr: revenueTruth.match(/MRR:\s*`?([^`\n]+)`?/i)?.[1] || "$0 unless verified payment evidence proves otherwise",
      status: "UNVERIFIED_REVENUE_UNLESS_PAYMENT_EVIDENCE_EXISTS",
      sourceEvidence: "command-centre/war-room/revenue-board.md#Revenue Truth",
      safeNextAction: extractSection(revenueContent, "One Revenue Next Action") || "UNKNOWN",
      lanes: revenueLanes.slice(0, 8),
      paymentReadiness: paymentReadiness.slice(0, 8),
    },
    gates: {
      frontend: productGateCounts.frontendGate || { total: 0, unknown: 0, blocked: 0, evidenced: 0 },
      backend: productGateCounts.backendGate || { total: 0, unknown: 0, blocked: 0, evidenced: 0 },
      payment: productGateCounts.paymentGate || { total: 0, unknown: 0, blocked: 0, evidenced: 0 },
      deploy: productGateCounts.deployGate || { total: 0, unknown: 0, blocked: 0, evidenced: 0 },
      provider: productGateCounts.providerGate || { total: 0, unknown: 0, blocked: 0, evidenced: 0 },
    },
    productVcos,
    approvals: {
      shrishRequired: approvalNeedsShrish,
      standingRedGates: bulletsFromSection(approvalContent, "Standing Red Gates", 12),
      sourceEvidence: "command-centre/war-room/approval-board.md",
    },
    workOrders: {
      active: workQueue.filter((item) => !/PARKED/i.test(item.status)).slice(0, 8),
      sourceEvidence: "command-centre/war-room/index.md#QUEUE; command-centre/war-room/work-order-pack.md",
    },
    agentAssignments: {
      routes: [...routeMap.values()].map((item) => ({
        ...item,
        lanes: [...item.lanes].sort(),
        owners: [...item.owners].sort(),
      })),
      sourceEvidence: "Derived from local workQueue targetAgent/lane/owner fields.",
    },
    failures,
    releases: [
      ...latestFiles("command-centre/war-room/execution-tracker/memory-run-manifests", 6),
      ...latestFiles("ops/releases", 4),
    ].slice(0, 8),
    contentQueue: revenueLanes
      .filter((row) => /content|workflow|gwalia/i.test(row.Lane || ""))
      .map((row) => ({
        title: row.Lane || "Content queue",
        status: row.Readiness || row.State || "UNKNOWN",
        nextAction: row["Safe next action"] || "UNKNOWN",
        sourceEvidence: "command-centre/war-room/revenue-board.md#Revenue Lanes",
      })),
    boardDecisions: [
      ...linesMatching(decisionContent, /DEC-|decision|approved|blocked|parked/i, 5).map((line) => ({
        title: line.replace(/^-+\s*/, ""),
        status: "D_LOCAL_DECISION_LOG",
        sourceEvidence: "vcos/mds-kernel/state/decision-log.md",
      })),
      ...latestFiles("command-centre/war-room/communications/board-to-ceo-outbox", 4).map((file) => ({
        title: file.title,
        status: "BOARD_TO_CEO_OUTBOX",
        sourceEvidence: file.sourceEvidence,
      })),
    ].slice(0, 8),
    ceoActions: [
      ...latestFiles("command-centre/war-room/communications/ceo-to-board-outbox", 5).map((file) => ({
        title: file.title,
        status: "CEO_TO_BOARD_OUTBOX",
        sourceEvidence: file.sourceEvidence,
      })),
      ...latestFiles("command-centre/war-room/communications/ceo-to-agent-outbox", 3).map((file) => ({
        title: file.title,
        status: "CEO_TO_AGENT_OUTBOX",
        sourceEvidence: file.sourceEvidence,
      })),
    ].slice(0, 8),
    nextAction: {
      title:
        bulletsFromSection(nextActionsContent, "Immediate", 1)[0] ||
        bulletsFromSection(nextActionsContent, "Next Actions", 1)[0] ||
        firstNonEmptyLine(nextActionsContent) ||
        "UNKNOWN",
      sourceEvidence: "vcos/mds-kernel/state/next-actions.md",
    },
    nightlyCloseout: {
      status: "LOCAL_LAST_RUN_SUMMARY",
      summary: markdownSummary(lastRunContent),
      sourceEvidence: "vcos/mds-kernel/state/last-run-summary.md; command-centre/war-room/execution-tracker/memory-run-manifests/",
    },
    openItems: linesMatching(openContent, /^[-*]|\bOPEN\b|\bPENDING\b/i, 8).map((line) => ({
      title: line.replace(/^[-*]\s*/, ""),
      sourceEvidence: "vcos/mds-kernel/state/open-items.md",
    })),
  };
}

function numberedItemsFromSection(text, heading, limit = 10) {
  return extractSection(text, heading)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function extractWorkOrderBlocks(text, limit = 8) {
  const blocks = [];
  const matches = [...text.matchAll(/## (?<heading>(?:Current Priority|Human Gate|WO-\d+|Parked Priority)[^\n]*)\n([\s\S]*?)(?=\n## |\s*$)/g)];
  for (const match of matches) {
    const heading = match.groups?.heading?.trim() || "Work order";
    const block = match[2] || "";
    const project = block.match(/PROJECT:\s*(.+)/)?.[1]?.trim() || heading;
    const task = block.match(/TASK:\s*([\s\S]*?)(?:\nROOT:|\nREAD:|\nLOAD FIRST:|\nRULES:|$)/)?.[1]?.replace(/\s+/g, " ").trim();
    const acceptance = block.match(/ACCEPTANCE CRITERIA:\s*([\s\S]*?)(?:```|\n## |$)/)?.[1]
      ?.split(/\r?\n/)
      .map((line) => line.trim().replace(/^-+\s*/, ""))
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
    blocks.push({
      heading,
      text: [project, task, acceptance].filter(Boolean).join(" - "),
      isHumanGate: heading.toLowerCase().includes("human gate"),
      isParked: heading.toLowerCase().includes("parked"),
    });
    if (blocks.length >= limit) break;
  }
  return blocks;
}

function inferAssignment(text) {
  const lower = text.toLowerCase();
  const base = {
    lane: "Product Ops Studio",
    owner: "Orion",
    reviewer: "Rook",
    targetAgent: "Codex",
    priority: "P1",
    risk: "AMBER",
    status: "READY FOR LOCAL ROUTING",
    evidenceRequirement: "Name exact D-root source files and preserve UNKNOWN where owning authority has not verified state.",
    proofCondition: "Local artifact or local verification evidence exists, with no deploy, provider mutation, external send, payment action, or secret read.",
    stopCondition: "Stop before deploy, provider mutation, external message, payment action, secret access, deletion, migration, pricing change, or live-state claim.",
    nextAction: "Create a scoped local ticket, verify source evidence, and dispatch only with an explicit stop condition.",
    allowedActions: [
      "Read whitelisted D-root doctrine, boards, and product files needed for this ticket.",
      "Create local drafts, local code changes, or local evidence records inside the named scope.",
      "Run local no-secret checks and capture evidence paths.",
    ],
    forbiddenActions: [
      "Deploy or mutate provider-owned state.",
      "Read or print secrets, env values, credentials, tokens, private keys, or payment secrets.",
      "Send external messages, forms, client commitments, posts, or payment artifacts.",
    ],
  };

  if (lower.includes("stripe") || lower.includes("payment") || lower.includes("checkout") || lower.includes("invoice") || lower.includes("pricing") || lower.includes("revenue")) {
    return {
      ...base,
      lane: "Finance Studio",
      owner: "Aria",
      reviewer: "Codex Board",
      targetAgent: lower.includes("shrish") || lower.includes("human") ? "Human" : "Codex",
      priority: "P0",
      risk: "RED",
      status: lower.includes("shrish") || lower.includes("human") ? "HUMAN APPROVAL REQUIRED" : "BLOCKED UNTIL APPROVED",
      evidenceRequirement: "Use provider dashboard evidence for live payment state; use names only for missing provider items; never paste values.",
      proofCondition: "Decision form or readiness artifact exists with READY / MISSING / UNKNOWN status by provider and no secret values.",
    };
  }
  if (lower.includes("deploy") || lower.includes("vercel") || lower.includes("railway") || lower.includes("github") || lower.includes("branch") || lower.includes("commit")) {
    return {
      ...base,
      lane: "Engineering Studio",
      owner: "Kai",
      reviewer: "Rook",
      targetAgent: "Claude Code",
      priority: "P0",
      risk: "RED",
      status: "APPROVAL REQUIRED",
      evidenceRequirement: "Use GitHub for committed/versioned code truth and provider dashboard evidence for live deployment truth.",
      proofCondition: "Local checks and exact commit/provider metadata are recorded; no deploy occurs unless separately approved.",
    };
  }
  if (lower.includes("security") || lower.includes("secret") || lower.includes("credential") || lower.includes("auth") || lower.includes("database") || lower.includes("migration")) {
    return {
      ...base,
      lane: "QA Studio",
      owner: "Rook",
      reviewer: "Security / Compliance Board lens",
      targetAgent: "Antigravity",
      priority: "P0",
      risk: "RED",
      status: "REVIEW REQUIRED",
      evidenceRequirement: "Use no-secret source review and provider dashboard metadata only when explicitly authorized.",
      proofCondition: "Risk finding or review packet names files, claims, unknowns, and forbidden actions without exposing secrets.",
    };
  }
  if (lower.includes("notebook") || lower.includes("research") || lower.includes("source")) {
    return {
      ...base,
      lane: "Research Studio",
      owner: "Atlas",
      reviewer: "Codex Board",
      targetAgent: "NotebookLM",
      risk: "AMBER",
      evidenceRequirement: "Preserve source provenance, uncertainty, and citation boundaries.",
      proofCondition: "Research retrieval or synthesis packet cites sources and separates evidence from recommendation.",
    };
  }
  if (lower.includes("board") || lower.includes("ceo") || lower.includes("doctrine") || lower.includes("authority") || lower.includes("memory")) {
    return {
      ...base,
      lane: "CEO Command",
      owner: "Veda Gupta",
      reviewer: "Codex Board",
      targetAgent: "Codex",
      priority: "P0",
      risk: "AMBER",
      evidenceRequirement: "Load CEO.md, memory-first contract, source authority matrix, current state, and exact doctrine files before deciding.",
      proofCondition: "Decision packet records dissent, confidence, falsification condition, and one delegated next action.",
    };
  }
  if (lower.includes("client") || lower.includes("message") || lower.includes("outreach") || lower.includes("post") || lower.includes("content")) {
    return {
      ...base,
      lane: "Content Studio",
      owner: "Myra",
      reviewer: "Shrish",
      targetAgent: "Human",
      priority: "P1",
      risk: "RED",
      status: "NO SEND WITHOUT SHRISH",
      evidenceRequirement: "Use draft-only content evidence and exact approval target; do not send or post.",
      proofCondition: "Draft packet exists with NO SEND / NO POST status and exact approval requirement.",
    };
  }
  return base;
}

function titleFromText(text) {
  return text
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
}

function queueItem({ id, title, text, sourceEvidence, source, parked = false }) {
  const assignment = inferAssignment(`${title} ${text}`);
  return {
    id,
    title: titleFromText(title || text),
    objective: text,
    source,
    sourceEvidence,
    lane: assignment.lane,
    owner: assignment.owner,
    reviewer: assignment.reviewer,
    targetAgent: assignment.targetAgent,
    priority: parked ? "P3" : assignment.priority,
    risk: assignment.risk,
    status: parked ? "PARKED" : assignment.status,
    evidenceRequirement: assignment.evidenceRequirement,
    proofCondition: assignment.proofCondition,
    stopCondition: assignment.stopCondition,
    nextAction: assignment.nextAction,
    allowedActions: assignment.allowedActions,
    forbiddenActions: assignment.forbiddenActions,
  };
}

const loadedSources = sourceFiles.map(([id, title, relativePath, kind]) => {
  const { exists, content } = readAllowed(relativePath);
  const absolute = path.join(warRoomRoot, relativePath);
  const stats = exists ? fs.statSync(absolute) : null;
  return {
    id,
    title,
    relativePath: `command-centre/war-room/${relativePath}`,
    kind,
    exists,
    modifiedAt: stats?.mtime.toISOString() || null,
    sizeBytes: stats?.size || 0,
    summary: exists ? markdownSummary(content) : "Source file missing; app must fail closed for this board.",
    content: exists ? content.slice(0, 16000) : "",
  };
});
const repoSources = repoSourceFiles.map(([id, title, relativePath, kind]) => {
  const { exists, content } = readRepoAllowed(relativePath);
  const absolute = path.join(repoRoot, relativePath);
  const stats = exists ? fs.statSync(absolute) : null;
  return {
    id,
    title,
    relativePath,
    kind,
    exists,
    modifiedAt: stats?.mtime.toISOString() || null,
    sizeBytes: stats?.size || 0,
    summary: exists ? markdownSummary(content) : "Source file missing; app must fail closed for this signal.",
    content: exists ? content.slice(0, 16000) : "",
  };
});

const indexContent = loadedSources.find((source) => source.id === "index")?.content ?? "";
const workOrderContent = loadedSources.find((source) => source.id === "work-orders")?.content ?? "";
const productCsv = loadedSources.find((source) => source.id === "product-readiness-csv")?.content ?? "";
const productRows = parseCsv(productCsv);
const frontendCsv = loadedSources.find((source) => source.id === "frontend-completion-csv")?.content ?? "";
const frontendRows = parseCsv(frontendCsv);
const productVcosInstanceCsv = loadedSources.find((source) => source.id === "product-vcos-instances-csv")?.content ?? "";
const productVcosInstanceRows = parseCsv(productVcosInstanceCsv);
const moduleRoot = path.join(frameworkRoot, "modules");
const frameworkModules = fs.existsSync(moduleRoot)
  ? fs
      .readdirSync(moduleRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const modulePath = path.join("modules", entry.name, "module.json");
        return readFrameworkJson(modulePath, { id: entry.name, missing: true });
      })
  : [];

const framework = {
  authority: readFrameworkJson("authority/default-constitution.json", null),
  agentProfiles: readFrameworkJson("agents/default-agent-profiles.json", { profiles: [] }),
  runControls: readFrameworkJson("run-control/default-run-controls.json", { profiles: [] }),
  gatewayContracts: readFrameworkJson("gateways/default-gateway-contracts.json", { gateways: [] }),
  knowledgePacks: readFrameworkJson("knowledge/default-knowledge-packs.json", { packs: [] }),
  qualityScorecard: readFrameworkJson("quality/default-quality-scorecard.json", { policy: {}, components: [] }),
  modules: frameworkModules,
};

const matrixBenchmark = [
  {
    capability: "Company runtime",
    matrixPositioning: "Public positioning emphasizes a 0-person company that earns.",
    mdsControl: "Founder-governed Command Centre with CEO/Board authority, explicit approvals, and local D-root evidence.",
    sprint001Status: "VISIBLE",
  },
  {
    capability: "Long-horizon execution",
    matrixPositioning: "Public positioning packages objective setting, agent coordination, shipped artifacts, and proof verification.",
    mdsControl: "Local tickets bind objective, owner, evidence, stop condition, run controls, source health, and closeout before dispatch.",
    sprint001Status: "FILE-BACKED",
  },
  {
    capability: "Agents and departments",
    matrixPositioning: "Owner, leads, workers, and departments are packaged as runtime primitives.",
    mdsControl: "MIDAS agent profiles, VCOS departments, director ownership, and dispatch packets are local, evidence-bound primitives.",
    sprint001Status: "LOCAL CONTRACTS INGESTED",
  },
  {
    capability: "Memory and skills",
    matrixPositioning: "Memory, skills, assets, and handoffs are core operating artifacts.",
    mdsControl: "MDS Company Memory, memory-first contract, session closeout contract, skill/workflow promotion gates, and source authority model.",
    sprint001Status: "PROOF-GATED",
  },
  {
    capability: "Revenue claims",
    matrixPositioning: "Marketing can imply autonomous earning outcomes.",
    mdsControl: "Revenue/payment/live state remains UNKNOWN until provider or payment-proof authority proves it.",
    sprint001Status: "FAIL-CLOSED",
  },
  {
    capability: "Execution safety",
    matrixPositioning: "Automation-first cadence and handoffs.",
    mdsControl: "Run controls block deploys, money movement, external messages, provider mutation, and secret access without explicit approval.",
    sprint001Status: "ENFORCED IN UI",
  },
];

const workQueue = [
  ...numberedItemsFromSection(indexContent, "QUEUE", 8).map((item, index) =>
    queueItem({
      id: `queue-war-room-${index + 1}`,
      title: item,
      text: item,
      source: "War Room queue",
      sourceEvidence: "command-centre/war-room/index.md#QUEUE",
    }),
  ),
  ...extractWorkOrderBlocks(workOrderContent, 9).map((block, index) =>
    queueItem({
      id: `queue-work-order-${index + 1}`,
      title: block.heading,
      text: block.text,
      source: "Work order pack",
      sourceEvidence: "command-centre/war-room/work-order-pack.md",
      parked: block.isParked,
    }),
  ),
].slice(0, 16);

// Fail-closed degradation (F5-MV-18): when the war-room index/work-order pack
// is missing (untracked file loss), derive the queue from the REAL work orders
// that still exist on disk: command-centre/war-room/fable-work-orders/*.md.
// This reads actual governed work-order files; nothing is fabricated.
if (workQueue.length < 4) {
  const fableOrdersDir = path.join(warRoomRoot, "fable-work-orders");
  if (fs.existsSync(fableOrdersDir)) {
    const orderFiles = fs
      .readdirSync(fableOrdersDir)
      .filter((name) => name.endsWith(".md"))
      .sort()
      .slice(0, 12);
    for (const [index, name] of orderFiles.entries()) {
      let heading = name.replace(/\.md$/, "");
      try {
        const head = fs.readFileSync(path.join(fableOrdersDir, name), "utf8").slice(0, 1500);
        const match = head.match(/^#\s+(.+)$/m);
        if (match) heading = match[1].trim();
      } catch {
        // keep filename-derived heading
      }
      workQueue.push(
        queueItem({
          id: `queue-fable-order-${index + 1}`,
          title: heading,
          text: `Governed work order on disk: ${heading}. Index/work-order-pack boards are missing from the war room; this row is derived directly from the work-order file.`,
          source: "Fable work orders (board-missing fallback)",
          sourceEvidence: `command-centre/war-room/fable-work-orders/${name}`,
        }),
      );
    }
  }
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  root: "D:/Million Dollar AI Studio/",
  sourceRoot: "D:/Million Dollar AI Studio/command-centre/war-room/",
  authority: {
    dRoot: "Active operating PROD root for MDS doctrine, state, local work, and Command Centre.",
    github: "Committed/versioned code authority.",
    providers: "Live runtime, deployment, database, auth, billing, payment, schema, and environment authority.",
    eRoot: "Backup/recovery only.",
    unknownRule: "UNKNOWN stays UNKNOWN unless owning authority proves the state.",
  },
  today: {
    status: markdownSummary(indexContent),
    activeObjective:
      "Build Sprint 001 local-first Command Centre spine from existing War Room boards without provider mutation.",
    nextSafeAction:
      bulletsFromSection(indexContent, "NEXT ACTION", 1)[0] ||
      bulletsFromSection(indexContent, "Current Immediate Next Action", 1)[0] ||
      "Use the local shell to route one accountable next action with evidence and stop condition.",
    blockers: bulletsFromSection(indexContent, "Top Blockers", 8),
    approvals: bulletsFromSection(indexContent, "Approval Strip", 8),
  },
  sources: loadedSources,
  repoSources,
  sourceHealth: [...loadedSources, ...repoSources].map((source) => ({
    id: source.id,
    title: source.title,
    relativePath: source.relativePath,
    exists: source.exists,
    modifiedAt: source.modifiedAt,
    sizeBytes: source.sizeBytes,
    status: source.exists ? "LOADED" : "MISSING_FAIL_CLOSED",
  })),
  productReadiness: productRows,
  frontendCompletion: frontendRows,
  productVcosInstances: productVcosInstanceRows,
  workQueue,
  controlSurface: buildControlSurface({ loadedSources, repoSources, productRows, frontendRows, productVcosInstanceRows, workQueue }),
  framework,
  matrixBenchmark,
};

fs.mkdirSync(outDir, { recursive: true });
const tempFile = `${outFile}.${process.pid}.tmp`;
fs.writeFileSync(tempFile, `${JSON.stringify(snapshot, null, 2)}\n`);
fs.renameSync(tempFile, outFile);
console.log(`Wrote ${path.relative(appRoot, outFile)} from ${loadedSources.length} whitelisted sources.`);
