import { Clock } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input",  label: "input"  },
  { type: "source", position: "right", id: "output", label: "output" },
];

export const TimerNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [delay, setDelay] = useState<number>(data?.delay ?? 1000);

  return (
    <BaseNode
      id={id} nodeType="timer" title="Timer" icon={Clock}
      accentColor="var(--node-rose)" handles={handles}
      customHandles={data?.customHandles}
      selected={selected} minWidth={200} minHeight={130} resizable
    >
      <div className="node-field">
        <label className="node-field-label">Delay (ms)</label>
        <input
          className="node-field-input"
          type="number"
          value={delay}
          onChange={(e) => setDelay(Number(e.target.value))}
          min={0}
          step={100}
        />
      </div>
      <p className="node-info">Adds a delay before passing data to the next node.</p>
    </BaseNode>
  );
};
