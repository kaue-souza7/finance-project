import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Tags,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { categoryApi } from "@/services/category";
import { planningApi } from "@/services/planning";
import type { CategoryResponse, PlanningCreate } from "@/types/finance";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

function currentMonth() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const now = currentMonth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [investment, setInvestment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    categoryApi
      .list()
      .then(async (items) => {
        if (!active) return;
        if (items.length > 0) {
          setCategories(items);
          return;
        }
        const seeded = await categoryApi.seedDefaults();
        if (active) setCategories(seeded);
      })
      .catch(() => {
        // Categorias são um extra do onboarding; não bloqueiam o fluxo.
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreatePlanning = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const data: PlanningCreate = {
      month,
      year,
      expected_revenue: revenue ? Number(revenue) : 0,
      expected_expenses: expenses ? Number(expenses) : 0,
      planned_investment: investment ? Number(investment) : 0,
    };

    try {
      await planningApi.create(data);
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar planejamento";
      if (message.toLowerCase().includes("already exists")) {
        toast("Você já tem um planejamento para este mês.", "success");
        setStep(3);
        return;
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const goToTransactions = () => {
    navigate(`/transactions?month=${month}&year=${year}`);
  };

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <Sparkles size={22} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Primeiros passos
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Vamos montar seu primeiro mês
          </h1>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              item <= step ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Seu espaço está pronto. Em poucos passos você define quanto espera
            ganhar, gastar e investir neste mês.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
              <Wallet size={20} className="mt-0.5 shrink-0 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Planejamento mensal
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Defina receita, despesas e investimento previstos.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40">
              <Tags size={20} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Categorias prontas
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {categories.length > 0
                    ? categories.slice(0, 5).map((c) => c.name).join(" · ")
                    : "Moradia, alimentação, transporte e mais."}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500"
          >
            Começar
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-3 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Pular por agora
          </button>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={handleCreatePlanning}
          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50"
          noValidate
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Planejamento de {MONTHS[month - 1]} de {year}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Você pode ajustar esses valores depois, a qualquer momento.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="onboarding-month" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Mês
              </label>
              <select
                id="onboarding-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="onboarding-year" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ano
              </label>
              <input
                id="onboarding-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="onboarding-revenue" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Receita prevista (R$)
              </label>
              <input
                id="onboarding-revenue"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="onboarding-expenses" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Despesas previstas (R$)
              </label>
              <input
                id="onboarding-expenses"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="onboarding-investment" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Investimento planejado (R$)
              </label>
              <input
                id="onboarding-investment"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                placeholder="0,00"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {saving ? "Criando..." : "Criar planejamento"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
            Tudo pronto!
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Seu planejamento de {MONTHS[month - 1]} foi criado. Agora você pode
            lançar sua primeira despesa ou voltar para o Dashboard.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={goToTransactions}
              className="min-h-[48px] rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white"
            >
              Adicionar primeira despesa
            </button>
            <button
              onClick={() => navigate("/")}
              className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Ir para o Dashboard
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
