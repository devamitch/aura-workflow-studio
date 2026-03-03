/**
 * GenericNode — universal node component driven by the NodeDefinition registry.
 * All new node types added to definitions.ts render through this component
 * without requiring individual node files.
 */
import React from "react";
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
import type { NodeProps } from "reactflow";
import { BaseNode } from "../components/node/BaseNode";
import { getNodeDefinition } from "./definitions";
import type { NodeData } from "../types";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Bot, FileText, Globe, Key, MessageCircle, MessageSquare,
  Settings2, GitBranch, GitMerge, Shuffle, Repeat, Zap, Filter,
  RefreshCw, Pause, Timer, Code2, StickyNote, Database, Send,
  Webhook, Clock, Activity, AlertTriangle, Flame,
};

function getIcon(type: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    llm: Brain, aiAgent: Bot, promptTemplate: FileText,
    telegramTrigger: MessageCircle, whatsappTrigger: MessageSquare, discordTrigger: MessageCircle,
    oauthCallback: Key, webhook: Webhook, timer: Clock,
    googleAuth: Key, githubAuth: Key, facebookAuth: Key, customOAuth2: Key,
    telegramBot: Send, whatsappBot: MessageSquare, discordBot: MessageCircle,
    http: Globe, stripe: Key, postgresql: Database, supabase: Database, firebase: Flame,
    if: GitBranch, switch: Shuffle, loop: Repeat, parallel: Zap, merge: GitMerge,
    filter: Filter, retry: RefreshCw, delay: Pause, rateLimit: Timer,
    set: Settings2, code: Code2, text: FileText, note: StickyNote,
    embedding: Brain, vectorStore: Database, ragPipeline: Brain,
    executionLogger: Activity, metricsSink: Activity, errorBoundary: AlertTriangle,
  };
  return map[type] ?? Globe;
}

// ── Execution state colors ────────────────────────────────────────────────────
const EXEC_BORDER: Record<string, string> = {
  pending:  "var(--border-mid)",
  running:  "#f59e0b",
  success:  "#10b981",
  failed:   "#ef4444",
  skipped:  "#6b7280",
};

export const GenericNode: React.FC<NodeProps<NodeData>> = ({ id, data, selected }) => {
  const def = getNodeDefinition(data.nodeType ?? "");
  const Icon = getIcon(data.nodeType ?? "");
  const accentColor = def?.uiTheme ?? "#6366f1";

  const execState = data.executionState;
  const execBorder = execState ? EXEC_BORDER[execState] : undefined;

  const handles = [
    ...(def?.consumesInput !== false
      ? [{ type: "target" as const, position: "left" as const, id: "input", label: "in" }]
      : []),
    ...(def?.producesOutput !== false
      ? [{ type: "source" as const, position: "right" as const, id: "output", label: "out" }]
      : []),
  ];

  const hasErrors = (data.validationErrors?.length ?? 0) > 0;

  return (
    <div style={execBorder ? { outline: `2px solid ${execBorder}`, borderRadius: 10 } : {}}>
      <BaseNode
        id={id}
        title={String(data.label ?? def?.label ?? data.nodeType ?? "Node")}
        icon={Icon}
        accentColor={hasErrors ? "#ef4444" : accentColor}
        handles={handles}
        customHandles={data.customHandles ?? []}
        selected={selected}
        nodeType={data.nodeType}
      >
        {/* Execution state badge */}
        {execState && (
          <div className="node-exec-badge" data-state={execState}>
            {execState === "running" && <span className="node-exec-spinner" />}
            {execState}
          </div>
        )}

        {/* Credential warning */}
        {hasErrors && (
          <div className="node-cred-warning" title={data.validationErrors?.join(", ")}>
            <AlertTriangle size={11} />
            <span>Missing credentials</span>
          </div>
        )}

        {/* Type label */}
        <div className="generic-node-type-label">{def?.label ?? data.nodeType}</div>

        {/* Description */}
        {def?.description && (
          <div className="generic-node-desc">{def.description}</div>
        )}
      </BaseNode>
    </div>
  );
};
