import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Share2, X } from "lucide-react";
import { dismissIOSCard, shouldShowIOSCard } from "../utils/storage";

const steps = [
  {
    icon: Share2,
    label: "Toque em Compartilhar",
  },
  {
    icon: Plus,
    label: "Adicionar à Tela de Início",
  },
  {
    icon: Check,
    label: "Toque em Adicionar",
  },
] as const;

export function IOSInstallCard() {
  const [visible, setVisible] = useState(shouldShowIOSCard);

  const handleDismiss = useCallback(() => {
    dismissIOSCard();
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="ios-install-card"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        >
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={handleDismiss}
              aria-label="Fechar instruções de instalação"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X size={16} aria-hidden="true" />
            </button>

            <h2 className="mb-1 pr-8 text-base font-semibold text-slate-900 dark:text-slate-100">
              Instale o Finance
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Adicione à tela de início do seu iPhone:
            </p>

            <ol className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={index} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                    >
                      {index + 1}
                    </span>
                    <Icon
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 dark:text-slate-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
