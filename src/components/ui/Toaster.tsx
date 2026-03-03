import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast, type ToastItem } from "../../lib/toast";

const ICONS = {
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({
  item,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(item.id), 280);
  }, [item.id, onDismiss]);

  useEffect(() => {
    if (item.duration <= 0) return;
    const t = setTimeout(dismiss, item.duration);
    return () => clearTimeout(t);
  }, [item.duration, dismiss]);

  // Also listen to programmatic dismissals
  useEffect(() => {
    return toast.onDismiss((id) => {
      if (id === item.id) dismiss();
    });
  }, [item.id, dismiss]);

  return (
    <div
      className={`toast-card toast-card--${item.type}${visible && !leaving ? " toast-card--visible" : ""}${leaving ? " toast-card--leaving" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon">{ICONS[item.type]}</span>
      <div className="toast-body">
        {item.title && <div className="toast-title">{item.title}</div>}
        <div className="toast-message">{item.message}</div>
      </div>
      <button className="toast-close" onClick={dismiss} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((item) => {
      setItems((prev) => [...prev.slice(-4), item]); // max 5 toasts
    });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
