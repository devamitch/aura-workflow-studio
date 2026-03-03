/**
 * NodeSidebar — per-node configuration panel.
 * Opens in the right panel when a node is selected.
 * BYOK: credential entry with Web Crypto AES-256-GCM encryption.
 */
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Eye, EyeOff, KeyRound, Settings, ShieldCheck, X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { encryptCredential, maskSecret, validateCredentials } from "../../services/credentialEngine";
import { getNodeDefinition } from "../../nodes/definitions";
import type { CredentialField, FieldDef } from "../../types";

// ── Field renderer ────────────────────────────────────────────────────────────
const FieldInput: React.FC<{
  field: FieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
}> = ({ field, value, onChange }) => {
  const str = value != null ? String(value) : (field.defaultValue != null ? String(field.defaultValue) : "");

  if (field.type === "boolean") {
    return (
      <label className="ns-toggle">
        <input type="checkbox" checked={Boolean(value ?? field.defaultValue)} onChange={(e) => onChange(e.target.checked)} />
        <span className="ns-toggle-track" />
        <span className="ns-toggle-label">{field.label}</span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <select className="ns-input" value={str} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (field.type === "textarea" || field.type === "json") {
    return (
      <textarea className="ns-input ns-textarea" value={str} placeholder={field.placeholder ?? ""} rows={4} onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <input
      className="ns-input"
      type={field.type === "number" ? "number" : "text"}
      value={str}
      placeholder={field.placeholder ?? ""}
      onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
    />
  );
};

// ── Credential field ──────────────────────────────────────────────────────────
const CredInput: React.FC<{
  field: CredentialField;
  nodeId: string;
  storedEncrypted?: string;
}> = ({ field, nodeId, storedEncrypted }) => {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);
  const updateNodeCredential = useStore((s) => s.updateNodeCredential);
  const runValidation = useStore((s) => s.runValidation);

  const hasSaved = Boolean(storedEncrypted);

  const handleSave = useCallback(async () => {
    if (!value.trim()) return;
    const encrypted = await encryptCredential(value.trim());
    updateNodeCredential(nodeId, field.key, encrypted);
    runValidation();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setValue("");
  }, [value, nodeId, field.key, updateNodeCredential, runValidation]);

  const handleClear = useCallback(() => {
    updateNodeCredential(nodeId, field.key, "");
    runValidation();
  }, [nodeId, field.key, updateNodeCredential, runValidation]);

  return (
    <div className={`ns-cred-field${hasSaved ? " ns-cred-field--saved" : ""}${field.required && !hasSaved ? " ns-cred-field--required" : ""}`}>
      {/* Field header */}
      <div className="ns-cred-header">
        <KeyRound size={11} className="ns-cred-key-icon" />
        <span className="ns-cred-label">{field.label}</span>
        <div className="ns-cred-header-badges">
          {field.required && !hasSaved && (
            <span className="ns-cred-pill ns-cred-pill--required">Required</span>
          )}
          {!field.required && (
            <span className="ns-cred-pill ns-cred-pill--optional">Optional</span>
          )}
          {hasSaved && (
            <span className="ns-cred-pill ns-cred-pill--saved">
              <ShieldCheck size={10} />
              Encrypted
            </span>
          )}
        </div>
      </div>

      {/* Saved value row */}
      {hasSaved && (
        <div className="ns-cred-saved-row">
          <div className="ns-cred-saved-value">
            <CheckCircle size={11} className="ns-cred-ok-icon" />
            <span>{maskSecret("stored_value", 0)}</span>
          </div>
          <button className="ns-cred-clear-btn" onClick={handleClear} title="Remove saved key">
            <X size={10} /> Remove
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="ns-cred-input-row">
        <input
          className="ns-input ns-cred-input"
          type={field.secret && !visible ? "password" : "text"}
          value={value}
          placeholder={hasSaved ? "Enter new value to overwrite…" : (field.placeholder ?? `Paste your ${field.label}…`)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
        />
        {field.secret && (
          <button className="ns-cred-vis-btn" onClick={() => setVisible((v) => !v)} title="Show / hide">
            {visible ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
        <button
          className={`ns-cred-save-btn${saved ? " saved" : ""}`}
          onClick={() => void handleSave()}
          disabled={!value.trim()}
        >
          {saved ? <><CheckCircle size={11} /> Saved</> : "Save"}
        </button>
      </div>

      {/* Placeholder hint */}
      {!hasSaved && field.placeholder && (
        <p className="ns-cred-hint">{field.placeholder}</p>
      )}
    </div>
  );
};

// ── Credential status bar ─────────────────────────────────────────────────────
const CredStatusBar: React.FC<{
  creds: CredentialField[];
  storedCreds: Record<string, string>;
}> = ({ creds, storedCreds }) => {
  const required = creds.filter((c) => c.required);
  const savedRequired = required.filter((c) => storedCreds[c.key]);
  const missingRequired = required.filter((c) => !storedCreds[c.key]);

  if (required.length === 0) {
    return (
      <div className="ns-cred-status ns-cred-status--ok">
        <ShieldCheck size={12} />
        <span>No required credentials</span>
      </div>
    );
  }

  if (missingRequired.length === 0) {
    return (
      <div className="ns-cred-status ns-cred-status--ok">
        <ShieldCheck size={12} />
        <span>All {required.length} required keys set</span>
      </div>
    );
  }

  return (
    <div className="ns-cred-status ns-cred-status--warn">
      <AlertTriangle size={12} />
      <span>
        {savedRequired.length}/{required.length} required keys set
        {missingRequired.length > 0 && ` · Missing: ${missingRequired.map(c => c.label).join(", ")}`}
      </span>
    </div>
  );
};

// ── Main NodeSidebar ──────────────────────────────────────────────────────────
export const NodeSidebar: React.FC = () => {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const setSelectedNode = useStore((s) => s.setSelectedNode);

  const [credOpen, setCredOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const def = node ? getNodeDefinition(node.data.nodeType ?? "") : undefined;

  useEffect(() => { setCredOpen(true); setConfigOpen(true); }, [selectedNodeId]);

  if (!node || !def) {
    return (
      <div className="node-sidebar node-sidebar-empty">
        <div className="ns-empty-msg">
          <Settings size={24} />
          <p>Select a node to configure it</p>
          <p className="ns-empty-sub">Click any node on the canvas</p>
        </div>
      </div>
    );
  }

  const fields = def.sidebarSchema?.fields ?? def.sidebarSchema?.sections?.flatMap((s) => s.fields) ?? [];
  const creds = def.requiredCredentials ?? [];
  const validationErrors = node.data.validationErrors ?? [];
  const storedCreds = node.data.credentials ?? {};

  const { errors: credErrors } = validateCredentials(
    Object.fromEntries(Object.entries(storedCreds).map(([k, v]) => [k, v ? "set" : ""])),
    creds
  );

  const requiredCreds = creds.filter((c) => c.required);
  const optionalCreds = creds.filter((c) => !c.required);

  return (
    <div className="node-sidebar">
      {/* ── Header */}
      <div className="ns-header">
        <div className="ns-title">
          <span className="ns-type-dot" style={{ background: def.uiTheme }} />
          <div>
            <div className="ns-node-name">{String(node.data.label ?? def.label)}</div>
            <div className="ns-node-type">{def.label} · {def.group}</div>
          </div>
        </div>
        <button className="ns-close" onClick={() => setSelectedNode(null)}>
          <X size={16} />
        </button>
      </div>

      {/* ── Validation errors */}
      {validationErrors.length > 0 && (
        <div className="ns-validation-errors">
          <AlertTriangle size={13} />
          <div>{validationErrors.map((e, i) => <div key={i}>{e}</div>)}</div>
        </div>
      )}

      <div className="ns-scroll">

        {/* ── Credentials section */}
        {creds.length > 0 && (
          <section className="ns-section">
            <button className="ns-section-header" onClick={() => setCredOpen((v) => !v)}>
              <KeyRound size={13} />
              <span>API Keys &amp; Credentials</span>
              {credErrors.length > 0 && (
                <span className="ns-cred-badge">{credErrors.length} missing</span>
              )}
              {credOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {credOpen && (
              <div className="ns-section-body">
                {/* Status bar */}
                <CredStatusBar creds={creds} storedCreds={storedCreds} />

                {/* Required credentials */}
                {requiredCreds.length > 0 && (
                  <>
                    {requiredCreds.map((cred) => (
                      <CredInput key={cred.key} field={cred} nodeId={node.id} storedEncrypted={storedCreds[cred.key]} />
                    ))}
                  </>
                )}

                {/* Optional credentials */}
                {optionalCreds.length > 0 && (
                  <>
                    {optionalCreds.length > 0 && requiredCreds.length > 0 && (
                      <div className="ns-cred-divider">Optional</div>
                    )}
                    {optionalCreds.map((cred) => (
                      <CredInput key={cred.key} field={cred} nodeId={node.id} storedEncrypted={storedCreds[cred.key]} />
                    ))}
                  </>
                )}

                <p className="ns-cred-note">
                  Keys are encrypted with AES-256-GCM and stored locally in your browser. They never leave your device.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Config fields */}
        {fields.length > 0 && (
          <section className="ns-section">
            <button className="ns-section-header" onClick={() => setConfigOpen((v) => !v)}>
              <Settings size={13} />
              <span>Configuration</span>
              {configOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {configOpen && (
              <div className="ns-section-body">
                {fields.map((field) => {
                  if (field.type === "boolean") {
                    return (
                      <div key={field.key} className="ns-field">
                        <FieldInput field={field} value={node.data[field.key] ?? node.data.config?.[field.key]} onChange={(v) => updateNodeField(node.id, field.key, v)} />
                        {field.description && <p className="ns-field-desc">{field.description}</p>}
                      </div>
                    );
                  }
                  return (
                    <div key={field.key} className="ns-field">
                      <label className="ns-label">
                        {field.label}
                        {field.required && <span className="ns-required"> *</span>}
                      </label>
                      <FieldInput field={field} value={node.data[field.key] ?? node.data.config?.[field.key]} onChange={(v) => updateNodeField(node.id, field.key, v)} />
                      {field.description && <p className="ns-field-desc">{field.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Description footer */}
        {def.description && (
          <div className="ns-description">
            <p>{def.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
