import { Palette, Pencil, Waves, X } from "lucide-react";
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
  const updateEdgeStyle = useStore((s) => s.updateEdgeStyle);

  useEffect(() => {
    setDraft((label as string) ?? "");
  }, [label]);

  const parallelEdges = allEdges.filter((e) => e.source === source && e.target === target);
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

  const currentEdge = allEdges.find((e) => e.id === id);
  const edgeColor =
    (currentEdge?.data as any)?.edgeColor ??
    "var(--text-300)";
  const edgeVariant: "solid" | "dashed" =
    ((currentEdge?.data as any)?.edgeVariant as "solid" | "dashed") ?? "solid";

  const edgeStyle = {
    ...style,
    stroke: edgeColor,
    strokeDasharray: edgeVariant === "dashed" ? "6 4" : undefined,
  };

  const cycleColor = () => {
    const palette = [
      "var(--text-300)",
      "var(--node-emerald)",
      "var(--node-violet)",
      "var(--node-blue)",
      "var(--node-amber)",
      "var(--node-rose)",
    ];
    const idx = palette.indexOf(edgeColor);
    const next = palette[(idx + 1 + palette.length) % palette.length];
    updateEdgeStyle(id, { color: next });
  };

  const toggleVariant = () => {
    updateEdgeStyle(id, { variant: edgeVariant === "solid" ? "dashed" : "solid" });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
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
                    className="edge-action-btn"
                    onClick={cycleColor}
                    title="Cycle connection color"
                  >
                    <Palette size={9} />
                  </button>
                  <button
                    className="edge-action-btn"
                    onClick={toggleVariant}
                    title="Toggle solid/dashed"
                  >
                    <Waves size={9} />
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
