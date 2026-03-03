/**
 * ExecutionPanel — frontend-only workflow simulation runner.
 * Shows per-node status, logs, token usage, cost, and timeline.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertCircle, CheckCircle, Clock, DollarSign, Loader2, Play, RotateCcw, Square, X, Zap } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useStore } from "../../store";
import { runSimulation, formatCost, formatDuration } from "../../services/executionSimulator";
import type { ExecutionResult, ExecutionRun } from "../../types";

export const ExecutionPanel: React.FC = () => {
  const showExecutionPanel = useStore((s) => s.showExecutionPanel);
  const setShowExecutionPanel = useStore((s) => s.setShowExecutionPanel);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const validationErrors = useStore((s) => s.validationErrors);
  const updateRunResult = useStore((s) => s.updateRunResult);
  const setCurrentRun = useStore((s) => s.setCurrentRun);
  const addExecutionRun = useStore((s) => s.addExecutionRun);
  const clearExecution = useStore((s) => s.clearExecution);
  const runValidation = useStore((s) => s.runValidation);

  const [run, setRun] = useState<ExecutionRun | null>(null);
  const [running, setRunning] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [speed, setSpeed] = useState(500);
  const abortRef = useRef(false);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleRun = useCallback(async () => {
    runValidation();
    if (Object.keys(useStore.getState().validationErrors).length > 0) return;

    abortRef.current = false;
    setRunning(true);
    clearExecution();
    setRun(null);

    const result = await runSimulation(
      nodes,
      edges,
      {
        onStepStart: (nodeId) => updateRunResult(nodeId, "running"),
        onStepComplete: (result: ExecutionResult) => {
          updateRunResult(result.nodeId, result.status);
          setRun((prev) => prev ? { ...prev, results: [...prev.results, result] } : null);
        },
        onRunComplete: (r) => {
          setRun(r);
          setCurrentRun(r);
          addExecutionRun(r);
          setRunning(false);
        },
        onRunFailed: (_, r) => {
          setRun(r);
          setCurrentRun(r);
          addExecutionRun(r);
          setRunning(false);
        },
      },
      speed
    );
    setRun(result);
  }, [nodes, edges, speed, updateRunResult, setCurrentRun, addExecutionRun, clearExecution, runValidation]);

  const handleStop = useCallback(() => {
    abortRef.current = true;
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    clearExecution();
    setRun(null);
    setRunning(false);
    setExpandedNode(null);
  }, [clearExecution]);

  if (!showExecutionPanel) return null;

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle size={13} className="exec-status-ok" />;
    if (status === "failed") return <AlertCircle size={13} className="exec-status-fail" />;
    if (status === "running") return <Loader2 size={13} className="exec-status-running" />;
    return <Clock size={13} className="exec-status-pending" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && setShowExecutionPanel(false)}
      >
        <motion.div
          className="modal-panel exec-panel"
          initial={{ scale: 0.93, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title-row">
              <Zap size={20} className="modal-title-icon" />
              <h2>Execution Simulator</h2>
            </div>
            <p className="modal-subtitle">Simulate your workflow client-side with realistic mock execution.</p>
            <button className="modal-close" onClick={() => setShowExecutionPanel(false)}><X size={18} /></button>
          </div>

          {/* Controls */}
          <div className="exec-controls">
            {hasErrors && (
              <div className="exec-warning">
                <AlertCircle size={13} />
                <span>{Object.keys(validationErrors).length} node(s) have missing credentials. They will be skipped.</span>
              </div>
            )}
            <div className="exec-controls-row">
              <label className="exec-speed-label">
                Speed
                <select className="exec-speed-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={200}>Fast</option>
                  <option value={500}>Normal</option>
                  <option value={1000}>Slow</option>
                </select>
              </label>

              {!running ? (
                <button className="exec-run-btn" onClick={() => void handleRun()} disabled={!nodes.length}>
                  <Play size={14} />
                  Run Simulation
                </button>
              ) : (
                <button className="exec-stop-btn" onClick={handleStop}>
                  <Square size={14} />
                  Stop
                </button>
              )}
              <button className="exec-reset-btn" onClick={handleReset} disabled={running}>
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Summary stats */}
          {run && (
            <div className="exec-stats">
              <div className="exec-stat">
                <Activity size={12} />
                <span>{run.results.filter((r) => r.status === "success").length}/{run.plan.steps.length} passed</span>
              </div>
              <div className="exec-stat">
                <Clock size={12} />
                <span>{run.completedAt ? formatDuration(run.completedAt - run.startedAt) : "—"}</span>
              </div>
              <div className="exec-stat">
                <Zap size={12} />
                <span>{run.totalTokens.toLocaleString()} tokens</span>
              </div>
              <div className="exec-stat">
                <DollarSign size={12} />
                <span>{formatCost(run.totalCostUSD)}</span>
              </div>
              <div className={`exec-stat exec-stat-status exec-stat-${run.status}`}>
                {run.status}
              </div>
            </div>
          )}

          {/* Step list */}
          <div className="exec-steps">
            {(run?.plan?.steps ?? []).map((step, i) => {
              const result = run?.results.find((r) => r.nodeId === step.nodeId);
              const isRunning = running && !result && i === run?.results.length;
              const status = result?.status ?? (isRunning ? "running" : "pending");

              return (
                <div key={step.nodeId} className={`exec-step exec-step-${status}`}>
                  <button
                    className="exec-step-header"
                    onClick={() => setExpandedNode(expandedNode === step.nodeId ? null : step.nodeId)}
                  >
                    <span className="exec-step-icon">{statusIcon(status)}</span>
                    <span className="exec-step-name">{step.nodeLabel}</span>
                    <span className="exec-step-type">{step.nodeType}</span>
                    {result?.durationMs && <span className="exec-step-dur">{formatDuration(result.durationMs)}</span>}
                    {result?.tokenUsage && <span className="exec-step-tokens">{result.tokenUsage.total} tok</span>}
                  </button>
                  {expandedNode === step.nodeId && result && (
                    <div className="exec-step-logs">
                      {result.logs.map((log, li) => (
                        <div key={li} className={`exec-log-line${log.includes("ERROR") ? " exec-log-error" : ""}`}>
                          {log}
                        </div>
                      ))}
                      {result.error && <div className="exec-log-error">{result.error}</div>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {!run && !running && (
              <div className="exec-empty">
                <Activity size={24} />
                <p>Click &quot;Run Simulation&quot; to execute your workflow</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
