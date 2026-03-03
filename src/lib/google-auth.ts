// ── Google Auth helpers ───────────────────────────────────────────────────────
// Stores the Google ID token in localStorage for session persistence.

const TOKEN_KEY = "aura_google_token";
const PROFILE_KEY = "aura_google_profile";

export const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID ?? "";

/** True if a Google Client ID is configured. */
export const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID);

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwtPayload<T = Record<string, unknown>>(
  token: string,
): T {
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

export interface CachedGoogleProfile {
  sub?: string;
  email: string;
  name?: string | null;
  picture?: string | null;
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
    const { exp } = decodeJwtPayload<Partial<GooglePayload>>(token);
    if (typeof exp === "number" && Date.now() / 1000 > exp) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  } catch {
    // Non-JWT Google access tokens cannot be decoded client-side for exp checks.
  }
  return token;
}

/** Clear the stored token. */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Persist a minimal profile for bootstrap when token is not a JWT. */
export function saveCachedProfile(profile: CachedGoogleProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** Read cached profile, if available. */
export function loadCachedProfile(): CachedGoogleProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedGoogleProfile;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Clear cached profile. */
export function clearCachedProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
