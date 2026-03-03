import type { Content } from "@google/genai";
import {
  GEMINI_MODEL_FALLBACKS,
  hasGeminiApiKey as hasGeminiKey,
  streamTextWithFallback,
} from "./googleGenAI";

const CHAT_MODELS = GEMINI_MODEL_FALLBACKS;

export interface GeminiMessage {
  role: "user" | "model";
  text: string;
}

const CHAT_SYSTEM_PROMPT = `You are Aura, an expert AI workflow architect. You help users design and build visual AI automation pipelines.

When a user describes a workflow:
1. First reply with a clear, numbered TASK PLAN (max 8 steps). Each step is one sentence describing what the workflow will DO.
2. Do NOT generate JSON yet — present the plan and wait.

When generating workflows, be creative and practical. Think in terms of triggers, data transforms, AI models, integrations, and outputs.
Keep responses concise and actionable.`;

export function hasGeminiApiKey(): boolean {
  return hasGeminiKey();
}

/**
 * Streams a Gemini chat reply.
 * Throws on API key missing or all-models failure so callers get proper error handling.
 */
export async function streamGeminiChatReply(
  history: GeminiMessage[],
  userText: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  if (!hasGeminiKey()) {
    throw new Error(
      "No Gemini API key found. Add VITE_GEMINI_KEY to .env or go to Settings → Gemini Key to set one.",
    );
  }

  const contents: Content[] = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: userText }] },
  ];

  // streamTextWithFallback throws on failure — let it propagate
  return streamTextWithFallback({
    models: CHAT_MODELS,
    contents,
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT,
      temperature: 0.65,
      maxOutputTokens: 2048,
    },
    onChunk,
  });
}
