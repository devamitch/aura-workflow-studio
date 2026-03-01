import { LogIn } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import { VoiceInput } from "../components/ui/VoiceInput";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "source", position: "right", id: "value", label: "output" },
];

const typeOptions = [
  { value: "Text", label: "Text" },
  { value: "File", label: "File" },
];

export const InputNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [currName, setCurrName] = useState(
    data?.inputName || id.replace("customInput-", "input_"),
  );
  const [inputType, setInputType] = useState(data?.inputType || "Text");

  return (
    <BaseNode
      id={id} nodeType="customInput" title="Input" icon={LogIn}
      accentColor="var(--node-emerald)" handles={handles}
      customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={180} resizable
    >
      <div className="node-field">
        <label className="node-field-label">Name</label>
        <VoiceInput
          value={currName}
          onValueChange={setCurrName}
          placeholder="input_name"
        />
      </div>
      <div className="node-field">
        <label className="node-field-label">Type</label>
        <CustomSelect value={inputType} onChange={setInputType} options={typeOptions} />
      </div>
    </BaseNode>
  );
};
