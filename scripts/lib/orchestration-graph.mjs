const NODE_TYPES = new Set(["start", "agent", "gate", "tool", "end"]);

const safeId = (value, label) => {
  const id = String(value || "");
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(id)) throw new Error(`${label}_ID_INVALID`);
  return id;
};

export function validateOrchestrationGraph(input) {
  const nodes = Array.isArray(input?.nodes) ? input.nodes.slice(0, 50).map((node) => ({ id: safeId(node.id, "NODE"), type: NODE_TYPES.has(node.type) ? node.type : "agent", label: String(node.label || node.id).trim().slice(0, 100), x: Math.max(0, Math.min(1200, Number(node.x || 0))), y: Math.max(0, Math.min(800, Number(node.y || 0))) })) : [];
  if (!nodes.length || new Set(nodes.map((node) => node.id)).size !== nodes.length) throw new Error("GRAPH_NODES_INVALID");
  const ids = new Set(nodes.map((node) => node.id));
  const edges = (Array.isArray(input?.edges) ? input.edges : []).slice(0, 100).map((edge) => ({ id: safeId(edge.id, "EDGE"), from: safeId(edge.from, "EDGE_FROM"), to: safeId(edge.to, "EDGE_TO"), condition: String(edge.condition || "always").trim().slice(0, 120), loop: edge.loop === true }));
  if (new Set(edges.map((edge) => edge.id)).size !== edges.length || edges.some((edge) => !ids.has(edge.from) || !ids.has(edge.to))) throw new Error("GRAPH_EDGES_INVALID");
  const maxIterations = Number(input.maxIterations || 1);
  if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 20 || edges.some((edge) => edge.loop) && maxIterations < 2) throw new Error("GRAPH_ITERATION_LIMIT_INVALID");
  return { schemaVersion: "mds.orchestration-graph.v1", id: safeId(input.id || "Graph", "GRAPH"), title: String(input.title || "Untitled graph").trim().slice(0, 160), nodes, edges, maxIterations, status: "LOCAL_DRAFT", executionAllowed: false };
}

export function readyGraphNodes(graphInput, completedNodeIds = []) {
  const graph = validateOrchestrationGraph(graphInput);
  const completed = new Set(completedNodeIds);
  return graph.nodes.filter((node) => !completed.has(node.id) && graph.edges.filter((edge) => edge.to === node.id && !edge.loop).every((edge) => completed.has(edge.from)));
}

export async function runParallelGraphWave({ graph: graphInput, completedNodeIds = [], worker, concurrency = 2 }) {
  const graph = validateOrchestrationGraph(graphInput);
  if (typeof worker !== "function") throw new Error("GRAPH_WORKER_REQUIRED");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("GRAPH_CONCURRENCY_INVALID");
  const ready = readyGraphNodes(graph, completedNodeIds).slice(0, concurrency);
  const settled = await Promise.allSettled(ready.map((node) => worker({ ...node, executionAuthority: "LOCAL_WORKER_ONLY" })));
  return { schemaVersion: "mds.parallel-wave-receipt.v1", graphId: graph.id, concurrency, scheduledNodeIds: ready.map((node) => node.id), results: settled.map((result, index) => ({ nodeId: ready[index].id, status: result.status === "fulfilled" ? "COMPLETED" : "FAILED", output: String(result.status === "fulfilled" ? result.value : result.reason?.message || result.reason).slice(0, 2000) })), providerAgentsSpawned: false, subprocessesSpawned: false, nextWaveRequiresReview: true };
}
