import { FileText } from "lucide-react";
import React from "react";
import { BaseNode } from "../components/node/BaseNode";
import type { HandleConfig } from "../types";

const handles: HandleConfig[] = [
  { type: "source", position: "right", id: "doc", label: "doc" },
];

interface Props {
  id: string;
  data: any;
  selected?: boolean;
}

export const DocumentNode: React.FC<Props> = ({ id, data, selected }) => {
  return (
    <BaseNode
      id={id}
      nodeType="document"
      title="RAG Document"
      icon={FileText}
      accentColor="var(--node-amber)"
      handles={handles}
      customHandles={data?.customHandles}
      selected={selected}
      minWidth={240}
      minHeight={120}
      resizable
    >
      <p className="node-info">
        Represents a document collection used for retrieval-augmented generation.
        Manage documents from the Aura sidebar or admin panel.
      </p>
    </BaseNode>
  );
};

