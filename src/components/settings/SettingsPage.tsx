import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Database,
  Download,
  HardDrive,
  Info,
  KeyRound,
  LogOut,
  Moon,
  RefreshCcw,
  Server,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_ME_QUERY_KEY } from "../../hooks/useAuthMeSync";
import {
  clearApiBaseUrlOverride,
  clearGeminiApiKeyOverride,
  getApiBaseUrl,
  getApiBaseUrlOverride,
  getDefaultApiBaseUrl,
  getEnvGeminiApiKey,
  getGeminiApiKey,
  getGeminiApiKeyOverride,
  setApiBaseUrlOverride,
  setGeminiApiKeyOverride,
} from "../../lib/runtime-config";
import { useStore } from "../../store";

const KNOWN_LOCAL_KEYS = [
  "aura_store",
  "vs_saved_workflows",
  "aura_workflow_versions",
  "aura_user_plan",
  "aura_api_base_override",
  "aura_gemini_key_override",
  "aura_google_token",
  "aura_google_profile",
  "aura_saved_accounts",
  "REACT_QUERY_OFFLINE_CACHE",
] as const;

const SECTION_LINKS = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Sparkles },
  { id: "plan", label: "Plan", icon: Crown },
  { id: "runtime-api", label: "Runtime API", icon: Server },
  { id: "runtime-key", label: "Gemini Key", icon: KeyRound },
  { id: "workspace", label: "Workspace", icon: Database },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
] as const;

type SectionId = (typeof SECTION_LINKS)[number]["id"];
type NoticeTone = "success" | "error" | "info";

interface NoticeState {
  message: string;
  tone: NoticeTone;
}

interface SectionLink {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

const createSectionMap = (): Record<SectionId, HTMLElement | null> =>
  Object.fromEntries(SECTION_LINKS.map(({ id }) => [id, null])) as Record<
    SectionId,
    HTMLElement | null
  >;

const maskSecret = (value: string): string => {
  if (!value) return "Not configured";
  if (value.length <= 10) return "••••••••";
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
};

function formatBytes(chars: number): string {
  const kb = chars / 1024;
  if (!Number.isFinite(kb) || kb <= 0) return "0 KB";
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(1)} KB`;
}

function collectStorageStats() {
  if (typeof window === "undefined") {
    return { keysCount: 0, usageLabel: "0 KB" };
  }

  const keysCount = KNOWN_LOCAL_KEYS.filter((key) =>
    Boolean(window.localStorage.getItem(key)),
  ).length;

  const totalChars = KNOWN_LOCAL_KEYS.reduce(
    (sum, key) => sum + (window.localStorage.getItem(key)?.length ?? 0),
    0,
  );

  return {
    keysCount,
    usageLabel: formatBytes(totalChars),
  };
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs =
    useRef<Record<SectionId, HTMLElement | null>>(createSectionMap());

  const user = useStore((s) => s.user);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const plan = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const addExtraCredits = useStore((s) => s.addExtraCredits);
  const signOut = useStore((s) => s.signOut);
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const exportToJSON = useStore((s) => s.exportToJSON);
  const importFromJSON = useStore((s) => s.importFromJSON);
  const loadDemo = useStore((s) => s.loadDemo);
  const clearCanvas = useStore((s) => s.clearCanvas);
  const createVersion = useStore((s) => s.createVersion);

  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [apiBaseInput, setApiBaseInput] = useState(getApiBaseUrl());
  const [geminiKeyInput, setGeminiKeyInput] = useState(
    getGeminiApiKeyOverride(),
  );
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("account");

  const envGeminiKey = useMemo(() => getEnvGeminiApiKey(), []);
  const geminiKeyActive = getGeminiApiKey();
  const hasGeminiOverride = Boolean(getGeminiApiKeyOverride());
  const hasApiOverride = Boolean(getApiBaseUrlOverride());

  const storageStats = useMemo(() => collectStorageStats(), [notice]);

  const creditsRemaining =
    plan.tier === "free"
      ? Math.max(0, plan.creditsTotal + plan.creditsExtra - plan.creditsUsed)
      : null;
  const creditsUsedPercent =
    plan.tier === "free" && plan.creditsTotal > 0
      ? Math.min(100, (plan.creditsUsed / plan.creditsTotal) * 100)
      : 0;

  const showNotice = (message: string, tone: NoticeTone = "success") => {
    setNotice({ message, tone });
  };

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) {
          setActiveSection(top.target.id as SectionId);
        }
      },
      {
        root,
        rootMargin: "-10% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    for (const { id } of SECTION_LINKS) {
      const section = sectionRefs.current[id];
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const signOutMutation = useMutation({
    mutationFn: async () => signOut(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
      navigate("/login", { replace: true });
    },
    onError: () => {
      showNotice("Could not sign out. Please retry.", "error");
    },
  });

  const setThemeDirect = (target: "dark" | "light") => {
    if (theme !== target) toggleTheme();
    showNotice(`Theme set to ${target}.`);
  };

  const setPlanDirect = (tier: "free" | "pro" | "annual") => {
    setPlan(tier);
    showNotice(`Plan switched to ${tier}.`);
  };

  const handleSaveWorkflow = () => {
    saveWorkflow(workflowName.trim() || "Untitled");
    showNotice("Workflow saved locally.");
  };

  const handleExportJson = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AuraStudio-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Workflow exported.");
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const result = importFromJSON(String(readEvent.target?.result ?? ""));
      if (!result.ok) {
        showNotice(`Import failed: ${result.error ?? "Invalid JSON"}`, "error");
      } else {
        showNotice("Workflow imported successfully.");
      }
    };
    reader.onerror = () => {
      showNotice("Could not read selected file.", "error");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const refreshAuthQuery = () => {
    void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
  };

  const handleSaveApiBase = () => {
    const next = apiBaseInput.trim();
    if (!next) {
      showNotice("API base URL cannot be empty.", "error");
      return;
    }

    try {
      const parsed = new URL(next);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        showNotice("Use http:// or https:// URL.", "error");
        return;
      }
    } catch {
      showNotice("Enter a valid URL with protocol.", "error");
      return;
    }

    setApiBaseUrlOverride(next);
    setApiBaseInput(getApiBaseUrl());
    refreshAuthQuery();
    showNotice("Runtime API URL updated.");
  };

  const handleResetApiBase = () => {
    clearApiBaseUrlOverride();
    setApiBaseInput(getApiBaseUrl());
    refreshAuthQuery();
    showNotice("Runtime API URL reset to default.", "info");
  };

  const handleSaveGeminiKey = () => {
    setGeminiApiKeyOverride(geminiKeyInput);
    showNotice(
      geminiKeyInput.trim()
        ? "Gemini key override saved."
        : "Gemini key override cleared.",
    );
  };

  const handleClearGeminiOverride = () => {
    clearGeminiApiKeyOverride();
    setGeminiKeyInput("");
    showNotice("Gemini key override cleared.", "info");
  };

  const handleResetWorkspace = () => {
    if (!window.confirm("Clear canvas and load demo workflow?")) return;
    clearCanvas();
    loadDemo();
    showNotice("Workspace reset to demo workflow.", "info");
  };

  const handleClearLocalData = () => {
    if (
      !window.confirm(
        "This will remove all local app data and reload. Continue?",
      )
    ) {
      return;
    }
    for (const key of KNOWN_LOCAL_KEYS) {
      window.localStorage.removeItem(key);
    }
    window.location.reload();
  };

  const setSectionRef =
    (id: SectionId) =>
    (element: HTMLElement | null): void => {
      sectionRefs.current[id] = element;
    };

  const scrollToSection = (id: SectionId) => {
    const section = sectionRefs.current[id];
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const noticeIcon =
    notice?.tone === "error" ? (
      <AlertTriangle size={15} />
    ) : notice?.tone === "info" ? (
      <Info size={15} />
    ) : (
      <CheckCircle2 size={15} />
    );

  return (
    <div
      className="settings-page"
      ref={pageRef}
      style={{ flex: 1, width: "100%" }}
    >
      <div className="settings-shell" style={{ flex: 1 }}>
        <header className="settings-header">
          <div className="settings-header-main">
            <button className="settings-back-btn" onClick={() => navigate("/")}>
              <ArrowLeft size={15} /> Back To Canvas
            </button>
            <div className="settings-header-title">
              <p className="settings-overline">Workspace Settings</p>
              <h1>Settings</h1>
              <p>
                Configure account access, runtime integrations, and workflow
                persistence.
              </p>
            </div>
          </div>
          <div className="settings-header-metrics">
            <div className="settings-metric">
              <span className="settings-metric-label">Plan</span>
              <strong className="settings-metric-value">
                {plan.tier.toUpperCase()}
              </strong>
            </div>
            <div className="settings-metric">
              <span className="settings-metric-label">Theme</span>
              <strong className="settings-metric-value">{theme}</strong>
            </div>
            <div className="settings-metric">
              <span className="settings-metric-label">Storage</span>
              <strong className="settings-metric-value">
                {storageStats.usageLabel}
              </strong>
            </div>
            <div className="settings-metric">
              <span className="settings-metric-label">Keys</span>
              <strong className="settings-metric-value">
                {storageStats.keysCount}
              </strong>
            </div>
          </div>
        </header>

        {notice ? (
          <div
            className={`settings-notice settings-notice--${notice.tone}`}
            aria-live="polite"
          >
            {noticeIcon}
            <span>{notice.message}</span>
          </div>
        ) : null}

        <div className="settings-layout">
          <aside className="settings-sidebar">
            <div className="settings-sidebar-head">
              <h2>Navigation</h2>
              <p>Jump to any configuration area.</p>
            </div>
            <nav className="settings-nav">
              {(SECTION_LINKS as readonly SectionLink[]).map(
                ({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`settings-nav-btn ${activeSection === id ? "active" : ""}`}
                    onClick={() => scrollToSection(id)}
                    aria-current={activeSection === id ? "page" : undefined}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ),
              )}
            </nav>
            <div className="settings-sidebar-meta">
              <div className="settings-meta-item">
                <HardDrive size={13} />
                <span>{storageStats.usageLabel} local cache</span>
              </div>
            </div>
          </aside>

          <main className="settings-content">
            <div className="settings-grid">
              <section
                id="account"
                ref={setSectionRef("account")}
                className="settings-panel"
              >
                <div className="settings-panel-head">
                  <h2>
                    <UserRound size={16} /> Account
                  </h2>
                  <p>Identity, role and session controls.</p>
                </div>
                <div className="settings-row">
                  <span>Email</span>
                  <strong>{user?.email ?? "Not signed in"}</strong>
                </div>
                <div className="settings-row">
                  <span>Name</span>
                  <strong>{user?.name ?? "Not set"}</strong>
                </div>
                <div className="settings-row">
                  <span>Role</span>
                  <strong>{user?.is_admin ? "Admin" : "Member"}</strong>
                </div>
                <button
                  className="settings-btn settings-btn--danger"
                  onClick={() => signOutMutation.mutate()}
                  disabled={signOutMutation.isPending}
                >
                  <LogOut size={14} />
                  {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
                </button>
              </section>

              <section
                id="appearance"
                ref={setSectionRef("appearance")}
                className="settings-panel"
              >
                <div className="settings-panel-head">
                  <h2>
                    <Sparkles size={16} /> Appearance
                  </h2>
                  <p>Switch between light and dark workspace themes.</p>
                </div>
                <div className="settings-segment">
                  <button
                    className={`settings-segment-btn ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setThemeDirect("dark")}
                  >
                    <Moon size={13} /> Dark
                  </button>
                  <button
                    className={`settings-segment-btn ${theme === "light" ? "active" : ""}`}
                    onClick={() => setThemeDirect("light")}
                  >
                    <Sun size={13} /> Light
                  </button>
                </div>
              </section>

              <section
                id="plan"
                ref={setSectionRef("plan")}
                className="settings-panel"
              >
                <div className="settings-panel-head">
                  <h2>
                    <Crown size={16} /> Plan
                  </h2>
                  <p>Control plan tier and local credits.</p>
                </div>
                <div className="settings-segment">
                  {(["free", "pro", "annual"] as const).map((tier) => (
                    <button
                      key={tier}
                      className={`settings-segment-btn ${
                        plan.tier === tier ? "active" : ""
                      }`}
                      onClick={() => setPlanDirect(tier)}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="settings-row">
                  <span>Credits Used</span>
                  <strong>
                    {Number.isFinite(plan.creditsTotal)
                      ? `${plan.creditsUsed}/${plan.creditsTotal}`
                      : "Unlimited"}
                  </strong>
                </div>
                {plan.tier === "free" && creditsRemaining !== null ? (
                  <div className="settings-progress">
                    <div className="settings-progress-track">
                      <div
                        className="settings-progress-fill"
                        style={{ width: `${creditsUsedPercent}%` }}
                      />
                    </div>
                    <span className="settings-progress-label">
                      {creditsRemaining} credits left
                    </span>
                  </div>
                ) : (
                  <p className="settings-help">
                    Pro and Annual plans are not credit-limited.
                  </p>
                )}
                <button
                  className="settings-btn settings-btn--primary"
                  onClick={() => {
                    addExtraCredits(10);
                    showNotice("Added 10 extra credits.");
                  }}
                >
                  Add 10 Extra Credits
                </button>
              </section>

              <section
                id="runtime-api"
                ref={setSectionRef("runtime-api")}
                className="settings-panel"
              >
                <div className="settings-panel-head">
                  <h2>
                    <Server size={16} /> Runtime API
                  </h2>
                  <p>Set backend base URL used by authenticated API calls.</p>
                </div>
                <label className="settings-label" htmlFor="api-base-url">
                  Backend API Base URL
                </label>
                <input
                  id="api-base-url"
                  className="settings-input"
                  value={apiBaseInput}
                  onChange={(event) => setApiBaseInput(event.target.value)}
                  placeholder="http://localhost:8000"
                />
                <p className="settings-help">
                  Default: <code>{getDefaultApiBaseUrl()}</code>
                  {hasApiOverride ? " (override active)" : ""}
                </p>
                <div className="settings-actions">
                  <button
                    className="settings-btn settings-btn--primary"
                    onClick={handleSaveApiBase}
                  >
                    Save URL
                  </button>
                  <button
                    className="settings-btn settings-btn--ghost"
                    onClick={handleResetApiBase}
                  >
                    Reset
                  </button>
                </div>
              </section>

              <section
                id="runtime-key"
                ref={setSectionRef("runtime-key")}
                className="settings-panel"
              >
                <div className="settings-panel-head">
                  <h2>
                    <KeyRound size={16} /> Gemini API Key
                  </h2>
                  <p>Optional local override for Gemini client requests.</p>
                </div>
                <label className="settings-label" htmlFor="gemini-key">
                  Runtime Override Key
                </label>
                <input
                  id="gemini-key"
                  className="settings-input"
                  type="password"
                  value={geminiKeyInput}
                  onChange={(event) => setGeminiKeyInput(event.target.value)}
                  placeholder="AIza..."
                />
                <p className="settings-help">
                  Active key: <code>{maskSecret(geminiKeyActive)}</code>
                  {hasGeminiOverride
                    ? " (local override)"
                    : envGeminiKey
                      ? " (from env)"
                      : " (missing)"}
                </p>
                <div className="settings-actions">
                  <button
                    className="settings-btn settings-btn--primary"
                    onClick={handleSaveGeminiKey}
                  >
                    Save Key
                  </button>
                  <button
                    className="settings-btn settings-btn--ghost"
                    onClick={handleClearGeminiOverride}
                  >
                    Clear Override
                  </button>
                </div>
              </section>

              <section
                id="workspace"
                ref={setSectionRef("workspace")}
                className="settings-panel settings-panel--wide"
              >
                <div className="settings-panel-head">
                  <h2>
                    <Database size={16} /> Workspace
                  </h2>
                  <p>Snapshots, import/export, and local workspace controls.</p>
                </div>
                <div className="settings-row">
                  <span>Persisted Keys</span>
                  <strong>{storageStats.keysCount}</strong>
                </div>
                <div className="settings-row">
                  <span>Storage Usage</span>
                  <strong>{storageStats.usageLabel}</strong>
                </div>
                <label className="settings-label" htmlFor="workflow-name">
                  Save Workflow Name
                </label>
                <input
                  id="workflow-name"
                  className="settings-input"
                  value={workflowName}
                  onChange={(event) => setWorkflowName(event.target.value)}
                />
                <div className="settings-actions">
                  <button
                    className="settings-btn settings-btn--primary"
                    onClick={handleSaveWorkflow}
                  >
                    Save Workflow
                  </button>
                  <button
                    className="settings-btn settings-btn--ghost"
                    onClick={() => {
                      createVersion("Manual Settings Snapshot");
                      showNotice("Snapshot created.");
                    }}
                  >
                    Create Snapshot
                  </button>
                </div>
                <div className="settings-actions">
                  <button
                    className="settings-btn settings-btn--primary"
                    onClick={handleExportJson}
                  >
                    <Download size={14} /> Export JSON
                  </button>
                  <button
                    className="settings-btn settings-btn--ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} /> Import JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={handleImportJson}
                  />
                </div>
                <div className="settings-actions">
                  <button
                    className="settings-btn settings-btn--ghost"
                    onClick={loadDemo}
                  >
                    Load Demo
                  </button>
                  <button
                    className="settings-btn settings-btn--danger"
                    onClick={handleResetWorkspace}
                  >
                    <RefreshCcw size={14} /> Reset Workspace
                  </button>
                </div>
              </section>

              <section
                id="danger"
                ref={setSectionRef("danger")}
                className="settings-panel settings-panel--wide settings-panel--danger"
              >
                <div className="settings-panel-head">
                  <h2>
                    <Trash2 size={16} /> Danger Zone
                  </h2>
                  <p>
                    Clear all local persisted data and reload the application.
                  </p>
                </div>
                <p className="settings-help">
                  Removes local workflows, snapshots, runtime overrides and
                  cached authentication metadata.
                </p>
                <button
                  className="settings-btn settings-btn--danger"
                  onClick={handleClearLocalData}
                >
                  <Trash2 size={14} /> Clear Local Data
                </button>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
