import { Pencil, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { useStore } from "../../store";

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  style,
  label,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((label as string) ?? "");

  const deleteEdge = useStore((s) => s.deleteEdge);
  const updateEdgeLabel = useStore((s) => s.updateEdgeLabel);
  const allEdges = useStore((s) => s.edges);

  useEffect(() => {
    setDraft((label as string) ?? "");
  }, [label]);

  const parallelEdges = allEdges.filter(
    (e) => e.source === source && e.target === target,
  );
  const edgeIndex = parallelEdges.findIndex((e) => e.id === id);
  const parallelCount = parallelEdges.length;
  const curvature =
    parallelCount > 1
      ? 0.1 + (edgeIndex - (parallelCount - 1) / 2) * 0.45
      : 0.2;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const commit = () => {
    updateEdgeLabel(id, draft.trim());
    setEditing(false);
  };

  const openEdit = () => {
    setDraft((label as string) ?? "");
    setEditing(true);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {editing ? (
            <input
              autoFocus
              className="edge-label-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="Label…"
            />
          ) : (
            <div className="edge-label-group">
              {label && (
                <span className="edge-label" onDoubleClick={openEdit}>
                  {label as string}
                </span>
              )}
              {selected && (
                <div className="edge-actions">
                  <button
                    className="edge-action-btn"
                    onClick={openEdit}
                    title="Name connection"
                  >
                    <Pencil size={9} />
                  </button>
                  <button
                    className="edge-delete-btn"
                    onClick={() => deleteEdge(id)}
                    title="Delete connection"
                  >
                    <X size={9} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
