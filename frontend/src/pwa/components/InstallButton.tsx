import { motion } from "framer-motion";
import { Download } from "lucide-react";

interface InstallButtonProps {
  onInstall: () => Promise<"accepted" | "dismissed">;
}

export function InstallButton({ onInstall }: InstallButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed left-1/2 z-50 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
    >
      <button
        onClick={onInstall}
        aria-label="Instalar aplicativo Finance"
        className="flex min-h-[48px] items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        <Download size={18} aria-hidden="true" />
        Instalar Aplicativo
      </button>
    </motion.div>
  );
}
