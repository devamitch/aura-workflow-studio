import { LucideIcon, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { Handle, NodeResizer, Position } from "reactflow";
import { useStore } from "../../store";
import type { HandleConfig } from "../../types";
import { AddHandleForm } from "./AddHandleForm";

interface BaseNodeProps {
  id: string;
  title: string;
  icon: LucideIcon;
  accentColor?: string;
  handles: HandleConfig[];
  customHandles?: HandleConfig[];
  children?: React.ReactNode;
  selected?: boolean;
  minWidth?: number;
  minHeight?: number;
  nodeType?: string;
  resizable?: boolean;
}

const positionMap: Record<string, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

function getHandlePercent(handle: HandleConfig, allHandles: HandleConfig[]): number {
  const sideHandles = allHandles.filter((h) => h.position === handle.position);
  const idx = sideHandles.findIndex((h) => h.id === handle.id);
  return ((idx + 1) / (sideHandles.length + 1)) * 100;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  title,
  icon: Icon,
  accentColor,
  handles,
  customHandles,
  children,
  selected,
  minWidth = 220,
  minHeight = 100,
  nodeType,
  resizable = true,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const removeNodeHandle = useStore((s) => s.removeNodeHandle);

  const allHandles = [...handles, ...(customHandles ?? [])];
  const customHandleIds = allHandles
    .filter((h) => h.isCustom)
    .map((h) => h.id);

  return (
    <div
      className={`pipeline-node${selected ? " selected" : ""}`}
      data-type={nodeType}
      style={{
        minWidth,
        minHeight,
        ...(accentColor ? { ["--node-accent" as string]: accentColor } : {}),
      }}
    >
      {resizable && (
        <NodeResizer
          minWidth={minWidth}
          minHeight={minHeight}
          isVisible={selected}
          lineClassName="resizer-line"
          handleClassName="resizer-handle"
        />
      )}

      <div className="pipeline-node-header">
        <Icon className="pipeline-node-icon" size={16} strokeWidth={2.5} />
        <span className="pipeline-node-title">{title}</span>
        <button
          className="node-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            useStore.getState().deleteNode(id);
          }}
          title="Delete Node"
        >
          <X size={14} />
        </button>
      </div>

      <div className="pipeline-node-body">{children}</div>

      <div className="pipeline-node-footer">
        {showAddForm ? (
          <AddHandleForm
            nodeId={id}
            existingHandleIds={[...handles.map((h) => h.id), ...customHandleIds]}
            onClose={() => setShowAddForm(false)}
          />
        ) : (
          <button
            className="add-handle-btn"
            onClick={() => setShowAddForm(true)}
            title="Add port"
          >
            <Plus size={10} />
            Add Port
          </button>
        )}
      </div>

      <div className="handles-layer">
        {allHandles.map((handle) => {
          const pos = positionMap[handle.position] ?? Position.Left;
          const pct = getHandlePercent(handle, allHandles);
          const isVerticalEdge = handle.position === "left" || handle.position === "right";
          const offsetStyle: React.CSSProperties = isVerticalEdge
            ? { top: `${pct}%` }
            : { left: `${pct}%` };

          const deleteStyle: React.CSSProperties = isVerticalEdge
            ? {
                top: `calc(${pct}% - 7px)`,
                ...(handle.position === "left" ? { left: 6 } : { right: 6 }),
              }
            : {
                left: `calc(${pct}% - 7px)`,
                ...(handle.position === "top" ? { top: 6 } : { bottom: 6 }),
              };

          return (
            <React.Fragment key={`${id}-${handle.id}`}>
              <Handle
                type={handle.type}
                position={pos}
                id={`${id}-${handle.id}`}
                style={offsetStyle}
              />
              {handle.label && (
                <div
                  className={`handle-label handle-label-${handle.position}`}
                  style={offsetStyle}
                >
                  {handle.label}
                </div>
              )}
              {handle.isCustom && selected && (
                <button
                  className="handle-delete-btn"
                  style={deleteStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNodeHandle(id, handle.id);
                  }}
                  title="Remove port"
                >
                  <X size={8} />
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
