/**
 * Graph Compiler — converts React Flow nodes/edges into a canonical,
 * topologically-sorted ExecutionPlan with cost/token estimates.
 */

import type { PipelineNode, PipelineEdge, ExecutionStep, ExecutionPlan } from "../types";
import { getNodeDefinition } from "../nodes/definitions";
import dagre from "dagre";

// ── Topological sort (Kahn's algorithm) ──────────────────────────────────────
function topologicalSort(
  nodeIds: string[],
  edges: PipelineEdge[]
): { order: string[]; hasCycle: boolean } {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const id of nodeIds) {
    inDegree[id] = 0;
    adj[id] = [];
  }

  for (const edge of edges) {
    const src = edge.source;
    const tgt = edge.target;
    if (!adj[src] || !inDegree[tgt] === undefined) continue;
    adj[src].push(tgt);
    inDegree[tgt] = (inDegree[tgt] ?? 0) + 1;
  }

  const queue: string[] = Object.entries(inDegree)
    .filter(([, d]) => d === 0)
    .map(([id]) => id);
  const order: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of (adj[node] ?? [])) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return {
    order,
    hasCycle: order.length !== nodeIds.length,
  };
}

// ── Auto-layout with Dagre ────────────────────────────────────────────────────
export function autoLayoutDagre(
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  options: { nodeWidth?: number; nodeHeight?: number; rankdir?: string } = {}
): PipelineNode[] {
  const { nodeWidth = 260, nodeHeight = 120, rankdir = "LR" } = options;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, ranksep: 80, nodesep: 60, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPos.x - nodeWidth / 2,
        y: nodeWithPos.y - nodeHeight / 2,
      },
    };
  });
}

// ── Token/cost estimation ─────────────────────────────────────────────────────
const COST_PER_1K_TOKENS: Record<string, number> = {
  "gpt-4o": 0.005,
  "gpt-4o-mini": 0.00015,
  "claude-sonnet-4-6": 0.003,
  "claude-opus-4-6": 0.015,
  "gemini-2.5-flash": 0.000125,
  "gemini-1.5-flash": 0.000075,
  default: 0.001,
};

function estimateNodeTokens(node: PipelineNode): number {
  const def = getNodeDefinition(node.data.nodeType ?? "");
  if (!def) return 0;
  switch (def.category) {
    case "ai":
      return parseInt(String(node.data.maxTokens ?? 1024), 10) + 200; // + system prompt
    case "trigger":
    case "transform":
    case "logic":
      return 0;
    default:
      return 0;
  }
}

function estimateNodeDuration(node: PipelineNode): number {
  const t = node.data.nodeType;
  if (t === "llm" || t === "aiAgent" || t === "ragPipeline") return 2000;
  if (t === "http" || t === "email" || t === "stripe") return 800;
  if (t === "postgresql" || t === "supabase" || t === "firebase") return 300;
  return 50;
}

// ── Main compiler ─────────────────────────────────────────────────────────────
export interface CompileResult {
  plan: ExecutionPlan;
  hasCycle: boolean;
  orphanedNodes: string[];
}

export function compileGraph(
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): CompileResult {
  const nodeIds = nodes.map((n) => n.id);
  const { order, hasCycle } = topologicalSort(nodeIds, edges);

  // Build adjacency maps
  const inputs: Record<string, string[]> = {};
  const outputs: Record<string, string[]> = {};
  for (const id of nodeIds) {
    inputs[id] = [];
    outputs[id] = [];
  }
  for (const edge of edges) {
    outputs[edge.source]?.push(edge.target);
    inputs[edge.target]?.push(edge.source);
  }

  // Depth calculation
  const depth: Record<string, number> = {};
  for (const id of order) {
    const parentDepths = (inputs[id] ?? []).map((p) => depth[p] ?? 0);
    depth[id] = parentDepths.length > 0 ? Math.max(...parentDepths) + 1 : 0;
  }

  // Build execution steps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const steps: ExecutionStep[] = order.map((id) => {
    const node = nodeMap.get(id)!;
    const def = getNodeDefinition(node.data.nodeType ?? "");
    const requiredCreds = (def?.requiredCredentials ?? [])
      .filter((c) => c.required)
      .map((c) => c.key);

    // Nodes at same depth with no shared deps can parallelize
    const sameDepthNodes = order.filter((o) => depth[o] === depth[id] && o !== id);
    const canParallelize = sameDepthNodes.length > 0 && (inputs[id] ?? []).length === 0;

    return {
      nodeId: id,
      nodeType: node.data.nodeType ?? "unknown",
      nodeLabel: String(node.data.label ?? node.data.nodeType ?? id),
      inputs: inputs[id] ?? [],
      outputs: outputs[id] ?? [],
      requiredCredentials: requiredCreds,
      dependencyDepth: depth[id] ?? 0,
      canParallelize,
    };
  });

  // Estimates
  let totalTokens = 0;
  let totalDuration = 0;
  const providers = new Set<string>();
  const warnings: string[] = [];

  for (const node of nodes) {
    totalTokens += estimateNodeTokens(node);
    totalDuration += estimateNodeDuration(node);

    const provider = String(node.data.provider ?? "");
    if (provider) providers.add(provider);

    const def = getNodeDefinition(node.data.nodeType ?? "");
    if (def?.requiredCredentials) {
      const missing = def.requiredCredentials
        .filter((c) => c.required && !node.data.credentials?.[c.key])
        .map((c) => c.label);
      if (missing.length > 0) {
        warnings.push(`Node "${node.data.label ?? node.id}" missing: ${missing.join(", ")}`);
      }
    }
  }

  const model = String(nodes[0]?.data?.model ?? "default");
  const costPer1k = COST_PER_1K_TOKENS[model] ?? COST_PER_1K_TOKENS.default;
  const estimatedCostUSD = (totalTokens / 1000) * costPer1k;

  // Orphaned nodes (no edges at all)
  const connectedNodeIds = new Set(edges.flatMap((e) => [e.source, e.target]));
  const orphanedNodes = nodeIds.filter(
    (id) => !connectedNodeIds.has(id) && nodes.length > 1
  );

  if (hasCycle) {
    warnings.push("Graph contains a cycle — execution order may be unpredictable.");
  }

  return {
    hasCycle,
    orphanedNodes,
    plan: {
      steps,
      totalEstimatedTokens: totalTokens,
      estimatedCostUSD,
      estimatedDurationMs: totalDuration,
      providers: Array.from(providers),
      warnings,
    },
  };
}

// ── Validation: check if all required credentials present ────────────────────
export function validateGraphCredentials(
  nodes: PipelineNode[]
): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};

  for (const node of nodes) {
    const def = getNodeDefinition(node.data.nodeType ?? "");
    if (!def?.requiredCredentials) continue;
    const missing = def.requiredCredentials
      .filter((c) => c.required && !node.data.credentials?.[c.key])
      .map((c) => c.label);
    if (missing.length > 0) {
      errors[node.id] = missing;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
