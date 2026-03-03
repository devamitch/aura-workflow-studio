export interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

const API_URL = () =>
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

export async function fetchAuthMe(token: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_URL()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`auth/me failed: ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`google userinfo failed: ${response.status}`);
  }

  return (await response.json()) as GoogleUserInfo;
}
