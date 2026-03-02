import React from "react";
import { NODE_META } from "../../nodes/registry";
import { DraggableNode } from "./DraggableNode";

/**
 * NodePalette — lean left sidebar showing only draggable node types.
 * All workflow actions (save/load/export/import/layout) live in the Header.
 * The AI chat lives in the RightChatPanel.
 */
export const PipelineToolbar: React.FC = () => {
  const groups = (["Core & AI", "Logic", "Data & Text"] as const).map((title) => ({
    title,
    nodes: NODE_META.filter((n) => n.group === title),
  }));

  return (
    <div className="node-palette">
      <div className="node-palette-header">
        <span className="node-palette-title">Nodes</span>
      </div>

      <div className="node-palette-body">
        {groups.map((group) => (
          <div key={group.title} className="node-palette-group">
            <p className="node-palette-group-label">{group.title}</p>
            <div className="node-palette-nodes">
              {group.nodes.map((node) => (
                <DraggableNode
                  key={node.type}
                  type={node.type}
                  label={node.label}
                  icon={node.icon}
                />
              ))}
            </div>
          </div>
        ))}
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
