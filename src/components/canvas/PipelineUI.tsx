import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  useReactFlow,
  type EdgeTypes,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import { shallow } from "zustand/shallow";
import { nodeTypes } from "../../nodes/registry";
import { useStore } from "../../store";
import { CustomEdge } from "./CustomEdge";
import { NodeContextMenu, type ContextMenuState } from "./NodeContextMenu";
import type { PipelineEdge, PipelineNode } from "../../types";

import "reactflow/dist/style.css";

const GRID_SIZE = 20;

const edgeTypes: EdgeTypes = {
  smoothstep: CustomEdge,
};

const selector = (s: ReturnType<typeof useStore.getState>) => ({
  nodes: s.nodes,
  edges: s.edges,
  getNodeID: s.getNodeID,
  addNode: s.addNode,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
  onEdgeUpdate: s.onEdgeUpdate,
  setSelectedNode: s.setSelectedNode,
  selectedNodeId: s.selectedNodeId,
  deleteNode: s.deleteNode,
  deleteEdge: s.deleteEdge,
  clearCanvas: s.clearCanvas,
  applyAutoLayout: s.applyAutoLayout,
});

export const PipelineUI: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Track if edge update succeeded (for reconnection UX)
  const edgeUpdateSuccessful = useRef(true);

  // Clipboard for copy/paste
  const clipboard = useRef<PipelineNode[]>([]);

  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
    onEdgeUpdate, setSelectedNode, deleteNode, deleteEdge,
    clearCanvas, applyAutoLayout,
  } = useStore(selector, shallow);

  // ── Drop from palette ─────────────────────────────────────────────────────
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
      addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type, label: type } });
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // ── Node click → open sidebar ─────────────────────────────────────────────
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      setContextMenu(null);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, [setSelectedNode]);

  // ── Context menus ─────────────────────────────────────────────────────────
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeLabel: String((node.data as { label?: unknown }).label ?? node.type ?? node.id),
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const e = event as React.MouseEvent;
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

  // ── Edge reconnection (drag endpoint to new node) ─────────────────────────
  const handleEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const handleEdgeUpdate = useCallback(
    (oldEdge: PipelineEdge, newConnection: Parameters<typeof onEdgeUpdate>[1]) => {
      edgeUpdateSuccessful.current = true;
      onEdgeUpdate(oldEdge, newConnection);
    },
    [onEdgeUpdate]
  );

  const handleEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: PipelineEdge) => {
      if (!edgeUpdateSuccessful.current) {
        deleteEdge(edge.id);
      }
      edgeUpdateSuccessful.current = true;
    },
    [deleteEdge]
  );

  // ── Keyboard shortcuts: Cmd+C/V/D, Cmd+A, F ──────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      // Copy
      if (cmd && e.key.toLowerCase() === "c") {
        const selected = nodes.filter((n: PipelineNode) => n.selected);
        if (selected.length) clipboard.current = selected;
        return;
      }

      // Paste
      if (cmd && e.key.toLowerCase() === "v") {
        if (!clipboard.current.length) return;
        clipboard.current.forEach((n) => {
          const newID = getNodeID(n.type ?? "customInput");
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
        return;
      }

      // Duplicate
      if (cmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const selected = nodes.filter((n: PipelineNode) => n.selected);
        selected.forEach((n) => {
          const newID = getNodeID(n.type ?? "customInput");
          addNode({
            ...n,
            id: newID,
            selected: false,
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            data: { ...n.data, id: newID },
          });
        });
        return;
      }

      // Select all: Cmd+A
      if (cmd && e.key.toLowerCase() === "a") {
        e.preventDefault();
        useStore.getState().onNodesChange(
          nodes.map((n) => ({ type: "select" as const, id: n.id, selected: true }))
        );
        return;
      }

      // Fit view: F
      if (!cmd && e.key.toLowerCase() === "f") {
        reactFlowInstance?.fitView({ padding: 0.15, duration: 400 });
        return;
      }

      // Close context menu on Escape (App.tsx handles deselect)
      if (e.key === "Escape") setContextMenu(null);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nodes, getNodeID, addNode, reactFlowInstance]);

  // ── Context menu action helpers ───────────────────────────────────────────
  const handleCopyNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) clipboard.current = [node];
  }, [nodes]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newID = getNodeID(node.type ?? "customInput");
    addNode({
      ...node,
      id: newID,
      selected: false,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: { ...node.data, id: newID },
    });
  }, [nodes, getNodeID, addNode]);

  const handleDisconnect = useCallback((nodeId: string) => {
    useStore.getState().onEdgesChange(
      edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => ({ type: "remove" as const, id: e.id }))
    );
  }, [edges]);

  const handleSelectAll = useCallback(() => {
    useStore.getState().onNodesChange(
      nodes.map((n) => ({ type: "select" as const, id: n.id, selected: true }))
    );
  }, [nodes]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.15, duration: 400 });
  }, [reactFlowInstance]);

  const handlePaste = useCallback(() => {
    if (!clipboard.current.length) return;
    clipboard.current.forEach((n) => {
      const newID = getNodeID(n.type ?? "customInput");
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
  }, [getNodeID, addNode]);

  // ── Minimap colors ────────────────────────────────────────────────────────
  const minimapNodeColor = (node: Node) => {
    const colors: Record<string, string> = {
      llm: "#10b981", aiAgent: "#10b981", ragPipeline: "#06b6d4",
      customInput: "#f59e0b", webhook: "#f59e0b", timer: "#f59e0b",
      telegramTrigger: "#f59e0b", discordTrigger: "#f59e0b",
      customOutput: "#10b981",
      if: "#3b82f6", switch: "#3b82f6", loop: "#3b82f6", parallel: "#3b82f6",
      filter: "#3b82f6", merge: "#3b82f6", retry: "#3b82f6",
      http: "#f97316", email: "#f97316", stripe: "#f97316",
      postgresql: "#64748b", supabase: "#64748b", firebase: "#f97316",
      telegramBot: "#0ea5e9", discordBot: "#0ea5e9", slack: "#0ea5e9",
      googleAuth: "#6366f1", githubAuth: "#6366f1",
      code: "#8b5cf6", set: "#8b5cf6", text: "#8b5cf6", note: "#8b5cf6",
      document: "#06b6d4", retriever: "#06b6d4", embedding: "#06b6d4",
      executionLogger: "#64748b", errorBoundary: "#ef4444",
    };
    return colors[node.type ?? ""] ?? "#686880";
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
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        // ── Edge reconnection ─────────────────────────────────────────────
        onEdgeUpdate={handleEdgeUpdate}
        onEdgeUpdateStart={handleEdgeUpdateStart}
        onEdgeUpdateEnd={handleEdgeUpdateEnd}
        edgeUpdaterRadius={12}
        // ── Config ────────────────────────────────────────────────────────
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={3}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        panOnScroll
        panOnDrag={[1, 2]}
        selectionOnDrag
        elevateNodesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} size={1} color="var(--grid-dot)" />
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

      {/* Context menu — rendered outside ReactFlow to avoid clip issues */}
      <NodeContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onOpenConfig={(nodeId) => {
          setSelectedNode(nodeId);
          setContextMenu(null);
        }}
        onDuplicate={handleDuplicateNode}
        onCopyNode={handleCopyNode}
        onDeleteNode={(nodeId) => {
          deleteNode(nodeId);
          if (useStore.getState().selectedNodeId === nodeId) setSelectedNode(null);
        }}
        onDisconnect={handleDisconnect}
        onPaste={handlePaste}
        onSelectAll={handleSelectAll}
        onFitView={handleFitView}
        onAutoLayout={applyAutoLayout}
        onClearCanvas={clearCanvas}
      />
    </div>
  );
};
