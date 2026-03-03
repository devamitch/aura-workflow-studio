import {
  Bot,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  useChatReplyMutation,
  useWorkflowGenerationMutation,
  type GeminiMessage,
} from "../../hooks/useGeminiMutations";
import { hasGeminiApiKey } from "../../services/geminiChat";
import { useStore } from "../../store";
import "./AIPromptChat.css";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  taskList?: string;
  graphGenerated?: boolean;
  timestamp: string;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ── Task Plan viewer ──────────────────────────────────────────────────────────
const TaskListView: React.FC<{
  taskList: string;
  onConfirm: () => void;
  onEdit: (updated: string) => void;
  loading: boolean;
}> = ({ taskList, onConfirm, onEdit, loading }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(taskList);
  const [collapsed, setCollapsed] = useState(false);
  const stepCount = (taskList.match(/^\d+\./gm) ?? []).length;

  return (
    <div className="aura-task-panel">
      <button className="aura-task-toggle" onClick={() => setCollapsed((v) => !v)}>
        <span className="aura-task-toggle-label">
          <GitBranch size={11} />
          Task Plan
        </span>
        <span className="aura-task-toggle-steps">
          {stepCount} steps
          {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </span>
      </button>

      {!collapsed && (
        <div className="aura-task-body">
          {editing ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="aura-task-editor" />
          ) : (
            <pre className="aura-task-content">{taskList}</pre>
          )}
          <div className="aura-task-actions">
            {editing ? (
              <>
                <button className="aura-btn aura-btn-ghost" onClick={() => { setDraft(taskList); setEditing(false); }}>Cancel</button>
                <button className="aura-btn aura-btn-primary" onClick={() => { onEdit(draft); setEditing(false); }}>Apply</button>
              </>
            ) : (
              <>
                <button className="aura-btn aura-btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                <button className="aura-btn aura-btn-glow" onClick={onConfirm} disabled={loading}>
                  {loading ? <><Loader2 size={12} className="aura-spin" /> Building…</> : <><Wand2 size={12} /> Generate Workflow</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Typing cursor ─────────────────────────────────────────────────────────────
const StreamCursor = () => <span className="aura-cursor" aria-hidden />;

// ── Welcome message ───────────────────────────────────────────────────────────
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm **Aura**, your AI workflow architect.\n\nDescribe any automation, AI pipeline, or workflow — I'll design it as a visual node graph.",
  timestamp: new Date().toISOString(),
};

// ── Main component ────────────────────────────────────────────────────────────
interface Props { embedded?: boolean; }

export const AIPromptChat: React.FC<Props> = ({ embedded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [pendingTaskList, setPendingTaskList] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyGeneratedGraph = useStore((s) => s.applyGeneratedGraph);
  const consumeCredit = useStore((s) => s.consumeCredit);
  const user = useStore((s) => s.user);
  const chatReplyMutation = useChatReplyMutation();
  const workflowMutation = useWorkflowGenerationMutation();
  const streaming = chatReplyMutation.isPending;
  const buildingGraph = workflowMutation.isPending;
  const geminiEnabled = hasGeminiApiKey();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const buildHistory = (): GeminiMessage[] =>
    messages
      .filter((m) => m.id !== "welcome" && !m.isStreaming)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.content }));

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    if (!consumeCredit()) {
      setMessages((prev) => [...prev, {
        id: `limit-${Date.now()}`, role: "assistant" as const,
        content: "⚠️ You've used all **20 free credits** this month. Upgrade to Pro for unlimited AI generations!",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    const botId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date().toISOString() },
      { id: botId, role: "assistant", content: "", isStreaming: true, timestamp: new Date().toISOString() },
    ]);
    setInput("");
    const history = buildHistory();

    chatReplyMutation.mutate(
      {
        history,
        userText: text,
        onChunk: (_, accumulated) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === botId ? { ...m, content: accumulated } : m)),
          );
        },
      },
      {
        onSuccess: (fullText) => {
          const hasTaskPlan = /^\d+\./m.test(fullText);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    content: fullText,
                    isStreaming: false,
                    taskList: hasTaskPlan ? fullText : undefined,
                  }
                : m,
            ),
          );
          if (hasTaskPlan) setPendingTaskList(fullText);
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`,
                    isStreaming: false,
                  }
                : m,
            ),
          );
        },
      },
    );
  };

  // ── Generate graph using the proper service ───────────────────────────────
  const handleGenerateGraph = async (taskList: string) => {
    if (buildingGraph) return;
    const botId = `graph-gen-${Date.now()}`;
    setMessages((prev) => [...prev, { id: botId, role: "assistant", content: "Building workflow…", isStreaming: true, timestamp: new Date().toISOString() }]);

    workflowMutation.mutate(
      { prompt: taskList, history: buildHistory() },
      {
        onSuccess: ({ nodes, edges }) => {
          applyGeneratedGraph(nodes, edges);
          setPendingTaskList(null);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    content: `✅ Workflow ready — **${nodes.length} nodes**, **${edges.length} connections**. Check the canvas →`,
                    isStreaming: false,
                    graphGenerated: true,
                  }
                : m,
            ),
          );
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    content: `⚠️ ${err instanceof Error ? err.message : "Graph generation failed"}`,
                    isStreaming: false,
                  }
                : m,
            ),
          );
        },
      },
    );
  };

  // ── Voice ─────────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.lang = "en-US";
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const t = e.results[0][0].transcript as string;
      setInput((p) => (p ? `${p} ${t}` : t));
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const clearChat = () => { setMessages([WELCOME]); setPendingTaskList(null); };

  const lastMsg = messages[messages.length - 1];
  const showTaskList =
    lastMsg?.role === "assistant" && lastMsg.taskList && !lastMsg.graphGenerated &&
    pendingTaskList && !lastMsg.isStreaming;

  const hasVoice = typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className={`aura-chat${embedded ? " aura-chat--embedded" : ""}`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {!embedded && (
        <div className="aura-header">
          <div className="aura-header-left">
            <div className="aura-header-icon"><Sparkles size={13} /></div>
            <div>
              <div className="aura-header-title">Aura</div>
              <div className="aura-header-sub">Workflow Architect</div>
            </div>
          </div>
          {user?.name && <div className="aura-header-user">{user.name.split(" ")[0]}</div>}
        </div>
      )}

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="aura-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`aura-msg aura-msg--${msg.role}`}>
            {msg.role === "assistant" && (
              <div className="aura-avatar aura-avatar--bot"><Bot size={12} /></div>
            )}
            <div className={`aura-bubble aura-bubble--${msg.role}${msg.graphGenerated ? " aura-bubble--success" : ""}`}>
              <div className="aura-bubble-text" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
              {msg.isStreaming && <StreamCursor />}
            </div>
            {msg.role === "user" && (
              <div className="aura-avatar aura-avatar--user"><UserIcon size={12} /></div>
            )}
          </div>
        ))}

        {showTaskList && (
          <div className="aura-task-wrap">
            <TaskListView
              taskList={pendingTaskList!}
              loading={buildingGraph}
              onConfirm={() => void handleGenerateGraph(pendingTaskList!)}
              onEdit={(u) => setPendingTaskList(u)}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <div className="aura-input-area">
        {!geminiEnabled && (
          <div className="aura-key-warning">
            <span>⚠️</span> Add <code>VITE_GEMINI_KEY</code> to <code>.env</code>
          </div>
        )}

        <div className="aura-input-shell">
          <textarea
            ref={textareaRef}
            className="aura-input"
            placeholder="Describe your workflow…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            rows={1}
            disabled={streaming}
          />
          <div className="aura-input-actions">
            {hasVoice && (
              <button className={`aura-icon-btn${recording ? " aura-icon-btn--active" : ""}`} onClick={toggleVoice} title={recording ? "Stop recording" : "Voice input"}>
                {recording ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            )}
            <button className="aura-icon-btn aura-icon-btn--danger" onClick={clearChat} title="Clear chat">
              <Trash2 size={13} />
            </button>
            <button className="aura-send-btn" onClick={() => void handleSend()} disabled={!input.trim() || streaming} title="Send">
              {streaming ? <Loader2 size={14} className="aura-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        <div className="aura-input-hint">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  );
};
