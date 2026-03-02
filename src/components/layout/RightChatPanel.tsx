import React from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { AIPromptChat } from "../sidebar/AIPromptChat";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const RightChatPanel: React.FC<Props> = ({ open, onClose }) => {
  return (
    <div className={`right-panel ${open ? "open" : ""}`}>
      <div className="right-panel-header">
        <div className="right-panel-title">
          <Sparkles size={14} />
          <span>Aura AI Assistant</span>
        </div>
        <button className="right-panel-close" onClick={onClose} title="Close">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="right-panel-body">
        <AIPromptChat embedded />
      </div>
    </div>
  );
};
