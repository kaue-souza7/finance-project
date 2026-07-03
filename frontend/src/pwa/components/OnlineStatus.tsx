import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const RECONNECTED_DURATION_MS = 4000;

export function OnlineStatus() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const prevOnline = useRef(isOnline);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (prevOnline.current === false && isOnline === true) {
      setShowReconnected(true);
      timerRef.current = setTimeout(() => {
        setShowReconnected(false);
      }, RECONNECTED_DURATION_MS);
    }
    prevOnline.current = isOnline;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="alert"
          aria-live="assertive"
          className="fixed bottom-0 left-0 right-0 z-50 bg-amber-600 px-4 pb-[env(safe-area-inset-bottom,0px)] dark:bg-amber-700"
        >
          <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white">
            <WifiOff size={16} aria-hidden="true" className="shrink-0" />
            <span>Sem conexão com a internet</span>
          </div>
        </motion.div>
      )}

      {showReconnected && isOnline && (
        <motion.div
          key="reconnected"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-600 px-4 pb-[env(safe-area-inset-bottom,0px)] dark:bg-emerald-700"
        >
          <div className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white">
            <Wifi size={16} aria-hidden="true" className="shrink-0" />
            <span>Conexão restabelecida</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
