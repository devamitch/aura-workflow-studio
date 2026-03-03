import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import appIcon from "./assets/app-icon.png";
import authBanner from "./assets/auth-banner.png";
import { AuthGate } from "./components/auth/AuthGate";
import { PipelineUI } from "./components/canvas/PipelineUI";
import { Header } from "./components/layout/Header";
import { RightChatPanel } from "./components/layout/RightChatPanel";
import { IntentOrchestrator } from "./components/modals/IntentOrchestrator";
import { ExecutionPanel } from "./components/modals/ExecutionPanel";
import { ExportModal } from "./components/modals/ExportModal";
import { VersionHistory } from "./components/modals/VersionHistory";
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
import { KeyboardHelp } from "./components/ui/KeyboardHelp";
import { GOOGLE_CLIENT_ID, isGoogleConfigured } from "./lib/google-auth";
import { useStore } from "./store";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useStore();

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
  const [chatOpen, setChatOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const theme = useStore((s) => s.theme);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const setSelectedNode = useStore((s) => s.setSelectedNode);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const applyAutoLayout = useStore((s) => s.applyAutoLayout);
  const setRightPanelMode = useStore((s) => s.setRightPanelMode);

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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthGate />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ReactFlowProvider>
                  <div className="app-shell">
                    <Header />
                    <div className="app-body">
                      <aside className="left-palette">
                        <PipelineToolbar />
                      </aside>
                      <main className="canvas-area">
                        <PipelineUI />
                        <IntegratedBottomBar
                          onToggleChat={() => setChatOpen((v) => !v)}
                          chatOpen={chatOpen}
                        />
                      </main>
                      <RightChatPanel
                        open={chatOpen}
                        onClose={() => setChatOpen(false)}
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
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;
