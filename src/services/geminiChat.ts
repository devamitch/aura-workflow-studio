const GEMINI_KEY = (import.meta.env.GEMINI_KEY as string) ?? "";
const CHAT_MODELS = [
  "gemini-3.0-flash",
  "gemini-2.5-flash-preview-04-17",
  "gemini-1.5-flash",
] as const;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

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
  return Boolean(GEMINI_KEY);
}

export async function streamGeminiChatReply(
  history: GeminiMessage[],
  userText: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  if (!GEMINI_KEY) {
    return "⚠️ No Gemini API key found. Add VITE_GEMINI_KEY to your .env file.";
  }

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user" as const, parts: [{ text: userText }] },
  ];

  for (const model of CHAT_MODELS) {
    try {
      const response = await fetch(
        `${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.65, maxOutputTokens: 2048 },
          }),
        },
      );

      if (!response.ok || !response.body) continue;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload) as Record<string, unknown>;
            const text = (
              (
                (
                  json.candidates as Array<Record<string, unknown>> | undefined
                )?.[0]?.content as Record<string, unknown> | undefined
              )?.parts as Array<Record<string, unknown>> | undefined
            )?.[0]?.text as string | undefined;

            if (!text) continue;
            fullText += text;
            onChunk?.(text);
          } catch {
            // Ignore malformed SSE lines.
          }
        }
      }

      if (fullText) return fullText;
    } catch {
      // Try fallback model.
    }
  }

  return "⚠️ Gemini API unavailable. Please check your API key and try again.";
}
