import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Density = "compact" | "comfortable";

interface Preferences {
  theme: Theme;
  density: Density;
}

interface PreferencesContextValue extends Preferences {
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setDensity: (d: Density) => void;
  toggleDensity: () => void;
}

const STORAGE_KEY = "finance-preferences";

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        (parsed.theme === "light" || parsed.theme === "dark") &&
        (parsed.density === "compact" || parsed.density === "comfortable")
      ) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return {
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    density: "comfortable",
  };
}

function save(prefs: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    save(prefs);
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
    document.documentElement.dataset.density = prefs.density;
  }, [prefs]);

  const setTheme = useCallback((theme: Theme) => {
    setPrefs((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  }, []);

  const setDensity = useCallback((density: Density) => {
    setPrefs((prev) => ({ ...prev, density }));
  }, []);

  const toggleDensity = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      density: prev.density === "compact" ? "comfortable" : "compact",
    }));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        ...prefs,
        setTheme,
        toggleTheme,
        setDensity,
        toggleDensity,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}

export { usePreferences, usePreferences as useTheme };
export type { Theme, Density };
