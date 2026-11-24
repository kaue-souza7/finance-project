import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  NotebookPen,
  Plus,
  RefreshCw,
  SearchX,
  Share2,
} from "lucide-react";
import { OrganizationCard } from "@/components/additionalOrganization/OrganizationCard";
import { OrganizationFormSheet } from "@/components/additionalOrganization/OrganizationFormSheet";
import { OrganizationListRow } from "@/components/additionalOrganization/OrganizationListRow";
import { OrganizationToolbar } from "@/components/additionalOrganization/OrganizationToolbar";
import { PendingInvitesBanner } from "@/components/additionalOrganization/PendingInvitesBanner";
import { ReceivedInvitesSheet } from "@/components/additionalOrganization/ReceivedInvitesSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonCard } from "@/components/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { useOrganizationViewMode } from "@/hooks/useOrganizationViewMode";
import { useVisibleRefresh } from "@/hooks/useVisibleRefresh";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import {
  normalizeSearch,
  organizationTypeLabel,
} from "@/utils/additionalOrganization";
import type { AdditionalOrganizationSummary } from "@/types/additionalOrganization";
import type { AdditionalOrganizationInvite } from "@/types/additionalOrganizationSharing";

export function AdditionalOrganizations() {
  const navigate = useNavigate();
  const { viewMode, setViewMode } = useOrganizationViewMode();
  const { toast: showToast } = useToast();

  const [ownedOrganizations, setOwnedOrganizations] = useState<
    AdditionalOrganizationSummary[]
  >([]);
  const [sharedOrganizations, setSharedOrganizations] = useState<
    AdditionalOrganizationSummary[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<
    AdditionalOrganizationInvite[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<AdditionalOrganizationSummary | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdditionalOrganizationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [receivedOpen, setReceivedOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [owned, shared, invites] = await Promise.all([
        additionalOrganizationApi.list(),
        additionalOrganizationApi.listShared(),
        additionalOrganizationApi.listReceivedInvites(),
      ]);
      setOwnedOrganizations(owned);
      setSharedOrganizations(shared);
      setPendingInvites(invites);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar organizações",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useVisibleRefresh(
    () => {
      void additionalOrganizationApi
        .listReceivedInvites()
        .then(setPendingInvites)
        .catch(() => {
          // Mantém o contador atual.
        });
    },
    !formOpen && !receivedOpen && !deleteTarget,
  );

  const matchesQuery = useCallback(
    (organization: AdditionalOrganizationSummary, term: string) => {
      if (!term) return true;
      const haystack = normalizeSearch(
        [
          organization.title,
          organizationTypeLabel(organization.type),
          organization.content_preview ?? "",
          organization.owner.name,
        ].join(" "),
      );
      return haystack.includes(term);
    },
    [],
  );

  const filteredOwned = useMemo(() => {
    const term = normalizeSearch(deferredQuery);
    return ownedOrganizations.filter((organization) =>
      matchesQuery(organization, term),
    );
  }, [ownedOrganizations, deferredQuery, matchesQuery]);

  const filteredShared = useMemo(() => {
    const term = normalizeSearch(deferredQuery);
    return sharedOrganizations.filter((organization) =>
      matchesQuery(organization, term),
    );
  }, [sharedOrganizations, deferredQuery, matchesQuery]);

  const filteredCount = filteredOwned.length + filteredShared.length;
  const totalCount =
    ownedOrganizations.length + sharedOrganizations.length;

  const handleFormSuccess = (
    organization: AdditionalOrganizationSummary,
  ) => {
    if (editTarget) {
      showToast("Organização atualizada", "success");
      void load();
      return;
    }

    showToast("Organização criada", "success");
    navigate(`/organizacao-adicional/${organization.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await additionalOrganizationApi.delete(deleteTarget.id);
      showToast("Organização excluída", "success");
      setDeleteTarget(null);
      void load();
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

  const openCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const openEdit = (organization: AdditionalOrganizationSummary) => {
    setEditTarget(organization);
    setFormOpen(true);
  };

  const renderSection = (
    title: string,
    organizations: AdditionalOrganizationSummary[],
    shared: boolean,
    emptyMessage: string,
  ) => (
    <section className={shared ? "mt-7" : ""}>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h2>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {organizations.length}
        </span>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-800/30">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-2"
          }
        >
          {organizations.map((organization) =>
            viewMode === "grid" ? (
              <OrganizationCard
                key={organization.id}
                organization={organization}
                shared={shared}
                onOpen={() =>
                  navigate(`/organizacao-adicional/${organization.id}`)
                }
                {...(!shared
                  ? {
                      onEdit: () => openEdit(organization),
                      onDelete: () => setDeleteTarget(organization),
                    }
                  : {})}
              />
            ) : (
              <OrganizationListRow
                key={organization.id}
                organization={organization}
                shared={shared}
                onOpen={() =>
                  navigate(`/organizacao-adicional/${organization.id}`)
                }
                {...(!shared
                  ? {
                      onEdit: () => openEdit(organization),
                      onDelete: () => setDeleteTarget(organization),
                    }
                  : {})}
              />
            ),
          )}
        </div>
      )}
    </section>
  );

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Organização Adicional
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Organize receitas extras e anotações, sozinho ou em conjunto.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          aria-label="Nova organização"
          className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
        >
          <Plus size={18} />
          <span className="hidden min-[360px]:inline">Nova</span>
        </button>
      </div>

      <PendingInvitesBanner
        count={pendingInvites.length}
        onOpen={() => setReceivedOpen(true)}
      />

      <OrganizationToolbar
        query={query}
        onQueryChange={setQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        count={filteredCount}
      />

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {error}
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
      )}

      {!loading && !error && totalCount === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
            <NotebookPen size={28} />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Nenhuma organização adicional
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Crie um texto livre para suas anotações ou uma receita adicional
            para distribuir valores como 13º, férias e PLR.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus size={17} />
            Criar primeira organização
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        totalCount > 0 &&
        filteredCount === 0 &&
        query.trim() && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
            <SearchX size={32} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              Nenhuma organização encontrada
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tente outro termo ou limpe a pesquisa.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Limpar pesquisa
            </button>
          </div>
        )}

      {!loading && !error && totalCount > 0 && filteredCount > 0 && (
        <div>
          {renderSection(
            "Minhas organizações",
            filteredOwned,
            false,
            "Você ainda não criou nenhuma organização.",
          )}
          {renderSection(
            "Organizações compartilhadas",
            filteredShared,
            true,
            "As organizações que outras pessoas compartilharem com você aparecerão aqui.",
          )}
        </div>
      )}

      {!loading && !error && totalCount === 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Share2 size={13} />
          O compartilhamento por e-mail estará disponível ao criar uma
          organização.
        </div>
      )}

      <OrganizationFormSheet
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        onSuccess={handleFormSuccess}
        initial={editTarget}
      />

      <ReceivedInvitesSheet
        open={receivedOpen}
        invites={pendingInvites}
        onClose={() => setReceivedOpen(false)}
        onAccepted={(organizationId) => {
          void load();
          navigate(`/organizacao-adicional/${organizationId}`);
        }}
        onDeclined={(inviteId) => {
          setPendingInvites((previous) =>
            previous.filter((invite) => invite.id !== inviteId),
          );
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir organização?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" e todos os seus dados serão removidos permanentemente.`
            : ""
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
