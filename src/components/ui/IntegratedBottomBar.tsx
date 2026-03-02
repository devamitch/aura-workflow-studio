import {
  Loader2,
  Maximize,
  MessageSquare,
  Play,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useState } from "react";
import { useReactFlow } from "reactflow";
import { useStore } from "../../store";
import type { ParseResponse } from "../../types";
import { AlertModal } from "./AlertModal";

interface Props {
  onToggleChat: () => void;
  chatOpen: boolean;
}

export const IntegratedBottomBar: React.FC<Props> = ({ onToggleChat, chatOpen }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const hasPast = useStore((s) => s.pastNodes.length > 0);
  const hasFuture = useStore((s) => s.futureNodes.length > 0);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleRun = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/pipelines/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      setResult(await response.json());
    } catch {
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bottom-bar">
        {/* History */}
        <div className="bottom-bar-group">
          <button className="bottom-bar-btn" onClick={undo} disabled={!hasPast} title="Undo (⌘Z)">
            <Undo2 size={16} />
          </button>
          <button className="bottom-bar-btn" onClick={redo} disabled={!hasFuture} title="Redo (⌘Y)">
            <Redo2 size={16} />
          </button>
        </div>

        {/* Zoom */}
        <div className="bottom-bar-group">
          <button className="bottom-bar-btn" onClick={() => zoomIn()} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="bottom-bar-btn" onClick={() => zoomOut()} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button className="bottom-bar-btn" onClick={() => fitView()} title="Fit View">
            <Maximize size={16} />
          </button>
        </div>

        {/* AI Chat toggle */}
        <div className="bottom-bar-group">
          <button
            className={`bottom-bar-btn ${chatOpen ? "active" : ""}`}
            onClick={onToggleChat}
            title="Toggle AI Chat"
          >
            <MessageSquare size={16} />
            <span className="bottom-bar-label">AI Chat</span>
          </button>
        </div>

        {/* Run */}
        <div className="bottom-bar-group ml-auto">
          <button className="bottom-bar-run-btn" onClick={handleRun} disabled={loading}>
            {loading ? (
              <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            <span>{loading ? "Running…" : "Run Pipeline"}</span>
          </button>
        </div>
      </div>

      {result && <AlertModal data={result} onClose={() => setResult(null)} />}
    </>
  );
};
