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
import { createJSONStorage, persist } from "zustand/middleware";

import {
  clearToken,
  clearCachedProfile,
  decodeJwtPayload,
  isGoogleConfigured,
  loadCachedProfile,
  loadToken,
  saveCachedProfile,
  saveToken,
  type GooglePayload,
} from "./lib/google-auth";
import {
  autoLayoutDagre,
  validateGraphCredentials,
} from "./services/graphCompiler";
import { getApiBaseUrl } from "./lib/runtime-config";
import type {
  ExecutionRun,
  ExportProjectType,
  HandleConfig,
  PipelineEdge,
  PipelineNode,
  PlanTier,
  UserPlan,
  WorkflowVersion,
} from "./types";

// ── Auth User (local interface matching types.ts) ─────────────────────────────
export interface AuthUser {
  id: string | number;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
  is_premium?: boolean;
  has_api_key?: boolean;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────
const demoNodes: PipelineNode[] = [
  {
    id: "d-input1",
    type: "customInput",
    position: { x: 60, y: 80 },
    data: {
      id: "d-input1",
      nodeType: "customInput",
      label: "User Query",
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
      label: "Research Topic",
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
      label: "System Prompt",
      text: "You are an expert research analyst. Synthesize information into a comprehensive report.",
    },
  },
  {
    id: "d-api",
    type: "api",
    position: { x: 420, y: 440 },
    data: {
      id: "d-api",
      nodeType: "api",
      label: "Fetch Research",
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
      label: "Filter Results",
      condition: "value.relevance_score > 0.7",
    },
  },
  {
    id: "d-llm",
    type: "llm",
    position: { x: 420, y: 100 },
    data: { id: "d-llm", nodeType: "llm", label: "Analyze with LLM" },
  },
  {
    id: "d-merge",
    type: "merge",
    position: { x: 760, y: 300 },
    data: { id: "d-merge", nodeType: "merge", label: "Merge Outputs" },
  },
  {
    id: "d-output",
    type: "customOutput",
    position: { x: 1060, y: 300 },
    data: {
      id: "d-output",
      nodeType: "customOutput",
      label: "Research Report",
      outputName: "research_report",
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
    data: { edgeColor: "#6366f1" },
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
    data: { edgeColor: "#6366f1" },
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
    data: { edgeColor: "#f59e0b" },
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
    data: { edgeColor: "#f59e0b" },
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
    data: { edgeColor: "#10b981" },
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
    data: { edgeColor: "#3b82f6" },
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
    data: { edgeColor: "#6366f1" },
  },
];

// ── Persistence helpers ────────────────────────────────────────────────────────
const LS_KEY = "vs_saved_workflows";
const PLAN_LS_KEY = "aura_user_plan";
const VERSIONS_KEY = "aura_workflow_versions";
const STORE_KEY = "aura_store";

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
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeSavedWorkflows(list: SavedWorkflow[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

function readVersions(): WorkflowVersion[] {
  try {
    return JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeVersions(v: WorkflowVersion[]) {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(v));
  } catch {}
}

// ── Plan ──────────────────────────────────────────────────────────────────────
export const PLAN_LIMITS: Record<
  PlanTier,
  { aiGenerations: number; modelAccess: string[] }
> = {
  free: { aiGenerations: 20, modelAccess: ["gemini-1.5-flash"] },
  pro: {
    aiGenerations: Infinity,
    modelAccess: [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gpt-4o",
      "gpt-4o-mini",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
    ],
  },
  annual: {
    aiGenerations: Infinity,
    modelAccess: [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gpt-4o",
      "gpt-4o-mini",
      "claude-sonnet-4-6",
      "claude-opus-4-6",
      "claude-haiku-4-5-20251001",
    ],
  },
};

function loadPlan(): UserPlan {
  try {
    const raw = localStorage.getItem(PLAN_LS_KEY);
    if (raw) return JSON.parse(raw) as UserPlan;
  } catch {}
  return { tier: "free", creditsUsed: 0, creditsTotal: 20, creditsExtra: 0 };
}
function savePlan(plan: UserPlan) {
  try {
    localStorage.setItem(PLAN_LS_KEY, JSON.stringify(plan));
  } catch {}
}

// ── Store interface ────────────────────────────────────────────────────────────
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
  setAuthLoading: (loading: boolean) => void;
  applyServerUser: (data: Record<string, unknown>) => void;
  markAuthFallback: () => void;
  signOut: () => Promise<void>;

  // Plan & Credits
  plan: UserPlan;
  setPlan: (tier: PlanTier, extraCredits?: number) => void;
  consumeCredit: () => boolean;
  addExtraCredits: (amount: number) => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Canvas
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  nodeIDs: Record<string, number>;

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
  onEdgeUpdate: (oldEdge: PipelineEdge, newConnection: Connection) => void;
  updateNodeField: (
    nodeId: string,
    fieldName: string,
    fieldValue: unknown,
  ) => void;
  updateNodeCredential: (
    nodeId: string,
    credKey: string,
    encryptedValue: string,
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
  applyAutoLayout: () => void;

  // Workflow persistence
  saveWorkflow: (name: string) => void;
  getSavedWorkflows: () => SavedWorkflow[];
  loadSavedWorkflow: (id: string) => void;
  deleteSavedWorkflow: (id: string) => void;
  exportToJSON: () => string;
  importFromJSON: (json: string) => { ok: boolean; error?: string };

  // Versions
  versions: WorkflowVersion[];
  createVersion: (label?: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;

  // Validation
  validationErrors: Record<string, string[]>;
  runValidation: () => void;

  // Execution state
  currentRun: ExecutionRun | null;
  executionHistory: ExecutionRun[];
  setCurrentRun: (run: ExecutionRun | null) => void;
  updateRunResult: (
    nodeId: string,
    state: "running" | "success" | "failed" | "skipped",
  ) => void;
  addExecutionRun: (run: ExecutionRun) => void;
  clearExecution: () => void;

  // UI State
  selectedNodeId: string | null;
  rightPanelMode: "chat" | "node-config";
  showIntentOrchestrator: boolean;
  showExecutionPanel: boolean;
  showExportModal: boolean;
  showVersionHistory: boolean;
  showPricingModal: boolean;
  pricingTab: "plans" | "credits";
  setSelectedNode: (nodeId: string | null) => void;
  setRightPanelMode: (mode: "chat" | "node-config") => void;
  setShowIntentOrchestrator: (v: boolean) => void;
  setShowExecutionPanel: (v: boolean) => void;
  setShowExportModal: (v: boolean) => void;
  setShowVersionHistory: (v: boolean) => void;
  setShowPricingModal: (v: boolean, tab?: "plans" | "credits") => void;
}

type PersistedStoreState = Pick<
  CombinedStore,
  "theme" | "nodes" | "edges" | "nodeIDs" | "selectedNodeId" | "rightPanelMode"
>;

// ── Edge factory ──────────────────────────────────────────────────────────────
export function makeEdge(
  overrides: Partial<PipelineEdge> & {
    id: string;
    source: string;
    target: string;
  },
): PipelineEdge {
  return {
    type: "smoothstep",
    animated: false,
    markerEnd: { type: MarkerType.Arrow, height: 20, width: 20 },
    data: { edgeColor: "#6366f1" },
    ...overrides,
  };
}

const applyTheme = (theme: "dark" | "light") => {
  if (typeof document !== "undefined") {
    document.body?.setAttribute("data-theme", theme);
  }
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useStore = create<CombinedStore>()(
  persist(
    (set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  loading: isGoogleConfigured,

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
      saveCachedProfile({
        sub: payload.sub,
        email: payload.email,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      });
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
        loading: true,
      });
    } catch {
      const cached = loadCachedProfile();
      if (!cached?.email) {
        clearToken();
        set({ loading: false, user: null, token: null });
        return;
      }
      set({
        user: {
          id: 0,
          email: cached.email,
          name: cached.name ?? null,
          avatar_url: cached.picture ?? null,
          is_admin: false,
          is_premium: false,
          has_api_key: false,
        },
        token: stored,
        loading: true,
      });
    }
  },

  signInWithGoogle: async (credential, userInfo) => {
    saveToken(credential);
    let email = "",
      name: string | null = null,
      picture: string | null = null;
    if (userInfo) {
      email = userInfo.email;
      name = userInfo.name ?? null;
      picture = userInfo.picture ?? null;
    } else {
      try {
        const p = decodeJwtPayload<GooglePayload>(credential);
        email = p.email;
        name = p.name ?? null;
        picture = p.picture ?? null;
      } catch {}
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
      loading: true,
    });
    if (email) {
      saveCachedProfile({
        sub: userInfo?.sub,
        email,
        name,
        picture,
      });
    }
  },

  setAuthLoading: (loading) => set({ loading }),

  applyServerUser: (data) => {
    set({
      user: {
        id: (data.id as number) ?? 0,
        email: (data.email as string) ?? "",
        name: (data.name as string | null) ?? null,
        avatar_url: (data.avatar_url as string | null) ?? null,
        is_admin: (data.is_admin as boolean) ?? false,
        is_premium: (data.is_premium as boolean) ?? false,
        has_api_key: (data.has_api_key as boolean) ?? false,
      },
    });
  },

  markAuthFallback: () => {
    const { user } = get();
    if (user) set({ user: { ...user, has_api_key: true } });
  },

  signOut: async () => {
    clearToken();
    clearCachedProfile();
    googleLogout();
    set({ user: null, token: null, loading: false });
  },

  // ── Plan & Credits ────────────────────────────────────────────────────────
  plan: loadPlan(),

  setPlan: (tier, extraCredits = 0) => {
    const plan: UserPlan = {
      tier,
      creditsUsed: 0,
      creditsTotal: tier === "free" ? 20 : Infinity,
      creditsExtra: extraCredits,
      renewsAt:
        tier !== "free"
          ? new Date(Date.now() + 30 * 24 * 3600_000).toISOString()
          : undefined,
    };
    savePlan(plan);
    set({ plan });
  },

  consumeCredit: () => {
    const { plan } = get();
    if (plan.tier !== "free") return true;
    const available = plan.creditsTotal + plan.creditsExtra - plan.creditsUsed;
    if (available <= 0) return false;
    const updated = { ...plan, creditsUsed: plan.creditsUsed + 1 };
    savePlan(updated);
    set({ plan: updated });
    return true;
  },

  addExtraCredits: (amount) => {
    const { plan } = get();
    const updated = { ...plan, creditsExtra: plan.creditsExtra + amount };
    savePlan(updated);
    set({ plan: updated });
  },

  // ── Theme ─────────────────────────────────────────────────────────────────
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    applyTheme(next);
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
    if (!pastNodes.length) return;
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
    if (!futureNodes.length) return;
    set({
      nodes: futureNodes[0],
      edges: futureEdges[0],
      pastNodes: [...pastNodes.slice(-49), [...nodes]],
      pastEdges: [...pastEdges.slice(-49), [...edges]],
      futureNodes: futureNodes.slice(1),
      futureEdges: futureEdges.slice(1),
    });
  },

  getNodeID: (type) => {
    const ids = { ...get().nodeIDs };
    ids[type] = (ids[type] ?? 0) + 1;
    set({ nodeIDs: ids });
    return `${type}-${ids[type]}`;
  },

  addNode: (node) => {
    get().takeSnapshot();
    set({ nodes: [...get().nodes, node] });
    // Auto-validate credentials after node is placed
    setTimeout(() => get().runValidation(), 0);
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as PipelineNode[] });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) as PipelineEdge[] });
  },

  onConnect: (connection) => {
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
      ) as PipelineEdge[],
    });
  },

  // Edge reconnection — drag an edge endpoint to a different node
  onEdgeUpdate: (oldEdge, newConnection) => {
    get().takeSnapshot();
    // Manually replace the old edge with a reconnected version (equivalent to deprecated updateEdge)
    const filtered = get().edges.filter((e) => e.id !== oldEdge.id);
    const reconnected = makeEdge({
      ...oldEdge,
      ...newConnection,
      id: oldEdge.id,
      source: newConnection.source ?? oldEdge.source,
      target: newConnection.target ?? oldEdge.target,
      sourceHandle: newConnection.sourceHandle ?? oldEdge.sourceHandle,
      targetHandle: newConnection.targetHandle ?? oldEdge.targetHandle,
    });
    set({ edges: [...filtered, reconnected] });
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

  updateNodeCredential: (nodeId, credKey, encryptedValue) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                credentials: {
                  ...(n.data.credentials ?? {}),
                  [credKey]: encryptedValue,
                },
              },
            }
          : n,
      ),
    });
  },

  deleteNode: (nodeId) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
    });
  },

  addNodeHandle: (nodeId, handle) => {
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

  removeNodeHandle: (nodeId, handleId) => {
    get().takeSnapshot();
    const fullId = `${nodeId}-${handleId}`;
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
        (e) => e.sourceHandle !== fullId && e.targetHandle !== fullId,
      ),
    });
  },

  deleteEdge: (edgeId) => {
    get().takeSnapshot();
    set({ edges: get().edges.filter((e) => e.id !== edgeId) });
  },

  updateEdgeLabel: (edgeId, label) => {
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
                ...(e.data ?? {}),
                edgeColor: style.color ?? e.data?.edgeColor,
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
    set({ nodes: [], edges: [], selectedNodeId: null });
  },
  loadDemo: () => {
    get().takeSnapshot();
    set({ nodes: demoNodes, edges: demoEdges });
  },

  applyGeneratedGraph: (nodes, edges) => {
    get().takeSnapshot();
    set({ nodes, edges });
    setTimeout(() => get().runValidation(), 100);
  },

  applyAutoLayout: () => {
    const { nodes, edges } = get();
    if (!nodes.length) return;
    get().takeSnapshot();
    set({ nodes: autoLayoutDagre(nodes, edges, { rankdir: "LR" }) });
  },

  // ── Workflow Persistence ──────────────────────────────────────────────────
  saveWorkflow: (name) => {
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
    void fetch(`${getApiBaseUrl()}/pipelines`, {
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

  loadSavedWorkflow: (id) => {
    const wf = readSavedWorkflows().find((w) => w.id === id);
    if (!wf) return;
    get().takeSnapshot();
    set({ nodes: wf.nodes, edges: wf.edges });
  },

  deleteSavedWorkflow: (id) => {
    writeSavedWorkflows(readSavedWorkflows().filter((w) => w.id !== id));
  },

  exportToJSON: () =>
    JSON.stringify({ nodes: get().nodes, edges: get().edges }, null, 2),

  importFromJSON: (json) => {
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

  // ── Versions ─────────────────────────────────────────────────────────────
  versions: readVersions(),

  createVersion: (label) => {
    const { nodes, edges } = get();
    const version: WorkflowVersion = {
      id: `v-${Date.now()}`,
      label: label ?? `Snapshot ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    const versions = [version, ...readVersions()].slice(0, 30);
    writeVersions(versions);
    set({ versions });
  },

  restoreVersion: (id) => {
    const version = get().versions.find((v) => v.id === id);
    if (!version) return;
    get().takeSnapshot();
    set({ nodes: version.nodes, edges: version.edges });
  },

  deleteVersion: (id) => {
    const versions = get().versions.filter((v) => v.id !== id);
    writeVersions(versions);
    set({ versions });
  },

  // ── Validation ────────────────────────────────────────────────────────────
  validationErrors: {},

  runValidation: () => {
    const { nodes } = get();
    const { errors } = validateGraphCredentials(nodes);
    set({ validationErrors: errors });
    set({
      nodes: nodes.map((n) => ({
        ...n,
        data: { ...n.data, validationErrors: errors[n.id] ?? [] },
      })),
    });
  },

  // ── Execution ─────────────────────────────────────────────────────────────
  currentRun: null,
  executionHistory: [],

  setCurrentRun: (run) => set({ currentRun: run }),

  updateRunResult: (nodeId, state) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, executionState: state } }
          : n,
      ),
    });
  },

  addExecutionRun: (run) => {
    set({ executionHistory: [run, ...get().executionHistory].slice(0, 50) });
  },

  clearExecution: () => {
    set({
      currentRun: null,
      nodes: get().nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          executionState: undefined,
          executionLog: undefined,
          executionDuration: undefined,
          tokenUsage: undefined,
        },
      })),
    });
  },

  // ── UI State ──────────────────────────────────────────────────────────────
  selectedNodeId: null,
  rightPanelMode: "chat",
  showIntentOrchestrator: false,
  showExecutionPanel: false,
  showExportModal: false,
  showVersionHistory: false,
  showPricingModal: false,
  pricingTab: "plans",

  setSelectedNode: (nodeId) => {
    set({
      selectedNodeId: nodeId,
      rightPanelMode: nodeId ? "node-config" : "chat",
    });
  },

  setRightPanelMode: (mode) => set({ rightPanelMode: mode }),
  setShowIntentOrchestrator: (v) => set({ showIntentOrchestrator: v }),
  setShowExecutionPanel: (v) => set({ showExecutionPanel: v }),
  setShowExportModal: (v) => set({ showExportModal: v }),
  setShowVersionHistory: (v) => set({ showVersionHistory: v }),
  setShowPricingModal: (v, tab) =>
    set({ showPricingModal: v, ...(tab ? { pricingTab: tab } : {}) }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedStoreState => ({
        theme: state.theme,
        nodes: state.nodes,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
        selectedNodeId: state.selectedNodeId,
        rightPanelMode: state.rightPanelMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
        state.runValidation();
      },
    },
  ),
);

export type { ExportProjectType, PlanTier, UserPlan };
