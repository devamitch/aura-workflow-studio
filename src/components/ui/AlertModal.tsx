import { ShieldCheck } from "lucide-react";
import React from "react";
import type { ParseResponse } from "../../types";

interface AlertModalProps {
  data: ParseResponse;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ data, onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        <div className="modal-header">
          <ShieldCheck className="modal-header-icon" size={28} />
          <span className="modal-header-title">Pipeline Analysis</span>
        </div>

        <div className="modal-stats">
          <div className="modal-stat">
            <span className="modal-stat-label">Nodes</span>
            <span className="modal-stat-value">{data.num_nodes}</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-label">Edges</span>
            <span className="modal-stat-value">{data.num_edges}</span>
          </div>
          <div className="modal-stat">
            <span className="modal-stat-label">DAG Status</span>
            <span
              className={`modal-badge ${data.is_dag ? "modal-badge-success" : "modal-badge-warning"}`}
            >
              {data.is_dag ? "✓ Valid DAG" : "⚠ Contains Cycles"}
            </span>
          </div>
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
