import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, Plus, Receipt } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ExpenseCard } from "@/components/ExpenseCard";
import { ExpenseForm } from "@/components/ExpenseForm";
import { MonthSelector } from "@/components/MonthSelector";
import { SkeletonCard } from "@/components/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { planningApi } from "@/services/planning";
import { expenseApi } from "@/services/expense";
import { MONTHS, getCurrentMonth, nextMonth, prevMonth } from "@/utils/date";
import type {
  ExpenseCreate,
  ExpenseResponse,
  ExpenseUpdate,
  PlanningResponse,
} from "@/types/finance";

type SortOption = "name-asc" | "name-desc" | "amount-asc" | "amount-desc";

export function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultDate = getCurrentMonth();
  const rawMonth = searchParams.get("month");
  const rawYear = searchParams.get("year");

  let month = defaultDate.month;
  let year = defaultDate.year;

  if (rawMonth) {
    const n = parseInt(rawMonth, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 12) month = n;
  }

  if (rawYear) {
    const n = parseInt(rawYear, 10);
    if (Number.isFinite(n) && n >= 2020 && n <= 2100) year = n;
  }

  const [plan, setPlan] = useState<PlanningResponse | null>(null);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseResponse | null>(null);
  const { toast: showToast } = useToast();
  const [copying, setCopying] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await planningApi.getByMonth(month, year);
      setPlan(p);
      if (p) {
        const exps = await expenseApi.list(p.id);
        setExpenses(exps);
      } else {
        setExpenses([]);
      }
    } catch {
      showToast("Erro ao carregar despesas", "error");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrevMonth = useCallback(() => {
    const target = prevMonth(month, year);
    const params = new URLSearchParams(window.location.search);
    params.set("month", String(target.month));
    params.set("year", String(target.year));
    setSearchParams(params);
  }, [month, year, setSearchParams]);

  const handleNextMonth = useCallback(() => {
    const target = nextMonth(month, year);
    const params = new URLSearchParams(window.location.search);
    params.set("month", String(target.month));
    params.set("year", String(target.year));
    setSearchParams(params);
  }, [month, year, setSearchParams]);

  const handleCreate = async (data: ExpenseCreate | ExpenseUpdate) => {
    setSaving(true);
    try {
      await expenseApi.create(data as ExpenseCreate);
      showToast("Despesa adicionada", "success");
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao criar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: ExpenseCreate | ExpenseUpdate) => {
    if (!editExpense) return;
    setSaving(true);
    try {
      await expenseApi.update(editExpense.id, data as ExpenseUpdate);
      showToast("Despesa atualizada", "success");
      setEditExpense(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await expenseApi.delete(id);
      showToast("Despesa excluída", "success");
      load();
    } catch {
      showToast("Erro ao excluir", "error");
    }
  };

  const handleTogglePaid = async (id: string, paid: boolean) => {
    // optimistic update — atualiza estado local imediatamente
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, paid } : e)));
    // animação dispara automaticamente via ExpenseCard com Framer Motion
    try {
      await expenseApi.update(id, { paid });
    } catch {
      // rollback em caso de erro no servidor
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, paid: !paid } : e)),
      );
      showToast("Erro ao atualizar status", "error");
    }
  };

  const handleCopyFromPrevious = async () => {
    setCopying(true);
    try {
      await expenseApi.copyFromPrevious(month, year);
      setShowCopyConfirm(false);
      showToast("Despesas copiadas com sucesso", "success");
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      let friendly = "Erro ao copiar";
      if (msg.includes("No planning found")) {
        friendly = "Nenhum planejamento encontrado no mês anterior";
      }
      showToast(friendly, "error");
    } finally {
      setCopying(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (acc, e) => acc + Number(e.amount),
    0,
  );

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.description.localeCompare(b.description, "pt-BR");
        case "name-desc":
          return b.description.localeCompare(a.description, "pt-BR");
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
      }
    });
  }, [expenses, sortBy]);

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Despesas
          </h1>
          {plan && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCopyConfirm(true)}
                disabled={copying}
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Copy size={16} />
                Copiar
              </button>
              <button
                onClick={() => {
                  setEditExpense(null);
                  setShowForm(!showForm);
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
              >
                <Plus size={18} />
                Nova
              </button>
            </div>
          )}
        </div>
        <MonthSelector
          month={month - 1}
          year={year}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />
      </div>

      {(showForm || editExpense) && plan && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {editExpense ? "Editar despesa" : "Nova despesa"}
          </h2>
          <ExpenseForm
            planningId={plan.id}
            onSubmit={editExpense ? handleUpdate : handleCreate}
              initial={
                editExpense
                  ? {
                      planning_id: editExpense.planning_id,
                      category_id: editExpense.category_id,
                      category: editExpense.category,
                      description: editExpense.description,
                      amount: Number(editExpense.amount),
                      recurrence: editExpense.recurrence,
                      due_date: editExpense.due_date,
                      paid: editExpense.paid,
                    }
                  : undefined
              }
            loading={saving}
          />
        </div>
      )}

      {!loading && !plan && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
          <Receipt size={32} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Crie um planejamento para este mês antes de adicionar despesas.
          </p>
        </div>
      )}

      {plan && !loading && expenses.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Total de despesas
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalExpenses)}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-rose-500 transition-all"
              style={{
                width: `${
                  Number(plan.expected_expenses) > 0
                    ? Math.min(
                        100,
                        (totalExpenses / Number(plan.expected_expenses)) * 100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {Math.round(
              Number(plan.expected_expenses) > 0
                ? (totalExpenses / Number(plan.expected_expenses)) * 100
                : 0,
            )}
            % do previsto ({new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(plan.expected_expenses))})
          </p>
        </div>
      )}

      {plan && !loading && expenses.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ordenar por
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSortBy("name-asc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "name-asc"
                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Nome A-Z
            </button>
            <button
              onClick={() => setSortBy("name-desc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "name-desc"
                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Nome Z-A
            </button>
            <button
              onClick={() => setSortBy("amount-asc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "amount-asc"
                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Menor valor
            </button>
            <button
              onClick={() => setSortBy("amount-desc")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "amount-desc"
                  ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              Maior valor
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : expenses.length === 0 && plan
            ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/30">
                  <Receipt size={32} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma despesa registrada.
                  </p>
                </div>
              )
            : sortedExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={setEditExpense}
                  onDelete={handleDelete}
                  onTogglePaid={handleTogglePaid}
                />
              ))}
      </div>

      <ConfirmDialog
        open={showCopyConfirm}
        title="Copiar despesas do mês anterior"
        message={`As despesas de ${month === 1 ? MONTHS[11] : MONTHS[month - 2]} ${month === 1 ? year - 1 : year} serão copiadas para ${MONTHS[month - 1]} ${year}. As despesas pagas serão resetadas.`}
        loading={copying}
        onConfirm={handleCopyFromPrevious}
        onCancel={() => setShowCopyConfirm(false)}
      />


    </section>
  );
}
