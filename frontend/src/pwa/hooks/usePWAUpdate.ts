import { useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

interface UsePWAUpdateReturn {
  needRefresh: boolean;
  update: () => void;
}

export function usePWAUpdate(): UsePWAUpdateReturn {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      console.warn("SW registration failed", error);
    },
  });

  const update = useCallback(() => {
    void updateServiceWorker();
  }, [updateServiceWorker]);

  return { needRefresh, update };
}
