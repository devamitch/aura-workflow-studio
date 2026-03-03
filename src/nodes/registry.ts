import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  Clock,
  Code2,
  Database,
  FileText,
  Filter,
  Flame,
  GitBranch,
  GitMerge,
  Globe,
  Key,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Pause,
  RefreshCw,
  Repeat,
  Send,
  Settings2,
  Shuffle,
  StickyNote,
  Timer,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { NodeTypes } from "reactflow";
import { ApiNode } from "./apiNode";
import { CodeNode } from "./codeNode";
import { DocumentNode } from "./documentNode";
import { EmailNode } from "./emailNode";
import { FilterNode } from "./filterNode";
import { HttpNode } from "./httpNode";
import { IfNode } from "./ifNode";
import { InputNode } from "./inputNode";
import { LLMNode } from "./llmNode";
import { LoopNode } from "./loopNode";
import { MergeNode } from "./mergeNode";
import { NoteNode } from "./noteNode";
import { OutputNode } from "./outputNode";
import { RetrieverNode } from "./retrieverNode";
import { SetNode } from "./setNode";
import { SlackNode } from "./slackNode";
import { SwitchNode } from "./switchNode";
import { TextNode } from "./textNode";
import { TimerNode } from "./timerNode";
import { WebhookNode } from "./webhookNode";
import { GenericNode } from "./GenericNode";

// Re-export NodeGroup from types for convenience
export type { NodeGroup } from "../types";

export interface NodeMeta {
  type: string;
  label: string;
  icon: LucideIcon;
  group: string;
  description?: string;
}

export const NODE_META: NodeMeta[] = [
  // ── Triggers ────────────────────────────────────────────────────────────────
  { type: "webhook",         label: "Webhook",          icon: Webhook,        group: "Triggers",          description: "HTTP trigger endpoint" },
  { type: "timer",           label: "Schedule",         icon: Clock,          group: "Triggers",          description: "Cron / interval trigger" },
  { type: "customInput",     label: "Manual Input",     icon: LogIn,          group: "Triggers",          description: "User-provided input" },
  { type: "telegramTrigger", label: "Telegram Trigger", icon: MessageCircle,  group: "Triggers",          description: "Trigger on Telegram message" },
  { type: "whatsappTrigger", label: "WhatsApp Trigger", icon: MessageSquare,  group: "Triggers",          description: "Trigger via Twilio WhatsApp" },
  { type: "discordTrigger",  label: "Discord Trigger",  icon: MessageCircle,  group: "Triggers",          description: "Trigger on Discord event" },
  { type: "oauthCallback",   label: "OAuth Callback",   icon: Key,            group: "Triggers",          description: "Handle OAuth redirect" },

  // ── AI & Core ────────────────────────────────────────────────────────────────
  { type: "llm",             label: "LLM",              icon: Brain,          group: "AI & Core",         description: "AI language model call" },
  { type: "aiAgent",         label: "AI Agent",         icon: Bot,            group: "AI & Core",         description: "Tool-enabled AI agent" },
  { type: "promptTemplate",  label: "Prompt Template",  icon: FileText,       group: "AI & Core",         description: "Dynamic prompt construction" },
  { type: "customOutput",    label: "Output",           icon: LogOut,         group: "AI & Core",         description: "Pipeline result output" },

  // ── Logic & Flow ─────────────────────────────────────────────────────────────
  { type: "if",              label: "IF Condition",     icon: GitBranch,      group: "Logic & Flow",      description: "Branch on condition" },
  { type: "switch",          label: "Switch / Route",   icon: Shuffle,        group: "Logic & Flow",      description: "Multi-way routing" },
  { type: "loop",            label: "Loop",             icon: Repeat,         group: "Logic & Flow",      description: "Iterate over a list" },
  { type: "parallel",        label: "Parallel",         icon: Zap,            group: "Logic & Flow",      description: "Execute branches in parallel" },
  { type: "merge",           label: "Merge",            icon: GitMerge,       group: "Logic & Flow",      description: "Combine multiple inputs" },
  { type: "filter",          label: "Filter",           icon: Filter,         group: "Logic & Flow",      description: "Filter array items" },
  { type: "retry",           label: "Retry",            icon: RefreshCw,      group: "Logic & Flow",      description: "Retry on failure with backoff" },
  { type: "delay",           label: "Delay",            icon: Pause,          group: "Logic & Flow",      description: "Wait for specified time" },
  { type: "rateLimit",       label: "Rate Limit",       icon: Timer,          group: "Logic & Flow",      description: "Rate limit throughput" },

  // ── Data & Transform ─────────────────────────────────────────────────────────
  { type: "set",             label: "Set Variable",     icon: Settings2,      group: "Data & Transform",  description: "Assign values" },
  { type: "code",            label: "Code Function",    icon: Code2,          group: "Data & Transform",  description: "Run custom JavaScript" },
  { type: "text",            label: "Text Template",    icon: FileText,       group: "Data & Transform",  description: "Static text / template" },
  { type: "note",            label: "Note",             icon: StickyNote,     group: "Data & Transform",  description: "Documentation note" },

  // ── Integrations ─────────────────────────────────────────────────────────────
  { type: "http",            label: "HTTP Request",     icon: Globe,          group: "Integrations",      description: "Call any REST API" },
  { type: "email",           label: "Send Email",       icon: Mail,           group: "Integrations",      description: "SMTP email action" },
  { type: "stripe",          label: "Stripe",           icon: Key,            group: "Integrations",      description: "Stripe payment integration" },
  { type: "postgresql",      label: "PostgreSQL",       icon: Database,       group: "Integrations",      description: "PostgreSQL database query" },
  { type: "supabase",        label: "Supabase",         icon: Database,       group: "Integrations",      description: "Supabase database action" },
  { type: "firebase",        label: "Firebase",         icon: Flame,          group: "Integrations",      description: "Firebase Firestore / RTDB" },
  { type: "api",             label: "API (Legacy)",     icon: Globe,          group: "Integrations",      description: "Legacy API node" },

  // ── Auth & Identity ──────────────────────────────────────────────────────────
  { type: "googleAuth",      label: "Google Auth",      icon: Key,            group: "Auth & Identity",   description: "Google OAuth 2.0" },
  { type: "githubAuth",      label: "GitHub Auth",      icon: Key,            group: "Auth & Identity",   description: "GitHub OAuth" },
  { type: "facebookAuth",    label: "Facebook Auth",    icon: Key,            group: "Auth & Identity",   description: "Facebook OAuth" },
  { type: "customOAuth2",    label: "Custom OAuth 2.0", icon: Key,            group: "Auth & Identity",   description: "Generic OAuth 2.0" },

  // ── Bots & Messaging ─────────────────────────────────────────────────────────
  { type: "telegramBot",     label: "Telegram Bot",     icon: Send,           group: "Bots & Messaging",  description: "Send Telegram message" },
  { type: "whatsappBot",     label: "WhatsApp Bot",     icon: MessageSquare,  group: "Bots & Messaging",  description: "Send WhatsApp via Twilio" },
  { type: "discordBot",      label: "Discord Bot",      icon: MessageCircle,  group: "Bots & Messaging",  description: "Send Discord message" },
  { type: "slack",           label: "Slack",            icon: MessageSquare,  group: "Bots & Messaging",  description: "Send Slack message" },

  // ── RAG & Memory ─────────────────────────────────────────────────────────────
  { type: "embedding",       label: "Embedding",        icon: Brain,          group: "RAG & Memory",      description: "Generate text embeddings" },
  { type: "vectorStore",     label: "Vector Store",     icon: Database,       group: "RAG & Memory",      description: "Store / query vectors" },
  { type: "document",        label: "RAG Document",     icon: FileText,       group: "RAG & Memory",      description: "Ingest document for RAG" },
  { type: "retriever",       label: "Retriever",        icon: Globe,          group: "RAG & Memory",      description: "Vector similarity search" },
  { type: "ragPipeline",     label: "RAG Pipeline",     icon: Brain,          group: "RAG & Memory",      description: "Complete RAG pipeline" },

  // ── Observability ────────────────────────────────────────────────────────────
  { type: "executionLogger", label: "Logger",           icon: Activity,       group: "Observability",     description: "Log execution data" },
  { type: "metricsSink",     label: "Metrics Sink",     icon: Activity,       group: "Observability",     description: "Collect and emit metrics" },
  { type: "errorBoundary",   label: "Error Boundary",   icon: AlertTriangle,  group: "Observability",     description: "Handle errors gracefully" },
];

// Nodes with dedicated React components (existing)
const dedicatedNodes: NodeTypes = {
  customInput:  InputNode    as unknown as NodeTypes[string],
  customOutput: OutputNode   as unknown as NodeTypes[string],
  llm:          LLMNode      as unknown as NodeTypes[string],
  webhook:      WebhookNode  as unknown as NodeTypes[string],
  if:           IfNode       as unknown as NodeTypes[string],
  switch:       SwitchNode   as unknown as NodeTypes[string],
  loop:         LoopNode     as unknown as NodeTypes[string],
  code:         CodeNode     as unknown as NodeTypes[string],
  http:         HttpNode     as unknown as NodeTypes[string],
  set:          SetNode      as unknown as NodeTypes[string],
  email:        EmailNode    as unknown as NodeTypes[string],
  slack:        SlackNode    as unknown as NodeTypes[string],
  document:     DocumentNode as unknown as NodeTypes[string],
  retriever:    RetrieverNode as unknown as NodeTypes[string],
  text:         TextNode     as unknown as NodeTypes[string],
  note:         NoteNode     as unknown as NodeTypes[string],
  api:          ApiNode      as unknown as NodeTypes[string],
  filter:       FilterNode   as unknown as NodeTypes[string],
  merge:        MergeNode    as unknown as NodeTypes[string],
  timer:        TimerNode    as unknown as NodeTypes[string],
};

// All new node types use GenericNode (driven by definitions.ts)
const genericNodeTypes = NODE_META
  .map((m) => m.type)
  .filter((t) => !Object.prototype.hasOwnProperty.call(dedicatedNodes, t))
  .reduce<NodeTypes>((acc, t) => {
    acc[t] = GenericNode as unknown as NodeTypes[string];
    return acc;
  }, {});

export const nodeTypes: NodeTypes = { ...dedicatedNodes, ...genericNodeTypes };
