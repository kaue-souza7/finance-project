import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppInit } from "../context/AppInitContext";

export function ReadySignal() {
  const { loading } = useAuth();
  const { markReady } = useAppInit();

  useEffect(() => {
    if (!loading) {
      markReady();
    }
  }, [loading, markReady]);

  return null;
}
