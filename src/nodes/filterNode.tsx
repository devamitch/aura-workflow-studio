import { Filter } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { VoiceInput } from "../components/ui/VoiceInput";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "input", label: "input" },
  { type: "source", position: "right", id: "pass",  label: "pass"  },
  { type: "source", position: "right", id: "fail",  label: "fail"  },
];

export const FilterNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [condition, setCondition] = useState(data?.condition ?? "value.length > 0");

  return (
    <BaseNode
      id={id} nodeType="filter" title="Filter" icon={Filter}
      accentColor="var(--node-orange)" handles={handles}
      customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={160} resizable
    >
      <div className="node-field">
        <label className="node-field-label">Condition</label>
        <VoiceInput
          value={condition}
          onValueChange={setCondition}
          placeholder="e.g. value.length > 0"
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
        />
      </div>
      <p className="node-info">Routes data to pass / fail outputs based on condition.</p>
    </BaseNode>
  );
};
