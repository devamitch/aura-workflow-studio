import { Shuffle } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input",    label: "input"   },
  { type: "source", position: "right", id: "case-1",   label: "case 1"  },
  { type: "source", position: "right", id: "case-2",   label: "case 2"  },
  { type: "source", position: "right", id: "case-3",   label: "case 3"  },
  { type: "source", position: "right", id: "default",  label: "default" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SwitchNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [field, setField] = useState(data?.field || "value");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="switch" title="Switch / Route" icon={Shuffle}
      accentColor="var(--node-orange)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={250} minHeight={210} resizable>
      <div className="node-field">
        <label className="node-field-label">Route by field</label>
        <input className="node-input" value={field} placeholder="value"
          onChange={(e) => { setField(e.target.value); updateNodeField(id, "field", e.target.value); }} />
      </div>
      <p className="node-info">Routes input to case 1/2/3 or default output.</p>
    </BaseNode>
  );
};
