import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { AuthGate } from "./components/auth/AuthGate";
import { PipelineUI } from "./components/canvas/PipelineUI";
import { Header } from "./components/layout/Header";
import { RightChatPanel } from "./components/layout/RightChatPanel";
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
import { GOOGLE_CLIENT_ID } from "./lib/google-auth";
import { useStore } from "./store";

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
      <AuthGate>
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
              <RightChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
            </div>
          </div>
        </ReactFlowProvider>
      </AuthGate>
    </GoogleOAuthProvider>
  );
};

export default App;
