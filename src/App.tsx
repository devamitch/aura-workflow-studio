import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { AuthGate } from "./components/auth/AuthGate";
import { PipelineUI } from "./components/canvas/PipelineUI";
import { Header } from "./components/layout/Header";
import { RightChatPanel } from "./components/layout/RightChatPanel";
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
import { useStore } from "./store";

const App: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const { theme, undo, redo } = useStore();

  // Sync theme to body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Global keyboard shortcuts
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
    <AuthGate>
      <ReactFlowProvider>
        <div className="app-shell">
          {/* ── Top header ── */}
          <Header />

          {/* ── Body: left palette + canvas + right chat ── */}
          <div className="app-body">
            {/* Left: node palette */}
            <aside className="left-palette">
              <PipelineToolbar />
            </aside>

            {/* Center: canvas */}
            <main className="canvas-area">
              <div className="canvas-bg-orbs" aria-hidden="true" />
              <PipelineUI />

              {/* Bottom control bar sits over the canvas */}
              <IntegratedBottomBar
                onToggleChat={() => setChatOpen((v) => !v)}
                chatOpen={chatOpen}
              />
            </main>

            {/* Right: collapsible AI chat panel */}
            <RightChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
          </div>
        </div>
      </ReactFlowProvider>
    </AuthGate>
  );
};

export default App;
