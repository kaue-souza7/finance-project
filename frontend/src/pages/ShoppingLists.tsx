import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, UserCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ReceivedShoppingListInvitesModal } from "@/components/ReceivedShoppingListInvitesModal";
import { ShoppingListCard } from "@/components/ShoppingListCard";
import { ShoppingListForm } from "@/components/ShoppingListForm";
import { SkeletonCard } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { shoppingListApi } from "@/services/shoppingList";
import type { ShoppingListResponse } from "@/types/finance";

export function ShoppingLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ShoppingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ShoppingListResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ShoppingListResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shoppingListApi.list();
      setLists(data);
    } catch (err) {
      console.error("Erro ao carregar listas:", err);
      setToast({ message: "Erro ao carregar listas", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await shoppingListApi.delete(deleteTarget.id);
      setToast({ message: "Lista excluída", variant: "success" });
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error("Erro ao excluir lista:", err);
      setToast({ message: "Erro ao excluir lista", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (list: ShoppingListResponse) => {
    setEditTarget(list);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    const message = editTarget ? "Lista atualizada" : "Lista criada";
    setToast({ message, variant: "success" });
    reloadSilent();
  };

  const reloadSilent = async () => {
    try {
      const data = await shoppingListApi.list();
      setLists(data);
    } catch (err) {
      console.error("Erro ao recarregar listas:", err);
    }
  };

  const ownedLists = lists.filter((l) => l.role === "owner");
  const sharedLists = lists.filter((l) => l.role !== "owner");

  const sortedOwned = [...ownedLists].sort((a, b) => {
    if (a.completed_at && !b.completed_at) return 1;
    if (!a.completed_at && b.completed_at) return -1;
    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });

  const sortedShared = [...sharedLists].sort((a, b) => {
    if (a.completed_at && !b.completed_at) return 1;
    if (!a.completed_at && b.completed_at) return -1;
    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            CheckList de Mercado
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Suas listas de compras
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInvites(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <UserCheck size={18} />
            Convites
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setShowForm(true);
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus size={18} />
            Nova lista
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Minhas listas
            </h2>

            {sortedOwned.length === 0
              ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
                  <ClipboardList
                    size={40}
                    className="mx-auto text-slate-400"
                  />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma lista criada.
                  </p>
                  <button
                    onClick={() => {
                      setEditTarget(null);
                      setShowForm(true);
                    }}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                  >
                    <Plus size={18} />
                    Criar primeira lista
                  </button>
                </div>
              )
              : sortedOwned.map((list) => (
                  <ShoppingListCard
                    key={list.id}
                    list={list}
                    onClick={() => navigate(`/checklist/${list.id}`)}
                    onEdit={() => handleEdit(list)}
                    onDelete={() => setDeleteTarget(list)}
                  />
                ))}
          </div>

          {sortedShared.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Compartilhadas comigo
              </h2>

              {sortedShared.map((list) => (
                <ShoppingListCard
                  key={list.id}
                  list={list}
                  onClick={() => navigate(`/checklist/${list.id}`)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  shared
                />
              ))}
            </div>
          )}
        </>
      )}

      <ShoppingListForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTarget(null);
        }}
        onSuccess={handleFormSuccess}
        initial={
          editTarget
            ? {
                id: editTarget.id,
                title: editTarget.title,
                color: editTarget.color,
                icon: editTarget.icon,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir lista?"
        message="Todos os itens desta lista serão removidos permanentemente."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ReceivedShoppingListInvitesModal
        open={showInvites}
        onClose={() => setShowInvites(false)}
        onUpdate={load}
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
