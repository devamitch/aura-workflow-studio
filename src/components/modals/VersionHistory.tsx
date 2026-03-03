/**
 * VersionHistory — local workflow snapshots with restore and diff info.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Clock, GitBranch, RotateCcw, Trash2, X } from "lucide-react";
import React from "react";
import { useStore } from "../../store";

export const VersionHistory: React.FC = () => {
  const showVersionHistory = useStore((s) => s.showVersionHistory);
  const setShowVersionHistory = useStore((s) => s.setShowVersionHistory);
  const versions = useStore((s) => s.versions);
  const createVersion = useStore((s) => s.createVersion);
  const restoreVersion = useStore((s) => s.restoreVersion);
  const deleteVersion = useStore((s) => s.deleteVersion);
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  if (!showVersionHistory) return null;

  const handleSnapshot = () => {
    createVersion(`Snapshot — ${nodes.length} nodes`);
  };

  const handleRestore = (id: string) => {
    if (confirm("Restore this version? Current canvas will be replaced.")) {
      restoreVersion(id);
      setShowVersionHistory(false);
    }
  };

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && setShowVersionHistory(false)}
      >
        <motion.div
          className="modal-panel version-panel"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
        >
          <div className="modal-header">
            <div className="modal-title-row">
              <GitBranch size={18} className="modal-title-icon" />
              <h2>Version History</h2>
            </div>
            <p className="modal-subtitle">Snapshots are stored locally (up to 30).</p>
            <button className="modal-close" onClick={() => setShowVersionHistory(false)}><X size={18} /></button>
          </div>

          <div className="version-body">
            {/* Current state */}
            <div className="version-current">
              <div className="version-current-info">
                <span className="version-current-dot" />
                <div>
                  <div className="version-current-label">Current State</div>
                  <div className="version-meta">{nodes.length} nodes · {edges.length} edges</div>
                </div>
              </div>
              <button className="version-snapshot-btn" onClick={handleSnapshot}>
                <Camera size={13} />
                Save Snapshot
              </button>
            </div>

            {/* Snapshots list */}
            {versions.length === 0 ? (
              <div className="version-empty">
                <Clock size={24} />
                <p>No snapshots yet.</p>
                <p>Click &quot;Save Snapshot&quot; to create one.</p>
              </div>
            ) : (
              <div className="version-list">
                {versions.map((v) => (
                  <div key={v.id} className="version-item">
                    <div className="version-item-info">
                      <div className="version-item-label">{v.label}</div>
                      <div className="version-meta">
                        <Clock size={10} />
                        {relativeTime(v.timestamp)} · {v.nodes.length} nodes · {v.edges.length} edges
                      </div>
                    </div>
                    <div className="version-item-actions">
                      <button
                        className="version-restore-btn"
                        onClick={() => handleRestore(v.id)}
                        title="Restore this version"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        className="version-delete-btn"
                        onClick={() => deleteVersion(v.id)}
                        title="Delete snapshot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
