import React, { useRef, useState } from "react";
import {
  Download,
  FilePlus,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  PlayCircle,
  Save,
  Settings,
  Sparkles,
  Sun,
  Upload,
  Crown,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../../store";
import { WorkflowsModal } from "../sidebar/WorkflowsModal";

export const Header: React.FC = () => {
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [savePrompt, setSavePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, toggleTheme, user, signOut, clearCanvas, loadDemo, saveWorkflow, exportToJSON, importFromJSON, applyAutoLayout } = useStore();

  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const handleSaveConfirm = () => {
    saveWorkflow(saveName.trim() || "Untitled");
    setSavePrompt(false);
    setSaveName("");
  };

  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-workflow-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importFromJSON(ev.target?.result as string);
      if (!result.ok) alert(`Import failed: ${result.error}`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const displayName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <>
      <header className="app-header">
        {/* Brand */}
        <div className="header-brand">
          <div className="header-logo-mark">
            <Sparkles size={16} />
          </div>
          <span className="header-logo-text">
            Aura<span>AI</span>
          </span>
          <span className="header-badge">BETA</span>
        </div>

        {/* Center: Workflow actions */}
        <div className="header-actions">
          <button className="header-btn" onClick={clearCanvas} title="New Workflow">
            <FilePlus size={14} />
            <span>New</span>
          </button>

          {savePrompt ? (
            <div className="header-save-row">
              <input
                ref={saveInputRef}
                className="header-save-input"
                placeholder="Workflow name…"
                value={saveName}
                autoFocus
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveConfirm();
                  if (e.key === "Escape") { setSavePrompt(false); setSaveName(""); }
                }}
              />
              <button className="header-btn header-btn-primary" onClick={handleSaveConfirm}>
                Save
              </button>
              <button className="header-btn" onClick={() => { setSavePrompt(false); setSaveName(""); }}>
                ✕
              </button>
            </div>
          ) : (
            <button
              className="header-btn"
              onClick={() => { setSavePrompt(true); setTimeout(() => saveInputRef.current?.focus(), 50); }}
              title="Save Workflow"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          )}

          <button className="header-btn" onClick={() => setShowWorkflowsModal(true)} title="Open Workflows">
            <FolderOpen size={14} />
            <span>Open</span>
          </button>

          <div className="header-divider" />

          <button className="header-btn" onClick={loadDemo} title="Load Demo">
            <PlayCircle size={14} />
            <span>Demo</span>
          </button>
          <button className="header-btn" onClick={applyAutoLayout} title="Auto Layout">
            <LayoutDashboard size={14} />
            <span>Layout</span>
          </button>
          <button className="header-btn" onClick={handleExport} title="Export JSON">
            <Download size={14} />
            <span>Export</span>
          </button>
          <button className="header-btn" onClick={() => fileInputRef.current?.click()} title="Import JSON">
            <Upload size={14} />
            <span>Import</span>
          </button>
        </div>

        {/* Right: Stats + theme + user */}
        <div className="header-right">
          <div className="header-stats">
            <span className="header-stat-chip">{nodes.length} nodes</span>
            <span className="header-stat-chip">{edges.length} edges</span>
          </div>

          <button className="header-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="header-user-menu" onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}>
              <button
                className="header-user-btn"
                onClick={() => setShowUserMenu((v) => !v)}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={displayName} className="header-avatar" />
                ) : (
                  <div className="header-avatar-fallback">{displayName[0].toUpperCase()}</div>
                )}
                <span className="header-user-name">{displayName}</span>
                {user.is_premium && <Crown size={12} className="header-premium-crown" />}
                <ChevronDown size={12} />
              </button>

              {showUserMenu && (
                <div className="header-dropdown">
                  <div className="header-dropdown-user">
                    <div className="header-dropdown-email">{user.email}</div>
                    {user.is_premium ? (
                      <span className="header-plan-badge premium">Premium</span>
                    ) : (
                      <span className="header-plan-badge free">Free Plan</span>
                    )}
                  </div>
                  <div className="header-dropdown-divider" />
                  <button className="header-dropdown-item">
                    <Settings size={13} />
                    Settings
                  </button>
                  <button
                    className="header-dropdown-item danger"
                    onClick={() => void signOut()}
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {showWorkflowsModal && (
        <WorkflowsModal onClose={() => setShowWorkflowsModal(false)} />
      )}
    </>
  );
};
