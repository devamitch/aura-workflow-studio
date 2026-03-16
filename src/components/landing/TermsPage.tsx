import React, { useEffect } from "react";
import { FileText } from "lucide-react";
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

export const TermsPage: React.FC = () => {
  useEffect(() => { document.body.setAttribute("data-theme", "dark"); window.scrollTo(0, 0); }, []);

  return (
    <div style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden", background: "var(--bg-app)", color: "var(--text-900)", fontFamily: "var(--font-body)", position: "relative", scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.3) transparent" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", right: "10%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 60%)", filter: "blur(80px)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "52px 48px" }}/>
      </div>

      <LegalNav/>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto", padding: "80px 6vw 120px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{ width: 52, height: 52, borderRadius: "14px", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={24} color="#7c3aed"/>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Legal</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: 0, color: "var(--text-900)" }}>Terms of Service</h1>
          </div>
        </div>
        <p style={{ color: "var(--text-500)", fontSize: 14, marginBottom: "52px", paddingLeft: "68px" }}>
          Last updated: March 16, 2026 · Please read carefully before using Aura Studio.
        </p>

        <Section title="1. Acceptance of Terms">
          <P>By accessing or using Aura Studio ("the Service"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, do not use the Service.</P>
          <P>These Terms constitute a legally binding agreement between you and Amit Chakraborty ("we", "us", or "our"), the operator of Aura Studio.</P>
          <P>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or a prominent notice on the Service. Your continued use after changes constitutes acceptance.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>Aura Studio is a visual AI workflow orchestration platform that allows users to:</P>
          <UL items={[
            "Design AI pipelines using a drag-and-drop canvas interface",
            "Configure and connect 45+ node types including LLMs, API calls, logic routers, and integrations",
            "Generate workflows using natural language via the Intent Orchestrator (powered by Gemini AI)",
            "Simulate and test workflow execution in a frontend simulation environment",
            "Export workflows as production-ready code in multiple project scaffolds",
            "Manage API credentials with client-side AES-256-GCM encryption",
          ]}/>
          <P>The Service is currently in beta. Features may change, and uptime guarantees do not apply during the beta period.</P>
        </Section>

        <Section title="3. Eligibility">
          <P>You must be at least 13 years of age to use the Service. If you are under 18, you represent that you have parental consent to use the Service. By using the Service, you represent that you meet these requirements.</P>
          <P>The Service is intended for personal, educational, and commercial use by developers, businesses, and AI practitioners.</P>
        </Section>

        <Section title="4. User Accounts">
          <P>You may use Aura Studio by authenticating with your Google account via Google OAuth. By doing so, you grant us permission to access your basic Google profile information (name, email, profile picture) as described in our Privacy Policy.</P>
          <P>You are responsible for:</P>
          <UL items={[
            "Maintaining the security of your Google account credentials",
            "All activities that occur under your account",
            "Ensuring that your use of the Service complies with applicable laws",
            "Any API keys or third-party credentials you configure in the application",
          ]}/>
          <P>You must promptly notify us of any unauthorized use of your account at <a href="mailto:amit98ch@gmail.com" style={{ color: "var(--primary)", textDecoration: "none" }}>amit98ch@gmail.com</a>.</P>
        </Section>

        <Section title="5. Acceptable Use">
          <P>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</P>
          <UL items={[
            "Use the Service to build workflows that violate any applicable law or regulation",
            "Create or distribute content that is harmful, harassing, defamatory, obscene, or fraudulent",
            "Attempt to circumvent rate limits, authentication, or security measures of the Service",
            "Use the Service to generate spam, phishing content, or malicious code",
            "Reverse engineer, decompile, or attempt to extract the source code of the Service",
            "Use automated bots, scrapers, or tools to access the Service in ways that circumvent normal usage",
            "Violate the terms of service of third-party APIs (including Gemini, OpenAI, Stripe, etc.) when integrating them via Aura Studio nodes",
            "Impersonate any person or entity or misrepresent your affiliation with any person or entity",
          ]}/>
          <P>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</P>
        </Section>

        <Section title="6. Intellectual Property">
          <P><strong style={{ color: "var(--text-700)" }}>Aura Studio IP:</strong> The Service, including its design, code, branding, and content (excluding user-generated content), is owned by Amit Chakraborty and protected by applicable intellectual property laws. You may not copy, modify, or distribute our proprietary materials without written permission.</P>
          <P><strong style={{ color: "var(--text-700)" }}>Your Content:</strong> You retain full ownership of the workflows, pipelines, prompts, and configurations you create using Aura Studio. We claim no intellectual property rights over your content.</P>
          <P><strong style={{ color: "var(--text-700)" }}>Exported Code:</strong> Code generated by the Export feature is yours to use, modify, and distribute freely, including for commercial purposes. No attribution is required, though we appreciate it.</P>
          <P><strong style={{ color: "var(--text-700)" }}>Feedback:</strong> Any feedback, suggestions, or ideas you provide about the Service may be used by us without any obligation to compensate you.</P>
        </Section>

        <Section title="7. Third-Party Services & Integrations">
          <P>Aura Studio enables integration with third-party services (Google Gemini, OpenAI, Slack, GitHub, Stripe, etc.) through its node system. Your use of these integrations is subject to the respective terms of service of those providers.</P>
          <P>We are not responsible for:</P>
          <UL items={[
            "The availability, accuracy, or behavior of third-party APIs",
            "Data processed by third-party services via your configured workflows",
            "API rate limits, costs, or usage charges imposed by third-party providers",
            "Any actions taken by third-party services in response to data you send through workflows",
          ]}/>
          <P>You are responsible for ensuring you have the right to use any third-party API keys or credentials you configure in the Service.</P>
        </Section>

        <Section title="8. Beta Service Disclaimer">
          <P>Aura Studio is currently in beta. This means:</P>
          <UL items={[
            "The Service may contain bugs, errors, or incomplete features",
            "Features may be added, modified, or removed without notice",
            "We do not guarantee uptime, data persistence, or performance during the beta period",
            "Workflow data stored in your browser is your responsibility to back up",
            "We may limit access to the Service at any time during the beta",
          ]}/>
          <P>Beta users acknowledge and accept these limitations as part of the agreement to participate in early access.</P>
        </Section>

        <Section title="9. Limitation of Liability">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AURA STUDIO AND ITS OPERATOR (AMIT CHAKRABORTY) SHALL NOT BE LIABLE FOR:</P>
          <UL items={[
            "Any indirect, incidental, special, consequential, or punitive damages",
            "Loss of profits, data, goodwill, or business opportunities",
            "Damages resulting from unauthorized access to or alteration of your transmissions or data",
            "Damages resulting from your reliance on any information or content obtained through the Service",
            "Damages arising from third-party services you access through integrations",
          ]}/>
          <P>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM (OR $10 USD IF NO PAYMENT HAS BEEN MADE).</P>
          <P>Some jurisdictions do not allow limitation of liability for consequential damages. In such jurisdictions, our liability is limited to the fullest extent permitted by law.</P>
        </Section>

        <Section title="10. Disclaimer of Warranties">
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</P>
          <P>We do not warrant that the Service will be uninterrupted, error-free, secure, or free of viruses or other harmful components. You use the Service at your own risk.</P>
        </Section>

        <Section title="11. Indemnification">
          <P>You agree to indemnify, defend, and hold harmless Amit Chakraborty and any contributors to Aura Studio from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising from:</P>
          <UL items={[
            "Your use of the Service in violation of these Terms",
            "Your violation of any third-party rights, including intellectual property or privacy rights",
            "Any content you create or transmit through the Service",
            "Your violation of applicable laws or regulations",
          ]}/>
        </Section>

        <Section title="12. Termination">
          <P>We may suspend or terminate your access to the Service at our discretion, with or without cause, including for violation of these Terms. You may stop using the Service at any time.</P>
          <P>Upon termination, your right to use the Service ceases immediately. Sections on Intellectual Property, Limitation of Liability, Disclaimer of Warranties, and Governing Law survive termination.</P>
        </Section>

        <Section title="13. Governing Law">
          <P>These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of India.</P>
          <P>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</P>
        </Section>

        <Section title="14. Contact">
          <P>If you have questions about these Terms, please contact:</P>
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
