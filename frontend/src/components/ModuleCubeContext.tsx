import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";

interface ModuleCubeContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  isTouch: boolean;
}

const ModuleCubeContext = createContext<ModuleCubeContextValue>({
  openId: null,
  setOpenId: () => {},
  isTouch: false,
});

export function ModuleCubeProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    if (!isTouch) return;

    const handlePointerDown = (e: PointerEvent) => {
      const cubeEl = (e.target as HTMLElement).closest("[data-module-cube]");
      if (!cubeEl) {
        setOpenId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isTouch]);

  return (
    <ModuleCubeContext.Provider value={{ openId, setOpenId, isTouch }}>
      {children}
    </ModuleCubeContext.Provider>
  );
}

export function useModuleCubeContext() {
  return useContext(ModuleCubeContext);
}
