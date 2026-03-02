import { ArrowRight, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { useStore } from "../../store";

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { user, loading, bootstrapAuth } = useStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const oauthRedirectTo = useMemo(() => {
    const explicit = import.meta.env.VITE_AUTH_REDIRECT_TO?.trim();
    return explicit || window.location.origin;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    bootstrapAuth();
  }, [bootstrapAuth]);

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthRedirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        throw error;
      }
      if (!data?.url) {
        throw new Error(
          "No OAuth redirect URL was returned. Verify Google provider + redirect URLs in Supabase Auth.",
        );
      }
      window.location.assign(data.url);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please verify Supabase OAuth settings.";
      setAuthError(message);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-app)",
          color: "var(--primary)",
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        <Sparkles
          size={28}
          className="animate-spin"
          style={{ marginRight: 12 }}
        />
        <span style={{ animation: "pulse-record 2s infinite" }}>
          Initializing Aura...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop') center/cover",
          position: "relative",
          fontFamily: "var(--font-body)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7, 7, 9, 0.85)",
            backdropFilter: "blur(20px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "48px 40px",
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(15, 15, 20, 0.65)",
            backdropFilter: "blur(40px)",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
            minWidth: 380,
            maxWidth: 460,
            textAlign: "center",
            isolation: "isolate",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              height: 200,
              background: "var(--primary)",
              filter: "blur(100px)",
              opacity: 0.15,
              zIndex: -1,
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              padding: 12,
              borderRadius: 20,
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              marginBottom: 24,
            }}
          >
            <Sparkles size={32} color="var(--primary)" />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#fff",
              marginBottom: 12,
            }}
          >
            Aura
            <span
              style={{
                color: "var(--primary)",
                textShadow: "0 0 24px var(--primary-glow)",
              }}
            >
              Flow
            </span>
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "var(--text-700)",
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            Enterprise-grade visual AI orchestration. Build advanced agentic
            workflows with zero token burn.
          </p>

          <button
            onClick={() => void handleGoogleSignIn()}
            disabled={isSigningIn}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: 100,
              border: "1px solid rgba(255,255,255,0.1)",
              background: isSigningIn ? "rgba(255,255,255,0.65)" : "#fff",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: isSigningIn ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 8px 32px rgba(255,255,255,0.15)",
              opacity: isSigningIn ? 0.9 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
                {isSigningIn
                  ? "Redirecting to Google..."
                  : "Continue with Google"}
              </span>
            </div>
            <ArrowRight size={20} color="#000" />
          </button>

          {authError && (
            <p
              style={{
                marginTop: 14,
                fontSize: 12,
                lineHeight: 1.5,
                color: "#fca5a5",
              }}
            >
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
