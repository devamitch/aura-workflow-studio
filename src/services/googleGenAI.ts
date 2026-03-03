import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
  type GenerateContentResponse,
} from "@google/genai";
import { getGeminiApiKey } from "../lib/runtime-config";

export const GEMINI_MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
] as const;

let aiClient: GoogleGenAI | null = null;
let lastGeminiApiKey: string | null = null;

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().length > 0;
}

export function getGoogleGenAI(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    aiClient = null;
    lastGeminiApiKey = null;
    return null;
  }
  if (!aiClient || lastGeminiApiKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    lastGeminiApiKey = apiKey;
  }
  return aiClient;
}

export interface GeminiGenerateParams {
  contents: Content[];
  config?: GenerateContentConfig;
  models?: readonly string[];
}

/** Describe the root cause of a Gemini API error in human-readable form. */
function describeGeminiError(err: unknown, model: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("API_KEY_INVALID") || msg.includes("api key not valid")) {
    return `Invalid Gemini API key. Go to Settings to update it.`;
  }
  if (msg.includes("QUOTA_EXCEEDED") || msg.includes("quota")) {
    return `Gemini quota exceeded for model ${model}. Trying fallbacks…`;
  }
  if (msg.includes("SAFETY")) {
    return `Request blocked by Gemini safety filters.`;
  }
  if (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("Failed to fetch")
  ) {
    return `Network error contacting Gemini. Check your connection.`;
  }
  return msg;
}

export async function generateTextWithFallback(
  params: GeminiGenerateParams,
): Promise<string> {
  const ai = getGoogleGenAI();
  if (!ai) {
    throw new Error(
      "No Gemini API key configured. Add VITE_GEMINI_KEY to your .env file, or set it in Settings → Gemini Key.",
    );
  }

  const models = params.models ?? GEMINI_MODEL_FALLBACKS;
  let lastError: Error = new Error("Unknown Gemini error");

  for (const model of models) {
    try {
      const response = (await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      })) as GenerateContentResponse;

      const text = response.text?.trim();
      if (text) return text;
    } catch (err) {
      const description = describeGeminiError(err, model);
      lastError = new Error(description);
      // Continue to next fallback model
    }
  }

  throw new Error(
    `Gemini failed on all models. Last error: ${lastError.message}`,
  );
}

export interface GeminiStreamParams extends GeminiGenerateParams {
  onChunk?: (chunk: string) => void;
}

export async function streamTextWithFallback(
  params: GeminiStreamParams,
): Promise<string> {
  const ai = getGoogleGenAI();
  if (!ai) {
    throw new Error(
      "No Gemini API key configured. Add VITE_GEMINI_KEY to your .env file, or set it in Settings → Gemini Key.",
    );
  }

  const models = params.models ?? GEMINI_MODEL_FALLBACKS;
  let lastError: Error = new Error("Unknown Gemini error");

  for (const model of models) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      });

      let fullText = "";
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (!text) continue;
        fullText += text;
        params.onChunk?.(text);
      }

      if (fullText.trim()) return fullText;
    } catch (err) {
      const description = describeGeminiError(err, model);
      lastError = new Error(description);
      // Continue to next fallback model
    }
  }

  throw new Error(
    `Gemini streaming failed on all models. Last error: ${lastError.message}`,
  );
}
