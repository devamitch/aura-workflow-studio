import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, Crown, Shield, Trash2, Users, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function adminFetch(path: string, opts: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const r = await fetch(`${API_URL}/api/v1/admin${path}`, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error((await r.json()).detail || "Request failed");
  return r.json();
}

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [tab, setTab] = useState<"stats" | "users">("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([adminFetch("/stats"), adminFetch("/users")]);
      setStats(s);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const togglePremium = async (userId: string, current: boolean) => {
    await adminFetch("/grant-premium", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, is_premium: !current }),
    });
    loadStats();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all their data?")) return;
    await adminFetch(`/users/${userId}`, { method: "DELETE" });
    loadStats();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 640, width: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <Shield className="modal-header-icon" size={22} />
          <span className="modal-header-title">Admin Panel</span>
          <button className="modal-close-x" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[
            { key: "stats", label: "Overview", icon: BarChart3 },
            { key: "users", label: "Users", icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                border: `1px solid ${tab === key ? "var(--primary)" : "var(--border-subtle)"}`,
                background: tab === key ? "var(--primary-soft)" : "transparent",
                color: tab === key ? "var(--primary)" : "var(--text-700)",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-500)" }}>Loading...</div>
          ) : tab === "stats" && stats ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { label: "Total Users", value: stats.total_users },
                { label: "Premium Users", value: stats.premium_users },
                { label: "Total Pipelines", value: stats.total_pipelines },
                { label: "Total Documents", value: stats.total_documents },
                { label: "Conversion Rate", value: `${stats.conversion_rate}%` },
              ].map((s) => (
                <div key={s.label} className="modal-stat">
                  <span className="modal-stat-label">{s.label}</span>
                  <span className="modal-stat-value">{s.value}</span>
                </div>
              ))}
            </div>
          ) : tab === "users" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map((u) => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  borderRadius: 10, border: "1px solid var(--border-subtle)", background: "var(--bg-input)",
                }}>
                  {u.avatar_url && (
                    <img src={u.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.name || u.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-500)" }}>{u.email}</div>
                  </div>
                  {u.is_premium && (
                    <span style={{ padding: "3px 8px", borderRadius: 100, background: "rgba(234,179,8,0.1)", color: "#eab308", fontSize: 10, fontWeight: 700 }}>
                      <Crown size={9} style={{ display: "inline", marginRight: 3 }} />PREMIUM
                    </span>
                  )}
                  <button
                    onClick={() => togglePremium(u.id, u.is_premium)}
                    title={u.is_premium ? "Revoke premium" : "Grant premium"}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-700)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {u.is_premium ? "Revoke" : "Grant"}
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: "var(--text-400)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
