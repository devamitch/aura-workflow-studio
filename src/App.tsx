import { Menu, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { PipelineUI } from "./components/canvas/PipelineUI";
import { PipelineToolbar } from "./components/sidebar/Toolbar";
import { IntegratedBottomBar } from "./components/ui/IntegratedBottomBar";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { useStore } from "./store";

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const { theme } = useStore();

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
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <ReactFlowProvider>
      <div className="app-container">
        <button
          className="mobile-toggle-btn"
          onClick={() => setIsSidebarOpen((v) => !v)}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div
          className={`sidebar-backdrop ${isSidebarOpen ? "visible" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        <div className={`sidebar-container ${isSidebarOpen ? "open" : ""}`}>
          <PipelineToolbar />
        </div>

        <main className="main-content">
          <section className="canvas-wrapper">
            <div className="canvas-bg-orbs" aria-hidden="true" />

            <PipelineUI />
            <ThemeToggle />
            <IntegratedBottomBar />
          </section>
        </main>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
