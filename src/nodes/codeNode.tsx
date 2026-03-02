import { Code2 } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input",  label: "input"  },
  { type: "source", position: "right", id: "output", label: "output" },
];

const DEFAULT_CODE = `// Available: input (from connected node)
// Return your result
return { result: input };`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CodeNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [code, setCode] = useState(data?.code || DEFAULT_CODE);
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="code" title="Code / Function" icon={Code2}
      accentColor="var(--node-cyan)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={300} minHeight={220} resizable>
      <div className="node-field">
        <label className="node-field-label">JavaScript</label>
        <textarea
          className="node-code-editor"
          value={code}
          rows={5}
          spellCheck={false}
          onChange={(e) => {
            setCode(e.target.value);
            updateNodeField(id, "code", e.target.value);
          }}
        />
      </div>
    </BaseNode>
  );
};
