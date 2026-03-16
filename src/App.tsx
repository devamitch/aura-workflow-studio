import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import { shallow } from "zustand/shallow";
import appIcon from "./assets/app-icon.png";
import authBanner from "./assets/auth-banner.png";
import { AuthGate } from "./components/auth/AuthGate";
import { PipelineUI } from "./components/canvas/PipelineUI";
import { Header } from "./components/layout/Header";
import { RightChatPanel } from "./components/layout/RightChatPanel";
import { ExecutionPanel } from "./components/modals/ExecutionPanel";
import { ExportModal } from "./components/modals/ExportModal";
import { IntentOrchestrator } from "./components/modals/IntentOrchestrator";
import { VersionHistory } from "./components/modals/VersionHistory";
import SettingsPage from "./components/settings/SettingsPage";
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
import { KeyboardHelp } from "./components/ui/KeyboardHelp";
import { Toaster } from "./components/ui/Toaster";
import { LandingPage } from "./components/landing/LandingPage";
import { PrivacyPage } from "./components/landing/PrivacyPage";
import { TermsPage } from "./components/landing/TermsPage";
import { useAuthMeSync } from "./hooks/useAuthMeSync";
import { GOOGLE_CLIENT_ID, isGoogleConfigured } from "./lib/google-auth";
import { useStore } from "./store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useStore((s) => s.user);
  const loading = useStore((s) => s.loading);

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <img src={authBanner} alt="" className="auth-loading-bg" />
        <div className="auth-loading-orb" />
        <div className="auth-loading-content">
          <div className="auth-loading-icon-wrap">
            <img src={appIcon} alt="Aura Engine" className="auth-app-icon" />
          </div>
          <p className="auth-loading-title">Aura Engine</p>
          <p className="auth-loading-sub">Initializing workspace…</p>
        </div>
      </div>
    );
  }

  if (!user && isGoogleConfigured) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  useAuthMeSync();
  const [chatOpen, setChatOpen] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const {
    theme,
    undo,
    redo,
    setSelectedNode,
    selectedNodeId,
    applyAutoLayout,
    setRightPanelMode,
  } = useStore(
    (s) => ({
      theme: s.theme,
      undo: s.undo,
      redo: s.redo,
      setSelectedNode: s.setSelectedNode,
      selectedNodeId: s.selectedNodeId,
      applyAutoLayout: s.applyAutoLayout,
      setRightPanelMode: s.setRightPanelMode,
    }),
    shallow,
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Auto-open right panel when a node is selected
  useEffect(() => {
    if (selectedNodeId) {
      setChatOpen(true);
      setRightPanelMode("node-config");
    }
  }, [selectedNodeId, setRightPanelMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      // Undo / Redo
      if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (cmd && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      // Toggle right panel: Cmd+\
      if (cmd && e.key === "\\") {
        e.preventDefault();
        setChatOpen((v) => !v);
        return;
      }
      // Auto layout: Cmd+L
      if (cmd && e.key.toLowerCase() === "l") {
        e.preventDefault();
        applyAutoLayout();
        return;
      }
      // Switch to AI Chat tab: Cmd+1
      if (cmd && e.key === "1") {
        e.preventDefault();
        setChatOpen(true);
        setRightPanelMode("chat");
        return;
      }
      // Switch to Node Config tab: Cmd+2
      if (cmd && e.key === "2") {
        e.preventDefault();
        setChatOpen(true);
        setRightPanelMode("node-config");
        return;
      }
      // Keyboard help: ?
      if (e.key === "?" && !cmd) {
        setShowKeyboardHelp((v) => !v);
        return;
      }
      // Escape: deselect + close panel + close help
      if (e.key === "Escape") {
        setShowKeyboardHelp(false);
        setSelectedNode(null);
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setSelectedNode, applyAutoLayout, setRightPanelMode]);

  const AppShell = ({
    children,
    showBottomBar,
    showToolBar,
  }: {
    children: React.ReactNode;
    showBottomBar?: boolean;
    showToolBar?: boolean;
  }) => (
    <ReactFlowProvider>
      <div className="app-shell">
        <Header
          showMenu={showToolBar}
          toolbarOpen={toolbarOpen}
          setToolbarOpen={setToolbarOpen}
        />
        <div className="app-body">
          {showToolBar && (
            <>
              <aside className={`left-palette ${toolbarOpen ? "open" : ""}`}>
                <PipelineToolbar />
              </aside>
              <div
                className="left-palette-backdrop"
                onClick={() => setToolbarOpen(false)}
              />
            </>
          )}
          <main
            className={`canvas-area${showBottomBar ? "" : " canvas-area--settings"}`}
          >
            {children}
            {showBottomBar && (
              <IntegratedBottomBar
                onToggleChat={() => setChatOpen((v) => !v)}
                chatOpen={chatOpen}
              />
            )}
          </main>
          <RightChatPanel
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            onOpen={() => setChatOpen(true)}
          />
        </div>
      </div>

      {/* Global modals — rendered outside layout flow */}
      <IntentOrchestrator />
      <ExecutionPanel />
      <ExportModal />
      <VersionHistory />
      {showKeyboardHelp && (
        <KeyboardHelp onClose={() => setShowKeyboardHelp(false)} />
      )}
    </ReactFlowProvider>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthGate />} />
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SettingsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell showBottomBar showToolBar>
                  <PipelineUI />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Global toast notifications — renders as a portal above everything */}
      <Toaster />
    </GoogleOAuthProvider>
  );
};

export default App;
