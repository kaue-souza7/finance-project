import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Copy,
  PiggyBank,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MonthSelector } from "@/components/MonthSelector";
import { SkeletonCard } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { expenseApi } from "@/services/expense";
import { planningApi } from "@/services/planning";
import type { PlanningResponse } from "@/types/finance";

function today() {
  const d = new Date();
  return { month: d.getMonth(), year: d.getFullYear() };
}

let brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function useMonthlyData(month: number, year: number) {
  const [plan, setPlan] = useState<PlanningResponse | null>(null);
  const [actualExpenses, setActualExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await planningApi.getByMonth(month + 1, year);
      setPlan(p);
      if (p) {
        const exps = await expenseApi.list(p.id);
        setActualExpenses(exps.reduce((a, e) => a + Number(e.amount), 0));
      } else {
        setActualExpenses(0);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  return { plan, actualExpenses, loading, error, reload: load };
}

export function Dashboard() {
  const [{ month, year }, setDate] = useState(today);
  const { plan, actualExpenses, loading, error, reload } = useMonthlyData(month, year);
  const [copying, setCopying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const hasPlanning = plan !== null;

  const revenue = plan ? Number(plan.expected_revenue) : 0;
  const expenses = plan ? Number(plan.expected_expenses) : 0;
  const investment = plan ? Number(plan.planned_investment) : 0;
  const balance = plan ? Number(plan.remaining_balance) : 0;
  const expensePct = expenses > 0 ? Math.min(100, (actualExpenses / expenses) * 100) : 0;

  const handlePrev = useCallback(() => {
    setDate(({ month: m, year: y }) =>
      m === 0 ? { month: 11, year: y - 1 } : { month: m - 1, year: y },
    );
  }, []);

  const handleNext = useCallback(() => {
    setDate(({ month: m, year: y }) =>
      m === 11 ? { month: 0, year: y + 1 } : { month: m + 1, year: y },
    );
  }, []);

  const handleCopy = async () => {
    setCopying(true);
    try {
      await planningApi.copyFromPrevious(month + 1, year);
      setShowConfirm(false);
      reload();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao copiar",
        variant: "error",
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe seu planejamento financeiro mensal.
        </p>
      </div>

      {/* MONTH SELECTOR */}
      <MonthSelector
        month={month}
        year={year}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="mt-4">
          <Card>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle size={28} className="text-rose-500" />
              <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              <button
                onClick={reload}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div
        className={`mt-4 transition-opacity duration-200 ${loading && !plan ? "opacity-40" : "opacity-100"}`}
      >
        {loading && !plan ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : hasPlanning ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Receita</CardTitle>
                    <CardValue className="mt-1 text-emerald-600 dark:text-emerald-400">
                      {brl(revenue)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <ArrowUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Despesas</CardTitle>
                    <CardValue className="mt-1 text-rose-600 dark:text-rose-400">
                      {brl(expenses)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/30">
                    <ArrowDown size={18} className="text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Investimento</CardTitle>
                    <CardValue className="mt-1 text-sky-600 dark:text-sky-400">
                      {brl(investment)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                    <PiggyBank size={18} className="text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Saldo restante</CardTitle>
                    <CardValue
                      className={`mt-1 ${
                        balance >= 0
                          ? "text-slate-900 dark:text-white"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {brl(balance)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                    <Wallet size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* EXPENSE PROGRESS BAR */}
            <Card className="mt-4">
              <div className="flex items-center justify-between">
                <CardTitle>Despesas realizadas</CardTitle>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {brl(actualExpenses)} / {brl(expenses)}
                </span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-2.5 rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${expensePct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{Math.round(expensePct)}% utilizado</span>
                <span>
                  {brl(Math.max(0, expenses - actualExpenses))} disponível
                </span>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      {/* EMPTY STATE — no planning for this month */}
      {!loading && !hasPlanning && !error && (
        <div className="mt-6">
          <Card>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Wallet size={36} className="text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Nenhum planejamento para este mês
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Crie um planejamento ou copie os valores do mês anterior para começar.
                </p>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={copying}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Copy size={16} />
                Copiar mês anterior
              </button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Copiar mês anterior"
        message="Os valores do mês anterior serão copiados para este mês. Você poderá editá-los depois."
        loading={copying}
        onConfirm={handleCopy}
        onCancel={() => setShowConfirm(false)}
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
