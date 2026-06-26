import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { shoppingListApi } from "@/services/shoppingList";
import type {
  ShoppingListItemCreate,
  ShoppingListItemResponse,
  ShoppingListItemUpdate,
} from "@/types/finance";

interface ShoppingListItemFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (item: ShoppingListItemResponse) => void;
  listId: string;
  initial?: {
    id: string;
    name: string;
    quantity: string | null;
    order: number;
  };
}

export function ShoppingListItemForm({
  open,
  onClose,
  onSuccess,
  listId,
  initial,
}: ShoppingListItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setQuantity(initial.quantity ?? "");
      } else {
        setName("");
        setQuantity("");
      }
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let response: ShoppingListItemResponse;
      if (initial) {
        response = await shoppingListApi.updateItem(listId, initial.id, {
          name: name.trim(),
          quantity: quantity.trim() || null,
        } satisfies ShoppingListItemUpdate);
      } else {
        response = await shoppingListApi.createItem(listId, {
          name: name.trim(),
          quantity: quantity.trim() || null,
        } satisfies ShoppingListItemCreate);
      }
      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center">
      <div className="flex max-h-[60vh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[24rem] sm:max-w-lg sm:rounded-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {initial ? "Editar item" : "Adicionar item"}
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
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arroz"
                maxLength={255}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Quantidade{" "}
                <span className="text-slate-400 dark:text-slate-500">
                  (opcional)
                </span>
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 1 kg, 2 pacotes, 5"
                maxLength={50}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500">{error}</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {initial ? "Salvar alterações" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
