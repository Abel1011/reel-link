import { X, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export function ErrorToast({ message, duration = 5000, onClose }: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border-2 border-tomato-500 bg-paper-50 px-4 py-3 shadow-[4px_4px_0_0_var(--color-tomato-500)] transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tomato-500" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-500">
          Cut!
        </div>
        <p className="mt-0.5 text-sm text-ink-700">{message}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 200);
        }}
        className="shrink-0 rounded p-0.5 text-ink-400 transition-colors hover:bg-paper-200 hover:text-ink-700"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
