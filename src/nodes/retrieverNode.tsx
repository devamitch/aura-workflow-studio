import { Search } from "lucide-react";
import React from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "target", position: "left", id: "docs", label: "docs" },
  { type: "target", position: "left", id: "query", label: "query" },
  { type: "source", position: "right", id: "context", label: "context" },
];

interface Props {
  id: string;
  data: any;
  selected?: boolean;
}

export const RetrieverNode: React.FC<Props> = ({ id, data, selected }) => {
  return (
    <BaseNode
      id={id}
      nodeType="retriever"
      title="RAG Retriever"
      icon={Search}
      accentColor="var(--node-cyan)"
      handles={handles}
      customHandles={data?.customHandles}
      selected={selected}
      minWidth={260}
      minHeight={140}
      resizable
    >
      <p className="node-info">
        Takes documents + a query and returns a condensed context payload using vector search.
      </p>
    </BaseNode>
  );
};

