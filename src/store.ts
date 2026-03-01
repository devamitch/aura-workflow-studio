import {
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";
import { create } from "zustand";
import type { HandleConfig, PipelineEdge, PipelineNode } from "./types";

const demoNodes: PipelineNode[] = [
  {
    id: "d-input1",
    type: "customInput",
    position: { x: 60, y: 80 },
    data: { id: "d-input1", nodeType: "customInput", inputName: "user_query", inputType: "Text" },
  },
  {
    id: "d-input2",
    type: "customInput",
    position: { x: 60, y: 330 },
    data: { id: "d-input2", nodeType: "customInput", inputName: "topic", inputType: "Text" },
  },
  {
    id: "d-text",
    type: "text",
    position: { x: 60, y: 560 },
    data: {
      id: "d-text",
      nodeType: "text",
      text: "You are an expert research analyst. Synthesize the provided information into a comprehensive, well-structured report.",
    },
  },
  {
    id: "d-api",
    type: "api",
    position: { x: 420, y: 440 },
    data: { id: "d-api", nodeType: "api", method: "GET", url: "https://api.research.io/search" },
  },
  {
    id: "d-filter",
    type: "filter",
    position: { x: 420, y: 640 },
    data: { id: "d-filter", nodeType: "filter", condition: "value.relevance_score > 0.7" },
  },
  {
    id: "d-llm",
    type: "llm",
    position: { x: 420, y: 100 },
    data: { id: "d-llm", nodeType: "llm" },
  },
  {
    id: "d-merge",
    type: "merge",
    position: { x: 760, y: 300 },
    data: { id: "d-merge", nodeType: "merge" },
  },
  {
    id: "d-output",
    type: "customOutput",
    position: { x: 1060, y: 300 },
    data: { id: "d-output", nodeType: "customOutput", outputName: "research_report", outputType: "Text" },
  },
];

const demoEdges: PipelineEdge[] = [
  {
    id: "de-1",
    source: "d-input1", sourceHandle: "d-input1-value",
    target: "d-llm",   targetHandle: "d-llm-prompt",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-2",
    source: "d-text",  sourceHandle: "d-text-value",
    target: "d-llm",   targetHandle: "d-llm-system",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-3",
    source: "d-input2", sourceHandle: "d-input2-value",
    target: "d-api",    targetHandle: "d-api-body",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-4",
    source: "d-api",    sourceHandle: "d-api-response",
    target: "d-filter", targetHandle: "d-filter-input",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-5",
    source: "d-llm",   sourceHandle: "d-llm-response",
    target: "d-merge", targetHandle: "d-merge-input-a",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-6",
    source: "d-filter", sourceHandle: "d-filter-pass",
    target: "d-merge",  targetHandle: "d-merge-input-b",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-7",
    source: "d-merge",  sourceHandle: "d-merge-merged",
    target: "d-output", targetHandle: "d-output-value",
    type: "smoothstep", animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
];

const LS_KEY = "vs_saved_workflows";

export interface SavedWorkflow {
  id: string;
  name: string;
  savedAt: string;
  nodeCount: number;
  edgeCount: number;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

function readSavedWorkflows(): SavedWorkflow[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSavedWorkflows(list: SavedWorkflow[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

interface NodeIDs {
  [type: string]: number;
}

interface PipelineStore {
  theme: "dark" | "light";
  toggleTheme: () => void;

  nodes: PipelineNode[];
  edges: PipelineEdge[];
  nodeIDs: NodeIDs;

  pastNodes: PipelineNode[][];
  pastEdges: PipelineEdge[][];
  futureNodes: PipelineNode[][];
  futureEdges: PipelineEdge[][];
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;

  getNodeID: (type: string) => string;
  addNode: (node: PipelineNode) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeField: (nodeId: string, fieldName: string, fieldValue: unknown) => void;
  deleteNode: (nodeId: string) => void;
  addNodeHandle: (nodeId: string, handle: HandleConfig) => void;
  removeNodeHandle: (nodeId: string, handleId: string) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  clearCanvas: () => void;
  loadDemo: () => void;

  saveWorkflow: (name: string) => void;
  getSavedWorkflows: () => SavedWorkflow[];
  loadSavedWorkflow: (id: string) => void;
  deleteSavedWorkflow: (id: string) => void;

  exportToJSON: () => string;
  importFromJSON: (json: string) => { ok: boolean; error?: string };

  applyAutoLayout: () => void;
}

function makeEdge(
  overrides: Partial<PipelineEdge> & { id: string; source: string; target: string },
): PipelineEdge {
  return {
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
    ...overrides,
  };
}

export const useStore = create<PipelineStore>((set, get) => ({
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    document.body.setAttribute("data-theme", next);
  },

  nodes: demoNodes,
  edges: demoEdges,
  nodeIDs: { customInput: 1, text: 1, llm: 1, customOutput: 1 },

  pastNodes: [],
  pastEdges: [],
  futureNodes: [],
  futureEdges: [],

  takeSnapshot: () => {
    const { nodes, edges, pastNodes, pastEdges } = get();
    set({
      pastNodes: [...pastNodes.slice(-49), [...nodes]],
      pastEdges: [...pastEdges.slice(-49), [...edges]],
      futureNodes: [],
      futureEdges: [],
    });
  },

  undo: () => {
    const { nodes, edges, pastNodes, pastEdges, futureNodes, futureEdges } = get();
    if (pastNodes.length === 0) return;
    set({
      nodes: pastNodes[pastNodes.length - 1],
      edges: pastEdges[pastEdges.length - 1],
      pastNodes: pastNodes.slice(0, -1),
      pastEdges: pastEdges.slice(0, -1),
      futureNodes: [[...nodes], ...futureNodes.slice(0, 49)],
      futureEdges: [[...edges], ...futureEdges.slice(0, 49)],
    });
  },

  redo: () => {
    const { nodes, edges, pastNodes, pastEdges, futureNodes, futureEdges } = get();
    if (futureNodes.length === 0) return;
    set({
      nodes: futureNodes[0],
      edges: futureEdges[0],
      pastNodes: [...pastNodes.slice(-49), [...nodes]],
      pastEdges: [...pastEdges.slice(-49), [...edges]],
      futureNodes: futureNodes.slice(1),
      futureEdges: futureEdges.slice(1),
    });
  },

  getNodeID: (type: string): string => {
    const ids = { ...get().nodeIDs };
    if (ids[type] === undefined) ids[type] = 0;
    ids[type] += 1;
    set({ nodeIDs: ids });
    return `${type}-${ids[type]}`;
  },

  addNode: (node: PipelineNode): void => {
    get().takeSnapshot();
    set({ nodes: [...get().nodes, node] });
  },

  onNodesChange: (changes: NodeChange[]): void => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes: EdgeChange[]): void => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection): void => {
    get().takeSnapshot();
    set({
      edges: addEdge(
        makeEdge({
          ...connection,
          id: `e-${Date.now()}`,
          source: connection.source ?? "",
          target: connection.target ?? "",
        }),
        get().edges,
      ),
    });
  },

  updateNodeField: (nodeId, fieldName, fieldValue): void => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, [fieldName]: fieldValue } } : n,
      ),
    });
  },

  deleteNode: (nodeId: string) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  addNodeHandle: (nodeId: string, handle: HandleConfig) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                customHandles: [
                  ...((n.data.customHandles as HandleConfig[] | undefined) ?? []),
                  handle,
                ],
              },
            }
          : n,
      ),
    });
  },

  removeNodeHandle: (nodeId: string, handleId: string) => {
    get().takeSnapshot();
    const fullHandleId = `${nodeId}-${handleId}`;
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                customHandles: ((n.data.customHandles as HandleConfig[] | undefined) ?? []).filter(
                  (h) => h.id !== handleId,
                ),
              },
            }
          : n,
      ),
      edges: get().edges.filter(
        (e) => e.sourceHandle !== fullHandleId && e.targetHandle !== fullHandleId,
      ),
    });
  },

  deleteEdge: (edgeId: string) => {
    get().takeSnapshot();
    set({ edges: get().edges.filter((e) => e.id !== edgeId) });
  },

  updateEdgeLabel: (edgeId: string, label: string) => {
    get().takeSnapshot();
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, label: label || undefined } : e,
      ),
    });
  },

  clearCanvas: () => {
    get().takeSnapshot();
    set({ nodes: [], edges: [] });
  },

  loadDemo: () => {
    get().takeSnapshot();
    set({ nodes: demoNodes, edges: demoEdges });
  },

  saveWorkflow: (name: string) => {
    const { nodes, edges } = get();
    const list = readSavedWorkflows();
    list.unshift({
      id: `wf-${Date.now()}`,
      name: name.trim() || "Untitled",
      savedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    writeSavedWorkflows(list.slice(0, 50));
  },

  getSavedWorkflows: () => readSavedWorkflows(),

  loadSavedWorkflow: (id: string) => {
    const wf = readSavedWorkflows().find((w) => w.id === id);
    if (!wf) return;
    get().takeSnapshot();
    set({ nodes: wf.nodes, edges: wf.edges });
  },

  deleteSavedWorkflow: (id: string) => {
    writeSavedWorkflows(readSavedWorkflows().filter((w) => w.id !== id));
  },

  exportToJSON: (): string => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  importFromJSON: (json: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        return { ok: false, error: "Expected { nodes, edges }" };
      }
      get().takeSnapshot();
      set({ nodes: parsed.nodes, edges: parsed.edges });
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "Parse error" };
    }
  },

  applyAutoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    const COL_W = 310, ROW_H = 200, PAD_X = 60, PAD_Y = 80;

    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach((n) => { adj[n.id] = []; inDeg[n.id] = 0; });
    edges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target);
      inDeg[e.target] = (inDeg[e.target] || 0) + 1;
    });

    const layer: Record<string, number> = {};
    const queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
    queue.forEach((id) => { layer[id] = 0; });

    while (queue.length > 0) {
      const id = queue.shift()!;
      (adj[id] || []).forEach((tid) => {
        const next = (layer[id] || 0) + 1;
        if (layer[tid] === undefined || layer[tid] < next) layer[tid] = next;
        if (--inDeg[tid] <= 0) queue.push(tid);
      });
    }

    nodes.forEach((n) => { if (layer[n.id] === undefined) layer[n.id] = 0; });

    const maxLayer = Math.max(0, ...nodes.map((n) => layer[n.id]));
    const groups: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
    nodes.forEach((n) => groups[layer[n.id]].push(n.id));

    const totalH = Math.max(...groups.map((g) => g.length)) * ROW_H;

    const updated = nodes.map((n) => {
      const l = layer[n.id];
      const group = groups[l];
      const idx = group.indexOf(n.id);
      const startY = PAD_Y + (totalH - group.length * ROW_H) / 2;
      return { ...n, position: { x: PAD_X + l * COL_W, y: startY + idx * ROW_H } };
    });

    get().takeSnapshot();
    set({ nodes: updated });
  },
}));

export { makeEdge };
