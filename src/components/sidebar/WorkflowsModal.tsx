import { Download, FolderOpen, Trash2, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useStore, type SavedWorkflow } from "../../store";

interface WorkflowsModalProps {
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const WorkflowsModal: React.FC<WorkflowsModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<"open" | "import">("open");
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>(() =>
    useStore.getState().getSavedWorkflows(),
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSavedWorkflow = useStore((s) => s.loadSavedWorkflow);
  const deleteSavedWorkflow = useStore((s) => s.deleteSavedWorkflow);
  const exportToJSON = useStore((s) => s.exportToJSON);
  const importFromJSON = useStore((s) => s.importFromJSON);

  const refresh = () => setWorkflows(useStore.getState().getSavedWorkflows());

  const handleOpen = (id: string) => {
    loadSavedWorkflow(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteSavedWorkflow(id);
    refresh();
  };

  const handleExportJSON = useCallback(() => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportToJSON]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importFromJSON(text);
      if (result.ok) {
        onClose();
      } else {
        setImportError(result.error ?? "Unknown error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <FolderOpen className="modal-header-icon" size={24} />
          <span className="modal-header-title">Workflows</span>
          <button className="modal-close-x" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        <div className="modal-btn-row" style={{ marginBottom: 16 }}>
          <button
            className={`modal-btn${tab === "open" ? " modal-btn-primary" : ""}`}
            onClick={() => setTab("open")}
          >
            Saved Workflows
          </button>
          <button
            className={`modal-btn${tab === "import" ? " modal-btn-primary" : ""}`}
            onClick={() => setTab("import")}
          >
            Import / Export
          </button>
        </div>

        {tab === "open" && (
          <>
            <div className="wf-list">
              {workflows.length === 0 ? (
                <div className="wf-list-empty">
                  No saved workflows yet.
                  <br />
                  Use the Save button in the sidebar to save your current pipeline.
                </div>
              ) : (
                workflows.map((wf) => (
                  <div key={wf.id} className="wf-item">
                    <div className="wf-item-info">
                      <div className="wf-item-name">{wf.name}</div>
                      <div className="wf-item-meta">
                        {wf.nodeCount} nodes · {wf.edgeCount} edges ·{" "}
                        {formatDate(wf.savedAt)}
                      </div>
                    </div>
                    <button
                      className="wf-item-open"
                      onClick={() => handleOpen(wf.id)}
                    >
                      Open
                    </button>
                    <button
                      className="wf-item-del"
                      onClick={() => handleDelete(wf.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {tab === "import" && (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  background: "var(--bg-input)",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 10,
                  }}
                >
                  Export
                </p>
                <button
                  className="modal-btn modal-btn-primary"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onClick={handleExportJSON}
                >
                  <Download size={14} />
                  Download as JSON
                </button>
              </div>

              <div className="modal-divider" />

              <div
                style={{
                  padding: "14px 16px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  background: "var(--bg-input)",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 10,
                  }}
                >
                  Import
                </p>
                <button
                  className="modal-btn"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  Import from JSON file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleImportFile}
                />
                {importError && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--danger)",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 6,
                      padding: "6px 10px",
                    }}
                  >
                    {importError}
                  </p>
                )}
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--text-500)",
                    lineHeight: 1.5,
                  }}
                >
                  Accepts JSON files exported from this tool. Current workflow
                  will be replaced.
                </p>
              </div>
            </div>

            <button className="modal-close-btn" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};
