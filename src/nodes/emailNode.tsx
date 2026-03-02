import { Mail } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "body",    label: "body"    },
  { type: "target", position: "left",  id: "subject", label: "subject" },
  { type: "source", position: "right", id: "status",  label: "status"  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EmailNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [to, setTo] = useState(data?.to || "");
  const [subject, setSubject] = useState(data?.subject || "");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="email" title="Send Email" icon={Mail}
      accentColor="var(--node-blue)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={260} minHeight={190} resizable>
      <div className="node-field">
        <label className="node-field-label">To</label>
        <input className="node-input" value={to} placeholder="user@example.com"
          onChange={(e) => { setTo(e.target.value); updateNodeField(id, "to", e.target.value); }} />
      </div>
      <div className="node-field">
        <label className="node-field-label">Subject</label>
        <input className="node-input" value={subject} placeholder="Subject line"
          onChange={(e) => { setSubject(e.target.value); updateNodeField(id, "subject", e.target.value); }} />
      </div>
    </BaseNode>
  );
};
