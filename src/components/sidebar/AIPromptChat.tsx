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
  Trash2,
  User as UserIcon,
  Wand2,
} from "lucide-react";
import { useStore } from "../../store";
import type { PipelineEdge, PipelineNode } from "../../types";

// ── Gemini direct API ─────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY ?? "";
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are Aura, an expert AI workflow architect. You help users build visual AI pipelines using a node-based canvas.

When a user describes a workflow:
1. First reply with a clear, numbered TASK PLAN (max 8 steps). Each step is one sentence.
2. Wait for user to confirm before generating JSON.

When asked to generate a workflow JSON, respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "nodes": [
    { "id": "node-1", "type": "customInput", "position": {"x": 60, "y": 100}, "data": {"id": "node-1", "nodeType": "customInput", "inputName": "query", "inputType": "Text"} },
    { "id": "node-2", "type": "llm", "position": {"x": 400, "y": 100}, "data": {"id": "node-2", "nodeType": "llm", "model": "gemini-1.5-flash"} },
    { "id": "node-3", "type": "customOutput", "position": {"x": 740, "y": 100}, "data": {"id": "node-3", "nodeType": "customOutput", "outputName": "result", "outputType": "Text"} }
  ],
  "edges": [
    { "id": "e-1", "source": "node-1", "sourceHandle": "node-1-value", "target": "node-2", "targetHandle": "node-2-prompt", "type": "smoothstep", "animated": true }
  ]
}

Available node types: customInput, customOutput, llm, text, api, filter, merge, note, timer.
Keep workflows practical and under 10 nodes. Space nodes 340px apart horizontally, 200px vertically.`;

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

async function* streamGemini(
  history: GeminiMessage[],
): AsyncGenerator<string> {
  if (!GEMINI_KEY) {
    yield "⚠️ No Gemini API key configured. Add VITE_GEMINI_KEY to your .env file.";
    return;
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message;
    yield `⚠️ Gemini error: ${msg ?? response.statusText}`;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunk
      }
    }
  }
}

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

// ── Simple markdown renderer ──────────────────────────────────────────────────
function renderMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ── Task List Plan Viewer ─────────────────────────────────────────────────────
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
      <div
        className="task-list-header"
        onClick={() => setCollapsed((v) => !v)}
      >
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
                <button
                  className="tl-btn tl-btn-primary"
                  onClick={() => {
                    onEdit(draft);
                    setEditing(false);
                  }}
                >
                  Apply
                </button>
                <button
                  className="tl-btn"
                  onClick={() => {
                    setDraft(taskList);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="tl-btn" onClick={() => setEditing(true)}>
                  Edit Plan
                </button>
                <button
                  className="tl-btn tl-btn-primary"
                  onClick={onConfirm}
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? (
                    <Loader2 size={11} className="spin-icon" />
                  ) : (
                    <Wand2 size={11} />
                  )}
                  {loading ? "Building…" : "Generate Workflow ✨"}
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
interface Props {
  embedded?: boolean;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm **Aura**, your AI workflow architect.\n\nDescribe any automation, AI pipeline, or workflow you want to build — I'll design it for you as a visual node graph.",
  timestamp: new Date().toISOString(),
};

export const AIPromptChat: React.FC<Props> = ({ embedded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pendingTaskList, setPendingTaskList] = useState<string | null>(null);
  const [buildingGraph, setBuildingGraph] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const applyGeneratedGraph = useStore((s) => s.applyGeneratedGraph);
  const consumeCredit = useStore((s) => s.consumeCredit);
  const plan = useStore((s) => s.plan);
  const user = useStore((s) => s.user);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Build Gemini history from messages
  const buildHistory = (): GeminiMessage[] =>
    messages
      .filter((m) => m.id !== "welcome" && !m.isStreaming)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    // Credit gate for free plan
    if (!consumeCredit()) {
      setMessages((prev) => [...prev, {
        id: `limit-${Date.now()}`,
        role: "assistant" as const,
        content: "⚠️ You've used all **20 free credits** this month. Upgrade to Pro for unlimited AI generations!",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    const botId = `a-${Date.now()}`;
    const botMsg: ChatMessage = {
      id: botId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setStreaming(true);

    try {
      const history = buildHistory();
      history.push({ role: "user", parts: [{ text }] });

      let fullText = "";
      for await (const chunk of streamGemini(history)) {
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: fullText } : m,
          ),
        );
      }

      // Finalize: detect if there's a task plan (numbered list)
      const hasTaskPlan = /^\d+\./m.test(fullText);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                isStreaming: false,
                taskList: hasTaskPlan ? fullText : undefined,
              }
            : m,
        ),
      );
      if (hasTaskPlan) setPendingTaskList(fullText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, content: `⚠️ ${msg}`, isStreaming: false }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleGenerateGraph = async (taskList: string) => {
    setBuildingGraph(true);
    const botId = `graph-gen-${Date.now()}`;
    const botMsg: ChatMessage = {
      id: botId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);

    try {
      const prompt = `Generate a workflow JSON for this task plan:\n\n${taskList}\n\nRespond ONLY with the JSON object, no markdown fences.`;
      const history: GeminiMessage[] = [
        { role: "user", parts: [{ text: prompt }] },
      ];

      let raw = "";
      for await (const chunk of streamGemini(history)) {
        raw += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: raw } : m)),
        );
      }

      // Extract JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON in response.");

      const parsed = JSON.parse(jsonMatch[0]) as {
        nodes: PipelineNode[];
        edges: PipelineEdge[];
      };
      applyGeneratedGraph(parsed.nodes, parsed.edges);
      setPendingTaskList(null);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                content: `✅ Workflow created with **${parsed.nodes.length} nodes** and **${parsed.edges.length} connections**! Check the canvas →`,
                isStreaming: false,
                graphGenerated: true,
              }
            : m,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Graph generation failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, content: `⚠️ ${msg}`, isStreaming: false }
            : m,
        ),
      );
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
    rec.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const t = e.results[0][0].transcript as string;
      setInput((prev) => (prev ? `${prev} ${t}` : t));
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setPendingTaskList(null);
  };

  const lastMsg = messages[messages.length - 1];
  const showTaskList =
    lastMsg?.role === "assistant" &&
    lastMsg.taskList &&
    !lastMsg.graphGenerated &&
    pendingTaskList &&
    !lastMsg.isStreaming;

  const hasVoice =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  return (
    <div className={`ai-chat-container${embedded ? " embedded" : ""}`}>
      {/* Header */}
      {!embedded && (
        <div className="ai-chat-header">
          <Sparkles size={14} />
          <span className="ai-chat-header-title">Aura Assistant</span>
          {user?.name && (
            <span className="ai-chat-header-user">
              {user.name.split(" ")[0]}
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg-row ${msg.role}`}>
            <div className={`chat-avatar ${msg.role}`}>
              {msg.role === "assistant" ? (
                <Bot size={13} />
              ) : (
                <UserIcon size={13} />
              )}
            </div>
            <div
              className={`chat-bubble ${msg.role}${msg.graphGenerated ? " graph-ok" : ""}${msg.isStreaming ? " streaming" : ""}`}
              dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
            />
          </div>
        ))}

        {showTaskList && (
          <div className="task-list-wrap">
            <TaskListView
              taskList={pendingTaskList!}
              loading={buildingGraph}
              onConfirm={() => void handleGenerateGraph(pendingTaskList!)}
              onEdit={(updated) => setPendingTaskList(updated)}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="ai-chat-input-area">
        <div className="ai-chat-input-row">
          <textarea
            className="ai-chat-input"
            placeholder="Describe a workflow… (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            disabled={streaming}
          />
          <div className="ai-chat-input-btns">
            {hasVoice && (
              <button
                className={`chat-icon-btn${recording ? " recording" : ""}`}
                onClick={toggleVoice}
                title={recording ? "Stop recording" : "Voice input"}
              >
                {recording ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
            <button
              className="chat-icon-btn danger"
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
            <button
              className="chat-send-btn"
              onClick={() => void handleSend()}
              disabled={!input.trim() || streaming}
              title="Send"
            >
              {streaming ? (
                <Loader2 size={15} className="spin-icon" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
        {!GEMINI_KEY && (
          <p className="chat-no-key-warning">
            ⚠️ Add VITE_GEMINI_KEY to .env to enable AI chat
          </p>
        )}
      </div>
    </div>
  );
};
