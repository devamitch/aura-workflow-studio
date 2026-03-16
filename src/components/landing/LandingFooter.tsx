import { Coffee, Globe, Linkedin, Mail } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface LandingFooterProps {
  onScrollTo?: (id: string) => void;
  minimal?: boolean;
}

const SOCIAL = [
  { icon: <Linkedin size={14}/>, href: "https://www.linkedin.com/in/devamitch/" },
  { icon: <Globe size={14}/>, href: "https://devamit.co.in/" },
  { icon: <Mail size={14}/>, href: "mailto:amit98ch@gmail.com" },
  { icon: <Coffee size={14}/>, href: "https://buymeacoffee.com/amithellmab" },
];

const PRODUCT_NAV = ["Features", "Nodes", "Pricing", "How it Works"];

const DEVELOPER_LINKS = [
  { label: "Portfolio", href: "https://devamit.co.in/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/devamitch/" },
  { label: "Other Projects", href: "https://crunchyroll.devamit.co.in/" },
  { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/amithellmab" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export const LandingFooter: React.FC<LandingFooterProps> = ({ onScrollTo, minimal }) => {
  const linkStyle: React.CSSProperties = { color: "var(--text-500)", textDecoration: "none", fontSize: 13, transition: "color 0.18s", display: "block", marginBottom: "9px" };
  const hoverOn = (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--text-900)");
  const hoverOff = (e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.color = "var(--text-500)");

  return (
    <footer style={{ position: "relative", zIndex: 10, padding: minimal ? "32px 6vw" : "52px 6vw 32px", background: "rgba(0,0,0,0.5)" }}>
      <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
        {!minimal && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "36px", marginBottom: "44px" }}>
            {/* Brand col — wider */}
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "12px" }}>
                <img src="/app-icon.png" alt="Aura" style={{ width: 28, height: 28, borderRadius: 7 }}/>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.04em", color: "var(--text-900)" }}>
                  Aura <span style={{ color: "var(--primary)" }}>Studio</span>
                </span>
              </div>
              <p style={{ color: "var(--text-500)", fontSize: 13, lineHeight: 1.65, maxWidth: 240, marginBottom: 18 }}>
                The no-code visual AI orchestration platform. Build, simulate, and deploy production LLM pipelines.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {SOCIAL.map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width: 32, height: 32, borderRadius: "8px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-500)", textDecoration: "none", transition: "all 0.18s" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "var(--primary-soft)"; e.currentTarget.style.color = "var(--primary)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text-500)"; }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Product</div>
              {PRODUCT_NAV.map((item) => (
                onScrollTo
                  ? <button key={item} onClick={() => onScrollTo(`#${item.toLowerCase().replace(/\s+/g, "")}`)} style={{ ...linkStyle as any, background: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", border: "none" }} onMouseOver={hoverOn} onMouseOut={hoverOff}>{item}</button>
                  : <a key={item} href={`/#${item.toLowerCase().replace(/\s+/g, "")}`} style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>{item}</a>
              ))}
            </div>

            {/* Developer */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Developer</div>
              {DEVELOPER_LINKS.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>{item.label}</a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Legal</div>
              {LEGAL_LINKS.map((item) => (
                <Link key={item.label} to={item.href} style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>{item.label}</Link>
              ))}
              <div style={{ marginTop: "18px", padding: "10px 12px", borderRadius: "9px", background: "rgba(255,221,0,0.05)" }}>
                <a href="https://buymeacoffee.com/amithellmab" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "7px", color: "rgba(255,221,0,0.8)", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                  <Coffee size={13}/> Support This Project
                </a>
              </div>
            </div>
          </div>
        )}

        <div style={{ paddingTop: minimal ? 0 : "22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: minimal ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--text-500)", fontSize: 12, margin: 0 }}>
            &copy; {new Date().getFullYear()} Aura Studio &mdash; crafted by{" "}
            <a href="https://devamit.co.in/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none" }}>Amit Chakraborty</a>
          </p>
          {minimal && (
            <div style={{ display: "flex", gap: "20px" }}>
              <Link to="/privacy" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>Privacy</Link>
              <Link to="/terms" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>Terms</Link>
              <Link to="/" style={linkStyle} onMouseOver={hoverOn} onMouseOut={hoverOff}>Home</Link>
            </div>
          )}
          {!minimal && (
            <p style={{ color: "var(--text-500)", fontSize: 12, margin: 0 }}>React · ReactFlow · Gemini AI · TypeScript</p>
          )}
        </div>
      </div>
    </footer>
  );
};
