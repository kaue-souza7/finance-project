import { useCallback, useEffect, useRef, useState } from "react";
import { messageApi } from "@/services/message";
import type { MessageResponse } from "@/types/finance";

export function useMessages(chatId: string | undefined) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<MessageResponse[]>([]);

  messagesRef.current = messages;

  const loadInitial = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await messageApi.list(chatId);
      setMessages(data.messages);
    } catch (err) {
      console.error("[useMessages] loadInitial", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const poll = useCallback(async () => {
    const current = messagesRef.current;
    if (!chatId || current.length === 0) return;
    try {
      const newMessages = await messageApi.listNew(
        chatId,
        current[current.length - 1].created_at,
      );
      if (newMessages.length > 0) {
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const toAdd = newMessages.filter((m) => !existing.has(m.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      }
    } catch (err) {
      console.error("[useMessages] poll", err);
    }
  }, [chatId]);

  const send = useCallback(async (content: string) => {
    if (!chatId) return;
    setSending(true);
    try {
      const msg = await messageApi.send(chatId, content);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error("[useMessages] send", err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [chatId]);

  useEffect(() => {
    setMessages([]);
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [poll]);

  return { messages, loading, sending, error, send, reload: loadInitial };
}
