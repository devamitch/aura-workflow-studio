import { Brain } from "lucide-react";
import React from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "system",   label: "system"   },
  { type: "target", position: "left",  id: "prompt",   label: "prompt"   },
  { type: "source", position: "right", id: "response", label: "response" },
];

export const LLMNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => (
  <BaseNode
    id={id} nodeType="llm" title="LLM" icon={Brain}
    accentColor="var(--node-violet)" handles={handles}
    customHandles={data?.customHandles}
    selected={selected} minWidth={240} minHeight={140} resizable
  >
    <p className="node-info">Connect system + prompt inputs, read the response output.</p>
  </BaseNode>
);
