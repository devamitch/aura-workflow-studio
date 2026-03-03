/**
 * IntentOrchestrator — the master "prompt → canvas" modal.
 * User types a natural-language description; AI generates the full workflow.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle, ChevronRight, Loader2, Sparkles, Wand2, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { useStore } from "../../store";
import { generateWorkflowFromPrompt, streamTaskPlan } from "../../services/promptToCanvas";

interface Step {
  text: string;
  done: boolean;
}

export const IntentOrchestrator: React.FC = () => {
  const showIntentOrchestrator = useStore((s) => s.showIntentOrchestrator);
  const setShowIntentOrchestrator = useStore((s) => s.setShowIntentOrchestrator);
  const applyGeneratedGraph = useStore((s) => s.applyGeneratedGraph);
  const consumeCredit = useStore((s) => s.consumeCredit);

  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"input" | "planning" | "plan-ready" | "generating" | "done" | "error">("input");
  const [planText, setPlanText] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState("");
  const [nodeCount, setNodeCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setPhase("input"); setPlanText(""); setSteps([]); setError(""); setPrompt(""); setNodeCount(0);
  };

  const close = () => { setShowIntentOrchestrator(false); reset(); };

  // ── Phase 1: Generate task plan ───────────────────────────────────────────
  const handleGeneratePlan = async () => {
    if (!prompt.trim()) return;
    if (!consumeCredit()) {
      setError("You've used all your free credits. Please upgrade to continue.");
      setPhase("error");
      return;
    }
    setPhase("planning");
    setPlanText("");
    setSteps([]);
    try {
      let accumulated = "";
      for await (const chunk of streamTaskPlan(prompt)) {
        accumulated += chunk;
        setPlanText(accumulated);
        // Parse numbered steps from accumulated text
        const matches = accumulated.match(/^\d+\..+/gm) ?? [];
        setSteps(matches.map((t) => ({ text: t, done: false })));
      }
      setPhase("plan-ready");
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  };

  // ── Phase 2: Generate workflow JSON and apply to canvas ───────────────────
  const handleBuildWorkflow = async () => {
    setPhase("generating");
    try {
      // Animate steps as "processing"
      for (let i = 0; i < steps.length; i++) {
        await new Promise<void>((r) => setTimeout(r, 300));
        setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, done: true } : s));
      }

      const { nodes, edges } = await generateWorkflowFromPrompt(prompt);
      setNodeCount(nodes.length);
      applyGeneratedGraph(nodes, edges);
      setPhase("done");
    } catch (e) {
      setError(String(e));
      setPhase("error");
    }
  };

  if (!showIntentOrchestrator) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <motion.div
          className="modal-panel io-panel"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title-row">
              <Wand2 size={20} className="modal-title-icon" />
              <h2>Intent Orchestrator</h2>
            </div>
            <p className="modal-subtitle">Describe your automation — Aura builds the workflow.</p>
            <button className="modal-close" onClick={close}><X size={18} /></button>
          </div>

          {/* Input phase */}
          {(phase === "input" || phase === "error") && (
            <div className="io-body">
              <div className="io-prompt-wrap">
                <Bot size={16} className="io-prompt-icon" />
                <textarea
                  ref={textareaRef}
                  className="io-textarea"
                  placeholder="e.g. &quot;Build a Telegram bot that receives a message, asks GPT-4o to summarize it, and saves the result to Supabase&quot;"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleGeneratePlan(); }}
                />
              </div>
              {error && <div className="io-error">{error}</div>}
              <div className="io-examples">
                {["Telegram bot with GPT-4o that answers questions", "Webhook → filter → email notification pipeline", "RAG chatbot with Supabase vector storage"].map((ex) => (
                  <button key={ex} className="io-example-chip" onClick={() => setPrompt(ex)}>{ex}</button>
                ))}
              </div>
              <div className="io-footer">
                <span className="io-hint">Cmd+Enter to generate</span>
                <button className="io-generate-btn" onClick={() => void handleGeneratePlan()} disabled={!prompt.trim()}>
                  <Sparkles size={15} />
                  Generate Plan
                </button>
              </div>
            </div>
          )}

          {/* Planning phase */}
          {phase === "planning" && (
            <div className="io-body io-planning">
              <div className="io-loading-row">
                <Loader2 size={16} className="io-spin" />
                <span>Analyzing your intent...</span>
              </div>
              {planText && (
                <div className="io-plan-preview">
                  <pre>{planText}<span className="io-cursor">▋</span></pre>
                </div>
              )}
            </div>
          )}

          {/* Plan ready */}
          {phase === "plan-ready" && (
            <div className="io-body">
              <div className="io-plan-header">
                <CheckCircle size={16} className="io-plan-ok" />
                <span>Aura&apos;s Workflow Plan</span>
              </div>
              <div className="io-steps-list">
                {steps.map((step, i) => (
                  <div key={i} className={`io-step${step.done ? " done" : ""}`}>
                    <ChevronRight size={13} />
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>
              <div className="io-footer">
                <button className="io-back-btn" onClick={() => setPhase("input")}>Edit Prompt</button>
                <button className="io-generate-btn" onClick={() => void handleBuildWorkflow()}>
                  <Wand2 size={15} />
                  Build Workflow
                </button>
              </div>
            </div>
          )}

          {/* Generating */}
          {phase === "generating" && (
            <div className="io-body io-generating">
              <div className="io-loading-row">
                <Loader2 size={16} className="io-spin" />
                <span>Building your workflow...</span>
              </div>
              <div className="io-steps-list">
                {steps.map((step, i) => (
                  <div key={i} className={`io-step${step.done ? " done" : ""}`}>
                    {step.done ? <CheckCircle size={13} className="io-step-done" /> : <ChevronRight size={13} />}
                    <span>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {phase === "done" && (
            <div className="io-body io-done">
              <div className="io-success">
                <CheckCircle size={40} className="io-success-icon" />
                <h3>Workflow Generated!</h3>
                <p>{nodeCount} nodes placed on the canvas with auto-layout.</p>
                <p className="io-success-hint">Click any node to configure credentials and settings.</p>
              </div>
              <div className="io-footer io-footer-center">
                <button className="io-generate-btn" onClick={close}>
                  View Workflow
                </button>
                <button className="io-back-btn" onClick={reset}>Build Another</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
