import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type {
  AdditionalOrganizationInvite,
  AdditionalOrganizationInviteStatus,
  AdditionalOrganizationParticipant,
} from "@/types/additionalOrganizationSharing";

interface ShareOrganizationSheetProps {
  open: boolean;
  organizationId: string;
  organizationTitle: string;
  canManage: boolean;
  onClose: () => void;
}

type Tab = "people" | "invites";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inviteStatusLabel(status: AdditionalOrganizationInviteStatus) {
  return {
    pending: "Pendente",
    accepted: "Aceito",
    declined: "Recusado",
    cancelled: "Cancelado",
    expired: "Expirado",
  }[status];
}

function statusClasses(status: AdditionalOrganizationInviteStatus) {
  return {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    accepted:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    declined:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    cancelled:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    expired:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  }[status];
}

function emailStatusLabel(invite: AdditionalOrganizationInvite) {
  if (invite.email_status === "sent") return "E-mail enviado";
  if (invite.email_status === "failed") return "Falha no envio do e-mail";
  if (invite.email_status === "unavailable") {
    return "SMTP indisponível — reenvie depois";
  }
  return "Enviando e-mail...";
}

export function ShareOrganizationSheet({
  open,
  organizationId,
  organizationTitle,
  canManage,
  onClose,
}: ShareOrganizationSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);
  const { toast: showToast } = useToast();

  const [tab, setTab] = useState<Tab>("people");
  const [participants, setParticipants] = useState<
    AdditionalOrganizationParticipant[]
  >([]);
  const [invites, setInvites] = useState<AdditionalOrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<AdditionalOrganizationParticipant | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<AdditionalOrganizationInvite | null>(null);

  const refreshInvites = useCallback(async () => {
    if (!canManage) return;
    try {
      const data = await additionalOrganizationApi.listInvites(
        organizationId,
      );
      setInvites(data);
    } catch {
      // Mantém a lista atual.
    }
  }, [canManage, organizationId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const people = await additionalOrganizationApi.listParticipants(
        organizationId,
      );
      setParticipants(people);
      if (canManage) {
        const inviteData = await additionalOrganizationApi.listInvites(
          organizationId,
        );
        setInvites(inviteData);
      } else {
        setInvites([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar compartilhamento",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, canManage]);

  useEffect(() => {
    if (!open) return;
    setTab("people");
    setEmail("");
    setError(null);
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending && !acting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, sending, acting, onClose]);

  if (!open) return null;

  const showEmailFeedback = (
    invite: AdditionalOrganizationInvite,
    prefix: string,
  ) => {
    if (invite.email_status === "unavailable") {
      showToast(
        `${prefix} O envio por e-mail está indisponível no momento. Reenvie depois.`,
        "error",
      );
      return;
    }
    if (invite.email_status === "failed") {
      showToast(
        `${prefix} O e-mail falhou. Use "Reenviar" para tentar novamente.`,
        "error",
      );
      return;
    }
    if (invite.email_status === "sent") {
      showToast(`${prefix} E-mail enviado.`, "success");
      return;
    }
    showToast(`${prefix} O envio do e-mail foi solicitado.`, "success");
    window.setTimeout(() => void refreshInvites(), 1500);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const invite = await additionalOrganizationApi.sendInvite(
        organizationId,
        trimmed,
      );
      setInvites((previous) => [invite, ...previous]);
      setEmail("");
      showEmailFeedback(invite, "Convite criado.");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao enviar convite",
        "error",
      );
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (invite: AdditionalOrganizationInvite) => {
    setActing(invite.id);
    try {
      const updated = await additionalOrganizationApi.resendInvite(
        organizationId,
        invite.id,
      );
      setInvites((previous) =>
        previous.map((current) =>
          current.id === updated.id ? updated : current,
        ),
      );
      showEmailFeedback(updated, "Convite reenviado.");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao reenviar convite",
        "error",
      );
    } finally {
      setActing(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;

    setActing(cancelTarget.id);
    try {
      await additionalOrganizationApi.cancelInvite(
        organizationId,
        cancelTarget.id,
      );
      setInvites((previous) =>
        previous.map((invite) =>
          invite.id === cancelTarget.id
            ? { ...invite, status: "cancelled" as const }
            : invite,
        ),
      );
      showToast("Convite cancelado", "success");
      setCancelTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao cancelar convite",
        "error",
      );
    } finally {
      setActing(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget?.membership_id) return;

    setActing(removeTarget.membership_id);
    try {
      await additionalOrganizationApi.removeParticipant(
        organizationId,
        removeTarget.membership_id,
      );
      setParticipants((previous) =>
        previous.filter(
          (participant) =>
            participant.membership_id !== removeTarget.membership_id,
        ),
      );
      showToast("Acesso removido", "success");
      setRemoveTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao remover participante",
        "error",
      );
    } finally {
      setActing(null);
    }
  };

  const pendingInvites = invites.filter(
    (invite) => invite.status === "pending",
  );
  const historyInvites = invites.filter(
    (invite) => invite.status !== "pending",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-organization-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              <h2
                id="share-organization-title"
                className="truncate text-base font-semibold text-slate-900 dark:text-white"
              >
                {canManage ? "Compartilhar organização" : "Pessoas com acesso"}
              </h2>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {organizationTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {canManage && (
          <div
            className="mx-5 mt-4 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-900/40"
            role="group"
            aria-label="Seções do compartilhamento"
          >
            <button
              type="button"
              onClick={() => setTab("people")}
              aria-pressed={tab === "people"}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium ${
                tab === "people"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Users size={16} />
              Pessoas
            </button>
            <button
              type="button"
              onClick={() => setTab("invites")}
              aria-pressed={tab === "invites"}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium ${
                tab === "invites"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Mail size={16} />
              Convites
              {pendingInvites.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {pendingInvites.length}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          )}

          {!loading && error && (
            <div className="py-8 text-center">
              <AlertCircle size={26} className="mx-auto text-rose-500" />
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white"
              >
                <RefreshCw size={15} />
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && tab === "people" && (
            <div className="space-y-5">
              {canManage && (
                <form onSubmit={handleSend} className="space-y-3">
                  <label
                    htmlFor="invite-email"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    E-mail da pessoa
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="pessoa@email.com"
                    className="min-h-[48px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    A pessoa receberá um e-mail e precisará aceitar antes de
                    acessar.
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Send size={17} />
                    )}
                    Enviar convite
                  </button>
                </form>
              )}

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pessoas com acesso
                </h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={`${participant.user_id}-${participant.membership_id ?? "owner"}`}
                      className="flex min-h-[60px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {participant.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {participant.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          participant.role === "owner"
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                            : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                        }`}
                      >
                        {participant.role === "owner"
                          ? "Proprietário"
                          : "Participante"}
                      </span>
                      {canManage &&
                        participant.role === "participant" &&
                        participant.membership_id && (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(participant)}
                            disabled={
                              acting === participant.membership_id
                            }
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                            aria-label={`Remover ${participant.name}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {!loading && !error && tab === "invites" && canManage && (
            <div className="space-y-5">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Convites pendentes
                </h3>
                {pendingInvites.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Nenhum convite pendente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                              {invite.invited_email}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <CalendarDays size={11} />
                              Expira em {formatDateTime(invite.expires_at)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(invite.status)}`}
                          >
                            {inviteStatusLabel(invite.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] ${
                              invite.email_status === "failed" ||
                              invite.email_status === "unavailable"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {invite.email_status === "sent" ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Mail size={12} />
                            )}
                            {emailStatusLabel(invite)}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => void handleResend(invite)}
                              disabled={acting === invite.id}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <RefreshCw size={13} />
                              Reenviar
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelTarget(invite)}
                              disabled={acting === invite.id}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                            >
                              <X size={13} />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {historyInvites.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Histórico
                  </h3>
                  <div className="space-y-1.5">
                    {historyInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                            {invite.invited_email}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDateTime(invite.created_at)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(invite.status)}`}
                        >
                          {inviteStatusLabel(invite.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remover participante?"
        message={
          removeTarget
            ? `${removeTarget.name} perderá o acesso à organização imediatamente.`
            : ""
        }
        loading={!!removeTarget && acting === removeTarget.membership_id}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar convite?"
        message={
          cancelTarget
            ? `O convite para ${cancelTarget.invited_email} deixará de funcionar.`
            : ""
        }
        loading={!!cancelTarget && acting === cancelTarget.id}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
