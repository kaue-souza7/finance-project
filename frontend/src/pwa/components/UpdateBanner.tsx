import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface UpdateBannerProps {
  onUpdate: () => void;
}

export function UpdateBanner({ onUpdate }: UpdateBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      role="alert"
      aria-live="polite"
      className="fixed left-0 right-0 top-0 z-50 px-4 sm:px-6 pt-[calc(1rem+env(safe-area-inset-top,0px))]"
    >
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-lg dark:border-indigo-800 dark:bg-slate-800">
          <div className="flex items-start gap-3">
            <RefreshCw
              size={20}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Nova versão disponível
              </p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Uma atualização do Finance está pronta.
              </p>
            </div>

            <button
              onClick={onUpdate}
              aria-label="Atualizar aplicativo"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Atualizar agora
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
