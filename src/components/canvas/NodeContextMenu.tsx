/**
 * NodeContextMenu — right-click context menu for nodes and canvas pane.
 * Renders as a floating panel positioned at the cursor.
 */
import {
  Clipboard, Copy, Crosshair, GitBranch,
  LayoutGrid, Maximize2, Settings, Trash2,
  Unlink, X,
} from "lucide-react";
import React, { useEffect, useRef } from "react";

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;         // undefined → pane context menu
  nodeLabel?: string;
}

interface Props {
  menu: ContextMenuState | null;
  onClose: () => void;
  // node actions
  onOpenConfig: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onCopyNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDisconnect: (nodeId: string) => void;
  // canvas actions
  onPaste: () => void;
  onSelectAll: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
  onClearCanvas: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  dividerAfter?: boolean;
}

export const NodeContextMenu: React.FC<Props> = ({
  menu,
  onClose,
  onOpenConfig,
  onDuplicate,
  onCopyNode,
  onDeleteNode,
  onDisconnect,
  onPaste,
  onSelectAll,
  onFitView,
  onAutoLayout,
  onClearCanvas,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!menu) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const isNode = Boolean(menu.nodeId);

  const nodeItems: MenuItem[] = [
    {
      icon: <Settings size={13} />,
      label: "Open Config",
      shortcut: "Click",
      action: () => { onOpenConfig(menu.nodeId!); onClose(); },
      dividerAfter: true,
    },
    {
      icon: <Copy size={13} />,
      label: "Copy",
      shortcut: "⌘C",
      action: () => { onCopyNode(menu.nodeId!); onClose(); },
    },
    {
      icon: <GitBranch size={13} />,
      label: "Duplicate",
      shortcut: "⌘D",
      action: () => { onDuplicate(menu.nodeId!); onClose(); },
      dividerAfter: true,
    },
    {
      icon: <Unlink size={13} />,
      label: "Disconnect Edges",
      action: () => { onDisconnect(menu.nodeId!); onClose(); },
      dividerAfter: true,
    },
    {
      icon: <Trash2 size={13} />,
      label: "Delete Node",
      shortcut: "Del",
      action: () => { onDeleteNode(menu.nodeId!); onClose(); },
      danger: true,
    },
  ];

  const paneItems: MenuItem[] = [
    {
      icon: <Clipboard size={13} />,
      label: "Paste",
      shortcut: "⌘V",
      action: () => { onPaste(); onClose(); },
      dividerAfter: true,
    },
    {
      icon: <Crosshair size={13} />,
      label: "Select All",
      shortcut: "⌘A",
      action: () => { onSelectAll(); onClose(); },
    },
    {
      icon: <Maximize2 size={13} />,
      label: "Fit View",
      shortcut: "F",
      action: () => { onFitView(); onClose(); },
    },
    {
      icon: <LayoutGrid size={13} />,
      label: "Auto Layout",
      shortcut: "⌘L",
      action: () => { onAutoLayout(); onClose(); },
      dividerAfter: true,
    },
    {
      icon: <X size={13} />,
      label: "Clear Canvas",
      action: () => { onClearCanvas(); onClose(); },
      danger: true,
    },
  ];

  const items = isNode ? nodeItems : paneItems;

  // Clamp position so the menu stays on screen
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;
  const menuW = 220;
  const menuH = items.length * 36 + 16;
  const left = Math.min(menu.x, vpW - menuW - 8);
  const top  = Math.min(menu.y, vpH - menuH - 8);

  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isNode && menu.nodeLabel && (
        <div className="ctx-menu-heading">{menu.nodeLabel}</div>
      )}
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <button
            className={`ctx-menu-item${item.danger ? " ctx-menu-item--danger" : ""}`}
            onClick={item.action}
          >
            <span className="ctx-menu-icon">{item.icon}</span>
            <span className="ctx-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="ctx-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
          {item.dividerAfter && <div className="ctx-menu-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
};
