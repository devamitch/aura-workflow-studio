import {
  googleLogout,
  useGoogleLogin,
  useGoogleOneTapLogin,
} from "@react-oauth/google";
import {
  Bot,
  Brain,
  Database,
  GitBranch,
  Lock,
  UserX,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import appIcon from "../../assets/app-icon.png";
import authBanner from "../../assets/auth-banner.png";
import {
  decodeJwtPayload,
  isGoogleConfigured,
  type GooglePayload,
} from "../../lib/google-auth";
import { useStore } from "../../store";

const PILLS = [
  { icon: Brain, label: "Multi-LLM" },
  { icon: GitBranch, label: "Visual Builder" },
  { icon: Database, label: "RAG Pipelines" },
  { icon: Bot, label: "AI Assistant" },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ── Saved accounts (quick re-login) ─────────────────────────────────────────
const SAVED_KEY = "aura_saved_accounts";

interface SavedAccount {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

const readSaved = (): SavedAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeSaved = (list: SavedAccount[]) =>
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));

const upsertSaved = (p: GooglePayload) => {
  const list = readSaved().filter((a) => a.sub !== p.sub);
  list.unshift({
    sub: p.sub,
    email: p.email,
    name: p.name,
    picture: p.picture,
  });
  writeSaved(list.slice(0, 5));
};

// ── Component ────────────────────────────────────────────────────────────────
import { Navigate } from "react-router-dom";

export const AuthGate: React.FC = () => {
  const { user, loading, signInWithGoogle } = useStore();
  const [authError, setAuthError] = useState("");
  const [saved, setSaved] = useState<SavedAccount[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  // 1. One Tap Auto Sign-in (returns a JWT)
  useGoogleOneTapLogin({
    onSuccess: (res) => {
      if (!res.credential) return;
      setIsSigningIn(true);
      void signInWithGoogle(res.credential)
        .then(() => {
          try {
            upsertSaved(
              decodeJwtPayload<GooglePayload>(res.credential as string),
            );
            setSaved(readSaved());
          } catch {
            /* skip */
          }
        })
        .catch(() => setAuthError("Unable to auto sign in."));
    },
    onError: () => console.log("One tap login suppressed or failed"),
    auto_select: true, // Auto sign-in if available!
  });

  // 2. Custom Button Sign-in (returns an Access Token, fetches User Info)
  const customGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAuthError("");
      setIsSigningIn(true);
      try {
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const userInfo = await userInfoRes.json();

        await signInWithGoogle(tokenResponse.access_token, userInfo);

        // Save to local fast-login cache
        upsertSaved({
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          exp: Date.now() / 1000 + 3600, // Valid for an hour loosely
        });
        setSaved(readSaved());
      } catch (err) {
        setAuthError("Unable to fetch user info from Google.");
        setIsSigningIn(false);
      }
    },
    onError: () => {
      setAuthError("Google sign-in popup failed.");
      setIsSigningIn(false);
    },
  });

  const handleRemove = (sub: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = saved.filter((a) => a.sub !== sub);
    writeSaved(updated);
    setSaved(updated);
    googleLogout();
  };

  if (!isGoogleConfigured || (user && !loading)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <img src={authBanner} alt="" className="auth-loading-bg" />
        <div className="auth-loading-orb" />
        <div className="auth-loading-content">
          <div className="auth-loading-icon-wrap">
            <img src={appIcon} alt="AuraFlow" className="auth-app-icon" />
          </div>
          <p className="auth-loading-title">AuraFlow</p>
          <p className="auth-loading-sub">Initializing workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      {/* Layered background - no dark overlay to let banner breathe! */}
      <img src={authBanner} alt="" className="auth-bg-img" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-bg-grid" />

      {/* Glass card */}
      <div className="auth-center-card">
        <div className="auth-card-glow" />

        {/* Icon */}
        <div className="auth-icon-ring">
          <img src={appIcon} alt="AuraFlow" className="auth-icon-img" />
        </div>

        <div className="auth-brand-row">
          <span className="auth-brand-name">
            Aura<span>Flow</span>
          </span>
          <span className="auth-brand-beta">BETA</span>
        </div>

        <h1 className="auth-headline">
          Build AI pipelines{" "}
          <span className="auth-headline-accent">visually</span>
        </h1>
        <p className="auth-subline">
          No-code LLM orchestration, RAG workflows, and production AI
          automation.
        </p>

        <div className="auth-pills-row">
          {PILLS.map(({ icon: Icon, label }) => (
            <div key={label} className="auth-pill">
              <Icon size={13} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {saved.length > 0 && (
          <div className="auth-saved-accounts">
            <p className="auth-saved-label">Continue as</p>
            {saved.map((acc) => (
              <div
                key={acc.sub}
                className="auth-saved-row"
                role="button"
                tabIndex={0}
                onClick={() => customGoogleLogin()}
                title={`Sign in as ${acc.email}`}
              >
                {acc.picture ? (
                  <img
                    src={acc.picture}
                    alt={acc.name ?? acc.email}
                    className="auth-saved-avatar"
                  />
                ) : (
                  <div className="auth-saved-avatar-fallback">
                    {(acc.name ?? acc.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="auth-saved-info">
                  {acc.name && (
                    <span className="auth-saved-name">{acc.name}</span>
                  )}
                  <span className="auth-saved-email">{acc.email}</span>
                </div>
                <button
                  className="auth-saved-remove"
                  onClick={(e) => handleRemove(acc.sub, e)}
                  title="Remove this account"
                  aria-label="Remove saved account"
                >
                  <UserX size={14} />
                </button>
              </div>
            ))}
            <div className="auth-or-row">
              <span>or use a different account</span>
            </div>
          </div>
        )}

        {/* ── Completely Custom Google Button ──
              ZERO white background frames injected by Google! */}
        <button
          className={`auth-google-btn${isSigningIn ? " auth-google-btn--loading" : ""}`}
          onClick={() => customGoogleLogin()}
          disabled={isSigningIn}
        >
          {isSigningIn ? <span className="auth-spinner" /> : <GoogleIcon />}
          <span>{isSigningIn ? "Signing in…" : "Continue with Google"}</span>
        </button>

        {authError && <p className="auth-error-text">{authError}</p>}

        <div className="auth-trust-row">
          <div className="auth-trust-item">
            <Lock size={11} />
            <span>AES-256 encrypted</span>
          </div>
          <div className="auth-trust-dot" />
          <div className="auth-trust-item">
            <Zap size={11} />
            <span>Free forever</span>
          </div>
        </div>

        <p className="auth-terms">
          By signing in you agree to our{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            Terms
          </a>{" "}
          &{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
