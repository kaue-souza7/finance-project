import { AnimatePresence, motion } from "framer-motion";
import logoSrc from "@/assets/logo/finance-logo.png";
import { useAppInit } from "../context/AppInitContext";

export function SplashScreen() {
  const { ready } = useAppInit();

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          role="status"
          aria-busy="true"
          aria-label="Carregando aplicativo"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-[#0c0c1e] dark:via-[#0f172a] dark:to-[#160a24]"
        >
          <img
            src={logoSrc}
            alt="Finance"
            width={192}
            height={108}
            className="h-20 w-auto"
          />

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Finance
          </h1>

          <div
            aria-hidden="true"
            className="mt-8 h-1 w-36 overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900/40"
          >
            <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
