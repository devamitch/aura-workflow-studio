import { GitMerge } from "lucide-react";
import React from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input-a", label: "A" },
  { type: "target", position: "left",  id: "input-b", label: "B" },
  { type: "source", position: "right", id: "merged",  label: "merged" },
];

export const MergeNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => (
  <BaseNode
    id={id} nodeType="merge" title="Merge" icon={GitMerge}
    accentColor="var(--node-indigo)" handles={handles}
    customHandles={data?.customHandles}
    selected={selected} minWidth={200} minHeight={120} resizable
  >
    <p className="node-info">Combines inputs A and B into a single output.</p>
  </BaseNode>
);
