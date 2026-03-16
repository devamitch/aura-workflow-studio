import React, { useEffect } from "react";
import { Lock, Shield } from "lucide-react";
import { LegalNav } from "./LandingNav";
import { LandingFooter } from "./LandingFooter";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: "48px" }}>
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 800, color: "var(--text-900)", letterSpacing: "-0.02em", marginBottom: "20px", paddingBottom: "12px", boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.06)" }}>{title}</h2>
    <div style={{ color: "var(--text-500)", fontSize: 15, lineHeight: 1.85 }}>{children}</div>
  </div>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ marginBottom: "16px" }}>{children}</p>
);

const UL: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ paddingLeft: "20px", margin: "8px 0 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
    {items.map((item, i) => <li key={i} style={{ listStyleType: "disc" }}>{item}</li>)}
  </ul>
);

export const PrivacyPage: React.FC = () => {
  useEffect(() => { document.body.setAttribute("data-theme", "dark"); window.scrollTo(0, 0); }, []);

  return (
    <div style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden", background: "var(--bg-app)", color: "var(--text-900)", fontFamily: "var(--font-body)", position: "relative", scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "20%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)", filter: "blur(80px)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "52px 48px" }}/>
      </div>

      <LegalNav/>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "80px 6vw 120px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ width: 52, height: 52, borderRadius: "14px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock size={24} color="var(--primary)"/>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Legal</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "var(--text-900)" }}>Privacy Policy</h1>
          </div>
        </div>
        <p style={{ color: "var(--text-500)", fontSize: 14, marginBottom: "52px", paddingLeft: "68px" }}>
          Last updated: March 16, 2026 · Effective immediately
        </p>

        {/* Privacy-first highlight */}
        <div style={{ background: "rgba(16,185,129,0.05)", boxShadow: "0 0 0 1px rgba(16,185,129,0.18)", borderRadius: "16px", padding: "22px 26px", marginBottom: "52px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <Shield size={20} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }}/>
          <div>
            <div style={{ fontWeight: 700, color: "#10b981", marginBottom: 6, fontSize: 14 }}>Your privacy is fundamental to how Aura Studio works.</div>
            <div style={{ color: "var(--text-500)", fontSize: 13, lineHeight: 1.7 }}>
              We designed Aura Studio with a privacy-first architecture. Your API keys and credentials are encrypted client-side using AES-256-GCM and stored only in your browser. They never reach our servers. This isn't a promise — it's enforced by the technical architecture of the product.
            </div>
          </div>
        </div>

        <Section title="1. Who We Are">
          <P>Aura Studio ("we", "us", or "our") is an AI workflow orchestration platform developed and operated by Amit Chakraborty, an independent developer based in India. You can reach us at <a href="mailto:amit98ch@gmail.com" style={{ color: "var(--primary)", textDecoration: "none" }}>amit98ch@gmail.com</a> or via the portfolio at <a href="https://devamit.co.in/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none" }}>devamit.co.in</a>.</P>
          <P>This Privacy Policy explains how we collect, use, and protect information when you use our web application (the "Service").</P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong style={{ color: "var(--text-700)" }}>2.1 Information you provide directly</strong></P>
          <UL items={[
            "Email address — when you sign up for the waitlist or create an account via Google OAuth",
            "Google account profile information (name, email, profile picture) — provided via Google Sign-In only if you choose to authenticate",
            "Workflow data — node configurations, pipeline structures, and workflow names you create are stored locally in your browser (localStorage / IndexedDB)",
          ]}/>
          <P><strong style={{ color: "var(--text-700)" }}>2.2 Automatically collected information</strong></P>
          <UL items={[
            "Basic server logs: IP address, browser type, referring URL, pages visited, and timestamps — retained for a maximum of 30 days for security and debugging purposes",
            "Error telemetry: anonymized crash reports to improve product stability",
          ]}/>
          <P><strong style={{ color: "var(--text-700)" }}>2.3 Information we explicitly do NOT collect</strong></P>
          <UL items={[
            "API keys, credentials, bearer tokens, or any secrets you enter into node configurations — these are encrypted client-side and never transmitted to our servers",
            "The content of your AI prompts or chat conversations with Gemini — these are sent directly from your browser to Google's API using your own API key",
            "Payment card details — processed entirely by third-party payment processors (Stripe, Razorpay)",
          ]}/>
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <UL items={[
            "Authenticate you via Google OAuth and maintain your session",
            "Send waitlist confirmation and beta invitation emails (only with your consent)",
            "Send essential product updates, security notices, and service announcements",
            "Debug, improve, and ensure the security of the Service",
            "Comply with applicable laws and regulations",
          ]}/>
          <P>We do not sell your personal information to third parties. We do not use your data for advertising profiling.</P>
        </Section>

        <Section title="4. Credential & API Key Storage">
          <P>This deserves special mention because it's central to Aura Studio's design.</P>
          <P>When you enter API keys, bearer tokens, or other credentials into a node's configuration panel, they are encrypted using the <strong style={{ color: "var(--text-700)" }}>Web Crypto API</strong> with AES-256-GCM encryption before being stored in your browser's localStorage. The encryption key is derived from a PBKDF2 function using a device-specific salt.</P>
          <P>These encrypted values are:</P>
          <UL items={[
            "Never transmitted to Aura Studio servers",
            "Never included in workflow exports unless you explicitly choose to include them",
            "Accessible only within your browser session on your device",
            "Deleted when you clear your browser storage or sign out",
          ]}/>
          <P>This means that even if our servers were compromised, your credentials would not be exposed.</P>
        </Section>

        <Section title="5. Third-Party Services">
          <P>Aura Studio integrates with the following third-party services:</P>
          <UL items={[
            "Google OAuth — for authentication. Subject to Google's Privacy Policy.",
            "Google Gemini API — AI features. Your prompts are sent directly to Google using your API key and subject to Google's data usage policies.",
            "Stripe / Razorpay — payment processing. We never see your card details. Subject to their respective privacy policies.",
          ]}/>
          <P>We encourage you to review the privacy policies of these third-party services.</P>
        </Section>

        <Section title="6. Data Retention">
          <P>We retain your account information for as long as your account is active or as needed to provide the Service. Server logs are retained for a maximum of 30 days. If you request account deletion, we will delete your personal data within 30 days.</P>
          <P>Workflow data, node configurations, and credentials stored in your browser are entirely under your control. Clearing your browser's localStorage or signing out will remove this data from your device.</P>
        </Section>

        <Section title="7. Your Rights">
          <P>Depending on your jurisdiction, you may have the following rights:</P>
          <UL items={[
            "Access — request a copy of personal data we hold about you",
            "Rectification — request correction of inaccurate data",
            "Erasure — request deletion of your data ('right to be forgotten')",
            "Portability — receive your data in a machine-readable format",
            "Objection — object to certain types of data processing",
            "Withdrawal of consent — withdraw previously given consent at any time",
          ]}/>
          <P>To exercise these rights, email us at <a href="mailto:amit98ch@gmail.com" style={{ color: "var(--primary)", textDecoration: "none" }}>amit98ch@gmail.com</a>. We will respond within 30 days.</P>
        </Section>

        <Section title="8. Cookies">
          <P>Aura Studio uses minimal cookies:</P>
          <UL items={[
            "Session cookies — required for authentication, automatically deleted when you close the browser",
            "Preference cookies — to remember your theme choice (light/dark)",
          ]}/>
          <P>We do not use tracking cookies, analytics cookies, or advertising cookies.</P>
        </Section>

        <Section title="9. Security">
          <P>We implement industry-standard security measures including HTTPS encryption for all data in transit, AES-256-GCM encryption for credentials at rest in the browser, and regular security reviews. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>Aura Studio is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.</P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by email (if you have provided one) and by posting a notice on our website. Continued use of the Service after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="12. Contact Us">
          <P>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:</P>
          <div style={{ background: "var(--bg-panel)", boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)", borderRadius: "16px", padding: "24px 28px", marginTop: "8px" }}>
            <div style={{ fontWeight: 700, color: "var(--text-900)", marginBottom: 8, fontSize: 15 }}>Amit Chakraborty</div>
            <div style={{ color: "var(--text-500)", fontSize: 13, marginBottom: 4 }}>Founder, Aura Studio</div>
            <a href="mailto:amit98ch@gmail.com" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13 }}>amit98ch@gmail.com</a>
            <div style={{ marginTop: 8 }}>
              <a href="https://devamit.co.in/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13 }}>devamit.co.in</a>
            </div>
          </div>
        </Section>
      </main>

      <LandingFooter minimal/>
    </div>
  );
};
