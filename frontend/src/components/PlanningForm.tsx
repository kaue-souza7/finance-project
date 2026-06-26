import { type FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "./Card";
import type { PlanningCreate, PlanningUpdate } from "@/types/finance";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getToday() {
  const d = new Date();
  return { month: d.getMonth(), year: d.getFullYear() };
}

interface PlanningFormProps {
  onSubmit: (data: PlanningCreate | PlanningUpdate) => Promise<void>;
  initial?: PlanningCreate;
  loading?: boolean;
}

export function PlanningForm({ onSubmit, initial, loading }: PlanningFormProps) {
  const today = getToday();
  const [month, setMonth] = useState(initial?.month ?? today.month + 1);
  const [year, setYear] = useState(initial?.year ?? today.year);
  const [revenue, setRevenue] = useState(
    initial ? String(initial.expected_revenue) : "",
  );
  const [expenses, setExpenses] = useState(
    initial ? String(initial.expected_expenses) : "",
  );
  const [investment, setInvestment] = useState(
    initial ? String(initial.planned_investment) : "",
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      month: initial ? initial.month : month,
      year: initial ? initial.year : year,
      expected_revenue: revenue ? Number(revenue) : 0,
      expected_expenses: expenses ? Number(expenses) : 0,
      planned_investment: investment ? Number(investment) : 0,
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!initial && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Mês
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              >
                {MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ano
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Receita prevista (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="0,00"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Despesas previstas (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            placeholder="0,00"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Investimento planejado (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={investment}
            onChange={(e) => setInvestment(e.target.value)}
            placeholder="0,00"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {initial ? "Atualizar" : "Criar planejamento"}
        </button>
      </form>
    </Card>
  );
}
