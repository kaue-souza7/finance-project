import { useCallback, useState } from "react";

export type OrganizationViewMode = "grid" | "list";

const STORAGE_KEY = "finance:additional-organizations:view";

function loadViewMode(): OrganizationViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function useOrganizationViewMode() {
  const [viewMode, setViewModeState] =
    useState<OrganizationViewMode>(loadViewMode);

  const setViewMode = useCallback((mode: OrganizationViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Preferência não essencial; a interface continua funcionando.
    }
  }, []);

  return { viewMode, setViewMode };
}
