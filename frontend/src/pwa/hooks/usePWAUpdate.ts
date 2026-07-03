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
    onRegisteredSW(_swUrl: string, _registration: ServiceWorkerRegistration | undefined) {
      // SW registered — noop for now, reserved for future telemetry
    },
    onRegisterError(error: unknown) {
      console.warn("SW registration failed", error);
    },
  });

  const update = useCallback(() => {
    void updateServiceWorker();
  }, [updateServiceWorker]);

  return { needRefresh, update };
}
