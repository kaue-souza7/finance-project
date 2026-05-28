import { useCallback, useEffect, useState } from "react";
import { chatInviteApi } from "@/services/chatInvite";
import type { ChatInviteResponse } from "@/types/finance";

export function useInvites() {
  const [invites, setInvites] = useState<ChatInviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatInviteApi.listReceived();
      setInvites(data);
    } catch (err) {
      console.error("[useInvites]", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  }, []);

  const accept = useCallback(async (id: string) => {
    await chatInviteApi.accept(id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const decline = useCallback(async (id: string) => {
    await chatInviteApi.decline(id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { invites, loading, error, accept, decline, reload: load };
}
