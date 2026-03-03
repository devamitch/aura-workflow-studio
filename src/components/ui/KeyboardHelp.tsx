/**
 * KeyboardHelp — shows all keyboard shortcuts when user presses "?"
 */
import { Keyboard, X } from "lucide-react";
import React, { useEffect } from "react";

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  {
    section: "Canvas",
    rows: [
      { keys: ["⌘", "Z"], desc: "Undo" },
      { keys: ["⌘", "⇧", "Z"], desc: "Redo" },
      { keys: ["⌘", "\\"], desc: "Toggle right panel" },
      { keys: ["⌘", "L"], desc: "Auto-layout nodes" },
      { keys: ["F"], desc: "Fit view" },
      { keys: ["⌘", "A"], desc: "Select all nodes" },
      { keys: ["Del / ⌫"], desc: "Delete selected" },
    ],
  },
  {
    section: "Nodes",
    rows: [
      { keys: ["⌘", "C"], desc: "Copy selected nodes" },
      { keys: ["⌘", "V"], desc: "Paste nodes" },
      { keys: ["⌘", "D"], desc: "Duplicate selected" },
      { keys: ["Click"], desc: "Select + open config" },
      { keys: ["Right-click"], desc: "Context menu" },
    ],
  },
  {
    section: "Panels",
    rows: [
      { keys: ["⌘", "1"], desc: "Open AI Chat panel" },
      { keys: ["⌘", "2"], desc: "Open Node Config panel" },
      { keys: ["Esc"], desc: "Deselect / close panel" },
      { keys: ["?"], desc: "Show keyboard shortcuts" },
    ],
  },
];

export const KeyboardHelp: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="kb-help-overlay" onClick={onClose}>
      <div className="kb-help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kb-help-title">
          <Keyboard size={16} />
          Keyboard Shortcuts
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>

        {SHORTCUTS.map((section) => (
          <div key={section.section} className="kb-help-section">
            <div className="kb-help-section-label">{section.section}</div>
            {section.rows.map((row) => (
              <div key={row.desc} className="kb-help-row">
                <span>{row.desc}</span>
                <div className="kb-help-keys">
                  {row.keys.map((k) => (
                    <span key={k} className="kb-key">{k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
