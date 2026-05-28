import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { InviteModal } from "@/components/InviteModal";
import { InviteBottomSheet } from "@/components/InviteBottomSheet";
import { useChats } from "@/hooks/useChats";
import { useInvites } from "@/hooks/useInvites";

export function Chat() {
  const navigate = useNavigate();
  const { chats, loading, error, reload } = useChats();
  const {
    invites,
    loading: loadingInvites,
    accept,
    decline,
    reload: reloadInvites,
  } = useInvites();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const handleAccept = useCallback(async (id: string) => {
    setActing(id);
    try {
      await accept(id);
      setToast({ message: "Convite aceito!", variant: "success" });
      reload();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao aceitar convite",
        variant: "error",
      });
    } finally {
      setActing(null);
    }
  }, [accept, reload]);

  const handleDecline = useCallback(async (id: string) => {
    setActing(id);
    try {
      await decline(id);
      setToast({ message: "Convite recusado", variant: "success" });
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao recusar convite",
        variant: "error",
      });
    } finally {
      setActing(null);
    }
  }, [decline]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-1 h-4 w-80" />
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finance Chat
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Converse com outros usuários sobre finanças.
          </p>
        </div>
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              onClick={reload}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Finance Chat
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Converse com outros usuários sobre finanças com mensagens privadas.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus size={16} />
          Novo chat
        </button>

        {invites.length > 0 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <UserPlus size={16} />
            Convites
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
              {invites.length}
            </span>
          </button>
        )}
      </div>

      {chats.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <MessageSquareText
              size={40}
              className="text-slate-300 dark:text-slate-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Nenhum chat ainda
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Convide alguém para começar uma conversa privada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <UserPlus size={16} />
              Convidar usuário
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {chats.map((chat, idx) => (
            <Card
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ animationDelay: `${idx * 80}ms` }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/chat/${chat.id}`);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar src={chat.participant.avatar_url} name={chat.participant.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {chat.participant.name}
                  </p>
                  {chat.last_message ? (
                    <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                      {chat.last_message}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm italic text-slate-400 dark:text-slate-500">
                      Nenhuma mensagem ainda
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          reloadInvites();
        }}
      />

      <InviteBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        invites={invites}
        loading={loadingInvites}
        acting={acting}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </section>
  );
}
