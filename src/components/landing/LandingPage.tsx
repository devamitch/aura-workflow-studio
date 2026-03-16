import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Code2,
  Coffee,
  Download,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Linkedin,
  Lock,
  Mail,
  MessageSquare,
  Network,
  Package,
  Play,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Upload,
  Workflow,
  Wrench,
  Zap,
  Globe2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useStore } from "../../store";
import { LandingNav } from "./LandingNav";
import { LandingFooter } from "./LandingFooter";

/* ─────────────────────────────────────────────
   CANVAS SVG ILLUSTRATION
───────────────────────────────────────────── */
const CanvasSVG = () => (
  <svg viewBox="0 0 860 440" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto" }}>
    {Array.from({ length: 17 }).map((_, c) => Array.from({ length: 9 }).map((_, r) => (
      <circle key={`${c}-${r}`} cx={c * 52 + 14} cy={r * 48 + 14} r="1.3" fill="rgba(99,102,241,0.18)" />
    )))}
    <path d="M220 105 C275 105 295 185 370 185" stroke="rgba(99,102,241,0.6)" strokeWidth="1.8" fill="none"/>
    <path d="M220 185 C275 185 295 185 370 185" stroke="rgba(99,102,241,0.6)" strokeWidth="1.8" fill="none"/>
    <path d="M540 185 C600 185 620 120 660 120" stroke="rgba(16,185,129,0.6)" strokeWidth="1.8" fill="none"/>
    <path d="M540 185 C600 185 620 248 660 248" stroke="rgba(245,158,11,0.6)" strokeWidth="1.8" fill="none"/>
    {/* Webhook node */}
    <rect x="55" y="75" width="165" height="74" rx="12" fill="#0d0d14"/>
    <rect x="55" y="75" width="165" height="25" rx="12" fill="rgba(99,102,241,0.18)"/>
    <rect x="55" y="88" width="165" height="12" fill="rgba(99,102,241,0.18)"/>
    <circle cx="76" cy="88" r="7" fill="rgba(99,102,241,0.35)"/>
    <rect x="90" y="84" width="70" height="8" rx="3" fill="rgba(255,255,255,0.5)"/>
    <rect x="70" y="113" width="45" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="70" y="123" width="125" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <circle cx="224" cy="113" r="5" fill="#6366f1"/>
    {/* LLM node */}
    <rect x="370" y="147" width="170" height="78" rx="12" fill="#0d0d14"/>
    <rect x="370" y="147" width="170" height="25" rx="12" fill="rgba(124,58,237,0.22)"/>
    <rect x="370" y="160" width="170" height="12" fill="rgba(124,58,237,0.22)"/>
    <circle cx="391" cy="160" r="7" fill="rgba(124,58,237,0.35)"/>
    <rect x="405" y="156" width="40" height="8" rx="3" fill="rgba(255,255,255,0.5)"/>
    <rect x="384" y="188" width="55" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="384" y="199" width="140" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <rect x="384" y="210" width="100" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <circle cx="366" cy="186" r="5" fill="#7c3aed"/>
    <circle cx="544" cy="186" r="5" fill="#7c3aed"/>
    {/* Output node */}
    <rect x="660" y="96" width="155" height="64" rx="12" fill="#0d0d14"/>
    <rect x="660" y="96" width="155" height="25" rx="12" fill="rgba(16,185,129,0.14)"/>
    <rect x="660" y="109" width="155" height="12" fill="rgba(16,185,129,0.14)"/>
    <circle cx="680" cy="109" r="7" fill="rgba(16,185,129,0.3)"/>
    <rect x="694" y="105" width="50" height="8" rx="3" fill="rgba(255,255,255,0.45)"/>
    <rect x="672" y="136" width="70" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <circle cx="656" cy="128" r="5" fill="#10b981"/>
    {/* Condition node */}
    <rect x="660" y="218" width="155" height="64" rx="12" fill="#0d0d14"/>
    <rect x="660" y="218" width="155" height="25" rx="12" fill="rgba(245,158,11,0.14)"/>
    <rect x="660" y="231" width="155" height="12" fill="rgba(245,158,11,0.14)"/>
    <circle cx="680" cy="231" r="7" fill="rgba(245,158,11,0.3)"/>
    <rect x="694" y="227" width="55" height="8" rx="3" fill="rgba(255,255,255,0.45)"/>
    <rect x="672" y="256" width="90" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <circle cx="656" cy="250" r="5" fill="#f59e0b"/>
    {/* API node */}
    <rect x="55" y="255" width="165" height="74" rx="12" fill="#0d0d14"/>
    <rect x="55" y="255" width="165" height="25" rx="12" fill="rgba(59,130,246,0.14)"/>
    <rect x="55" y="268" width="165" height="12" fill="rgba(59,130,246,0.14)"/>
    <circle cx="76" cy="268" r="7" fill="rgba(59,130,246,0.3)"/>
    <rect x="90" y="264" width="60" height="8" rx="3" fill="rgba(255,255,255,0.45)"/>
    <rect x="70" y="293" width="45" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="70" y="303" width="125" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <circle cx="224" cy="293" r="5" fill="#3b82f6"/>
    {/* Palette sidebar */}
    <rect x="0" y="0" width="42" height="440" fill="rgba(0,0,0,0.4)"/>
    {[["rgba(99,102,241,0.2)"], ["rgba(245,158,11,0.15)"], ["rgba(16,185,129,0.15)"], ["rgba(59,130,246,0.15)"], ["rgba(124,58,237,0.2)"]].map((bg, i) => (
      <rect key={i} x="5" y={14 + i * 42} width="32" height="32" rx="8" fill={bg[0]}/>
    ))}
  </svg>
);

/* ─────────────────────────────────────────────
   GAMIFICATION COMPONENTS
───────────────────────────────────────────── */
const XPBar: React.FC<{ label: string; xp: number; max: number; color: string }> = ({ label, xp, max, color }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-700)" }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color }}>{xp}/{max}</span>
    </div>
    <div style={{ height: "5px", borderRadius: "100px", background: "rgba(255,255,255,0.05)" }}>
      <motion.div initial={{ width: 0 }} whileInView={{ width: `${(xp / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.3, ease: "easeOut" }}
        style={{ height: "100%", borderRadius: "100px", background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 6px ${color}60` }}/>
    </div>
  </div>
);

const BADGE_DEFS = [
  { icon: <Wrench size={17}/>, label: "First Workflow", color: "#6366f1", unlocked: true },
  { icon: <Bot size={17}/>, label: "AI Wizard", color: "#7c3aed", unlocked: true },
  { icon: <Network size={17}/>, label: "Node Collector", color: "#f59e0b", unlocked: true },
  { icon: <Upload size={17}/>, label: "First Export", color: "#10b981", unlocked: true },
  { icon: <Shield size={17}/>, label: "Security Pro", color: "#06b6d4", unlocked: false },
  { icon: <Zap size={17}/>, label: "Speed Builder", color: "#f43f5e", unlocked: false },
  { icon: <Globe2 size={17}/>, label: "API Master", color: "#3b82f6", unlocked: false },
  { icon: <Trophy size={17}/>, label: "Pipeline Pro", color: "#f59e0b", unlocked: false },
];

/* Floating orb backgrounds */
const AmbientBG = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: "-20%", left: "15%", width: "70vw", height: "70vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)", filter: "blur(80px)" }}/>
    <div style={{ position: "absolute", top: "40%", right: "-10%", width: "55vw", height: "55vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)", filter: "blur(100px)" }}/>
    <div style={{ position: "absolute", bottom: "5%", left: "-5%", width: "45vw", height: "45vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)", filter: "blur(100px)" }}/>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "52px 48px" }}/>
  </div>
);

/* ─────────────────────────────────────────────
   NODE GRID
───────────────────────────────────────────── */
const NodeGrid = () => {
  const groups = [
    { name: "Triggers", color: "#f59e0b", nodes: ["Webhook", "Schedule", "Manual Input", "Telegram", "WhatsApp", "Discord"] },
    { name: "AI & Core", color: "#6366f1", nodes: ["LLM", "Prompt Template", "AI Router", "Chain", "Agent", "Embedder"] },
    { name: "Logic & Flow", color: "#7c3aed", nodes: ["Condition", "Switch", "Loop", "Code", "Merge", "Split"] },
    { name: "Data & Transform", color: "#3b82f6", nodes: ["Text", "Set Variables", "HTTP Request", "JSON Parser", "Transformer", "Validator"] },
    { name: "Integrations", color: "#10b981", nodes: ["Email", "Slack", "Notion", "Google Sheets", "GitHub", "Airtable"] },
    { name: "RAG & Memory", color: "#06b6d4", nodes: ["Embedder", "Vector Store", "Retriever", "Memory", "Document", "Chunker"] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px" }}>
      {groups.map((g) => (
        <div key={g.name} style={{ background: "rgba(255,255,255,0.024)", borderRadius: "14px", padding: "16px", boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(0,0,0,0.3)` }}>
          <div style={{ position: "relative", height: "3px", borderRadius: "100px", background: g.color, marginBottom: "12px", boxShadow: `0 0 12px ${g.color}80` }}/>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: g.color, boxShadow: `0 0 8px ${g.color}` }}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "var(--text-700)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{g.name}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {g.nodes.map((n) => (
              <span key={n} style={{ padding: "3px 9px", borderRadius: "100px", fontSize: 11, fontWeight: 600, background: `${g.color}12`, color: g.color }}>{n}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const user = useStore((s) => s.user);
  const loading = useStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 55]);

  useEffect(() => { document.body.setAttribute("data-theme", "dark"); }, []);
  if (!loading && user) return <Navigate to="/app" replace />;

  const scrollTo = (id: string) =>
    scrollRef.current?.querySelector(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); setEmail(""); }, 1300);
  };

  const FEATURES = [
    {
      accent: "#6366f1", badge: "Visual Builder", badgeIcon: <Workflow size={11}/>,
      title: "Drag. Drop. Deploy.",
      desc: "An infinite canvas built for power users. Connect 45+ modular nodes, trace logic flows, and orchestrate complex multi-LLM pipelines without writing a line of code.",
      bullets: ["Infinite canvas with pan and zoom", "45+ node types across 6 groups", "Dagre auto-layout engine", "Full undo / redo history"],
      visual: (
        <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}>
          <div style={{ height: "36px", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "7px", padding: "0 14px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }}/><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }}/><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }}/>
            <div style={{ flex: 1, margin: "0 14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: "var(--text-500)", fontFamily: "var(--font-mono)" }}>app.aurastudio.ai</span>
            </div>
          </div>
          <div style={{ background: "#070709" }}><CanvasSVG/></div>
        </div>
      ),
      side: "right" as const,
    },
    {
      accent: "#f59e0b", badge: "AI Orchestrator", badgeIcon: <Sparkles size={11}/>,
      title: "Describe it. Built in seconds.",
      desc: "Type what you want in plain English. Aura's Intent Orchestrator — powered by Gemini 2.5 Flash — converts your description into a full production workflow instantly.",
      bullets: ["Gemini 2.5 Flash streaming SSE", "Natural language to full workflow", "Task plan detection and confirm", "Live streaming cursor animation"],
      visual: (
        <div style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.025)", boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)", padding: "20px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-500)", marginBottom: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
            <Sparkles size={10} color="#f59e0b"/> Intent Orchestrator · Gemini 2.5 Flash
          </div>
          {[
            { role: "user", text: "Build a RAG pipeline that answers questions from our docs" },
            { role: "ai", text: "Planning 6 nodes:\n1. Webhook trigger\n2. Doc retriever\n3. Vector store lookup\n4. LLM answer generation\n5. Response formatter\n6. HTTP output" },
            { role: "ai", text: "Workflow ready. Click Generate to apply to your canvas." },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: "8px", display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "88%", padding: "9px 13px", borderRadius: "10px", background: m.role === "user" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", fontSize: 12, color: "var(--text-700)", lineHeight: 1.65, whiteSpace: "pre-line", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{m.text}</div>
            </div>
          ))}
          <div style={{ marginTop: "12px", padding: "11px 14px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(124,58,237,0.14))", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.2)" }}>
            <Sparkles size={12} color="#a78bfa"/>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Generate Workflow on Canvas</span>
          </div>
        </div>
      ),
      side: "left" as const,
    },
    {
      accent: "#10b981", badge: "One-Click Export", badgeIcon: <Package size={11}/>,
      title: "Ship production code instantly.",
      desc: "Turn your visual graph into deployment-ready code. Choose from 7 project scaffolds — Telegram bots, Discord bots, React SPAs, Docker full-stacks, and more.",
      bullets: ["Telegram, Discord, WhatsApp bots", "React SPA and Node.js API", "Fullstack Docker + Compose", "WordPress PHP plugin scaffold"],
      visual: (
        <div style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.025)", boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)", padding: "20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>Select Project Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "7px" }}>
            {[
              { name: "Telegram", color: "#6366f1", icon: <Bot size={14}/> },
              { name: "Discord", color: "#7c3aed", icon: <MessageSquare size={14}/> },
              { name: "WhatsApp", color: "#10b981", icon: <MessageSquare size={14}/> },
              { name: "React SPA", color: "#3b82f6", icon: <Code2 size={14}/> },
              { name: "Node API", color: "#f59e0b", icon: <Zap size={14}/> },
              { name: "Docker", color: "#06b6d4", icon: <Package size={14}/>, selected: true },
            ].map((ex) => (
              <div key={ex.name} style={{ padding: "10px 8px", borderRadius: "9px", background: ex.selected ? `${ex.color}22` : "rgba(255,255,255,0.03)", textAlign: "center", cursor: "pointer", transition: "all 0.18s", boxShadow: ex.selected ? `0 0 20px ${ex.color}30` : "none" }}>
                <div style={{ display: "flex", justifyContent: "center", color: ex.color, marginBottom: "4px" }}>{ex.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: ex.selected ? ex.color : "var(--text-500)" }}>{ex.name}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "12px", padding: "9px 13px", borderRadius: "9px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 4px 20px rgba(16,185,129,0.15)" }}>
            <Download size={12} color="#10b981"/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Download project.zip — Deploy anywhere</span>
          </div>
        </div>
      ),
      side: "right" as const,
    },
    {
      accent: "#06b6d4", badge: "Security First", badgeIcon: <Lock size={11}/>,
      title: "Your keys. Your device.",
      desc: "Every credential is encrypted with AES-256-GCM via Web Crypto API, stored only in your browser. Your secrets are never transmitted to our servers — enforced by architecture.",
      bullets: ["AES-256-GCM Web Crypto encryption", "PBKDF2 key derivation", "Zero server-side credential storage", "Per-node credential management"],
      visual: (
        <div style={{ borderRadius: "16px", overflow: "hidden", background: "rgba(255,255,255,0.025)", boxShadow: "0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)", padding: "20px" }}>
          {[
            { label: "OpenAI API Key", color: "#10b981" },
            { label: "Telegram Bot Token", color: "#6366f1" },
            { label: "Slack Webhook URL", color: "#f59e0b" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 13px", borderRadius: "9px", background: "rgba(255,255,255,0.03)", marginBottom: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
              <div style={{ width: 30, height: 30, borderRadius: "8px", background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}><Lock size={12}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-700)", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-500)", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: "4px" }}>••••••••••••••••••</div>
              </div>
              <div style={{ padding: "2px 7px", borderRadius: "20px", background: `${item.color}12`, color: item.color, fontSize: 9, fontWeight: 900, letterSpacing: "0.04em" }}>ENCRYPTED</div>
            </div>
          ))}
          <div style={{ padding: "9px 12px", borderRadius: "9px", background: "rgba(16,185,129,0.07)", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 2px 12px rgba(16,185,129,0.1)" }}>
            <Shield size={12} color="#10b981"/>
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>AES-256-GCM · Keys never leave your browser</span>
          </div>
        </div>
      ),
      side: "left" as const,
    },
  ];

  const STEPS = [
    { n: "01", icon: <MessageSquare size={20}/>, color: "#6366f1", title: "Describe your workflow", desc: "Tell Aura what you want in plain language. Our AI understands APIs, bots, data pipelines, and automation patterns perfectly." },
    { n: "02", icon: <Workflow size={20}/>, color: "#7c3aed", title: "Visualize and customize", desc: "Your workflow appears on the canvas instantly. Drag nodes, add connections, configure credentials with the Node Config panel." },
    { n: "03", icon: <Zap size={20}/>, color: "#10b981", title: "Simulate, export, deploy", desc: "Run in simulation mode to validate edge cases. Export production-ready code as a ZIP and deploy to any platform." },
  ];

  const PRICING = [
    { name: "Free", price: "$0", period: "forever", features: ["20 AI credits / month", "Unlimited canvas", "All 45+ node types", "Local execution sim", "3 workflow snapshots"], cta: "Get Started Free", highlight: false, color: "#6366f1" },
    { name: "Pro", price: "$12", period: "/ month", features: ["Unlimited AI credits", "Priority Gemini access", "All 7 export formats", "Unlimited snapshots", "Priority support", "Custom branding"], cta: "Join Pro Waitlist", highlight: true, color: "#6366f1", badge: "Most Popular" },
    { name: "Annual", price: "$96", period: "/ year", features: ["Everything in Pro", "Save 33%", "Annual invoice", "Early feature access", "Discord community", "1-on-1 onboarding"], cta: "Join Annual Waitlist", highlight: false, color: "#7c3aed" },
  ];

  return (
    <div ref={scrollRef} style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden", background: "var(--bg-app)", color: "var(--text-900)", fontFamily: "var(--font-body)", WebkitFontSmoothing: "antialiased", scrollbarWidth: "thin", scrollbarColor: "rgba(99,102,241,0.25) transparent" }}>

      {/* Scroll progress bar */}
      <motion.div style={{ position: "fixed", top: 0, left: 0, zIndex: 999, height: "2px", background: "linear-gradient(90deg, #6366f1, #7c3aed, #06b6d4)", scaleX: scrollYProgress, transformOrigin: "left", pointerEvents: "none" }}/>

      <AmbientBG/>
      <LandingNav onScrollTo={scrollTo}/>

      {/* ══════════ HERO ══════════ */}
      <section style={{ position: "relative", zIndex: 10, minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "56px 5vw 72px" }}>
        <motion.div style={{ y: heroY, display: "flex", flexDirection: "column", alignItems: "center" }}>

          <motion.div initial={{ opacity: 0, scale: 0.85, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16,1,0.3,1] }}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(99,102,241,0.12)", color: "var(--primary)", padding: "6px 16px", borderRadius: "100px", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", marginBottom: "22px", boxShadow: "0 0 30px rgba(99,102,241,0.2), inset 0 0 0 1px rgba(99,102,241,0.3)", textTransform: "uppercase" }}>
            <Sparkles size={11}/> Introducing Aura Studio V2
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.16,1,0.3,1] }}
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 7vw, 90px)", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.045em", maxWidth: "960px", marginBottom: "20px", color: "var(--text-900)" }}>
            Build AI Pipelines.<br/>
            <span style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 40px rgba(99,102,241,0.5))" }}>Visually.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.18, ease: [0.16,1,0.3,1] }}
            style={{ fontSize: "clamp(14px, 1.9vw, 19px)", color: "var(--text-500)", maxWidth: "600px", lineHeight: 1.7, marginBottom: "32px" }}>
            No-code LLM orchestration, RAG workflows, and production AI automation. Connect 45+ nodes, simulate, and export production code.
          </motion.p>

          {/* Stat pills */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }}
            style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "30px" }}>
            {[
              { icon: <Zap size={11}/>, label: "Instant AI Builds", color: "#f59e0b" },
              { icon: <Lock size={11}/>, label: "AES-256 Secure", color: "#06b6d4" },
              { icon: <Download size={11}/>, label: "7 Export Formats", color: "#10b981" },
              { icon: <Star size={11}/>, label: "Free Forever", color: "#6366f1" },
            ].map((p) => (
              <motion.span key={p.label} whileHover={{ scale: 1.06 }}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 13px", borderRadius: "100px", background: `${p.color}12`, color: p.color, fontSize: 11, fontWeight: 700, boxShadow: `0 0 20px ${p.color}18` }}>
                {p.icon}{p.label}
              </motion.span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.28 }}
            style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "68px" }}>
            <button onClick={() => scrollTo("#waitlist")}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", padding: "14px 36px", borderRadius: "100px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 8px 32px rgba(99,102,241,0.45)", border: "none" }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(99,102,241,0.6)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.45)"; }}>
              Join the Waitlist <ArrowRight size={16}/>
            </button>
            <Link to="/login"
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", color: "var(--text-900)", padding: "14px 36px", borderRadius: "100px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, textDecoration: "none", transition: "all 0.3s", boxShadow: "0 0 0 1px rgba(255,255,255,0.07)" }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <Play size={14}/> Try the App
            </Link>
          </motion.div>

          {/* Hero preview */}
          <motion.div initial={{ opacity: 0, y: 65, rotateX: 14 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.2, delay: 0.42, ease: [0.16,1,0.3,1] }}
            style={{ width: "100%", maxWidth: "1180px", perspective: "2000px", position: "relative" }}>
            <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", width: "70%", height: "130px", background: "radial-gradient(ellipse, rgba(99,102,241,0.22) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none", zIndex: -1 }}/>
            <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 50px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)" }}>
              <div style={{ height: "36px", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "7px", padding: "0 14px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }}/><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }}/><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }}/>
                <div style={{ flex: 1, margin: "0 16px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "var(--text-500)", fontFamily: "var(--font-mono)" }}>app.aurastudio.ai</span>
                </div>
              </div>
              <div style={{ background: "#070709" }}><CanvasSVG/></div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 5vw", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", maxWidth: "800px", margin: "0 auto" }}>
          {[
            { value: "45+", label: "Node Types" },
            { value: "7", label: "Export Formats" },
            { value: "AES-256", label: "Encryption" },
            { value: "Free", label: "Forever Tier" },
          ].map((s, i, arr) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ flex: "1 0 140px", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px", position: "relative" }}>
              {i < arr.length - 1 && <div style={{ position: "absolute", right: 0, top: "25%", height: "50%", width: "1px", background: "rgba(255,255,255,0.05)" }}/>}
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 2.5vw, 36px)", fontWeight: 800, color: "var(--text-900)", letterSpacing: "-0.03em" }}>{s.value}</span>
              <span style={{ fontSize: 11, color: "var(--text-500)", fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{ position: "relative", zIndex: 10 }}>
        {FEATURES.map((f, i) => (
          <div key={f.badge} style={{ padding: "8vw 7vw", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "52px", alignItems: "center", background: i % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent" }}>
            <motion.div initial={{ opacity: 0, x: f.side === "right" ? -36 : 36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.75 }} style={{ order: f.side === "right" ? 0 : 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "100px", marginBottom: "18px", background: `${f.accent}12`, color: f.accent, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", boxShadow: `0 0 20px ${f.accent}18` }}>
                {f.badgeIcon} {f.badge}
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 2.8vw, 42px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "14px", lineHeight: 1.12, color: "var(--text-900)" }}>{f.title}</h2>
              <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.35vw, 15px)", lineHeight: 1.78, marginBottom: "20px" }}>{f.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {f.bullets.map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "center", gap: "9px", color: "var(--text-700)", fontSize: 13 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${f.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 8px ${f.accent}30` }}>
                      <CheckCircle2 size={10} color={f.accent}/>
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: f.side === "right" ? 36 : -36 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.85, delay: 0.08 }} style={{ order: f.side === "right" ? 1 : 0, position: "relative" }}>
              <div style={{ position: "absolute", inset: "-40px", background: `radial-gradient(ellipse, ${f.accent}09 0%, transparent 65%)`, pointerEvents: "none", zIndex: -1 }}/>
              {f.visual}
            </motion.div>
          </div>
        ))}
      </section>

      {/* ══════════ GAMIFICATION ══════════ */}
      <section style={{ position: "relative", zIndex: 10, padding: "8vw 6vw", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 13px", borderRadius: "100px", marginBottom: "16px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", boxShadow: "0 0 20px rgba(245,158,11,0.15)" }}>
              <Trophy size={11}/> Builder Achievements
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3vw, 48px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "12px", color: "var(--text-900)" }}>Level up your AI game.</h2>
            <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", maxWidth: 460, margin: "0 auto", lineHeight: 1.65 }}>Build workflows, earn achievements, and track your progress as an AI automation expert.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
            {/* Builder Level */}
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              style={{ background: "rgba(255,255,255,0.025)", borderRadius: "18px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: 46, height: 46, borderRadius: "13px", background: "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(124,58,237,0.18))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
                  <Building2 size={20} color="#6366f1"/>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Aura Builder</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "var(--text-900)" }}>Level 5 — Architect</div>
                </div>
              </div>
              <XPBar label="Visual Builder" xp={850} max={1000} color="#6366f1"/>
              <XPBar label="AI Orchestration" xp={620} max={1000} color="#f59e0b"/>
              <XPBar label="Export Mastery" xp={430} max={1000} color="#10b981"/>
              <XPBar label="Security Expert" xp={275} max={1000} color="#06b6d4"/>
            </motion.div>

            {/* Badges */}
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.07 }}
              style={{ background: "rgba(255,255,255,0.025)", borderRadius: "18px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>Achievement Badges</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {BADGE_DEFS.map((badge) => (
                  <motion.div key={badge.label} whileHover={{ scale: 1.1 }} title={badge.label}
                    style={{ width: 46, height: 46, borderRadius: "12px", background: badge.unlocked ? `${badge.color}18` : "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: badge.unlocked ? badge.color : "rgba(255,255,255,0.15)", transition: "all 0.2s", boxShadow: badge.unlocked ? `0 0 16px ${badge.color}30` : "none" }}>
                    {badge.icon}
                  </motion.div>
                ))}
              </div>
              <div style={{ marginTop: "12px", fontSize: 12, color: "var(--text-500)" }}>4 / 8 badges unlocked</div>
            </motion.div>

            {/* Challenge */}
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.14 }}
              style={{ background: "linear-gradient(145deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))", borderRadius: "18px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,158,11,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Star size={15} color="#f59e0b" fill="#f59e0b"/>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Weekly Challenge</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px, 1.6vw, 18px)", fontWeight: 800, color: "var(--text-900)", marginBottom: 9, letterSpacing: "-0.02em" }}>Build a Telegram Summarizer Bot</h3>
              <p style={{ color: "var(--text-500)", fontSize: 12, lineHeight: 1.65, marginBottom: "14px" }}>Monitor Telegram messages, summarize with LLM, send daily digests. Export as a working Telegram Bot project.</p>
              <div style={{ display: "flex", gap: "5px", marginBottom: "14px", flexWrap: "wrap" }}>
                {["Webhook", "LLM", "Schedule", "Telegram"].map((t) => (
                  <span key={t} style={{ padding: "3px 9px", borderRadius: "100px", fontSize: 10, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>{t}</span>
                ))}
              </div>
              <div style={{ padding: "9px 12px", borderRadius: "9px", background: "rgba(245,158,11,0.07)", display: "flex", alignItems: "center", gap: "7px" }}>
                <Trophy size={12} color="#f59e0b"/>
                <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>500 XP + Speed Builder Badge</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ NODES ══════════ */}
      <section id="nodes" style={{ position: "relative", zIndex: 10, padding: "8vw 6vw" }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 13px", borderRadius: "100px", marginBottom: "16px", background: "rgba(99,102,241,0.1)", color: "var(--primary)", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
            <Layers size={11}/> 45+ Nodes Across 6 Categories
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.2vw, 50px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "12px", color: "var(--text-900)" }}>Everything you need.<br/>Nothing you don't.</h2>
          <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>From HTTP triggers to RAG retrievers — every step of a production AI workflow, covered.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <NodeGrid/>
        </motion.div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section style={{ position: "relative", zIndex: 10, padding: "8vw 6vw", background: "rgba(0,0,0,0.18)" }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.2vw, 50px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "12px", color: "var(--text-900)" }}>From idea to production<br/>in 3 steps.</h2>
          <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", maxWidth: 400, margin: "0 auto" }}>No DevOps. No complex setup. Just build, test, and ship.</p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "14px", maxWidth: "940px", margin: "0 auto" }}>
          {STEPS.map((step, i) => (
            <motion.div key={step.n} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ background: "rgba(255,255,255,0.025)", borderRadius: "18px", padding: "26px 22px", position: "relative", overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.04)" }}>
              <div style={{ position: "absolute", top: -4, right: -4, fontFamily: "var(--font-display)", fontSize: 80, fontWeight: 900, color: "rgba(255,255,255,0.02)", lineHeight: 1, userSelect: "none" }}>{step.n}</div>
              <div style={{ width: 42, height: 42, borderRadius: "11px", background: `${step.color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: step.color, boxShadow: `0 0 20px ${step.color}25` }}>{step.icon}</div>
              <div style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: step.color, background: `${step.color}10`, padding: "2px 7px", borderRadius: "4px", marginBottom: "9px", letterSpacing: "0.04em" }}>STEP {step.n}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(15px, 1.5vw, 19px)", fontWeight: 800, color: "var(--text-900)", marginBottom: 8, letterSpacing: "-0.02em" }}>{step.title}</h3>
              <p style={{ color: "var(--text-500)", fontSize: 13, lineHeight: 1.65 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" style={{ position: "relative", zIndex: 10, padding: "8vw 6vw" }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.2vw, 50px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "12px", color: "var(--text-900)" }}>Simple, honest pricing.</h2>
          <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", maxWidth: 380, margin: "0 auto" }}>Start free. Scale as you grow. No vendor lock-in.</p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", maxWidth: "900px", margin: "0 auto" }}>
          {PRICING.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ background: plan.highlight ? "linear-gradient(145deg, rgba(99,102,241,0.12), rgba(124,58,237,0.07))" : "rgba(255,255,255,0.024)", borderRadius: "20px", padding: "30px 24px", position: "relative", boxShadow: plan.highlight ? "0 0 60px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.25)" : "0 18px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)" }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", padding: "3px 13px", borderRadius: "100px", fontSize: 9, fontWeight: 900, letterSpacing: "0.06em", whiteSpace: "nowrap", textTransform: "uppercase", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>{plan.badge}</div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "22px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 3.5vw, 46px)", fontWeight: 800, color: "var(--text-900)", letterSpacing: "-0.04em" }}>{plan.price}</span>
                <span style={{ color: "var(--text-500)", fontSize: 13 }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "7px", color: "var(--text-700)", fontSize: 13 }}>
                    <CheckCircle2 size={13} color={plan.color} style={{ flexShrink: 0 }}/>{feat}
                  </li>
                ))}
              </ul>
              <button onClick={() => scrollTo("#waitlist")}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.3s", background: plan.highlight ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "rgba(255,255,255,0.06)", color: plan.highlight ? "#fff" : "var(--text-900)", border: "none", boxShadow: plan.highlight ? "0 4px 20px rgba(99,102,241,0.35)" : "none" }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.filter = "none"; }}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ WAITLIST ══════════ */}
      <section id="waitlist" style={{ position: "relative", zIndex: 10, padding: "10vw 6vw", background: "rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)", filter: "blur(75px)", pointerEvents: "none" }}/>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "52px", alignItems: "start" }}>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "100px", marginBottom: "18px", background: "rgba(99,102,241,0.1)", color: "var(--primary)", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
              <Mail size={10}/> Early Access
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.2vw, 46px)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: "12px", lineHeight: 1.1, color: "var(--text-900)" }}>Get early access.<br/>Shape the future.</h2>
            <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", lineHeight: 1.7, marginBottom: "22px" }}>
              Aura Studio is invite-only beta. Join the waitlist to be among the first to access the full platform and connect with the founder directly.
            </p>

            {/* Waitlist progress */}
            <div style={{ background: "rgba(99,102,241,0.07)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", boxShadow: "0 0 0 1px rgba(99,102,241,0.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 7px #10b981", animation: "landing-pulse 2s infinite" }}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-900)" }}>247 / 500 early spots claimed</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 800 }}>253 left</span>
              </div>
              <div style={{ height: "5px", borderRadius: "100px", background: "rgba(255,255,255,0.05)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: "49.4%" }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  style={{ height: "100%", borderRadius: "100px", background: "linear-gradient(90deg, #6366f1, #7c3aed)", boxShadow: "0 0 8px rgba(99,102,241,0.5)" }}/>
              </div>
              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                <Flame size={11} color="#f59e0b"/>
                <span style={{ fontSize: 11, color: "var(--text-500)" }}>12 people joined in the last 24 hours</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required disabled={isSubmitting}
                      style={{ flex: 1, padding: "12px 15px", borderRadius: "11px", background: "rgba(255,255,255,0.05)", color: "var(--text-900)", fontSize: 14, outline: "none", fontFamily: "var(--font-body)", transition: "all 0.2s", boxShadow: "0 0 0 1px rgba(255,255,255,0.07)", border: "none" }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.15)"; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.07)"; }}/>
                    <button type="submit" disabled={isSubmitting}
                      style={{ padding: "12px 22px", borderRadius: "11px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: isSubmitting ? "not-allowed" : "pointer", transition: "all 0.3s", opacity: isSubmitting ? 0.7 : 1, whiteSpace: "nowrap", border: "none", boxShadow: "0 4px 18px rgba(99,102,241,0.35)" }}>
                      {isSubmitting ? "Joining…" : "Join"}
                    </button>
                  </div>
                  <p style={{ color: "var(--text-500)", fontSize: 11, paddingLeft: 2 }}>No spam. Beta invitations and product updates only.</p>
                </motion.form>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(16,185,129,0.06)", borderRadius: "16px", padding: "22px", textAlign: "center", boxShadow: "0 0 0 1px rgba(16,185,129,0.18), 0 20px 50px rgba(0,0,0,0.3)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}>
                    <CheckCircle2 size={22} color="#10b981"/>
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--text-900)", marginBottom: 7 }}>You're on the list!</h3>
                  <p style={{ color: "var(--text-500)", fontSize: 12, lineHeight: 1.65, marginBottom: 16 }}>Confirm your spot by sending a quick email.</p>
                  <a href="mailto:amit98ch@gmail.com?subject=Aura%20Studio%20Waitlist%20Confirmation&body=Hi%20Amit%2C%0A%0AI%20just%20joined%20the%20waitlist%20and%20would%20love%20to%20confirm%20my%20spot!%0A%0AThanks"
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "#fff", textDecoration: "none", padding: "10px 22px", borderRadius: "100px", fontWeight: 700, fontSize: 13, transition: "all 0.3s", boxShadow: "0 4px 18px rgba(99,102,241,0.35)" }}>
                    <Mail size={12}/> Confirm via Email
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Connect */}
          <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 1.9vw, 24px)", fontWeight: 800, color: "var(--text-900)", letterSpacing: "-0.02em", marginBottom: 8 }}>Let's connect.</h3>
            <p style={{ color: "var(--text-500)", fontSize: "clamp(12px, 1.2vw, 14px)", lineHeight: 1.65, marginBottom: 18 }}>
              Built by <strong style={{ color: "var(--text-700)" }}>Amit Chakraborty</strong> — indie developer and AI enthusiast.
            </p>
            {[
              { icon: <Linkedin size={17}/>, label: "LinkedIn", handle: "@devamitch", desc: "Connect professionally. Build logs, AI experiments, startup insights.", color: "#0077b5", href: "https://www.linkedin.com/in/devamitch/" },
              { icon: <Globe size={17}/>, label: "Portfolio", handle: "devamit.co.in", desc: "Full portfolio — projects, case studies, and open source work.", color: "#6366f1", href: "https://devamit.co.in/" },
              { icon: <Mail size={17}/>, label: "Email", handle: "amit98ch@gmail.com", desc: "Partnership, investment, feedback, or just to say hi.", color: "#10b981", href: "mailto:amit98ch@gmail.com" },
            ].map((card) => (
              <a key={card.label} href={card.href} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderRadius: "13px", background: "rgba(255,255,255,0.025)", textDecoration: "none", transition: "all 0.22s", marginBottom: "9px", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }}
                onMouseOver={(e) => { e.currentTarget.style.background = `${card.color}09`; e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = `0 0 0 1px ${card.color}30, 0 8px 25px rgba(0,0,0,0.3)`; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.04)"; }}>
                <div style={{ width: 36, height: 36, borderRadius: "9px", background: `${card.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0, boxShadow: `0 0 16px ${card.color}20` }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-900)" }}>{card.label}</span>
                    <span style={{ fontSize: 10, color: card.color, fontFamily: "var(--font-mono)" }}>{card.handle}</span>
                    <ExternalLink size={10} color="var(--text-500)" style={{ marginLeft: "auto", flexShrink: 0 }}/>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-500)", margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ SUPPORT ══════════ */}
      <section id="support" style={{ position: "relative", zIndex: 10, padding: "8vw 6vw" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ background: "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))", borderRadius: "24px", padding: "44px 40px", textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,158,11,0.1)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 0 24px rgba(245,158,11,0.25)" }}>
              <Coffee size={22} color="#f59e0b"/>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3vw, 38px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "12px", color: "var(--text-900)" }}>
              Love what I'm building?<br/>Support the work.
            </h2>
            <p style={{ color: "var(--text-500)", fontSize: "clamp(13px, 1.3vw, 15px)", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 30px" }}>
              Aura Studio is built solo, nights and weekends, entirely as a passion project. If it's useful to you, your support keeps the servers running and the builder motivated.
            </p>
            <div style={{ display: "flex", gap: "11px", justifyContent: "center", flexWrap: "wrap", marginBottom: "26px" }}>
              <a href="https://buymeacoffee.com/amithellmab" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "#FFDD00", color: "#000", textDecoration: "none", padding: "13px 30px", borderRadius: "100px", fontWeight: 900, fontSize: 14, fontFamily: "var(--font-body)", transition: "all 0.3s", boxShadow: "0 6px 24px rgba(255,221,0,0.3)" }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(255,221,0,0.45)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(255,221,0,0.3)"; }}>
                <Coffee size={16}/> Buy Me a Coffee
              </a>
              <a href="https://www.linkedin.com/in/devamitch/" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,119,181,0.12)", color: "#0077b5", textDecoration: "none", padding: "13px 26px", borderRadius: "100px", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)", transition: "all 0.3s", boxShadow: "0 0 0 1px rgba(0,119,181,0.25)" }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,119,181,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,119,181,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <Linkedin size={15}/> Follow on LinkedIn
              </a>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
              {[
                { href: "https://www.linkedin.com/in/devamitch/", icon: <Linkedin size={13}/>, label: "LinkedIn" },
                { href: "https://devamit.co.in/", icon: <Globe size={13}/>, label: "Portfolio" },
                { href: "https://crunchyroll.devamit.co.in/", icon: <ExternalLink size={13}/>, label: "Projects" },
                { href: "mailto:amit98ch@gmail.com", icon: <Mail size={13}/>, label: "Email" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-500)", textDecoration: "none", fontSize: 12, transition: "color 0.18s" }}
                  onMouseOver={(e) => e.currentTarget.style.color = "var(--text-900)"}
                  onMouseOut={(e) => e.currentTarget.style.color = "var(--text-500)"}>
                  {l.icon} {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter onScrollTo={scrollTo}/>
    </div>
  );
};
