import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, ShieldCheck, X } from "lucide-react";
import { useWebAuthn } from "../hooks/useWebAuthn";

interface WebAuthnRegisterPromptProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WebAuthnRegisterPrompt({ onComplete, onSkip }: WebAuthnRegisterPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useWebAuthn();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const credentialId = await register();
      if (credentialId) {
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar biometria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="fixed bottom-6 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
      >
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={onSkip}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/40">
              <Fingerprint size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Ativar login biométrico?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Use biometria para acessar o Finance mais rápido.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={onSkip}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Agora não
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <ShieldCheck size={18} className="animate-pulse" />
              ) : (
                <Fingerprint size={18} />
              )}
              {loading ? "Ativando..." : "Ativar"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
