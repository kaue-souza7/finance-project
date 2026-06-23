import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { shoppingListApi } from "@/services/shoppingList";
import { getCategoryIcon, iconList } from "@/utils/categoryIcons";
import type { ShoppingListCreate, ShoppingListUpdate } from "@/types/finance";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#78716c",
];

interface ShoppingListFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initial?: { id: string; title: string; color: string; icon: string };
}

export function ShoppingListForm({
  open,
  onClose,
  onSuccess,
  initial,
}: ShoppingListFormProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState("shopping-bag");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setTitle(initial.title);
        setColor(initial.color);
        setIcon(initial.icon);
      } else {
        setTitle("");
        setColor(COLORS[0]);
        setIcon("shopping-bag");
      }
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (initial) {
        await shoppingListApi.update(initial.id, {
          title: title.trim(),
          color,
          icon,
        } satisfies ShoppingListUpdate);
      } else {
        await shoppingListApi.create({
          title: title.trim(),
          color,
          icon,
        } satisfies ShoppingListCreate);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar lista");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[32rem] sm:max-w-lg sm:rounded-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {initial ? "Editar lista" : "Nova lista"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Mercado Junho"
                maxLength={255}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
              />
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
                {iconList.map((item) => (
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
                    {getCategoryIcon(item.key, 18)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500">{error}</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {initial ? "Salvar alterações" : "Criar lista"}
          </button>
        </div>
      </div>
    </div>
  );
}
