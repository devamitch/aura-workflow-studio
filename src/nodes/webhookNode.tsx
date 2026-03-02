import { Webhook } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "source", position: "right", id: "body",    label: "body"    },
  { type: "source", position: "right", id: "headers", label: "headers" },
];

const methodOpts = [
  { value: "POST", label: "POST" },
  { value: "GET",  label: "GET"  },
  { value: "PUT",  label: "PUT"  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WebhookNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [method, setMethod] = useState(data?.method || "POST");
  const path = `/webhook/${id.slice(-6)}`;

  return (
    <BaseNode id={id} nodeType="webhook" title="Webhook Trigger" icon={Webhook}
      accentColor="var(--node-emerald)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={170} resizable>
      <div className="node-field">
        <label className="node-field-label">Method</label>
        <CustomSelect value={method} onChange={setMethod} options={methodOpts} />
      </div>
      <div className="node-field">
        <label className="node-field-label">Path</label>
        <div className="node-info-badge">{path}</div>
      </div>
      <p className="node-info">Triggers when HTTP request hits this endpoint.</p>
    </BaseNode>
  );
};
