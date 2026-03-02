import React, { useEffect, useRef, useState } from "react";
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
  User as UserIcon,
  Wand2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  taskList?: string;
  graphGenerated?: boolean;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || "";
}

const API_URL = () => (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

async function callChat(messages: { role: string; content: string }[]): Promise<string> {
  const token = await getToken();
  const r = await fetch(`${API_URL()}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: { message?: string } | string })?.detail as string || "AI request failed");
  }
  const data = await r.json();
  return (data as { content: string }).content;
}

async function callGenerateGraph(taskList: string): Promise<{ nodes: unknown[]; edges: unknown[] }> {
  const token = await getToken();
  const r = await fetch(`${API_URL()}/api/v1/ai/generate-graph`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ task_list: taskList }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string })?.detail || "Graph generation failed");
  }
  return r.json();
}

// ── Task List Viewer ──────────────────────────────────────────────────────────
const TaskListView: React.FC<{
  taskList: string;
  onConfirm: () => void;
  onEdit: (updated: string) => void;
  loading: boolean;
}> = ({ taskList, onConfirm, onEdit, loading }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(taskList);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="task-list-view">
      <div className="task-list-header" onClick={() => setCollapsed((v) => !v)}>
        <span className="task-list-title">
          <GitBranch size={12} />
          Task Plan
        </span>
        {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </div>

      {!collapsed && (
        <>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="task-list-editor"
            />
          ) : (
            <pre className="task-list-content">{taskList}</pre>
          )}

          <div className="task-list-actions">
            {editing ? (
              <>
                <button className="tl-btn tl-btn-primary" onClick={() => { onEdit(draft); setEditing(false); }}>Apply</button>
                <button className="tl-btn" onClick={() => { setDraft(taskList); setEditing(false); }}>Cancel</button>
              </>
            ) : (
              <>
                <button className="tl-btn" onClick={() => setEditing(true)}>Edit Plan</button>
                <button
                  className="tl-btn tl-btn-primary"
                  onClick={onConfirm}
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? <Loader2 size={11} style={{ animation: "spin 0.7s linear infinite" }} /> : <Wand2 size={11} />}
                  {loading ? "Building…" : "Generate Workflow"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Markdown renderer (bold + newlines only) ──────────────────────────────────
const renderMd = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  embedded?: boolean;
}

export const AIPromptChat: React.FC<Props> = ({ embedded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm **Aura**. Describe any workflow you want to build — I'll design a complete AI pipeline for you.",
    timestamp: new Date().toISOString(),
  }]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [pendingTaskList, setPendingTaskList] = useState<string | null>(null);
  const [buildingGraph, setBuildingGraph] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const applyGeneratedGraph = useStore((s) => s.applyGeneratedGraph);
  const user = useStore((s) => s.user);

  const chatHistory = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");

    try {
      const content = await callChat([...chatHistory, { role: "user", content: text }]);
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, role: "assistant", content, taskList: content, timestamp: new Date().toISOString() }]);
      setPendingTaskList(content);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: `⚠️ ${msg}`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateGraph = async (taskList: string) => {
    setBuildingGraph(true);
    try {
      const { nodes, edges } = await callGenerateGraph(taskList);
      applyGeneratedGraph(nodes as Parameters<typeof applyGeneratedGraph>[0], edges as Parameters<typeof applyGeneratedGraph>[1]);
      setPendingTaskList(null);
      setMessages((prev) => [...prev, {
        id: `graph-${Date.now()}`,
        role: "assistant",
        content: `✅ Workflow created with **${nodes.length} nodes** and **${edges.length} connections**! Check the canvas.`,
        graphGenerated: true,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Graph generation failed");
    } finally {
      setBuildingGraph(false);
    }
  };

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const t: string = e.results[0][0].transcript;
      setInput((prev) => prev ? `${prev} ${t}` : t);
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const lastMsg = messages[messages.length - 1];
  const showTaskList = lastMsg?.role === "assistant" && lastMsg.taskList && !lastMsg.graphGenerated && pendingTaskList;

  return (
    <div className={`ai-chat-container${embedded ? " embedded" : ""}`}>
      {/* Header — hidden when embedded (panel has its own header) */}
      {!embedded && (
        <div className="ai-chat-header">
          <Sparkles size={14} />
          <span className="ai-chat-header-title">Aura Assistant</span>
          {user?.name && (
            <span className="ai-chat-header-user">{user.name.split(" ")[0]}</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-wrapper ${msg.role}`}>
            <div className={`chat-message-avatar ${msg.role}`}>
              {msg.role === "assistant" ? <Bot size={12} /> : <UserIcon size={12} />}
            </div>
            <div
              className={`chat-message-bubble ${msg.role}${msg.graphGenerated ? " graph-success" : ""}`}
              dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
            />
          </div>
        ))}

        {showTaskList && (
          <div style={{ paddingLeft: 32 }}>
            <TaskListView
              taskList={pendingTaskList!}
              loading={buildingGraph}
              onConfirm={() => handleGenerateGraph(pendingTaskList!)}
              onEdit={(updated) => setPendingTaskList(updated)}
            />
          </div>
        )}

        {isTyping && (
          <div className="chat-message-wrapper assistant">
            <div className="chat-message-avatar assistant"><Bot size={12} /></div>
            <div className="chat-message-bubble assistant typing">
              <Loader2 size={11} style={{ animation: "spin 0.7s linear infinite" }} />
              <span>Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">{error}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          placeholder="Describe a workflow… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
          }}
          rows={2}
        />
        <div className="ai-chat-btns">
          <button
            onClick={toggleVoice}
            className={`voice-btn${recording ? " recording" : ""}`}
            title={recording ? "Stop" : "Voice input"}
          >
            {recording ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
          <button
            className="ai-chat-send-btn"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
