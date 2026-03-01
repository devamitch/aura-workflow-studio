import { Globe } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import { VoiceInput } from "../components/ui/VoiceInput";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "body",     label: "Body"     },
  { type: "target", position: "left",  id: "headers",  label: "Headers"  },
  { id: "response", type: "source", position: "right", label: "Response" },
];

const methodOptions = [
  { value: "GET" }, { value: "POST" }, { value: "PUT" },
  { value: "PATCH" }, { value: "DELETE" },
];

export const ApiNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [method, setMethod] = useState(data?.method || "GET");
  const [url, setUrl] = useState(data?.url || "");

  return (
    <BaseNode
      id={id} nodeType="api" title="API Request" icon={Globe}
      accentColor="var(--node-cyan)" handles={handles}
      customHandles={data?.customHandles}
      selected={selected} minWidth={280} minHeight={220} resizable
    >
      <div className="node-field">
        <label className="node-field-label">Method</label>
        <CustomSelect value={method} onChange={setMethod} options={methodOptions} />
      </div>
      <div className="node-field">
        <label className="node-field-label">URL</label>
        <VoiceInput
          value={url}
          onValueChange={setUrl}
          placeholder="https://api.example.com"
          type="text"
        />
      </div>
    </BaseNode>
  );
};
