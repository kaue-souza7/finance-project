import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Card } from "@/components/Card";
import { useToast } from "@/contexts/ToastContext";
import { leisureInviteApi } from "@/services/leisureInvite";
import type { InviteResponse } from "@/types/finance";

const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (dateStr: string) => {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ReceivedInvitesModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ReceivedInvitesModal({
  open,
  onClose,
  onUpdate,
}: ReceivedInvitesModalProps) {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leisureInviteApi.getReceived();
      setInvites(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar convites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleAccept = async (inviteId: string) => {
    setActing(inviteId);
    try {
      await leisureInviteApi.acceptInvite(inviteId);
      toast("Convite aceito!", "success");
      load();
      onUpdate();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao aceitar convite", "error");
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setActing(inviteId);
    try {
      await leisureInviteApi.declineInvite(inviteId);
      toast("Convite recusado", "success");
      load();
      onUpdate();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao recusar convite", "error");
    } finally {
      setActing(null);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
        <div
          className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 lg:mx-4 lg:w-full lg:max-w-lg lg:rounded-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Convites recebidos
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle size={24} className="text-rose-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {error}
                </p>
                <button
                  onClick={load}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  <RefreshCw size={14} />
                  Tentar novamente
                </button>
              </div>
            )}

            {!loading && !error && invites.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <UserCheck
                  size={40}
                  className="text-slate-300 dark:text-slate-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Nenhum convite
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Você não tem convites pendentes.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && invites.length > 0 && (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <Card key={invite.id}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {invite.leisure_title ?? "Lazer"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Convite de{" "}
                            <span className="font-medium">
                              {invite.sender_name ?? invite.sender_email}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            invite.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : invite.status === "accepted"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {invite.status === "pending"
                            ? "Pendente"
                            : invite.status === "accepted"
                              ? "Aceito"
                              : "Recusado"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {invite.leisure_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(invite.leisure_date)}
                          </span>
                        )}
                        <span>{formatDateTime(invite.created_at)}</span>
                      </div>

                      {invite.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(invite.id)}
                            disabled={acting === invite.id}
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {acting === invite.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleDecline(invite.id)}
                            disabled={acting === invite.id}
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <UserX size={14} />
                            Recusar
                          </button>
                        </div>
                      )}

                      {(invite.status === "accepted" ||
                        invite.status === "declined") && (
                        <button
                          onClick={() => {
                            navigate(`/leisure/${invite.leisure_id}`);
                            onClose();
                          }}
                          className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <ExternalLink size={14} />
                          Ver lazer
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


    </>
  );
}
