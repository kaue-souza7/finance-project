import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Receipt, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { BudgetOverviewCard } from "@/components/dashboard/BudgetOverviewCard";
import { EmptyPlanningCard } from "@/components/dashboard/EmptyPlanningCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TopCategoriesCard } from "@/components/dashboard/TopCategoriesCard";
import { UpcomingBillsCard } from "@/components/dashboard/UpcomingBillsCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { expenseApi } from "@/services/expense";
import { planningApi } from "@/services/planning";
import {
  getBudgetSummary,
  getTopCategories,
  getUpcomingBills,
} from "@/utils/dashboard";
import { getCurrentMonth, MONTHS } from "@/utils/date";
import type { ExpenseResponse, PlanningResponse } from "@/types/finance";

function useDashboardData(month: number, year: number) {
  const [plan, setPlan] = useState<PlanningResponse | null>(null);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentPlan = await planningApi.getByMonth(month, year);
      const currentExpenses = currentPlan
        ? await expenseApi.list(currentPlan.id)
        : [];

      setPlan(currentPlan);
      setExpenses(currentExpenses);
    } catch {
      setError("Não foi possível carregar seu resumo.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { plan, expenses, setExpenses, loading, error, reload: load };
}

function DashboardSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Carregando resumo financeiro"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-2 h-3 w-52 max-w-full" />
        <Skeleton className="mt-3 h-2.5 w-full" />
        <div className="mt-3 flex items-center justify-between gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[92px]" />
        <Skeleton className="h-[92px]" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <Skeleton className="h-3 w-24" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

function FirstExpenseCard({ href }: { href: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Receipt size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Planejamento pronto
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Lance as despesas do mês para acompanhar o teto diário e as contas a
            pagar.
          </p>
          <Link
            to={href}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-xs font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            Lançar primeira despesa
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { month, year } = getCurrentMonth();
  const monthName = MONTHS[month - 1];
  const monthLabel = `${monthName} de ${year}`;
  const transactionsHref = `/transactions?month=${month}&year=${year}`;

  const { user } = useAuth();
  const { toast: showToast } = useToast();
  const { plan, expenses, setExpenses, loading, error, reload } =
    useDashboardData(month, year);

  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [copying, setCopying] = useState(false);

  const today = new Date();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const budget = getBudgetSummary(
    plan ? Number(plan.expected_expenses) : 0,
    expenses,
    today,
  );
  const bills = getUpcomingBills(expenses);
  const categories = getTopCategories(expenses);
  const unpaidCount = expenses.filter((expense) => !expense.paid).length;
  const hasExpenses = expenses.length > 0;

  const planningSubtitle = plan
    ? `${monthName} planejado`
    : "Criar planejamento";
  const transactionsSubtitle = hasExpenses
    ? `${expenses.length} ${expenses.length === 1 ? "lançamento" : "lançamentos"}`
    : "Nenhum lançamento";

  const handleMarkPaid = async (id: string) => {
    const target = expenses.find((expense) => expense.id === id);
    if (!target || target.paid) return;

    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id ? { ...expense, paid: true } : expense,
      ),
    );

    try {
      await expenseApi.update(id, { paid: true });
      showToast("Conta marcada como paga.", "success");
    } catch {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === id ? { ...expense, paid: false } : expense,
        ),
      );
      showToast("Erro ao marcar a conta como paga.", "error");
    }
  };

  const handleCopyPrevious = async () => {
    setCopying(true);

    try {
      await planningApi.copyFromPrevious(month, year);
      setShowCopyConfirm(false);
      showToast("Planejamento copiado com sucesso.", "success");
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const friendly = message.includes("No planning found")
        ? "Nenhum planejamento encontrado no mês anterior."
        : message || "Erro ao copiar planejamento";
      showToast(friendly, "error");
    } finally {
      setCopying(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {firstName ? `Olá, ${firstName}` : "Olá"}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {monthLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          aria-label="Atualizar dashboard"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !plan && <DashboardSkeleton />}

      {!loading && error && !plan && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <button
              type="button"
              onClick={reload}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </Card>
      )}

      {!loading && !error && !plan && (
        <div className="space-y-3">
          <EmptyPlanningCard
            monthLabel={monthName}
            onCopyPrevious={() => setShowCopyConfirm(true)}
          />
          <QuickActions
            planningSubtitle={planningSubtitle}
            transactionsSubtitle={transactionsSubtitle}
            transactionsHref={transactionsHref}
          />
        </div>
      )}

      {plan && (
        <div className="space-y-3">
          {error && !loading && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <span className="flex min-w-0 items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span className="truncate">
                  Não foi possível atualizar seu resumo.
                </span>
              </span>
              <button
                type="button"
                onClick={reload}
                className="shrink-0 font-semibold underline-offset-2 hover:underline"
              >
                Tentar
              </button>
            </div>
          )}

          <BudgetOverviewCard
            summary={budget}
            remainingBalance={Number(plan.remaining_balance)}
            monthLabel={monthName}
            transactionsHref={transactionsHref}
          />

          <QuickActions
            planningSubtitle={planningSubtitle}
            transactionsSubtitle={transactionsSubtitle}
            transactionsHref={transactionsHref}
          />

          {hasExpenses ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <UpcomingBillsCard
                bills={bills}
                totalUnpaidCount={unpaidCount}
                totalUnpaidAmount={budget.unpaidTotal}
                today={today}
                onMarkPaid={handleMarkPaid}
                transactionsHref={transactionsHref}
              />
              <TopCategoriesCard
                categories={categories}
                totalSpent={budget.totalSpent}
                transactionsHref={transactionsHref}
              />
            </div>
          ) : (
            <FirstExpenseCard href={transactionsHref} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={showCopyConfirm}
        title="Copiar mês anterior"
        message={`Os valores do mês anterior serão copiados para ${monthLabel}. Você poderá editá-los depois.`}
        loading={copying}
        onConfirm={handleCopyPrevious}
        onCancel={() => setShowCopyConfirm(false)}
      />
    </section>
  );
}
