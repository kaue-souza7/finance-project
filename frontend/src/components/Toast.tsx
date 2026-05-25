import { useEffect } from "react";
import { CheckCircle, X, XCircle } from "lucide-react";

type Variant = "success" | "error";

interface ToastProps {
  open: boolean;
  message: string;
  variant?: Variant;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  open,
  message,
  variant = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const Icon = variant === "success" ? CheckCircle : XCircle;
  const bg =
    variant === "success"
      ? "bg-emerald-600"
      : "bg-red-600";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-auto">
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-toast ${bg}`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
