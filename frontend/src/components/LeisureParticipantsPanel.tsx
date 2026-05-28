import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  UserX,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Toast } from "@/components/Toast";
import { leisureInviteApi } from "@/services/leisureInvite";
import type {
  InviteResponse,
  LeisureParticipantResponse,
} from "@/types/finance";

interface LeisureParticipantsPanelProps {
  leisureId: string;
}

export function LeisureParticipantsPanel({
  leisureId,
}: LeisureParticipantsPanelProps) {
  const [participants, setParticipants] = useState<
    LeisureParticipantResponse[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<InviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const participants = await leisureInviteApi.getParticipants(leisureId);
      setParticipants(participants);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar participantes");
      setLoading(false);
      return;
    }

    try {
      const pending = await leisureInviteApi.getPendingInvites(leisureId);
      setPendingInvites(pending);
    } catch {
      setPendingInvites([]);
    }

    setLoading(false);
  }, [leisureId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setSendError(null);
    try {
      await leisureInviteApi.sendInvite(leisureId, email.trim());
      setToast({ message: "Convite enviado!", variant: "success" });
      setEmail("");
      load();
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Erro ao enviar convite",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle size={24} className="text-rose-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error}
          </p>
          <button
            onClick={load}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Participantes ({participants.length})
        </h3>
        {participants.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <UserX
                size={28}
                className="text-slate-300 dark:text-slate-600"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum participante ainda.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {p.user_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {p.user_name ?? "Usuário"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.user_email ?? ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {p.role === "participant" ? "Participante" : p.role}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Convidar
        </h3>
        <form onSubmit={handleSendInvite} className="flex gap-2">
          <div className="relative flex-1">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSendError(null);
              }}
              placeholder="Email do usuário"
              required
              autoComplete="off"
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Convidar
          </button>
        </form>
        {sendError && (
          <p className="mt-2 text-sm text-rose-500">{sendError}</p>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Convites pendentes ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {invite.receiver_email ?? invite.sender_email ?? "Convidado"}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Aguardando resposta
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
