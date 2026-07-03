import { useSyncExternalStore } from "react";

function getSnapshot(): boolean {
  const isStandalone = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const hasIOSStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandalone || hasIOSStandalone;
}

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsPWA(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
