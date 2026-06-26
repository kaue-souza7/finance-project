import { type FormEvent, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { leisureExpenseApi } from "@/services/leisureExpense";
import { parseBrl } from "@/utils/format";
import type { LeisureExpenseCreate } from "@/types/finance";

const CATEGORIES = [
  "Alimentação",
  "Hospedagem",
  "Transporte",
  "Entretenimento",
  "Ingressos",
  "Combustível",
  "Pedágio",
  "Estacionamento",
  "Compras",
  "Outros",
];

interface LeisureExpenseFormProps {
  leisureId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LeisureExpenseForm({
  leisureId,
  open,
  onClose,
  onSuccess,
}: LeisureExpenseFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paid, setPaid] = useState(false);
  const [addToPlanning, setAddToPlanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => parseBrl(amount), [amount]);
  const amountError = amount.length > 0 && !isFinite(parsedAmount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const numericAmount = parseBrl(amount);
    if (!title.trim() || !isFinite(numericAmount)) return;

    setSaving(true);
    setError(null);

    try {
      const payload: LeisureExpenseCreate = {
        title: title.trim(),
        category,
        amount: numericAmount,
        description: description.trim() || null,
        paid,
        add_to_planning: addToPlanning,
      };

      await leisureExpenseApi.create(leisureId, payload);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar despesa",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setCategory(CATEGORIES[0]);
    setAmount("");
    setDescription("");
    setPaid(false);
    setAddToPlanning(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
        <div
          className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 lg:mx-4 lg:w-full lg:max-w-lg lg:rounded-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Nova despesa
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto overscroll-contain px-5 py-4"
            noValidate
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Nome
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="Ex: Jantar no restaurante"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0,00"
                  autoComplete="off"
                  className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                    amountError
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700 dark:focus:border-rose-400 dark:focus:ring-rose-400"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  }`}
                />
                {amountError && (
                  <p className="mt-1.5 text-xs text-rose-500">
                    Use números e vírgula para centavos (ex: 1500,50)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descrição opcional..."
                  autoComplete="off"
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="paid"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-indigo-400/20"
                />
                <label
                  htmlFor="paid"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  Pago
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="addToPlanning"
                  checked={addToPlanning}
                  onChange={(e) => setAddToPlanning(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-indigo-400/20"
                />
                <label
                  htmlFor="addToPlanning"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  Adicionar ao planejamento financeiro
                </label>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-500">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || amountError || !amount}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? "Salvando..." : "Criar despesa"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
