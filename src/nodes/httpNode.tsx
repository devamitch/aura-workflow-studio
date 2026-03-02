import { Globe } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "body",     label: "body"     },
  { type: "target", position: "left",  id: "headers",  label: "headers"  },
  { type: "source", position: "right", id: "response", label: "response" },
  { type: "source", position: "right", id: "status",   label: "status"   },
];

const methodOpts = [
  { value: "GET",    label: "GET"    },
  { value: "POST",   label: "POST"   },
  { value: "PUT",    label: "PUT"    },
  { value: "PATCH",  label: "PATCH"  },
  { value: "DELETE", label: "DELETE" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HttpNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [method, setMethod] = useState(data?.method || "GET");
  const [url, setUrl] = useState(data?.url || "");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="http" title="HTTP Request" icon={Globe}
      accentColor="var(--node-blue)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={280} minHeight={190} resizable>
      <div className="node-field">
        <label className="node-field-label">Method</label>
        <CustomSelect value={method} onChange={(v) => { setMethod(v); updateNodeField(id, "method", v); }} options={methodOpts} />
      </div>
      <div className="node-field">
        <label className="node-field-label">URL</label>
        <input className="node-input" value={url} placeholder="https://api.example.com/endpoint"
          onChange={(e) => { setUrl(e.target.value); updateNodeField(id, "url", e.target.value); }} />
      </div>
    </BaseNode>
  );
};
