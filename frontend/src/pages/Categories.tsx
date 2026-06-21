import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Tags, Trash2, X } from "lucide-react";
import { Card } from "@/components/Card";
import { Toast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { categoryApi } from "@/services/category";
import { getCategoryIcon, iconList } from "@/utils/categoryIcons";
import type { CategoryResponse } from "@/types/finance";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#78716c",
];

export function Categories() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState("home");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await categoryApi.list();
      setCategories(cats);
    } catch {
      setToast({ message: "Erro ao carregar categorias", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setColor(COLORS[0]);
    setIcon("home");
  };

  const handleEdit = (cat: CategoryResponse) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await categoryApi.update(editingId, { name: name.trim(), color, icon });
        setToast({ message: "Categoria atualizada", variant: "success" });
      } else {
        await categoryApi.create({ name: name.trim(), color, icon });
        setToast({ message: "Categoria criada", variant: "success" });
      }
      resetForm();
      setShowForm(false);
      load();
    } catch {
      setToast({
        message: editingId ? "Erro ao atualizar categoria" : "Erro ao criar categoria",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoryApi.delete(deleteTarget);
      setToast({ message: "Categoria excluída", variant: "success" });
      setDeleteTarget(null);
      if (editingId === deleteTarget) {
        resetForm();
        setShowForm(false);
      }
      load();
    } catch {
      setToast({ message: "Erro ao excluir categoria", variant: "error" });
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Categorias
        </h1>
        {!showForm && !editingId && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus size={18} />
            Nova
          </button>
        )}
      </div>

      {(showForm || editingId !== null) && (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: color }}
                >
                  {getCategoryIcon(icon, 20, "#fff")}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome da categoria"
                  maxLength={100}
                  autoComplete="off"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
                />
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button
                  onClick={handleSave}
                  disabled={!name.trim()}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:flex-initial"
                >
                  <Save size={16} />
                  Salvar
                </button>
                <button
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Cor
              </label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-full transition-transform active:scale-95 sm:h-10 sm:w-10 ${
                      color === c
                        ? "scale-110 ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-800"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ícone
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {iconList.map((item) => {
                  const Icon = item.component;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setIcon(item.key)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors active:scale-95 sm:h-10 sm:w-10 dark:text-slate-400 ${
                        icon === item.key
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                      aria-label={`Ícone ${item.key}`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))
          : categories.length === 0
            ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
                <Tags size={32} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma categoria criada.
                </p>
              </div>
            )
            : categories.map((cat) => (
              <Card key={cat.id}>
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                    style={{ backgroundColor: cat.color }}
                  >
                    {getCategoryIcon(cat.icon, 18, "#fff")}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                    {cat.name}
                  </span>
                  <button
                    onClick={() => handleEdit(cat)}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat.id)}
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir categoria?"
        message="Despesas com esta categoria não serão removidas, mas ficarão sem vínculo."
        onConfirm={handleDelete}
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
