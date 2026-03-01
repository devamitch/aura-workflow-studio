import { LucideIcon, Plus } from "lucide-react";
import React, { useCallback } from "react";
import { useStore } from "../../store";

interface DraggableNodeProps {
  type: string;
  label: string;
  icon: LucideIcon;
}

function isTouchDevice(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

export const DraggableNode: React.FC<DraggableNodeProps> = ({
  type,
  label,
  icon: Icon,
}) => {
  const getNodeID = useStore((s) => s.getNodeID);
  const addNode = useStore((s) => s.addNode);

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const onClick = useCallback(() => {
    if (!isTouchDevice()) return;
    const nodeID = getNodeID(type);
    addNode({
      id: nodeID,
      type,
      position: {
        x: 120 + Math.round(Math.random() * 80),
        y: 120 + Math.round(Math.random() * 80),
      },
      data: { id: nodeID, nodeType: type, label: type },
    });
  }, [type, getNodeID, addNode]);

  return (
    <div
      className="draggable-node"
      data-node={type}
      onDragStart={onDragStart}
      onClick={onClick}
      draggable
      title={`Drag to add ${label}`}
    >
      <div className="draggable-node-icon">
        <Icon size={15} />
      </div>
      <span className="draggable-node-label">{label}</span>
      <span className="draggable-node-tap-badge">
        <Plus size={8} style={{ display: "inline", marginRight: 2 }} />
        Add
      </span>
    </div>
  );
};
