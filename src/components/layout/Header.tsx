import {
  ChevronDown,
  Crown,
  Download,
  FilePlus,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Moon,
  PlayCircle,
  Save,
  Settings,
  Sun,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { AUTH_ME_QUERY_KEY } from "../../hooks/useAuthMeSync";
import { useStore } from "../../store";
import { WorkflowsModal } from "../sidebar/WorkflowsModal";
import { PricingModal } from "../ui/PricingModal";

export const Header: React.FC = () => {
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [savePrompt, setSavePrompt] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    theme,
    toggleTheme,
    user,
    signOut,
    clearCanvas,
    loadDemo,
    saveWorkflow,
    exportToJSON,
    importFromJSON,
    applyAutoLayout,
    nodes,
    edges,
    plan,
    showPricingModal,
    pricingTab,
    setShowPricingModal,
    setShowIntentOrchestrator,
    setShowExecutionPanel,
    setShowExportModal,
    setShowVersionHistory,
  } = useStore(
    (s) => ({
      theme: s.theme,
      toggleTheme: s.toggleTheme,
      user: s.user,
      signOut: s.signOut,
      clearCanvas: s.clearCanvas,
      loadDemo: s.loadDemo,
      saveWorkflow: s.saveWorkflow,
      exportToJSON: s.exportToJSON,
      importFromJSON: s.importFromJSON,
      applyAutoLayout: s.applyAutoLayout,
      nodes: s.nodes,
      edges: s.edges,
      plan: s.plan,
      showPricingModal: s.showPricingModal,
      pricingTab: s.pricingTab,
      setShowPricingModal: s.setShowPricingModal,
      setShowIntentOrchestrator: s.setShowIntentOrchestrator,
      setShowExecutionPanel: s.setShowExecutionPanel,
      setShowExportModal: s.setShowExportModal,
      setShowVersionHistory: s.setShowVersionHistory,
    }),
    shallow,
  );

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
    },
  });

  const creditsLeft =
    plan.tier === "free"
      ? Math.max(0, plan.creditsTotal + plan.creditsExtra - plan.creditsUsed)
      : null;
  const creditsPercent =
    plan.tier === "free" ? (plan.creditsUsed / plan.creditsTotal) * 100 : 0;

  const handleSaveConfirm = () => {
    saveWorkflow(saveName.trim() || "Untitled");
    setSavePrompt(false);
    setSaveName("");
  };

  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AuraStudio-${new Date().toISOString().slice(0, 10)}.json`;
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

  const displayName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "User";

  return (
    <>
      <header className="app-header">
        {/* Brand */}
        <div className="header-brand">
          <div className="header-logo-mark">
            <img
              src="/app-icon.png"
              alt="Aura Engine"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
          </div>
          <span className="header-logo-text">
            Aura <span>Studio</span>
          </span>
          <span className="header-badge">v2</span>
        </div>

        {/* Center actions */}
        <div className="header-actions">
          {/* Prompt-to-canvas */}
          <button
            className="header-btn header-btn-magic"
            onClick={() => setShowIntentOrchestrator(true)}
            title="Build workflow from prompt"
          >
            <Wand2 size={14} />
            <span>Build with AI</span>
          </button>

          <div className="header-divider" />

          <button
            className="header-btn"
            onClick={clearCanvas}
            title="New Workflow"
          >
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
                  if (e.key === "Escape") {
                    setSavePrompt(false);
                    setSaveName("");
                  }
                }}
              />
              <button
                className="header-btn header-btn-primary"
                onClick={handleSaveConfirm}
              >
                Save
              </button>
              <button
                className="header-btn"
                onClick={() => {
                  setSavePrompt(false);
                  setSaveName("");
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="header-btn"
              onClick={() => {
                setSavePrompt(true);
                setTimeout(() => saveInputRef.current?.focus(), 50);
              }}
              title="Save Workflow"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          )}

          <button
            className="header-btn"
            onClick={() => setShowWorkflowsModal(true)}
            title="Open"
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </button>

          <div className="header-divider" />

          <button className="header-btn" onClick={loadDemo} title="Load Demo">
            <PlayCircle size={14} />
            <span>Demo</span>
          </button>
          <button
            className="header-btn"
            onClick={applyAutoLayout}
            title="Auto Layout (Dagre)"
          >
            <LayoutDashboard size={14} />
            <span>Layout</span>
          </button>
          <button
            className="header-btn"
            onClick={() => setShowVersionHistory(true)}
            title="Version History"
          >
            <GitBranch size={14} />
            <span>History</span>
          </button>
          <button
            className="header-btn"
            onClick={handleExportJSON}
            title="Export JSON"
          >
            <Download size={14} />
            <span>JSON</span>
          </button>
          <button
            className="header-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <div className="header-divider" />

          {/* Run simulation */}
          <button
            className="header-btn header-btn-run"
            onClick={() => setShowExecutionPanel(true)}
            title="Run Simulation"
          >
            <Zap size={14} />
            <span>Run</span>
          </button>

          {/* Export ZIP */}
          <button
            className="header-btn header-btn-export"
            onClick={() => setShowExportModal(true)}
            title="Export Project ZIP"
          >
            <Download size={14} />
            <span>Export ZIP</span>
          </button>
        </div>

        {/* Right */}
        <div className="header-right">
          <div className="header-stats">
            <span className="header-stat-chip">{nodes.length} nodes</span>
            <span className="header-stat-chip">{edges.length} edges</span>
          </div>

          {plan.tier === "free" && creditsLeft !== null && (
            <button
              className={`header-credits-bar${creditsLeft === 0 ? " depleted" : ""}`}
              onClick={() => setShowPricingModal(true, "credits")}
              title="Buy more credits"
            >
              <Zap size={11} />
              <span>
                {creditsLeft} / {plan.creditsTotal} credits
              </span>
              <div className="header-credits-track">
                <div
                  className="header-credits-fill"
                  style={{ width: `${Math.min(100, creditsPercent)}%` }}
                />
              </div>
            </button>
          )}

          {plan.tier !== "free" && (
            <div className={`header-plan-pill ${plan.tier}`}>
              <Crown size={11} />
              <span>{plan.tier === "annual" ? "Annual" : "Pro"}</span>
            </div>
          )}

          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="header-upgrade-btn"
            onClick={() => setShowPricingModal(true, "plans")}
            title="Upgrade"
          >
            <Crown size={13} />
            <span>{plan.tier === "free" ? "Upgrade" : "Plans"}</span>
          </button>

          {user && (
            <div
              className="header-user-menu"
              onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
            >
              <button
                className="header-user-btn"
                onClick={() => setShowUserMenu((v) => !v)}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={displayName}
                    className="header-avatar"
                  />
                ) : (
                  <div className="header-avatar-fallback">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                <span className="header-user-name">{displayName}</span>
                {plan.tier !== "free" && (
                  <Crown size={11} className="header-premium-crown" />
                )}
                <ChevronDown size={12} />
              </button>

              {showUserMenu && (
                <div className="header-dropdown">
                  <div className="header-dropdown-user">
                    <div className="header-dropdown-email">{user.email}</div>
                    <span className={`header-plan-badge ${plan.tier}`}>
                      {plan.tier === "free"
                        ? "Free Plan"
                        : plan.tier === "pro"
                          ? "Pro"
                          : "Annual"}
                    </span>
                  </div>
                  <div className="header-dropdown-divider" />
                  <button
                    className="header-dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPricingModal(true);
                    }}
                  >
                    <Crown size={13} />
                    Upgrade Plan
                  </button>
                  <button className="header-dropdown-item">
                    <Settings size={13} />
                    Settings
                  </button>
                  <button
                    className="header-dropdown-item danger"
                    onClick={() => {
                      setShowUserMenu(false);
                      signOutMutation.mutate();
                    }}
                    disabled={signOutMutation.isPending}
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
      {showPricingModal && (
        <PricingModal
          defaultTab={pricingTab}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </>
  );
};
