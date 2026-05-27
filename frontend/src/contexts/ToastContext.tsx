import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, X, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastState {
  open: boolean;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: "",
    variant: "success",
  });

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    setState({ open: true, message, variant });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const Icon = state.variant === "success" ? CheckCircle : XCircle;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {state.open && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-auto">
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-toast ${
              state.variant === "success"
                ? "bg-emerald-600"
                : "bg-red-600"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="flex-1">{state.message}</span>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-lg opacity-70 hover:opacity-100"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
