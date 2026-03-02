import { Repeat } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "list",     label: "list"     },
  { type: "source", position: "right", id: "item",     label: "item"     },
  { type: "source", position: "right", id: "done",     label: "done"     },
];

const modeOpts = [
  { value: "forEach", label: "For Each Item" },
  { value: "times",   label: "Repeat N Times" },
  { value: "while",   label: "While Condition" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LoopNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [mode, setMode] = useState(data?.mode || "forEach");
  const [times, setTimes] = useState(data?.times || "5");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="loop" title="Loop" icon={Repeat}
      accentColor="var(--node-rose)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={250} minHeight={190} resizable>
      <div className="node-field">
        <label className="node-field-label">Mode</label>
        <CustomSelect value={mode} onChange={(v) => { setMode(v); updateNodeField(id, "mode", v); }} options={modeOpts} />
      </div>
      {mode === "times" && (
        <div className="node-field">
          <label className="node-field-label">Repeat N</label>
          <input className="node-input" value={times} type="number" min="1"
            onChange={(e) => { setTimes(e.target.value); updateNodeField(id, "times", e.target.value); }} />
        </div>
      )}
    </BaseNode>
  );
};
