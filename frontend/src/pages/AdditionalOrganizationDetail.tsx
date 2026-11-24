import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  NotebookPen,
  Pencil,
  RefreshCw,
  Share2,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { AdditionalIncomePlanner } from "@/components/additionalOrganization/AdditionalIncomePlanner";
import { OrganizationFormSheet } from "@/components/additionalOrganization/OrganizationFormSheet";
import { FreeTextEditor } from "@/components/additionalOrganization/FreeTextEditor";
import { ShareOrganizationSheet } from "@/components/additionalOrganization/ShareOrganizationSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { useVisibleRefresh } from "@/hooks/useVisibleRefresh";
import { ApiError } from "@/services/api";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import {
  decimalStringToCents,
  formatCentsBRL,
} from "@/utils/format";
import {
  organizationTypeLabel,
} from "@/utils/additionalOrganization";
import type {
  AdditionalOrganizationDetail,
  AdditionalOrganizationSummary,
} from "@/types/additionalOrganization";

export function AdditionalOrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();

  const [organization, setOrganization] =
    useState<AdditionalOrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await additionalOrganizationApi.getById(id);
        setOrganization(data);
        if (!silent) setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setOrganization(null);
          setError("Você não tem mais acesso a esta organização.");
          setLoading(false);
          return;
        }
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar organização",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useVisibleRefresh(
    () => {
      void load(true);
    },
    !editOpen && !shareOpen && !deleteOpen,
  );

  const mergeSummary = (summary: AdditionalOrganizationSummary) => {
    setOrganization((previous) =>
      previous
        ? {
            ...previous,
            ...summary,
            content: previous.content,
            items: previous.items,
          }
        : previous,
    );
  };

  const mergeContentSummary = (
    summary: AdditionalOrganizationSummary,
    content: string,
  ) => {
    setOrganization((previous) =>
      previous
        ? {
            ...previous,
            ...summary,
            content,
            items: previous.items,
          }
        : previous,
    );
  };

  const handleDelete = async () => {
    if (!organization) return;

    setDeleting(true);
    try {
      await additionalOrganizationApi.delete(organization.id);
      showToast("Organização excluída", "success");
      navigate("/organizacao-adicional");
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Erro ao excluir organização",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <SkeletonCard />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </section>
    );
  }

  if (error || !organization) {
    return (
      <section className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/organizacao-adicional")}
          className="mb-4 flex min-h-[44px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {error ?? "Organização não encontrada"}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const isIncome = organization.type === "additional_income";
  const isOwner = organization.role === "owner";
  const TypeIcon = isIncome ? Wallet : NotebookPen;

  return (
    <section className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => navigate("/organizacao-adicional")}
        className="mb-3 flex min-h-[44px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-5">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
            }`}
          >
            <TypeIcon size={23} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {organization.title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isIncome
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
                    }`}
                  >
                    {organizationTypeLabel(organization.type)}
                  </span>
                  {isIncome && organization.show_observations && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Com observações
                    </span>
                  )}
                  {!isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                      Compartilhada por {organization.owner.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-0.5">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShareOpen(true)}
                      className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20 sm:px-3"
                      aria-label="Compartilhar organização"
                    >
                      <Share2 size={18} />
                      <span className="hidden sm:inline">Compartilhar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      aria-label="Editar organização"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                      aria-label="Excluir organização"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20 sm:px-3"
                    aria-label="Ver pessoas com acesso"
                  >
                    <Users size={18} />
                    <span className="hidden sm:inline">Pessoas</span>
                  </button>
                )}
              </div>
            </div>

            {isIncome && organization.total_amount && (
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formatCentsBRL(
                  decimalStringToCents(organization.total_amount),
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {isIncome ? (
        <AdditionalIncomePlanner organization={organization} />
      ) : (
        <FreeTextEditor
          organization={organization}
          onSaved={mergeContentSummary}
          onReload={() => void load(true)}
        />
      )}

      {isOwner && (
        <OrganizationFormSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={(saved) => {
            mergeSummary(saved);
            showToast("Organização atualizada", "success");
          }}
          initial={organization}
        />
      )}

      <ShareOrganizationSheet
        open={shareOpen}
        organizationId={organization.id}
        organizationTitle={organization.title}
        canManage={isOwner}
        onClose={() => setShareOpen(false)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Excluir organização?"
        message={`"${organization.title}" e todos os seus dados serão removidos permanentemente.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </section>
  );
}
