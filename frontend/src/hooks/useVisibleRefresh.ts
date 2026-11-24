import { useEffect, useRef } from "react";

export function useVisibleRefresh(
  refresh: () => void,
  enabled = true,
) {
  const refreshRef = useRef(refresh);
  const lastRunRef = useRef(0);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRunRef.current < 2000) return;
      lastRunRef.current = now;
      refreshRef.current();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", run);
    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
      window.removeEventListener("focus", run);
    };
  }, [enabled]);
}
