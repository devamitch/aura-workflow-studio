import { googleLogout } from "@react-oauth/google";
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
import {
  clearToken,
  decodeJwtPayload,
  isGoogleConfigured,
  loadToken,
  saveToken,
  type GooglePayload,
} from "./lib/google-auth";
import type { HandleConfig, PipelineEdge, PipelineNode } from "./types";

// ─── Auth Types ────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  is_admin: boolean;
  is_premium: boolean;
  has_api_key: boolean;
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────
const demoNodes: PipelineNode[] = [
  {
    id: "d-input1",
    type: "customInput",
    position: { x: 60, y: 80 },
    data: {
      id: "d-input1",
      nodeType: "customInput",
      inputName: "user_query",
      inputType: "Text",
    },
  },
  {
    id: "d-input2",
    type: "customInput",
    position: { x: 60, y: 330 },
    data: {
      id: "d-input2",
      nodeType: "customInput",
      inputName: "topic",
      inputType: "Text",
    },
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
    data: {
      id: "d-api",
      nodeType: "api",
      method: "GET",
      url: "https://api.research.io/search",
    },
  },
  {
    id: "d-filter",
    type: "filter",
    position: { x: 420, y: 640 },
    data: {
      id: "d-filter",
      nodeType: "filter",
      condition: "value.relevance_score > 0.7",
    },
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
    data: {
      id: "d-output",
      nodeType: "customOutput",
      outputName: "research_report",
      outputType: "Text",
    },
  },
];

const demoEdges: PipelineEdge[] = [
  {
    id: "de-1",
    source: "d-input1",
    sourceHandle: "d-input1-value",
    target: "d-llm",
    targetHandle: "d-llm-prompt",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-2",
    source: "d-text",
    sourceHandle: "d-text-value",
    target: "d-llm",
    targetHandle: "d-llm-system",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-3",
    source: "d-input2",
    sourceHandle: "d-input2-value",
    target: "d-api",
    targetHandle: "d-api-body",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-4",
    source: "d-api",
    sourceHandle: "d-api-response",
    target: "d-filter",
    targetHandle: "d-filter-input",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-5",
    source: "d-llm",
    sourceHandle: "d-llm-response",
    target: "d-merge",
    targetHandle: "d-merge-input-a",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-6",
    source: "d-filter",
    sourceHandle: "d-filter-pass",
    target: "d-merge",
    targetHandle: "d-merge-input-b",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
  {
    id: "de-7",
    source: "d-merge",
    sourceHandle: "d-merge-merged",
    target: "d-output",
    targetHandle: "d-output-value",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
  },
];

// ─── Workflow Persistence ──────────────────────────────────────────────────────
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

// ─── Plan & Credits ─────────────────────────────────────────────────────────────
export type PlanTier = "free" | "pro" | "annual";

export interface UserPlan {
  tier: PlanTier;
  creditsUsed: number;
  creditsTotal: number;
  creditsExtra: number; // purchased add-on credits
  renewsAt: string | null;
}

export const PLAN_LIMITS: Record<
  PlanTier,
  { aiGenerations: number; modelAccess: string[] }
> = {
  free: { aiGenerations: 20, modelAccess: ["gemini-1.5-flash"] },
  pro: {
    aiGenerations: Infinity,
    modelAccess: [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gpt-4o",
      "gpt-4-turbo",
      "claude-3-5-sonnet",
      "claude-3-haiku",
    ],
  },
  annual: {
    aiGenerations: Infinity,
    modelAccess: [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gpt-4o",
      "gpt-4-turbo",
      "claude-3-5-sonnet",
      "claude-3-haiku",
      "claude-3-opus",
    ],
  },
};

const PLAN_LS_KEY = "aura_user_plan";
function loadPlan(): UserPlan {
  try {
    const raw = localStorage.getItem(PLAN_LS_KEY);
    if (raw) return JSON.parse(raw) as UserPlan;
  } catch {}
  return {
    tier: "free",
    creditsUsed: 0,
    creditsTotal: 20,
    creditsExtra: 0,
    renewsAt: null,
  };
}
function savePlan(plan: UserPlan) {
  try {
    localStorage.setItem(PLAN_LS_KEY, JSON.stringify(plan));
  } catch {}
}

interface NodeIDs {
  [type: string]: number;
}

// ─── Store Interface ───────────────────────────────────────────────────────────
interface CombinedStore {
  // Auth
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  bootstrapAuth: () => void;
  signInWithGoogle: (
    credential: string,
    userInfo?: { sub: string; email: string; name?: string; picture?: string },
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;

  // Plan & Credits
  plan: UserPlan;
  setPlan: (tier: PlanTier, extraCredits?: number) => void;
  consumeCredit: () => boolean; // returns false if out of credits
  addExtraCredits: (amount: number) => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Canvas
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  nodeIDs: NodeIDs;

  // History
  pastNodes: PipelineNode[][];
  pastEdges: PipelineEdge[][];
  futureNodes: PipelineNode[][];
  futureEdges: PipelineEdge[][];
  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;

  // Canvas actions
  getNodeID: (type: string) => string;
  addNode: (node: PipelineNode) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeField: (
    nodeId: string,
    fieldName: string,
    fieldValue: unknown,
  ) => void;
  deleteNode: (nodeId: string) => void;
  addNodeHandle: (nodeId: string, handle: HandleConfig) => void;
  removeNodeHandle: (nodeId: string, handleId: string) => void;
  deleteEdge: (edgeId: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  updateEdgeStyle: (
    edgeId: string,
    style: { color?: string; variant?: "solid" | "dashed" },
  ) => void;
  clearCanvas: () => void;
  loadDemo: () => void;
  applyGeneratedGraph: (nodes: PipelineNode[], edges: PipelineEdge[]) => void;

  // Workflow persistence
  saveWorkflow: (name: string) => void;
  getSavedWorkflows: () => SavedWorkflow[];
  loadSavedWorkflow: (id: string) => void;
  deleteSavedWorkflow: (id: string) => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => { ok: boolean; error?: string };
  applyAutoLayout: () => void;
}

function makeEdge(
  overrides: Partial<PipelineEdge> & {
    id: string;
    source: string;
    target: string;
  },
): PipelineEdge {
  return {
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
    ...overrides,
  };
}

const API_URL = () =>
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ─── Store Implementation ──────────────────────────────────────────────────────
export const useStore = create<CombinedStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  loading: isGoogleConfigured,

  // ── Plan & Credits ────────────────────────────────────────────────────────
  plan: loadPlan(),

  setPlan: (tier, extraCredits = 0) => {
    const total = tier === "free" ? 20 : Infinity;
    const plan: UserPlan = {
      tier,
      creditsUsed: 0,
      creditsTotal: total,
      creditsExtra: extraCredits,
      renewsAt:
        tier !== "free"
          ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
          : null,
    };
    savePlan(plan);
    set({ plan });
  },

  consumeCredit: () => {
    const { plan } = get();
    if (plan.tier !== "free") return true; // paid plans: unlimited
    const available = plan.creditsTotal + plan.creditsExtra - plan.creditsUsed;
    if (available <= 0) return false;
    const updated = { ...plan, creditsUsed: plan.creditsUsed + 1 };
    savePlan(updated);
    set({ plan: updated });
    return true;
  },

  addExtraCredits: (amount: number) => {
    const { plan } = get();
    const updated = { ...plan, creditsExtra: plan.creditsExtra + amount };
    savePlan(updated);
    set({ plan: updated });
  },

  bootstrapAuth: () => {
    if (!isGoogleConfigured) {
      set({ loading: false });
      return;
    }
    const stored = loadToken();
    if (!stored) {
      set({ loading: false });
      return;
    }
    try {
      const payload = decodeJwtPayload<GooglePayload>(stored);
      set({
        user: {
          id: 0,
          email: payload.email,
          name: payload.name ?? null,
          avatar_url: payload.picture ?? null,
          is_admin: false,
          is_premium: false,
          has_api_key: false,
        },
        token: stored,
        loading: false,
      });
      void get().refreshUser();
    } catch {
      clearToken();
      set({ loading: false });
    }
  },

  signInWithGoogle: async (
    credential: string,
    userInfo?: { sub: string; email: string; name?: string; picture?: string },
  ) => {
    saveToken(credential);
    // If pre-decoded userInfo is supplied (access-token flow), use it directly;
    // otherwise try to decode the credential as a JWT (one-tap/credential flow).
    let email = "";
    let name: string | null = null;
    let picture: string | null = null;
    if (userInfo) {
      email = userInfo.email;
      name = userInfo.name ?? null;
      picture = userInfo.picture ?? null;
    } else {
      try {
        const payload = decodeJwtPayload<GooglePayload>(credential);
        email = payload.email;
        name = payload.name ?? null;
        picture = payload.picture ?? null;
      } catch {
        // credential is not a JWT; user info unavailable without separate fetch
      }
    }
    set({
      user: {
        id: 0,
        email,
        name,
        avatar_url: picture,
        is_admin: false,
        is_premium: false,
        has_api_key: false,
      },
      token: credential,
      loading: false,
    });
    await get().refreshUser();
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const r = await fetch(`${API_URL()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const { user } = get();
        if (user) set({ user: { ...user, has_api_key: true } });
        return;
      }
      const data = (await r.json()) as {
        id?: number;
        email?: string;
        name?: string | null;
        avatar_url?: string | null;
        is_admin?: boolean;
        is_premium?: boolean;
        has_api_key?: boolean;
      };
      set({
        user: {
          id: data.id ?? 0,
          email: data.email ?? "",
          name: data.name ?? null,
          avatar_url: data.avatar_url ?? null,
          is_admin: data.is_admin ?? false,
          is_premium: data.is_premium ?? false,
          has_api_key: data.has_api_key ?? false,
        },
      });
    } catch {
      const { user } = get();
      if (user) set({ user: { ...user, has_api_key: true } });
    }
  },

  signOut: async () => {
    clearToken();
    googleLogout();
    set({ user: null, token: null });
  },

  // ── Theme ─────────────────────────────────────────────────────────────────
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    document.body.setAttribute("data-theme", next);
  },

  // ── Canvas ────────────────────────────────────────────────────────────────
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
    const { nodes, edges, pastNodes, pastEdges, futureNodes, futureEdges } =
      get();
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
    const { nodes, edges, pastNodes, pastEdges, futureNodes, futureEdges } =
      get();
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

  addNode: (node: PipelineNode) => {
    get().takeSnapshot();
    set({ nodes: [...get().nodes, node] });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection) => {
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

  updateNodeField: (nodeId, fieldName, fieldValue) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, [fieldName]: fieldValue } }
          : n,
      ),
    });
  },

  deleteNode: (nodeId: string) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
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
                  ...((n.data.customHandles as HandleConfig[] | undefined) ??
                    []),
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
                customHandles: (
                  (n.data.customHandles as HandleConfig[] | undefined) ?? []
                ).filter((h) => h.id !== handleId),
              },
            }
          : n,
      ),
      edges: get().edges.filter(
        (e) =>
          e.sourceHandle !== fullHandleId && e.targetHandle !== fullHandleId,
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

  updateEdgeStyle: (edgeId, style) => {
    get().takeSnapshot();
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              data: {
                ...(e.data as Record<string, unknown>),
                edgeColor:
                  style.color ?? (e.data as Record<string, unknown>)?.edgeColor,
                edgeVariant:
                  style.variant ??
                  (e.data as Record<string, unknown>)?.edgeVariant,
              },
            }
          : e,
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

  applyGeneratedGraph: (nodes, edges) => {
    get().takeSnapshot();
    set({ nodes, edges });
  },

  // ── Workflow Persistence ──────────────────────────────────────────────────
  saveWorkflow: (name: string) => {
    const { nodes, edges, token } = get();
    const wfName = name.trim() || "Untitled";
    const list = readSavedWorkflows();
    list.unshift({
      id: `wf-${Date.now()}`,
      name: wfName,
      savedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    writeSavedWorkflows(list.slice(0, 50));

    if (!token) return;
    void fetch(`${API_URL()}/pipelines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: wfName,
        description: null,
        graph: { nodes, edges },
      }),
    }).catch(() => {});
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

  exportToJSON: (): string =>
    JSON.stringify({ nodes: get().nodes, edges: get().edges }, null, 2),

  importFromJSON: (json: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges))
        return { ok: false, error: "Expected { nodes, edges }" };
      get().takeSnapshot();
      set({ nodes: parsed.nodes, edges: parsed.edges });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Parse error",
      };
    }
  },

  applyAutoLayout: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    const COL_W = 310,
      ROW_H = 200,
      PAD_X = 60,
      PAD_Y = 80;
    const adj: Record<string, string[]> = {};
    const inDeg: Record<string, number> = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
      inDeg[n.id] = 0;
    });
    edges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target);
      inDeg[e.target] = (inDeg[e.target] || 0) + 1;
    });

    const layer: Record<string, number> = {};
    const queue = nodes.filter((n) => inDeg[n.id] === 0).map((n) => n.id);
    queue.forEach((id) => {
      layer[id] = 0;
    });

    while (queue.length > 0) {
      const id = queue.shift()!;
      (adj[id] || []).forEach((tid) => {
        const next = (layer[id] || 0) + 1;
        if (layer[tid] === undefined || layer[tid] < next) layer[tid] = next;
        if (--inDeg[tid] <= 0) queue.push(tid);
      });
    }

    nodes.forEach((n) => {
      if (layer[n.id] === undefined) layer[n.id] = 0;
    });
    const maxLayer = Math.max(0, ...nodes.map((n) => layer[n.id]));
    const groups: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
    nodes.forEach((n) => groups[layer[n.id]].push(n.id));
    const totalH = Math.max(...groups.map((g) => g.length)) * ROW_H;

    const updated = nodes.map((n) => {
      const l = layer[n.id];
      const group = groups[l];
      const idx = group.indexOf(n.id);
      const startY = PAD_Y + (totalH - group.length * ROW_H) / 2;
      return {
        ...n,
        position: { x: PAD_X + l * COL_W, y: startY + idx * ROW_H },
      };
    });

    get().takeSnapshot();
    set({ nodes: updated });
  },
}));

export { makeEdge };
