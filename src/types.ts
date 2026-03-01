import type { Edge, Node } from "reactflow";

export interface HandleConfig {
  type: "source" | "target";
  position: "left" | "right" | "top" | "bottom";
  id: string;
  label?: string;
  isCustom?: boolean;
}

export interface NodeData {
  id: string;
  nodeType: string;
  customHandles?: HandleConfig[];
  [key: string]: unknown;
}

export type PipelineNode = Node<NodeData>;
export type PipelineEdge = Edge;

export interface ParseResponse {
  num_nodes: number;
  num_edges: number;
  is_dag: boolean;
}
