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
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
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
            <img src={appIcon} alt="AuraFlow" className="auth-app-icon" />
          </div>
          <p className="auth-loading-title">AuraFlow</p>
          <p className="auth-loading-sub">Initializing workspace…</p>
        </div>
      </div>
    );
  }

  if (!user && isGoogleConfigured) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, undo, redo } = useStore();

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (cmd && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Escape") setChatOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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
