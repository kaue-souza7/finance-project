import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChats";
import { useToast } from "@/contexts/ToastContext";

export function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sending, error, send, reload } = useMessages(id);
  const { chats } = useChats();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => c.id === id);
  const participantName = chat?.participant?.name ?? "Chat";
  const participantAvatarUrl = chat?.participant?.avatar_url;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    try {
      await send(content);
    } catch {
      toast("Erro ao enviar mensagem", "error");
    }
  }, [send, toast]);

  return (
    <section className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <button
          onClick={() => navigate("/chat")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar src={participantAvatarUrl} name={participantName} size="sm" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {participantName}
          </h2>
        </div>
      </div>

      <div className="px-4 py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        As mensagens desaparecem após 30 dias.
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              onClick={reload}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-700">
              <MessageSquareText
                size={28}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Nenhuma mensagem ainda
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Envie a primeira mensagem para {participantName}.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
              senderName={participantName}
              senderAvatarUrl={participantAvatarUrl}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading || sending} />
    </section>
  );
}
