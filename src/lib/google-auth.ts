// ── Google Auth helpers ───────────────────────────────────────────────────────
// Stores the Google ID token in localStorage for session persistence.

const TOKEN_KEY = "aura_google_token";

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/** True if a Google Client ID is configured. */
export const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID);

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(json) as T;
}

export interface GooglePayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  exp: number;
}

/** Persist a Google ID token to localStorage. */
export function saveToken(credential: string): void {
  localStorage.setItem(TOKEN_KEY, credential);
}

/** Read the stored Google ID token; null if absent or expired. */
export function loadToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const { exp } = decodeJwtPayload<GooglePayload>(token);
    if (Date.now() / 1000 > exp) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

/** Clear the stored token. */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
