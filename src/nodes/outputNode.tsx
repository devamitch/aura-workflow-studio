import { LogOut } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import { VoiceInput } from "../components/ui/VoiceInput";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left", id: "value", label: "input" },
];

const typeOptions = [
  { value: "Text",  label: "Text"  },
  { value: "Image", label: "Image" },
];

export const OutputNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [currName, setCurrName] = useState(
    data?.outputName || id.replace("customOutput-", "output_"),
  );
  const [outputType, setOutputType] = useState(data?.outputType || "Text");

  return (
    <BaseNode
      id={id} nodeType="customOutput" title="Output" icon={LogOut}
      accentColor="var(--node-blue)" handles={handles}
      customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={180} resizable
    >
      <div className="node-field">
        <label className="node-field-label">Name</label>
        <VoiceInput
          value={currName}
          onValueChange={setCurrName}
          placeholder="output_name"
        />
      </div>
      <div className="node-field">
        <label className="node-field-label">Type</label>
        <CustomSelect value={outputType} onChange={setOutputType} options={typeOptions} />
      </div>
    </BaseNode>
  );
};
