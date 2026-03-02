import { MessageSquare } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";
import { useStore } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "message",  label: "message" },
  { type: "source", position: "right", id: "response", label: "response" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SlackNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [channel, setChannel] = useState(data?.channel || "#general");
  const updateNodeField = useStore((s) => s.updateNodeField);

  return (
    <BaseNode id={id} nodeType="slack" title="Slack" icon={MessageSquare}
      accentColor="#4A154B" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={160} resizable>
      <div className="node-field">
        <label className="node-field-label">Channel</label>
        <input className="node-input" value={channel} placeholder="#channel-name"
          onChange={(e) => { setChannel(e.target.value); updateNodeField(id, "channel", e.target.value); }} />
      </div>
      <p className="node-info">Sends message to a Slack channel.</p>
    </BaseNode>
  );
};
