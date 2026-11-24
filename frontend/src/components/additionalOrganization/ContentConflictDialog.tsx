import { useRef } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ContentConflictDialogProps {
  open: boolean;
  loading?: boolean;
  onReload: () => void;
  onOverwrite: () => void;
}

export function ContentConflictDialog({
  open,
  loading = false,
  onReload,
  onOverwrite,
}: ContentConflictDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-conflict-title"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800 sm:max-w-md sm:rounded-xl"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2
              id="content-conflict-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              Texto alterado por outra pessoa
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Suas anotações locais foram preservadas. Escolha como deseja
              continuar.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Recarregar versão atual
          </button>
          <button
            type="button"
            onClick={onOverwrite}
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Manter meu texto e sobrescrever
          </button>
        </div>
      </div>
    </div>
  );
}
