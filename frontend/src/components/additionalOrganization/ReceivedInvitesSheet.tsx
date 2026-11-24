import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  Mail,
  UserX,
  X,
} from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type { AdditionalOrganizationInvite } from "@/types/additionalOrganizationSharing";

interface ReceivedInvitesSheetProps {
  open: boolean;
  invites: AdditionalOrganizationInvite[];
  onClose: () => void;
  onAccepted: (organizationId: string) => void;
  onDeclined: (inviteId: string) => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceivedInvitesSheet({
  open,
  invites,
  onClose,
  onAccepted,
  onDeclined,
}: ReceivedInvitesSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [acting, setActing] = useState<string | null>(null);
  const { toast: showToast } = useToast();
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !acting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, acting, onClose]);

  useEffect(() => {
    if (open) setActing(null);
  }, [open]);

  if (!open) return null;

  const handleAccept = async (invite: AdditionalOrganizationInvite) => {
    setActing(invite.id);
    try {
      const accepted = await additionalOrganizationApi.acceptInvite(
        invite.id,
      );
      showToast("Convite aceito!", "success");
      onClose();
      onAccepted(accepted.organization_id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao aceitar convite",
        "error",
      );
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (invite: AdditionalOrganizationInvite) => {
    setActing(invite.id);
    try {
      await additionalOrganizationApi.declineInvite(invite.id);
      showToast("Convite recusado", "success");
      onDeclined(invite.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao recusar convite",
        "error",
      );
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="received-invites-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-sky-500" />
            <h2
              id="received-invites-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              Convites recebidos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {invites.length === 0 ? (
            <div className="py-10 text-center">
              <Mail size={38} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                Nenhum convite pendente
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Os convites para organizações aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {invite.organization_title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Convite de{" "}
                        <span className="font-medium">
                          {invite.sender_name}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Pendente
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} />
                      Expira em {formatDate(invite.expires_at)}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDecline(invite)}
                      disabled={acting === invite.id}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <UserX size={15} />
                      Recusar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAccept(invite)}
                      disabled={acting === invite.id}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {acting === invite.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
