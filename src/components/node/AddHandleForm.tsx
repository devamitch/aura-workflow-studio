import React, { useRef, useState } from "react";
import { useStore } from "../../store";
import type { HandleConfig } from "../../types";

interface AddHandleFormProps {
  nodeId: string;
  existingHandleIds: string[];
  onClose: () => void;
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function makeUniqueId(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export const AddHandleForm: React.FC<AddHandleFormProps> = ({
  nodeId,
  existingHandleIds,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"input" | "output">("input");
  const inputRef = useRef<HTMLInputElement>(null);
  const addNodeHandle = useStore((s) => s.addNodeHandle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const base = slugify(trimmed) || "port";
    const id = makeUniqueId(base, existingHandleIds);

    const handle: HandleConfig = {
      id,
      label: trimmed,
      type: direction === "input" ? "target" : "source",
      position: direction === "input" ? "left" : "right",
      isCustom: true,
    };

    addNodeHandle(nodeId, handle);
    onClose();
  };

  return (
    <form className="add-handle-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        autoFocus
        className="node-field-input"
        placeholder="Port name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="add-handle-form-row">
        <button
          type="button"
          className={`add-handle-direction-btn ${direction === "input" ? "active" : ""}`}
          onClick={() => setDirection("input")}
        >
          Input
        </button>
        <button
          type="button"
          className={`add-handle-direction-btn ${direction === "output" ? "active" : ""}`}
          onClick={() => setDirection("output")}
        >
          Output
        </button>
      </div>
      <div className="add-handle-form-row">
        <button type="submit" className="add-handle-direction-btn active" style={{ flex: 2 }}>
          Add Port
        </button>
        <button type="button" className="add-handle-direction-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};
