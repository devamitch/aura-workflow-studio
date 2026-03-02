import {
  Brain,
  Clock,
  Code2,
  FileText,
  Filter,
  GitBranch,
  GitMerge,
  Globe,
  LogIn,
  LogOut,
  Mail,
  MessageSquare,
  Repeat,
  Settings2,
  Shuffle,
  StickyNote,
  Webhook,
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

// ── Group definition ──────────────────────────────────────────────────────────
export type NodeGroup =
  | "Triggers"
  | "AI & Core"
  | "Logic & Flow"
  | "Data & Transform"
  | "Integrations"
  | "RAG & Memory";

export interface NodeMeta {
  type: string;
  label: string;
  icon: LucideIcon;
  group: NodeGroup;
  description?: string;
}

export const NODE_META: NodeMeta[] = [
  // Triggers
  { type: "webhook",      label: "Webhook",        icon: Webhook,      group: "Triggers",         description: "HTTP trigger endpoint" },
  { type: "timer",        label: "Schedule",        icon: Clock,        group: "Triggers",         description: "Cron / interval trigger" },
  { type: "customInput",  label: "Manual Input",    icon: LogIn,        group: "Triggers",         description: "User-provided input" },

  // AI & Core
  { type: "llm",          label: "LLM",             icon: Brain,        group: "AI & Core",        description: "AI language model call" },
  { type: "customOutput", label: "Output",          icon: LogOut,       group: "AI & Core",        description: "Pipeline result output" },

  // Logic & Flow
  { type: "if",           label: "IF Condition",    icon: GitBranch,    group: "Logic & Flow",     description: "Branch on condition" },
  { type: "switch",       label: "Switch / Route",  icon: Shuffle,      group: "Logic & Flow",     description: "Multi-way routing" },
  { type: "loop",         label: "Loop",            icon: Repeat,       group: "Logic & Flow",     description: "Iterate over a list" },
  { type: "merge",        label: "Merge",           icon: GitMerge,     group: "Logic & Flow",     description: "Combine multiple inputs" },
  { type: "filter",       label: "Filter",          icon: Filter,       group: "Logic & Flow",     description: "Filter array items" },

  // Data & Transform
  { type: "set",          label: "Set Variable",    icon: Settings2,    group: "Data & Transform", description: "Assign a value" },
  { type: "code",         label: "Code Function",   icon: Code2,        group: "Data & Transform", description: "Run custom JavaScript" },
  { type: "text",         label: "Prompt Template", icon: FileText,     group: "Data & Transform", description: "Static text / template" },
  { type: "note",         label: "Note",            icon: StickyNote,   group: "Data & Transform", description: "Documentation note" },

  // Integrations
  { type: "http",         label: "HTTP Request",    icon: Globe,        group: "Integrations",     description: "Call any REST API" },
  { type: "api",          label: "API (Legacy)",    icon: Globe,        group: "Integrations",     description: "Legacy API node" },
  { type: "email",        label: "Send Email",      icon: Mail,         group: "Integrations",     description: "SMTP / email action" },
  { type: "slack",        label: "Slack",           icon: MessageSquare,group: "Integrations",     description: "Slack message" },

  // RAG & Memory
  { type: "document",     label: "RAG Document",    icon: FileText,     group: "RAG & Memory",     description: "Ingest document for RAG" },
  { type: "retriever",    label: "Retriever",       icon: Globe,        group: "RAG & Memory",     description: "Vector similarity search" },
];

export const nodeTypes: NodeTypes = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customInput:  InputNode   as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customOutput: OutputNode  as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  llm:          LLMNode     as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webhook:      WebhookNode as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if:           IfNode      as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  switch:       SwitchNode  as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loop:         LoopNode    as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code:         CodeNode    as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  http:         HttpNode    as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set:          SetNode     as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  email:        EmailNode   as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slack:        SlackNode   as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document:     DocumentNode as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retriever:    RetrieverNode as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text:         TextNode    as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  note:         NoteNode    as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api:          ApiNode     as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter:       FilterNode  as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge:        MergeNode   as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer:        TimerNode   as any,
};
