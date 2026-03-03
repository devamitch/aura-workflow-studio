import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { NODE_META } from "../../nodes/registry";
import { DraggableNode } from "./DraggableNode";
import type { NodeGroup } from "../../nodes/registry";

const GROUPS: NodeGroup[] = [
  "Triggers",
  "AI & Core",
  "Logic & Flow",
  "Data & Transform",
  "Integrations",
  "RAG & Memory",
];

export const PipelineToolbar: React.FC = () => {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? NODE_META.filter(
        (n) =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : null;

  return (
    <div className="node-palette">
      <div className="node-palette-header">
        <span className="node-palette-title">Nodes</span>
      </div>

      {/* Search */}
      <div className="palette-search-wrap">
        <Search size={13} className="palette-search-icon" />
        <input
          className="palette-search-input"
          placeholder="Search nodes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="palette-search-clear" onClick={() => setQuery("")}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="node-palette-body">
        {filtered ? (
          /* Search results — flat list */
          filtered.length === 0 ? (
            <p className="palette-empty">No nodes match "{query}"</p>
          ) : (
            <div className="node-palette-group">
              <p className="node-palette-group-label">Results ({filtered.length})</p>
              <div className="node-palette-nodes">
                {filtered.map((node) => (
                  <DraggableNode
                    key={node.type}
                    type={node.type}
                    label={node.label}
                    icon={node.icon}
                    description={node.description}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          /* Grouped view */
          GROUPS.map((title) => {
            const nodes = NODE_META.filter((n) => n.group === title);
            if (!nodes.length) return null;
            return (
              <div key={title} className="node-palette-group">
                <p className="node-palette-group-label">{title}</p>
                <div className="node-palette-nodes">
                  {nodes.map((node) => (
                    <DraggableNode
                      key={node.type}
                      type={node.type}
                      label={node.label}
                      icon={node.icon}
                      description={node.description}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="node-palette-footer">
        Built by{" "}
        <a href="https://devamit.co.in/" target="_blank" rel="noopener noreferrer">
          Amit Chakraborty
        </a>
      </div>
    </div>
  );
};
