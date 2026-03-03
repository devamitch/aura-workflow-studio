import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  type EdgeTypes,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import { shallow } from "zustand/shallow";
import { nodeTypes } from "../../nodes/registry";
import { useStore } from "../../store";
import { CustomEdge } from "./CustomEdge";
import type { PipelineNode } from "../../types";

import "reactflow/dist/style.css";

const GRID_SIZE = 20;

const edgeTypes: EdgeTypes = {
  smoothstep: CustomEdge,
};

const selector = (state: ReturnType<typeof useStore.getState>) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(selector, shallow);

  // Clipboard for copy/paste
  const clipboard = useRef<PipelineNode[]>([]);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds || !reactFlowInstance) return;
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const nodeID = getNodeID(type);
      addNode({
        id: nodeID,
        type,
        position,
        data: { id: nodeID, nodeType: type, label: type },
      });
    },
    [reactFlowInstance, getNodeID, addNode],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Copy / paste / duplicate
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA"].includes(tag)) return;

      if (cmd && e.key.toLowerCase() === "c") {
        const selected = nodes.filter((n: PipelineNode) => n.selected);
        if (selected.length) clipboard.current = selected;
      }
      if (cmd && e.key.toLowerCase() === "v") {
        if (!clipboard.current.length) return;
        clipboard.current.forEach((n) => {
          const newID = getNodeID(n.type || "customInput");
          addNode({
            ...n,
            id: newID,
            selected: false,
            position: { x: n.position.x + 30, y: n.position.y + 30 },
            data: { ...n.data, id: newID },
          });
        });
        clipboard.current = clipboard.current.map((n) => ({
          ...n,
          position: { x: n.position.x + 30, y: n.position.y + 30 },
        }));
      }
      if (cmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const selected = nodes.filter((n: PipelineNode) => n.selected);
        selected.forEach((n) => {
          const newID = getNodeID(n.type || "customInput");
          addNode({
            ...n,
            id: newID,
            selected: false,
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            data: { ...n.data, id: newID },
          });
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nodes, getNodeID, addNode]);

  const minimapNodeColor = (node: Node) => {
    const colors: Record<string, string> = {
      llm: "#7c3aed", customInput: "#3b82f6", customOutput: "#22c55e",
      webhook: "#f59e0b", timer: "#f59e0b", api: "#06b6d4", http: "#06b6d4",
      if: "#f97316", switch: "#f97316", loop: "#f43f5e", filter: "#f43f5e",
      code: "#6366f1", email: "#ec4899", slack: "#6366f1",
    };
    return colors[node.type || ""] || "#686880";
  };

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        panOnScroll
        panOnDrag={[1, 2]}
        selectionOnDrag
        elevateNodesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_SIZE}
          size={1}
          color="var(--grid-dot)"
        />
        <Controls className="rf-controls" showInteractive={false} />
        <MiniMap
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={0}
          maskColor="rgba(0,0,0,0.6)"
          className="rf-minimap"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};
