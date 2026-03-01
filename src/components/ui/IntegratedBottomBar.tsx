import {
  Loader2,
  Maximize,
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

export const IntegratedBottomBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const hasPast = useStore((s) => s.pastNodes.length > 0);
  const hasFuture = useStore((s) => s.futureNodes.length > 0);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/pipelines/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: ParseResponse = await response.json();
      setResult(data);
    } catch {
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bottom-bar">
        <div className="bottom-bar-group">
          <button
            className="bottom-bar-btn"
            onClick={undo}
            disabled={!hasPast}
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={18} />
          </button>
          <button
            className="bottom-bar-btn"
            onClick={redo}
            disabled={!hasFuture}
            title="Redo (Cmd+Y)"
          >
            <Redo2 size={18} />
          </button>
        </div>

        <div className="bottom-bar-group">
          <button
            className="bottom-bar-btn"
            onClick={() => zoomIn()}
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            className="bottom-bar-btn"
            onClick={() => zoomOut()}
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            className="bottom-bar-btn"
            onClick={() => fitView()}
            title="Fit View"
          >
            <Maximize size={18} />
          </button>
        </div>

        <div className="bottom-bar-group">
          <button
            className="submit-btn-premium"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Ready to Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {result && <AlertModal data={result} onClose={() => setResult(null)} />}
    </>
  );
};
