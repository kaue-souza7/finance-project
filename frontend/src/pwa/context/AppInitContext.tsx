import { createContext, useCallback, useContext, useRef, useState } from "react";
import { SplashScreen } from "../components/SplashScreen";

interface AppInitContextValue {
  ready: boolean;
  markReady: () => void;
}

const AppInitContext = createContext<AppInitContextValue | null>(null);

export function AppInitProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    setReady(true);
  }, []);

  return (
    <AppInitContext.Provider value={{ ready, markReady }}>
      {children}
      <SplashScreen />
    </AppInitContext.Provider>
  );
}

export function useAppInit(): AppInitContextValue {
  const ctx = useContext(AppInitContext);
  if (!ctx) throw new Error("useAppInit must be used inside AppInitProvider");
  return ctx;
}
