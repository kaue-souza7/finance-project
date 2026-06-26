import { type FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "./Card";
import { CategoryPicker } from "./CategoryPicker";
import type { ExpenseCreate, ExpenseUpdate } from "@/types/finance";

interface ExpenseFormProps {
  planningId: string;
  onSubmit: (data: ExpenseCreate | ExpenseUpdate) => Promise<void>;
  initial?: ExpenseCreate;
  loading?: boolean;
}

export function ExpenseForm({
  planningId,
  onSubmit,
  initial,
  loading,
}: ExpenseFormProps) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.category_id ?? null,
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [recurrence, setRecurrence] = useState<
    "once" | "monthly" | "yearly"
  >(initial?.recurrence ?? "once");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [paid, setPaid] = useState(initial?.paid ?? false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      planning_id: planningId,
      category_id: categoryId,
      category,
      description,
      amount: amount ? Number(amount) : 0,
      recurrence,
      due_date: dueDate,
      paid,
    });
  };

  const handleCategorySelect = (name: string, id?: string | null) => {
    setCategory(name);
    setCategoryId(id ?? null);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <CategoryPicker
          value={category}
          categoryId={categoryId}
          onSelect={handleCategorySelect}
        />

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Descrição
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={255}
            placeholder="Ex: Aluguel"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0,00"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Recorrência
          </label>
          <select
            value={recurrence}
            onChange={(e) =>
              setRecurrence(e.target.value as "once" | "monthly" | "yearly")
            }
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          >
            <option value="once">Única</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Data de vencimento
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-500 dark:bg-slate-700"
          />
          Já pago
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {initial ? "Atualizar despesa" : "Adicionar despesa"}
        </button>
      </form>
    </Card>
  );
}
