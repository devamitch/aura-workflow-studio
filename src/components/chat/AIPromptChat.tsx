import React, { useEffect, useRef, useState } from "react";
import {
  Bot, CheckCircle2, ChevronDown, ChevronUp, GitBranch, Loader2,
  Mic, MicOff, Send, Sparkles, User as UserIcon, Wand2
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

type ChatStep = "chat" | "review" | "graph";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || "";
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function callChat(messages: { role: string; content: string }[]): Promise<string> {
  const token = await getToken();
  const r = await fetch(`${API_URL}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.detail?.message || err.detail || "AI request failed");
  }
  const data = await r.json();
  return data.content;
}

async function callGenerateGraph(taskList: string): Promise<{ nodes: any[]; edges: any[] }> {
  const token = await getToken();
  const r = await fetch(`${API_URL}/api/v1/ai/generate-graph`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ task_list: taskList }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.detail?.message || err.detail || "Graph generation failed");
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
    <div style={{
      margin: "8px 0",
      background: "var(--bg-input)",
      border: "1px solid var(--primary-border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{
          padding: "10px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--primary-soft)", borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>
          <GitBranch size={13} />
          Generated Task Plan
        </span>
        {collapsed ? <ChevronDown size={13} color="var(--primary)" /> : <ChevronUp size={13} color="var(--primary)" />}
      </div>

      {!collapsed && (
        <>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{
                width: "100%", minHeight: 180, padding: "12px 14px",
                background: "var(--bg-input)", border: "none",
                color: "var(--text-900)", fontFamily: "var(--font-mono)",
                fontSize: 11, lineHeight: 1.7, resize: "vertical", outline: "none",
              }}
            />
          ) : (
            <pre style={{
              padding: "12px 14px", margin: 0,
              fontFamily: "var(--font-mono)", fontSize: 10.5, lineHeight: 1.7,
              color: "var(--text-700)", whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto",
            }}>
              {taskList}
            </pre>
          )}

          <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: "1px solid var(--border-subtle)" }}>
            {editing ? (
              <>
                <button
                  onClick={() => { onEdit(draft); setEditing(false); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: "var(--primary)", color: "white", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Apply Edits
                </button>
                <button
                  onClick={() => { setDraft(taskList); setEditing(false); }}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border-mid)", background: "transparent", color: "var(--text-700)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid var(--border-mid)", background: "transparent", color: "var(--text-700)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                >
                  Edit Plan
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  style={{
                    flex: 2, padding: "7px 0", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg, var(--primary), #7c3aed)",
                    color: "white", fontSize: 11.5, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? <Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} /> : <Wand2 size={12} />}
                  {loading ? "Building..." : "Generate Workflow"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const AIPromptChat: React.FC = () => {
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
  const recognitionRef = useRef<any>(null);
  const applyGeneratedGraph = useStore((s) => s.applyGeneratedGraph);
  const user = useStore((s) => s.user);

  // Build full message history for context window
  const chatHistory = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.content }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");

    try {
      const content = await callChat([...chatHistory, { role: "user", content: text }]);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content,
        taskList: content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setPendingTaskList(content);
    } catch (e: any) {
      const msg = e.message || "Something went wrong.";
      setError(msg);
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${msg}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateGraph = async (taskList: string) => {
    setBuildingGraph(true);
    try {
      const { nodes, edges } = await callGenerateGraph(taskList);
      applyGeneratedGraph(nodes, edges);
      setPendingTaskList(null);
      setMessages((prev) => [...prev, {
        id: `graph-${Date.now()}`,
        role: "assistant",
        content: `✅ Workflow created with **${nodes.length} nodes** and **${edges.length} connections**! Check the canvas.`,
        graphGenerated: true,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBuildingGraph(false);
    }
  };

  const toggleVoice = () => {
    const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    if (!supported) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => prev ? `${prev} ${t}` : t);
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  // Render message content with basic markdown (bold, line breaks)
  const renderContent = (content: string) => {
    return content
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  const lastMsg = messages[messages.length - 1];
  const showTaskList = lastMsg?.role === "assistant" && lastMsg.taskList && !lastMsg.graphGenerated && pendingTaskList;

  return (
    <div className="ai-chat-container">
      {/* Header */}
      <div className="ai-chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <Sparkles size={14} />
          <span className="ai-chat-header-title">Aura Assistant</span>
        </div>
        {user?.name && (
          <span style={{ fontSize: 10.5, color: "rgba(99,102,241,0.7)", fontWeight: 600 }}>
            {user.name.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-wrapper ${msg.role}`}>
            <div className={`chat-message-avatar ${msg.role}`}>
              {msg.role === "assistant" ? <Bot size={12} /> : <UserIcon size={12} />}
            </div>
            <div className={`chat-message-bubble ${msg.role}${msg.graphGenerated ? " graph-success" : ""}`}
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
          </div>
        ))}

        {/* Task list review UI */}
        {showTaskList && (
          <div style={{ paddingLeft: 34 }}>
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
              <Loader2 size={11} className="spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: 11 }}>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          placeholder="Describe a workflow... (Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          rows={2}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={toggleVoice}
            className={`voice-btn ${recording ? "recording" : ""}`}
            style={{ width: 36, height: "auto", flex: 1, borderRadius: 8 }}
            title={recording ? "Stop recording" : "Voice input"}
          >
            {recording ? <MicOff size={12} /> : <Mic size={12} />}
          </button>
          <button
            className="ai-chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{ width: 36, height: "auto", flex: 1, borderRadius: 8 }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
