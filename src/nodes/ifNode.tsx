import { GitBranch } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input",    label: "input"   },
  { type: "source", position: "right", id: "true",     label: "true ✓"  },
  { type: "source", position: "right", id: "false",    label: "false ✗" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IfNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [condition, setCondition] = useState(data?.condition || "value !== null");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="if" title="IF Condition" icon={GitBranch}
      accentColor="var(--node-amber)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={260} minHeight={160} resizable>
      <div className="node-field">
        <label className="node-field-label">Condition (JS)</label>
        <input
          className="node-input"
          value={condition}
          placeholder="value !== null"
          onChange={(e) => {
            setCondition(e.target.value);
            updateNodeField(id, "condition", e.target.value);
          }}
        />
      </div>
      <p className="node-info">Routes to true/false branch based on condition.</p>
    </BaseNode>
  );
};
