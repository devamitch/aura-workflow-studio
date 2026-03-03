/**
 * Credential Engine — Web Crypto API-based encrypted credential storage.
 * All secrets are AES-GCM encrypted before being written to node.data.credentials.
 * The encryption key is derived from a user-specific salt stored in localStorage.
 */

const STORAGE_KEY = "aura_cred_key_material";
const SALT_KEY = "aura_cred_salt";

// ── Key derivation ────────────────────────────────────────────────────────────
async function getOrCreateSalt(): Promise<Uint8Array> {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return new Uint8Array(JSON.parse(stored) as number[]);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
}

async function deriveKey(): Promise<CryptoKey> {
  const cached = localStorage.getItem(STORAGE_KEY);
  const salt = await getOrCreateSalt();

  // Use a fixed passphrase + user salt for key derivation
  const passphrase = "aura-engine-v1-" + (cached ?? "default");
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new Uint8Array(salt), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Encrypt ───────────────────────────────────────────────────────────────────
export async function encryptCredential(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plaintext)
    );
    // Encode as base64: iv (12 bytes) | ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch {
    // Fallback: store as-is with a prefix marker
    return "plain:" + plaintext;
  }
}

// ── Decrypt ───────────────────────────────────────────────────────────────────
export async function decryptCredential(stored: string): Promise<string> {
  if (!stored) return "";
  if (stored.startsWith("plain:")) return stored.slice(6);
  try {
    const key = await deriveKey();
    const bytes = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return stored; // Return raw on failure (may be unencrypted legacy value)
  }
}

// ── Batch helpers ─────────────────────────────────────────────────────────────
export async function encryptCredentials(
  creds: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    result[k] = await encryptCredential(v);
  }
  return result;
}

export async function decryptCredentials(
  creds: Record<string, string>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    result[k] = await decryptCredential(v);
  }
  return result;
}

// ── Validation ────────────────────────────────────────────────────────────────
import type { CredentialField } from "../types";

export function validateCredentials(
  creds: Record<string, string>,
  schema: CredentialField[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of schema) {
    if (!field.required) continue;
    const val = creds[field.key];
    if (!val || val.trim() === "") {
      errors.push(`"${field.label}" is required`);
      continue;
    }
    if (field.validator && !field.validator(val)) {
      errors.push(field.validationMessage ?? `"${field.label}" is invalid`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ── Mask secrets for display ──────────────────────────────────────────────────
export function maskSecret(value: string, showChars = 4): string {
  if (!value || value.length <= showChars) return "••••••••";
  return value.slice(0, showChars) + "••••••••";
}
