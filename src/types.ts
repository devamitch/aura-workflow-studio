import type { Node, Edge } from "reactflow";

// ── Node Category & Group ─────────────────────────────────────────────────────
export type NodeCategory =
  | "trigger"
  | "ai"
  | "logic"
  | "auth"
  | "db"
  | "endpoint"
  | "transform"
  | "messaging"
  | "observability";

export type NodeGroup =
  | "Triggers"
  | "AI & Core"
  | "Logic & Flow"
  | "Data & Transform"
  | "Integrations"
  | "Auth & Identity"
  | "Bots & Messaging"
  | "RAG & Memory"
  | "Observability";

// ── Node Definition System ────────────────────────────────────────────────────
export interface CredentialField {
  key: string;
  label: string;
  placeholder?: string;
  required: boolean;
  secret: boolean;
  type?: "text" | "password" | "url" | "select";
  options?: string[];
  validator?: (v: string) => boolean;
  validationMessage?: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "json" | "url";
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export interface FormSchema {
  sections?: Array<{ title?: string; fields: FieldDef[] }>;
  fields?: FieldDef[];
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  icon?: string;
  uiTheme: string;
  description?: string;
  requiredCredentials?: CredentialField[];
  requiredFields?: FieldDef[];
  producesOutput: boolean;
  consumesInput: boolean;
  sidebarSchema: FormSchema;
  group: NodeGroup;
}

// ── Canvas Types ──────────────────────────────────────────────────────────────
export interface HandleConfig {
  type: "source" | "target";
  position: "left" | "right" | "top" | "bottom";
  id: string;
  label?: string;
  isCustom?: boolean;
}

export interface NodeData {
  id: string;
  nodeType: string;
  label?: string;
  customHandles?: HandleConfig[];
  credentials?: Record<string, string>; // encrypted values via Web Crypto
  config?: Record<string, unknown>;
  error?: string | null;
  validationErrors?: string[];
  executionState?: "pending" | "running" | "success" | "failed" | "skipped";
  executionLog?: string[];
  executionDuration?: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
  [key: string]: unknown;
}

export type PipelineNode = Node<NodeData>;
export type PipelineEdge = Edge<{
  edgeColor?: string;
  dashed?: boolean;
  label?: string;
  animated?: boolean;
}>;

// ── Execution Types ───────────────────────────────────────────────────────────
export interface ExecutionStep {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  inputs: string[];
  outputs: string[];
  requiredCredentials: string[];
  dependencyDepth: number;
  canParallelize: boolean;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  totalEstimatedTokens: number;
  estimatedCostUSD: number;
  estimatedDurationMs: number;
  providers: string[];
  warnings: string[];
}

export interface ExecutionResult {
  stepId: string;
  nodeId: string;
  status: "success" | "failed" | "skipped";
  output?: unknown;
  error?: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
  durationMs: number;
  logs: string[];
  timestamp: number;
}

export interface ExecutionRun {
  id: string;
  startedAt: number;
  completedAt?: number;
  status: "running" | "success" | "failed" | "cancelled";
  plan: ExecutionPlan;
  results: ExecutionResult[];
  totalTokens: number;
  totalCostUSD: number;
}

// ── Version / Snapshot ────────────────────────────────────────────────────────
export interface WorkflowVersion {
  id: string;
  label: string;
  timestamp: number;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  description?: string;
}

// ── Export Types ──────────────────────────────────────────────────────────────
export type ExportProjectType =
  | "telegram-bot"
  | "whatsapp-bot"
  | "discord-bot"
  | "react-spa"
  | "node-api"
  | "fullstack-docker"
  | "wordpress-plugin";

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_admin?: boolean;
  is_premium?: boolean;
  has_api_key?: boolean;
}

export type PlanTier = "free" | "pro" | "annual";

export interface UserPlan {
  tier: PlanTier;
  creditsUsed: number;
  creditsTotal: number;
  creditsExtra: number;
  renewsAt?: string;
}

// ── Legacy ────────────────────────────────────────────────────────────────────
export interface ParseResponse {
  num_nodes: number;
  num_edges: number;
  is_dag: boolean;
}
