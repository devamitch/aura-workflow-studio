import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Key,
  Sparkles,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store";

// ── Providers ────────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    value: "gemini",
    label: "Google Gemini",
    placeholder: "AIza…",
    color: "#4285F4",
  },
  { value: "openai", label: "OpenAI", placeholder: "sk-…", color: "#10a37f" },
  {
    value: "claude",
    label: "Anthropic Claude",
    placeholder: "sk-ant-…",
    color: "#d97706",
  },
] as const;

// ── API Key Onboarding Modal ──────────────────────────────────────────────────
const APIKeyModal: React.FC<{ onSaved: () => void }> = ({ onSaved }) => {
  const [provider, setProvider] = useState<"gemini" | "openai" | "claude">(
    "gemini",
  );
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);

  const sel = PROVIDERS.find((p) => p.value === provider)!;

  const handleSave = async () => {
    if (apiKey.trim().length < 20) {
      setError("API key appears too short.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const apiUrl =
        (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
      const r = await fetch(`${apiUrl}/api/v1/keys/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, api_key: apiKey }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(
          (e as { detail?: string }).detail || "Failed to save key",
        );
      }
      await useStore.getState().refreshUser();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-icon-wrap">
          <Key size={26} color="var(--primary)" />
        </div>

        <h2 className="modal-title">Connect Your AI Key</h2>
        <p className="modal-subtitle">
          Aura uses your API key to power workflows. Your key is{" "}
          <strong>end-to-end encrypted</strong> and never shared.
        </p>

        {/* Provider picker */}
        <label className="modal-label">AI Provider</label>
        <div className="modal-select-wrap">
          <button
            className="modal-select-btn"
            onClick={() => setProviderOpen((v) => !v)}
          >
            <span
              className="modal-select-dot"
              style={{ background: sel.color }}
            />
            {sel.label}
            <ChevronDown
              size={13}
              style={{
                marginLeft: "auto",
                transform: providerOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
          {providerOpen && (
            <div className="modal-select-dropdown">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  className={`modal-select-option${p.value === provider ? " active" : ""}`}
                  onClick={() => {
                    setProvider(p.value);
                    setProviderOpen(false);
                    setApiKey("");
                  }}
                >
                  <span
                    className="modal-select-dot"
                    style={{ background: p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API key input */}
        <label className="modal-label" style={{ marginTop: 16 }}>
          API Key
        </label>
        <div className="modal-input-wrap">
          <input
            type={showKey ? "text" : "password"}
            placeholder={sel.placeholder}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError("");
            }}
            className={`modal-key-input${error ? " error" : ""}`}
          />
          <button
            className="modal-eye-btn"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <button
          className="modal-submit-btn"
          onClick={() => void handleSave()}
          disabled={saving || apiKey.trim().length < 5}
        >
          {saving ? (
            <span className="modal-spinner" />
          ) : (
            <CheckCircle size={15} />
          )}
          {saving ? "Encrypting & Saving…" : "Save Key & Continue"}
        </button>

        <p className="modal-footnote">
          🔐 AES-256 Fernet encrypted.{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get a free Gemini key →
          </a>
        </p>
      </div>
    </div>
  );
};

// ── Loading Screen ────────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="auth-full-screen">
    <div className="auth-loading-orb" />
    <Sparkles size={36} color="var(--primary)" className="auth-loading-icon" />
    <p className="auth-loading-text">
      Initializing <span>Aura</span>…
    </p>
  </div>
);

// ── Login Screen ──────────────────────────────────────────────────────────────
const LoginScreen: React.FC = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const explicit = (import.meta.env.VITE_AUTH_REDIRECT_TO as string)?.trim();
    return explicit || window.location.origin;
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true, // capture URL so we can handle errors
        },
      });
      if (error) throw error;
      if (!data?.url)
        throw new Error(
          "No OAuth URL returned. Check Supabase Google provider + redirect URLs.",
        );
      window.location.assign(data.url);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Google sign-in failed.",
      );
      setIsSigningIn(false);
    }
  };

  return (
    <div className="auth-full-screen login-bg">
      {/* Animated background */}
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />

      <div className="login-card">
        {/* Ambient glow */}
        <div className="login-card-glow" />

        {/* Logo */}
        <div className="login-logo-wrap">
          <Sparkles size={30} color="#818cf8" />
        </div>

        <h1 className="login-title">
          Aura<span>AI</span>
        </h1>
        <p className="login-tagline">Visual AI Orchestration Platform</p>
        <p className="login-desc">
          Build, visualize, and execute complex AI workflows without writing a
          single line of code.
        </p>

        {/* Feature pills */}
        <div className="login-pills">
          {[
            "Zero Token Cost",
            "BYOK Encrypted",
            "RAG Pipelines",
            "No-Code Builder",
          ].map((f) => (
            <span key={f} className="login-pill">
              {f}
            </span>
          ))}
        </div>

        {/* Google button */}
        <button
          className="login-google-btn"
          onClick={() => void handleGoogleSignIn()}
          disabled={isSigningIn}
        >
          <div className="login-google-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.7 17.6V20.34H19.27C21.36 18.42 22.56 15.6 22.56 12.25Z"
                fill="#4285F4"
              />
              <path
                d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.7 17.6C14.72 18.26 13.46 18.66 12 18.66C9.18 18.66 6.78 16.76 5.88 14.19H2.21V17.03C4.01 20.6 7.73 23 12 23Z"
                fill="#34A853"
              />
              <path
                d="M5.88 14.19C5.65 13.51 5.52 12.77 5.52 12C5.52 11.23 5.65 10.49 5.88 9.81V6.97H2.21C1.47 8.44 1.05 10.16 1.05 12C1.05 13.84 1.47 15.56 2.21 17.03L5.88 14.19Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.34C13.62 5.34 15.06 5.9 16.2 6.99L19.34 3.85C17.45 2.09 14.97 1 12 1C7.73 1 4.01 3.4 2.21 6.97L5.88 9.81C6.78 7.24 9.18 5.34 12 5.34Z"
                fill="#EA4335"
              />
            </svg>
            <span>
              {isSigningIn ? "Redirecting to Google…" : "Continue with Google"}
            </span>
          </div>
          <ArrowRight size={18} />
        </button>

        {authError && <div className="login-error">{authError}</div>}

        <p className="login-terms">
          By signing in, you agree to our Terms of Service &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
};

// ── AuthGate ──────────────────────────────────────────────────────────────────
interface Props {
  children: React.ReactNode;
}

export const AuthGate: React.FC<Props> = ({ children }) => {
  // const { user, loading } = useStore();

  // // If Supabase is not configured, let the app run in demo mode
  // if (!isSupabaseConfigured) return <>{children}</>;

  // if (loading) return <LoadingScreen />;
  // if (!user) return <LoginScreen />;

  // // BYOK gate: user is logged in but hasn't added an API key
  // if (!user.has_api_key) {
  //   return (
  //     <>
  //       {children}
  //       <APIKeyModal onSaved={() => void useStore.getState().refreshUser()} />
  //     </>
  //   );
  // }

  return <>{children}</>;
};
