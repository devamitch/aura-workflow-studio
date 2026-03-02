import { Settings2 } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input",  label: "input"  },
  { type: "source", position: "right", id: "output", label: "output" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SetNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [key, setKey] = useState(data?.key || "variable");
  const [value, setValue] = useState(data?.value || "");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="set" title="Set Variable" icon={Settings2}
      accentColor="var(--node-indigo)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={250} minHeight={180} resizable>
      <div className="node-field">
        <label className="node-field-label">Variable Name</label>
        <input className="node-input" value={key} placeholder="myVariable"
          onChange={(e) => { setKey(e.target.value); updateNodeField(id, "key", e.target.value); }} />
      </div>
      <div className="node-field">
        <label className="node-field-label">Value (or expression)</label>
        <input className="node-input" value={value} placeholder='"hello" or {{input.name}}'
          onChange={(e) => { setValue(e.target.value); updateNodeField(id, "value", e.target.value); }} />
      </div>
    </BaseNode>
  );
};
