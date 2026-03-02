import {
  Brain,
  Clock,
  FileText,
  Filter,
  GitMerge,
  Globe,
  LogIn,
  LogOut,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { NodeTypes } from "reactflow";
import { ApiNode } from "./apiNode";
import { FilterNode } from "./filterNode";
import { InputNode } from "./inputNode";
import { LLMNode } from "./llmNode";
import { MergeNode } from "./mergeNode";
import { NoteNode } from "./noteNode";
import { OutputNode } from "./outputNode";
import { TextNode } from "./textNode";
import { TimerNode } from "./timerNode";
import { DocumentNode } from "./documentNode";
import { RetrieverNode } from "./retrieverNode";

export interface NodeMeta {
  type: string;
  label: string;
  icon: LucideIcon;
  group: "Core & AI" | "Logic" | "Data & Text";
}

export const NODE_META: NodeMeta[] = [
  { type: "customInput",  label: "Input",  icon: LogIn,      group: "Core & AI"   },
  { type: "llm",          label: "LLM",    icon: Brain,      group: "Core & AI"   },
  { type: "customOutput", label: "Output", icon: LogOut,     group: "Core & AI"   },
  { type: "document",     label: "RAG Doc", icon: FileText,  group: "Data & Text" },
  { type: "retriever",    label: "Retriever", icon: Globe,   group: "Core & AI"   },
  { type: "filter",       label: "Filter", icon: Filter,     group: "Logic"       },
  { type: "merge",        label: "Merge",  icon: GitMerge,   group: "Logic"       },
  { type: "timer",        label: "Timer",  icon: Clock,      group: "Logic"       },
  { type: "text",         label: "Text",   icon: FileText,   group: "Data & Text" },
  { type: "note",         label: "Note",   icon: StickyNote, group: "Data & Text" },
  { type: "api",          label: "API",    icon: Globe,      group: "Data & Text" },
];

export const nodeTypes: NodeTypes = {
  customInput:  InputNode  as any,
  llm:          LLMNode    as any,
  customOutput: OutputNode as any,
  document:     DocumentNode as any,
  retriever:    RetrieverNode as any,
  text:         TextNode   as any,
  note:         NoteNode   as any,
  api:          ApiNode    as any,
  filter:       FilterNode as any,
  merge:        MergeNode  as any,
  timer:        TimerNode  as any,
};
