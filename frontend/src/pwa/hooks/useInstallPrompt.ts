import { useCallback, useEffect, useState } from "react";
import type { BeforeInstallPromptEvent } from "../types/pwa";

interface UseInstallPromptReturn {
  isInstallAvailable: boolean;
  isRecentlyInstalled: boolean;
  install: () => Promise<"accepted" | "dismissed">;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isRecentlyInstalled, setIsRecentlyInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsRecentlyInstalled(true);
      setEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = event;
    if (!prompt) throw new Error("Instalação não disponível");

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setEvent(null);

    if (outcome === "accepted") {
      setIsRecentlyInstalled(true);
    }

    return outcome;
  }, [event]);

  return {
    isInstallAvailable: event !== null,
    isRecentlyInstalled,
    install,
  };
}
