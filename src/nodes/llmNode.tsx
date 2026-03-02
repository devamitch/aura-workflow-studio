import { Brain, Lock } from "lucide-react";
import React, { useState } from "react";
import { BaseNode } from "../components/node/BaseNode";
import { CustomSelect } from "../components/ui/CustomSelect";
import type { HandleConfig } from "../types";
import { useStore, PLAN_LIMITS } from "../store";

const handles: HandleConfig[] = [
  { type: "target", position: "left",  id: "system",   label: "system"   },
  { type: "target", position: "left",  id: "prompt",   label: "prompt"   },
  { type: "source", position: "right", id: "response", label: "response" },
];

const ALL_MODELS = [
  { value: "gemini-1.5-flash",   label: "Gemini 1.5 Flash",    tier: "free"   },
  { value: "gemini-1.5-pro",     label: "Gemini 1.5 Pro",      tier: "pro"    },
  { value: "gpt-4o",             label: "GPT-4o",              tier: "pro"    },
  { value: "gpt-4-turbo",        label: "GPT-4 Turbo",         tier: "pro"    },
  { value: "claude-3-5-sonnet",  label: "Claude 3.5 Sonnet",   tier: "pro"    },
  { value: "claude-3-haiku",     label: "Claude 3 Haiku",      tier: "pro"    },
  { value: "claude-3-opus",      label: "Claude 3 Opus",       tier: "annual" },
];

export const LLMNode: React.FC<{ id: string; data: any; selected?: boolean }> = ({ id, data, selected }) => {
  const [model, setModel] = useState(data?.model || "gemini-1.5-flash");
  const [temperature, setTemperature] = useState<number>(data?.temperature ?? 0.7);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const plan = useStore((s) => s.plan);

  const allowed = PLAN_LIMITS[plan.tier].modelAccess;

  const modelOpts = ALL_MODELS.map((m) => ({
    value: m.value,
    label: allowed.includes(m.value) ? m.label : `🔒 ${m.label}`,
  }));

  const currentLocked = !allowed.includes(model);

  return (
    <BaseNode id={id} nodeType="llm" title="LLM" icon={Brain}
      accentColor="var(--node-violet)" handles={handles} customHandles={data?.customHandles}
      selected={selected} minWidth={260} minHeight={200} resizable>
      {currentLocked && (
        <div className="node-plan-lock">
          <Lock size={11} />
          <span>Upgrade to unlock {model}</span>
        </div>
      )}
      <div className="node-field">
        <label className="node-field-label">Model</label>
        <CustomSelect value={model} onChange={(v) => {
          if (!allowed.includes(v)) return;
          setModel(v);
          updateNodeField(id, "model", v);
        }} options={modelOpts} />
      </div>
      <div className="node-field">
        <label className="node-field-label">Temperature</label>
        <input className="node-input" type="number" min="0" max="2" step="0.1"
          value={temperature}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            setTemperature(t);
            updateNodeField(id, "temperature", t);
          }} />
      </div>
    </BaseNode>
  );
};
