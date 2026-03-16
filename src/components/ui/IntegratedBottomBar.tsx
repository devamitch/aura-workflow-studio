import {
  Maximize,
  MessageSquare,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";
import React from "react";
import { useReactFlow } from "reactflow";
import { useStore } from "../../store";

interface Props {
  onToggleChat: () => void;
  chatOpen: boolean;
}

export const IntegratedBottomBar: React.FC<Props> = ({ onToggleChat, chatOpen }) => {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const hasPast = useStore((s) => s.pastNodes.length > 0);
  const hasFuture = useStore((s) => s.futureNodes.length > 0);
  const setShowExecutionPanel = useStore((s) => s.setShowExecutionPanel);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

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
          <button className="bottom-bar-run-btn" onClick={() => setShowExecutionPanel(true)}>
            <Zap size={14} fill="currentColor" />
            <span>Run Pipeline</span>
          </button>
        </div>
      </div>
    </>
  );
};
