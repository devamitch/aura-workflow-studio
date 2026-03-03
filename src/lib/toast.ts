/**
 * Lightweight toast event bus — no external dependencies.
 * Fire toasts from anywhere; the <Toaster /> component listens.
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

type Listener = (item: ToastItem) => void;
type DismissListener = (id: string) => void;

const listeners = new Set<Listener>();
const dismissListeners = new Set<DismissListener>();

function emit(item: ToastItem) {
  listeners.forEach((l) => l(item));
}

function dismiss(id: string) {
  dismissListeners.forEach((l) => l(id));
}

export const toast = {
  show(type: ToastType, message: string, title?: string, duration = 4500): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    emit({ id, type, message, title, duration });
    return id;
  },
  success: (message: string, title?: string) => toast.show("success", message, title),
  error: (message: string, title?: string, duration = 6000) =>
    toast.show("error", message, title, duration),
  warning: (message: string, title?: string) => toast.show("warning", message, title),
  info: (message: string, title?: string) => toast.show("info", message, title),
  dismiss,

  /** Subscribe to new toast events — returns an unsubscribe function. */
  subscribe: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Subscribe to dismiss events — returns an unsubscribe function. */
  onDismiss: (fn: DismissListener): (() => void) => {
    dismissListeners.add(fn);
    return () => dismissListeners.delete(fn);
  },
};
