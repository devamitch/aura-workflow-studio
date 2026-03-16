import { Sparkles } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface LandingNavProps {
  onScrollTo?: (id: string) => void;
}

const NAV_LINKS = [
  { label: "Features", id: "#features" },
  { label: "Nodes", id: "#nodes" },
  { label: "Pricing", id: "#pricing" },
  { label: "Support", id: "#support" },
];

export const LandingNav: React.FC<LandingNavProps> = ({ onScrollTo }) => (
  <nav style={{
    position: "sticky", top: 0, zIndex: 200,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 5vw", height: "60px",
    background: "rgba(7,7,9,0.82)",
    backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
  }}>
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", flexShrink: 0 }}>
      <img src="/app-icon.png" alt="Aura Studio" style={{ width: 28, height: 28, borderRadius: 7 }}/>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.04em", color: "var(--text-900)" }}>
        Aura <span style={{ color: "var(--primary)" }}>Studio</span>
      </span>
      <span style={{
        padding: "1px 6px", borderRadius: "4px", fontSize: 9, fontWeight: 900,
        background: "var(--primary-soft)", color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase"
      }}>BETA</span>
    </Link>
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      {onScrollTo && NAV_LINKS.map((l) => (
        <button key={l.label} onClick={() => onScrollTo(l.id)}
          style={{ background: "none", padding: 0, border: "none", color: "var(--text-500)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "color 0.2s", whiteSpace: "nowrap" }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-900)"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--text-500)"}>{l.label}</button>
      ))}
      <Link to="/login" style={{ textDecoration: "none", color: "var(--text-400)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>Sign In</Link>
      {onScrollTo && (
        <button onClick={() => onScrollTo("#waitlist")}
          style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", padding: "8px 18px", borderRadius: "100px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 3px 16px rgba(99,102,241,0.32)", whiteSpace: "nowrap", border: "none" }}
          onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 5px 24px rgba(99,102,241,0.5)"; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 3px 16px rgba(99,102,241,0.32)"; }}>
          Get Early Access
        </button>
      )}
    </div>
  </nav>
);

/* Minimal nav for legal pages */
export const LegalNav: React.FC = () => (
  <nav style={{
    position: "sticky", top: 0, zIndex: 200,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 6vw", height: "60px",
    background: "rgba(7,7,9,0.85)",
    backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
  }}>
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
      <img src="/app-icon.png" alt="Aura Studio" style={{ width: 26, height: 26, borderRadius: 6 }}/>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.04em", color: "var(--text-900)" }}>
        Aura <span style={{ color: "var(--primary)" }}>Studio</span>
      </span>
    </Link>
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-500)", textDecoration: "none", fontSize: 13, fontWeight: 600, transition: "color 0.2s" }}
      onMouseOver={(e) => e.currentTarget.style.color = "var(--text-900)"}
      onMouseOut={(e) => e.currentTarget.style.color = "var(--text-500)"}>
      <Sparkles size={13}/> Back to Home
    </Link>
  </nav>
);
