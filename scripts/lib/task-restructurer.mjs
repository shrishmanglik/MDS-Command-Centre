const ADMIN_ROLES = new Set(["Scrum Master", "Coordinator", "Task Manager", "Administrator"]);
const EXECUTION_ROLES = new Set(["Developer", "QA", "Architect", "PM", "Human"]);

export function restructureTaskAssignments(input) {
  if (!Array.isArray(input?.tasks) || !input.tasks.length || input.tasks.length > 200) throw new Error("TASK_WIZARD_COUNT_INVALID");
  const tasks = input.tasks.map((task, index) => {
    const id = String(task.id || `TASK-${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64);
    const title = String(task.title || "").trim();
    if (!title || title.length > 200) throw new Error(`TASK_WIZARD_TITLE_INVALID: ${id}`);
    const originalRole = String(task.assigneeRole || "Developer");
    if (!ADMIN_ROLES.has(originalRole) && !EXECUTION_ROLES.has(originalRole)) throw new Error(`TASK_WIZARD_ROLE_INVALID: ${originalRole}`);
    return { id, title, originalRole, assigneeRole: ADMIN_ROLES.has(originalRole) ? "Developer" : originalRole, acceptanceCheck: String(task.acceptanceCheck || "UNKNOWN").trim().slice(0, 500), administrativeRelayRemoved: ADMIN_ROLES.has(originalRole), executionStarted: false };
  });
  return { schemaVersion: "mds.task-restructure-receipt.v1", status: "PROPOSED_DIRECT_ROUTING", tasks, relayCountRemoved: tasks.filter((task) => task.administrativeRelayRemoved).length, sourceModified: false, authority: "Proposed task routing only. No work order, agent assignment, code, or runtime was mutated." };
}
