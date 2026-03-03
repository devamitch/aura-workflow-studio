const API_BASE_OVERRIDE_KEY = "aura_api_base_override";
const GEMINI_KEY_OVERRIDE_KEY = "aura_gemini_key_override";

const DEFAULT_API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "http://localhost:8000";

const ENV_GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_KEY as string | undefined)?.trim() ||
  (import.meta.env.GEMINI_KEY as string | undefined)?.trim() ||
  "";

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function safeGet(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key)?.trim() || "";
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function getDefaultApiBaseUrl(): string {
  return normalizeUrl(DEFAULT_API_BASE_URL);
}

export function getApiBaseUrlOverride(): string {
  return normalizeUrl(safeGet(API_BASE_OVERRIDE_KEY));
}

export function getApiBaseUrl(): string {
  return getApiBaseUrlOverride() || getDefaultApiBaseUrl();
}

export function setApiBaseUrlOverride(url: string): void {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    safeRemove(API_BASE_OVERRIDE_KEY);
    return;
  }
  safeSet(API_BASE_OVERRIDE_KEY, normalized);
}

export function clearApiBaseUrlOverride(): void {
  safeRemove(API_BASE_OVERRIDE_KEY);
}

export function getEnvGeminiApiKey(): string {
  return ENV_GEMINI_API_KEY;
}

export function getGeminiApiKeyOverride(): string {
  return safeGet(GEMINI_KEY_OVERRIDE_KEY);
}

export function getGeminiApiKey(): string {
  return getGeminiApiKeyOverride() || getEnvGeminiApiKey();
}

export function setGeminiApiKeyOverride(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    safeRemove(GEMINI_KEY_OVERRIDE_KEY);
    return;
  }
  safeSet(GEMINI_KEY_OVERRIDE_KEY, trimmed);
}

export function clearGeminiApiKeyOverride(): void {
  safeRemove(GEMINI_KEY_OVERRIDE_KEY);
}
