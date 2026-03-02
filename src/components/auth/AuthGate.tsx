import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Lock, Sparkles, Zap } from "lucide-react";
import React from "react";
import { isGoogleConfigured } from "../../lib/google-auth";
import { useStore } from "../../store";

interface Props {
  children: React.ReactNode;
}

export const AuthGate: React.FC<Props> = ({ children }) => {
  const { user, loading, signInWithGoogle } = useStore();

  // No Google Client ID → dev/demo mode
  if (!isGoogleConfigured) return <>{children}</>;

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-orb" />
        <div className="auth-loading-content">
          <div className="auth-loading-icon-wrap">
            <Sparkles size={28} className="auth-spin-icon" />
          </div>
          <p className="auth-loading-title">AuraFlow</p>
          <p className="auth-loading-sub">Initializing workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow-1" />
        <div className="auth-bg-glow-2" />

        <div className="auth-card">
          <div className="auth-card-glow" />

          {/* Logo */}
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">
              <Sparkles size={22} />
            </div>
            <h1 className="auth-logo-text">
              Aura<span>Flow</span>
            </h1>
          </div>

          <p className="auth-tagline">Visual AI Orchestration Platform</p>
          <p className="auth-desc">
            Build, visualize, and run production-grade AI pipelines — no code
            required.
          </p>

          <div className="auth-pills">
            {["No-Code Builder", "BYOK Encrypted", "RAG Pipelines", "Live Preview"].map(
              (f) => (
                <span key={f} className="auth-pill">
                  {f}
                </span>
              ),
            )}
          </div>

          <div className="auth-google-wrap">
            <GoogleLogin
              onSuccess={(cred) => {
                if (cred.credential) void signInWithGoogle(cred.credential);
              }}
              onError={() => console.error("Google sign-in failed")}
              theme="filled_black"
              size="large"
              shape="pill"
              width="340"
              text="continue_with"
            />
          </div>

          <div className="auth-stats">
            <div className="auth-stat">
              <Zap size={12} />
              <span>Free forever</span>
            </div>
            <span className="auth-stat-sep" />
            <div className="auth-stat">
              <Lock size={12} />
              <span>AES-256 encrypted</span>
            </div>
            <span className="auth-stat-sep" />
            <div className="auth-stat">
              <ArrowRight size={12} />
              <span>Instant access</span>
            </div>
          </div>

          <p className="auth-terms">
            By signing in you agree to our{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms</a> &amp;{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
