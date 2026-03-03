/**
 * ExportModal — ZIP project scaffolder.
 * Choose project type, review required secrets, download ZIP.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, Code2, Download, Globe, Layers, Loader2, Server, X } from "lucide-react";
import React, { useState } from "react";
import { useStore } from "../../store";
import { exportProjectZip } from "../../services/zipExporter";
import { generateMasterPrompt } from "../../services/masterPromptGenerator";
import type { ExportProjectType } from "../../types";

interface ProjectTypeOption {
  type: ExportProjectType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const PROJECT_TYPES: ProjectTypeOption[] = [
  { type: "telegram-bot",    label: "Telegram Bot",         desc: "node-telegram-bot-api + Express backend", icon: <Bot size={18} /> },
  { type: "discord-bot",     label: "Discord Bot",          desc: "discord.js + Express backend",           icon: <Bot size={18} /> },
  { type: "whatsapp-bot",    label: "WhatsApp Bot",         desc: "Twilio + Express backend",               icon: <Bot size={18} /> },
  { type: "react-spa",       label: "React SPA",            desc: "Vite + React frontend",                  icon: <Globe size={18} /> },
  { type: "node-api",        label: "Node.js API",          desc: "Express REST API",                       icon: <Server size={18} /> },
  { type: "fullstack-docker",label: "Fullstack Docker",     desc: "React + Node + docker-compose",          icon: <Layers size={18} /> },
  { type: "wordpress-plugin",label: "WordPress Plugin",     desc: "PHP plugin scaffold",                    icon: <Code2 size={18} /> },
];

export const ExportModal: React.FC = () => {
  const showExportModal = useStore((s) => s.showExportModal);
  const setShowExportModal = useStore((s) => s.setShowExportModal);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [projectType, setProjectType] = useState<ExportProjectType>("fullstack-docker");
  const [workflowName, setWorkflowName] = useState("My Aura Workflow");
  const [exporting, setExporting] = useState(false);
  const [masterPromptCopied, setMasterPromptCopied] = useState(false);

  const masterPrompt = generateMasterPrompt(nodes, edges, workflowName);

  const close = () => { setShowExportModal(false); setStep(1); setExporting(false); };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProjectZip(nodes, edges, projectType, workflowName);
      setStep(3);
    } catch (e) {
      alert("Export failed: " + String(e));
    } finally {
      setExporting(false);
    }
  };

  const copyMasterPrompt = () => {
    void navigator.clipboard.writeText(masterPrompt);
    setMasterPromptCopied(true);
    setTimeout(() => setMasterPromptCopied(false), 2000);
  };

  if (!showExportModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <motion.div
          className="modal-panel export-panel"
          initial={{ scale: 0.93, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
        >
          <div className="modal-header">
            <div className="modal-title-row">
              <Download size={20} className="modal-title-icon" />
              <h2>Export Project</h2>
            </div>
            <div className="export-steps-indicator">
              {[1,2,3].map((s) => (
                <div key={s} className={`export-step-dot${step >= s ? " active" : ""}`}>{s}</div>
              ))}
            </div>
            <button className="modal-close" onClick={close}><X size={18} /></button>
          </div>

          {/* Step 1: Choose project type + name */}
          {step === 1 && (
            <div className="export-body">
              <div className="export-field">
                <label className="export-label">Workflow Name</label>
                <input
                  className="export-input"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="My Aura Workflow"
                />
              </div>
              <div className="export-field">
                <label className="export-label">Project Type</label>
                <div className="export-type-grid">
                  {PROJECT_TYPES.map((pt) => (
                    <button
                      key={pt.type}
                      className={`export-type-card${projectType === pt.type ? " selected" : ""}`}
                      onClick={() => setProjectType(pt.type)}
                    >
                      <span className="export-type-icon">{pt.icon}</span>
                      <span className="export-type-label">{pt.label}</span>
                      <span className="export-type-desc">{pt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="export-footer">
                <button className="io-generate-btn" onClick={() => setStep(2)}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Summary + master prompt */}
          {step === 2 && (
            <div className="export-body">
              <div className="export-summary">
                <div className="export-summary-row">
                  <span>Workflow</span><strong>{workflowName}</strong>
                </div>
                <div className="export-summary-row">
                  <span>Type</span><strong>{PROJECT_TYPES.find((p) => p.type === projectType)?.label}</strong>
                </div>
                <div className="export-summary-row">
                  <span>Nodes</span><strong>{nodes.length}</strong>
                </div>
                <div className="export-summary-row">
                  <span>Edges</span><strong>{edges.length}</strong>
                </div>
              </div>
              <div className="export-prompt-section">
                <div className="export-prompt-header">
                  <span>Master System Prompt</span>
                  <button className="export-copy-btn" onClick={copyMasterPrompt}>
                    {masterPromptCopied ? <CheckCircle size={12} /> : null}
                    {masterPromptCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="export-prompt-preview">{masterPrompt.slice(0, 800)}{masterPrompt.length > 800 ? "\n..." : ""}</pre>
              </div>
              <div className="export-footer">
                <button className="io-back-btn" onClick={() => setStep(1)}>← Back</button>
                <button className="io-generate-btn" onClick={() => void handleExport()} disabled={exporting}>
                  {exporting ? <Loader2 size={14} className="io-spin" /> : <Download size={14} />}
                  {exporting ? "Generating ZIP..." : "Download ZIP"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="export-body io-done">
              <div className="io-success">
                <CheckCircle size={40} className="io-success-icon" />
                <h3>Export Complete!</h3>
                <p>Your project ZIP has been downloaded.</p>
                <div className="export-done-instructions">
                  <code>cd {workflowName.toLowerCase().replace(/\s+/g, "-")}-aura-export</code>
                  <code>npm install</code>
                  <code>cp .env.template .env  # Fill in credentials</code>
                  <code>npm run dev</code>
                </div>
                <p className="io-success-hint">Or use <code>docker-compose up --build</code> for containerized deployment.</p>
              </div>
              <div className="io-footer io-footer-center">
                <button className="io-generate-btn" onClick={close}>Done</button>
                <button className="io-back-btn" onClick={() => setStep(1)}>Export Again</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
