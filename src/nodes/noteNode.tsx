import { StickyNote } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { VoiceTextarea } from "../components/ui/VoiceInput";

export const NoteNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({
  id, data, selected,
}) => {
  const [text, setText] = useState(data?.label || "");
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => { resize(); }, [text, resize]);

  return (
    <BaseNode
      id={id} nodeType="note" title="Note" icon={StickyNote}
      accentColor="var(--node-rose)" handles={[]}
      customHandles={data?.customHandles}
      selected={selected} minWidth={200} minHeight={150} resizable
    >
      <div className="node-field" style={{ flex: 1, display: "flex" }}>
        <VoiceTextarea
          value={text}
          onValueChange={setText}
          textareaRef={ref}
          placeholder="Type a note..."
          style={{ flex: 1 }}
        />
      </div>
    </BaseNode>
  );
};
