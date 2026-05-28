import { useCallback, useEffect, useState } from "react";
import { chatApi } from "@/services/chat";
import type { ChatResponse } from "@/types/finance";

export function useChats() {
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.list();
      setChats(data);
    } catch (err) {
      console.error("[useChats]", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { chats, loading, error, reload: load };
}
