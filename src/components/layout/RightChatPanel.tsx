import React from "react";
import { ChevronRight, Settings, Sparkles } from "lucide-react";
import { AIPromptChat } from "../sidebar/AIPromptChat";
import { NodeSidebar } from "../node/NodeSidebar";
import { useStore } from "../../store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const RightChatPanel: React.FC<Props> = ({ open, onClose }) => {
  const rightPanelMode = useStore((s) => s.rightPanelMode);
  const setRightPanelMode = useStore((s) => s.setRightPanelMode);
  const selectedNodeId = useStore((s) => s.selectedNodeId);

  return (
    <div className={`right-panel ${open ? "open" : ""}`}>
      {/* Tab header */}
      <div className="right-panel-header">
        <div className="right-panel-tabs">
          <button
            className={`right-panel-tab${rightPanelMode === "chat" ? " active" : ""}`}
            onClick={() => setRightPanelMode("chat")}
          >
            <Sparkles size={13} />
            <span>AI Chat</span>
          </button>
          <button
            className={`right-panel-tab${rightPanelMode === "node-config" ? " active" : ""}${selectedNodeId ? " has-node" : ""}`}
            onClick={() => setRightPanelMode("node-config")}
          >
            <Settings size={13} />
            <span>Node Config</span>
            {selectedNodeId && <span className="right-panel-tab-dot" />}
          </button>
        </div>
        <button className="right-panel-close" onClick={onClose} title="Close panel">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Panel body */}
      <div className="right-panel-body">
        {rightPanelMode === "chat" ? (
          <AIPromptChat embedded />
        ) : (
          <NodeSidebar />
        )}
      </div>
    </div>
  );
};
