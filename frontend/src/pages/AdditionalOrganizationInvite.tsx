import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock3,
  Loader2,
  Mail,
  UserX,
  Users,
} from "lucide-react";
import { Card } from "@/components/Card";
import { useToast } from "@/contexts/ToastContext";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import { organizationTypeLabel } from "@/utils/additionalOrganization";
import type { AdditionalOrganizationInvitePreview } from "@/types/additionalOrganizationSharing";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function AdditionalOrganizationInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  const token = searchParams.get("token");

  const [preview, setPreview] =
    useState<AdditionalOrganizationInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const resolve = useCallback(async () => {
    if (!token) {
      setError("Link de convite inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await additionalOrganizationApi.resolveInviteToken(token);
      if (data.status === "accepted") {
        navigate(`/organizacao-adicional/${data.organization_id}`, {
          replace: true,
        });
        return;
      }
      setPreview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível validar o convite.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    void resolve();
  }, [resolve]);

  const handleAccept = async () => {
    if (!preview) return;
    setActing(true);
    try {
      const accepted = await additionalOrganizationApi.acceptInvite(
        preview.invite_id,
      );
      showToast("Convite aceito!", "success");
      navigate(`/organizacao-adicional/${accepted.organization_id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao aceitar convite",
        "error",
      );
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!preview) return;
    setActing(true);
    try {
      await additionalOrganizationApi.declineInvite(preview.invite_id);
      showToast("Convite recusado", "success");
      setPreview({ ...preview, status: "declined" });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao recusar convite",
        "error",
      );
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-indigo-500" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Validando convite...
          </p>
        </div>
      </section>
    );
  }

  if (error || !preview) {
    return (
      <section className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate("/organizacao-adicional")}
          className="mb-4 flex min-h-[44px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <Card>
          <div className="py-6 text-center">
            <AlertCircle size={34} className="mx-auto text-rose-500" />
            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              Convite indisponível
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {error ?? "Este convite não está mais disponível."}
            </p>
          </div>
        </Card>
      </section>
    );
  }

  if (preview.status === "declined" || preview.status === "cancelled") {
    return (
      <section className="mx-auto max-w-lg">
        <Card>
          <div className="py-8 text-center">
            <UserX size={36} className="mx-auto text-slate-400" />
            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              Convite {preview.status === "declined" ? "recusado" : "cancelado"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Este convite não permite mais acesso à organização.
            </p>
            <button
              type="button"
              onClick={() => navigate("/organizacao-adicional")}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white"
            >
              Ir para Organização Adicional
            </button>
          </div>
        </Card>
      </section>
    );
  }

  if (preview.status === "expired") {
    return (
      <section className="mx-auto max-w-lg">
        <Card>
          <div className="py-8 text-center">
            <Clock3 size={36} className="mx-auto text-amber-500" />
            <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              Convite expirado
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Peça ao proprietário para enviar um novo convite.
            </p>
            <button
              type="button"
              onClick={() => navigate("/organizacao-adicional")}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
            >
              Voltar
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={() => navigate("/organizacao-adicional")}
        className="mb-4 flex min-h-[44px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <Card>
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
            <Mail size={26} />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Convite para organização
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {preview.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {organizationTypeLabel(preview.type)} · convidado por{" "}
            {preview.owner_name}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={12} />
              Expira em {formatDate(preview.expires_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              Acesso após o aceite
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleDecline()}
              disabled={acting}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <UserX size={16} />
              Recusar
            </button>
            <button
              type="button"
              onClick={() => void handleAccept()}
              disabled={acting}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {acting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Aceitar convite
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
