import {
  Download,
  FilePlus,
  FolderOpen,
  LayoutDashboard,
  PlayCircle,
  Save,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { NODE_META } from "../../nodes/registry";
import { useStore } from "../../store";
import { DraggableNode } from "./DraggableNode";
import { WorkflowsModal } from "./WorkflowsModal";

export const PipelineToolbar: React.FC = () => {
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [saveNamePrompt, setSaveNamePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const saveInputRef = useRef<HTMLInputElement>(null);

  const clearCanvas = useStore((s) => s.clearCanvas);
  const loadDemo = useStore((s) => s.loadDemo);
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const exportToJSON = useStore((s) => s.exportToJSON);
  const importFromJSON = useStore((s) => s.importFromJSON);
  const applyAutoLayout = useStore((s) => s.applyAutoLayout);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = (["Core & AI", "Logic", "Data & Text"] as const).map(
    (title) => ({
      title,
      nodes: NODE_META.filter((n) => n.group === title),
    }),
  );

  const handleSaveConfirm = () => {
    const name = saveName.trim() || "Untitled";
    saveWorkflow(name);
    setSaveNamePrompt(false);
    setSaveName("");
  };

  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importFromJSON(text);
      if (!result.ok) alert(`Import failed: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-header">
          <h2 className="toolbar-brand-logo">
            Vector<span>Shift</span>
          </h2>

          <div className="toolbar-actions">
            <button
              className="toolbar-action-btn"
              onClick={clearCanvas}
              title="New Workflow"
            >
              <FilePlus size={14} />
              <span>New</span>
            </button>
            <button
              className="toolbar-action-btn"
              onClick={loadDemo}
              title="Load Demo"
            >
              <PlayCircle size={14} />
              <span>Demo</span>
            </button>
            <button
              className="toolbar-action-btn"
              onClick={applyAutoLayout}
              title="Auto Layout"
            >
              <LayoutDashboard size={14} />
              <span>Layout</span>
            </button>
          </div>

          <div
            className="toolbar-actions"
            style={{ paddingTop: 8, borderTop: "none" }}
          >
            <button
              className="toolbar-action-btn"
              title="Save Workflow"
              onClick={() => {
                setSaveNamePrompt(true);
                setTimeout(() => saveInputRef.current?.focus(), 50);
              }}
            >
              <Save size={14} />
              <span>Save</span>
            </button>
            <button
              className="toolbar-action-btn"
              title="Open Saved Workflows"
              onClick={() => setShowWorkflowsModal(true)}
            >
              <FolderOpen size={14} />
              <span>Open</span>
            </button>
            <button
              className="toolbar-action-btn"
              title="Export as JSON"
              onClick={handleExport}
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            <button
              className="toolbar-action-btn"
              title="Import from JSON"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              <span>Import</span>
            </button>
          </div>

          {saveNamePrompt && (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                ref={saveInputRef}
                className="modal-input"
                style={{
                  margin: 0,
                  flex: 1,
                  fontSize: 12,
                  padding: "7px 10px",
                }}
                placeholder="Workflow name…"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveConfirm();
                  if (e.key === "Escape") {
                    setSaveNamePrompt(false);
                    setSaveName("");
                  }
                }}
              />
              <button
                className="modal-btn modal-btn-primary"
                style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 8 }}
                onClick={handleSaveConfirm}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-section">
          {groups.map((group) => (
            <React.Fragment key={group.title}>
              <p className="toolbar-section-title">{group.title}</p>
              <div className="toolbar-nodes">
                {group.nodes.map((node) => (
                  <DraggableNode
                    key={node.type}
                    type={node.type}
                    label={node.label}
                    icon={node.icon}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="toolbar-credit">
          Built by{" "}
          <a
            href="https://crunchyroll.devamit.co.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Amit Chakraborty
          </a>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      {showWorkflowsModal && (
        <WorkflowsModal onClose={() => setShowWorkflowsModal(false)} />
      )}
    </>
  );
};
