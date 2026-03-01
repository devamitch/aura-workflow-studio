import { FileText } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { VoiceTextarea } from "../components/ui/VoiceInput";
import { useStore } from "../store";
import type { HandleConfig } from "../types";

interface TextNodeProps {
  id: string;
  data: { text?: string; customHandles?: HandleConfig[] };
  selected?: boolean;
}

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

const outputHandles: HandleConfig[] = [
  { type: "source", position: "right", id: "output", label: "output" },
];

export const TextNode: React.FC<TextNodeProps> = ({ id, data, selected }) => {
  const [text, setText] = useState(data?.text ?? "{{input}}");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeField = useStore((s) => s.updateNodeField);

  const variables = useMemo(() => {
    const vars: string[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(VARIABLE_REGEX.source, "g");
    while ((match = regex.exec(text)) !== null) {
      if (!vars.includes(match[1])) vars.push(match[1]);
    }
    return vars;
  }, [text]);

  useEffect(() => {
    updateNodeField(id, "variables", variables);
  }, [id, variables, updateNodeField]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  useEffect(() => { autoResize(); }, [text, autoResize]);

  const handleChange = (val: string) => {
    setText(val);
    updateNodeField(id, "text", val);
  };

  const allHandles = useMemo(() => {
    const varHandles: HandleConfig[] = variables.map((variable) => ({
      type: "target" as const,
      position: "left" as const,
      id: `var-${variable}`,
      label: variable,
    }));
    return [...outputHandles, ...varHandles];
  }, [variables]);

  return (
    <BaseNode
      id={id} title="Text" icon={FileText} accentColor="var(--node-amber)"
      handles={allHandles} customHandles={data?.customHandles}
      selected={selected} minWidth={240} minHeight={120} resizable
    >
      <div className="node-field" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <label className="node-field-label">Text</label>
        <VoiceTextarea
          value={text}
          onValueChange={handleChange}
          textareaRef={textareaRef}
          placeholder="Enter text... Use {{ variable }} for dynamic inputs"
          style={{ flex: 1 }}
        />
      </div>
    </BaseNode>
  );
};
