import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus, ShoppingBag, UserPlus, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ShareManagementModal } from "@/components/ShareManagementModal";
import { ShoppingListItem } from "@/components/ShoppingListItem";
import { ShoppingListItemForm } from "@/components/ShoppingListItemForm";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { shoppingListApi } from "@/services/shoppingList";
import { getCategoryIcon } from "@/utils/categoryIcons";
import type {
  ShoppingListDetailResponse,
  ShoppingListItemResponse,
} from "@/types/finance";

export function ShoppingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<ShoppingListDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItemTarget, setEditItemTarget] =
    useState<ShoppingListItemResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ShoppingListItemResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await shoppingListApi.getById(id);
      setList(data);
    } catch (err) {
      console.error("Erro ao carregar lista:", err);
      setToast({ message: "Erro ao carregar lista", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (
    item: ShoppingListItemResponse,
    checked: boolean,
  ) => {
    if (!id || !list || !canEdit) return;

    const prevItems = list.items;
    const prevCompletedAt = list.completed_at;

    const updatedItems = list.items.map((i) =>
      i.id === item.id ? { ...i, checked } : i,
    );
    const allChecked =
      updatedItems.length > 0 && updatedItems.every((i) => i.checked);
    const newCompletedAt = allChecked
      ? (list.completed_at ?? new Date().toISOString())
      : null;

    setList({ ...list, items: updatedItems, completed_at: newCompletedAt });

    try {
      await shoppingListApi.toggleItem(id, item.id, { checked });
    } catch (err) {
      console.error("Erro ao atualizar item:", err);
      setList({ ...list, items: prevItems, completed_at: prevCompletedAt });
      setToast({ message: "Erro ao atualizar item", variant: "error" });
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget || !id || !list) return;

    const prevItems = list.items;
    const prevCompletedAt = list.completed_at;

    const updatedItems = list.items.filter((i) => i.id !== deleteTarget.id);
    const allChecked =
      updatedItems.length > 0 && updatedItems.every((i) => i.checked);
    const newCompletedAt = allChecked
      ? (list.completed_at ?? new Date().toISOString())
      : null;

    setList({ ...list, items: updatedItems, completed_at: newCompletedAt });
    setDeleting(true);

    try {
      await shoppingListApi.deleteItem(id, deleteTarget.id);
      setToast({ message: "Item excluído", variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
      setList({ ...list, items: prevItems, completed_at: prevCompletedAt });
      setToast({ message: "Erro ao excluir item", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditItem = (item: ShoppingListItemResponse) => {
    setEditItemTarget(item);
    setShowForm(true);
  };

  const handleFormSuccess = (item: ShoppingListItemResponse) => {
    if (!list) return;
    const existingIndex = list.items.findIndex((i) => i.id === item.id);
    const updatedItems =
      existingIndex >= 0
        ? list.items.map((i) => (i.id === item.id ? item : i))
        : [...list.items, item];
    const allChecked =
      updatedItems.length > 0 && updatedItems.every((i) => i.checked);
    const newCompletedAt = allChecked
      ? (list.completed_at ?? new Date().toISOString())
      : null;
    setList({ ...list, items: updatedItems, completed_at: newCompletedAt });
  };

  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = list?.items.length ?? 0;
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isComplete = list?.completed_at != null;
  const isOwner = list?.role === "owner";
  const isEditor = list?.role === "editor";
  const isViewer = list?.role === "viewer";
  const canEdit = isOwner || isEditor;

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (!list) return null;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => navigate("/checklist")}
          className="mb-3 flex min-h-[36px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: list.color }}
          >
            {getCategoryIcon(list.icon, 24, "#fff")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {list.title}
                </h1>
                {isOwner && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Users size={12} />
                    Dono
                  </span>
                )}
                {isEditor && list.shared_by && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    ✏️ Editando · compartilhado por {list.shared_by.name}
                  </span>
                )}
                {isViewer && list.shared_by && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                    👁️ Visualizando · compartilhado por {list.shared_by.name}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isComplete && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    ✓ Concluída
                  </span>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    <UserPlus size={15} />
                    Compartilhar
                  </button>
                )}
              </div>
            </div>

            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {checkedCount} de {totalCount} itens
            </p>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <motion.div
                  className={`h-full rounded-full ${
                    percentage === 100
                      ? "bg-emerald-500"
                      : "bg-sky-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Itens
        </h2>
        {canEdit && (
          <button
            onClick={() => {
              setEditItemTarget(null);
              setShowForm(true);
            }}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus size={15} />
            Adicionar item
          </button>
        )}
      </div>

      {list.items.length === 0
        ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
            <ShoppingBag size={36} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Nenhum item na lista.
            </p>
            {canEdit && (
              <button
                onClick={() => {
                  setEditItemTarget(null);
                  setShowForm(true);
                }}
                className="mt-4 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Plus size={15} />
                Adicionar primeiro item
              </button>
            )}
          </div>
        )
        : (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
            <AnimatePresence mode="popLayout">
              {list.items.map((item) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onEdit={handleEditItem}
                  onDelete={setDeleteTarget}
                  canEdit={canEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

      <ShareManagementModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onUpdate={load}
        listId={id!}
      />

      {canEdit && (
        <ShoppingListItemForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditItemTarget(null);
          }}
          onSuccess={handleFormSuccess}
          listId={id!}
          initial={
            editItemTarget
              ? {
                  id: editItemTarget.id,
                  name: editItemTarget.name,
                  quantity: editItemTarget.quantity,
                  order: editItemTarget.order,
                }
              : undefined
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir item?"
        message="Este item será removido permanentemente da lista."
        loading={deleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast
        open={!!toast}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "success"}
        onClose={() => setToast(null)}
      />
    </section>
  );
}
