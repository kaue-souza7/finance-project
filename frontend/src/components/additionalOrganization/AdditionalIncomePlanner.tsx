import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { AllocationCard } from "@/components/additionalOrganization/AllocationCard";
import { AllocationFormSheet } from "@/components/additionalOrganization/AllocationFormSheet";
import { AllocationTable } from "@/components/additionalOrganization/AllocationTable";
import { FinancialSummaryCards } from "@/components/additionalOrganization/FinancialSummaryCards";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { ApiError } from "@/services/api";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import { calculateOrganizationTotals } from "@/utils/additionalOrganization";
import type {
  AdditionalOrganizationDetail,
  AdditionalOrganizationItem,
  AdditionalOrganizationItemUpdate,
} from "@/types/additionalOrganization";

interface AdditionalIncomePlannerProps {
  organization: AdditionalOrganizationDetail;
}

export function AdditionalIncomePlanner({
  organization,
}: AdditionalIncomePlannerProps) {
  const [items, setItems] = useState<AdditionalOrganizationItem[]>(
    organization.items,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] =
    useState<AdditionalOrganizationItem | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdditionalOrganizationItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast: showToast } = useToast();

  useEffect(() => {
    setItems(organization.items);
  }, [organization.id, organization.items]);

  const totals = useMemo(
    () => calculateOrganizationTotals(organization.total_amount, items),
    [organization.total_amount, items],
  );

  const handleCreate = (item: AdditionalOrganizationItem) => {
    setItems((previous) =>
      [...previous, item].sort((a, b) => a.position - b.position),
    );
  };

  const handleUpdate = async (
    item: AdditionalOrganizationItem,
    data: AdditionalOrganizationItemUpdate,
  ) => {
    try {
      const saved = await additionalOrganizationApi.updateItem(
        organization.id,
        item.id,
        data,
      );
      setItems((previous) =>
        previous.map((current) =>
          current.id === saved.id ? saved : current,
        ),
      );
      return saved;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const current = await additionalOrganizationApi.getById(
            organization.id,
          );
          setItems(current.items);
        } catch {
          // Mantém os dados atuais; o erro de conflito já será exibido.
        }
      }
      throw error;
    }
  };

  const refreshFromServer = async () => {
    try {
      const current = await additionalOrganizationApi.getById(
        organization.id,
      );
      setItems(current.items);
    } catch {
      // Mantém os dados atuais.
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await additionalOrganizationApi.deleteItem(
        organization.id,
        deleteTarget.id,
      );
      setItems((previous) =>
        previous.filter((item) => item.id !== deleteTarget.id),
      );
      showToast("Linha excluída", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erro ao excluir linha",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setSheetOpen(true);
  };

  const openEdit = (item: AdditionalOrganizationItem) => {
    setEditItem(item);
    setSheetOpen(true);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Distribuição
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="hidden min-h-[44px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-xs font-medium text-white hover:from-indigo-700 hover:to-violet-700 md:flex"
        >
          <Plus size={16} />
          Adicionar linha
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
          <Wallet
            size={36}
            className="mx-auto text-slate-400"
          />
          <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
            Nenhum valor distribuído ainda
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Adicione a primeira linha para planejar o uso da sua receita.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus size={17} />
            Adicionar primeira linha
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <AllocationCard
                key={item.id}
                item={item}
                showObservations={organization.show_observations}
                onEdit={() => openEdit(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>

          <AllocationTable
            items={items}
            showObservations={organization.show_observations}
            onUpdate={handleUpdate}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      {items.length > 0 && (
        <button
          type="button"
          onClick={openCreate}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/60 md:hidden"
        >
          <Plus size={17} />
          Adicionar linha
        </button>
      )}

      <div className="mt-5">
        <FinancialSummaryCards
          totalCents={totals.totalCents}
          allocatedCents={totals.allocatedCents}
          remainingCents={totals.remainingCents}
          isOverBudget={totals.isOverBudget}
          progressPercent={totals.progressPercent}
        />
      </div>

      <AllocationFormSheet
        open={sheetOpen}
        organizationId={organization.id}
        showObservations={organization.show_observations}
        onClose={() => {
          setSheetOpen(false);
          setEditItem(null);
        }}
        onSuccess={(item) => {
          if (editItem) {
            setItems((previous) =>
              previous.map((current) =>
                current.id === item.id ? item : current,
              ),
            );
            showToast("Linha atualizada", "success");
          } else {
            handleCreate(item);
            showToast("Linha adicionada", "success");
          }
        }}
        initial={editItem}
        onConflict={refreshFromServer}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir linha?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" será removida permanentemente da distribuição.`
            : ""
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
