import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SkeletonCard } from "@/components/Skeleton";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { investmentApi } from "@/services/investment";
import type { InvestmentSummary } from "@/types/finance";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export function Investments() {
  const [data, setData] = useState<InvestmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await investmentApi.summary();
      setData(result);
    } catch {
      setError("Erro ao carregar investimentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalInvested = data ? Number(data.total_invested) : 0;
  const avgMonthly = data ? Number(data.average_monthly) : 0;
  const bestMonthValue = data?.best_month ? Number(data.best_month.invested) : 0;
  const hasData = data && data.total_months > 0;

  const chartData = data?.monthly_breakdown.map((m) => ({
    label: m.label,
    invested: Number(m.invested),
  })) ?? [];

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Investimentos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe o total investido acumulado mês a mês.
        </p>
      </div>

      {error && !loading && (
        <div className="mt-4">
          <Card>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle size={28} className="text-rose-500" />
              <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              <button
                onClick={load}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          </Card>
        </div>
      )}

      <div
        className={`mt-4 transition-opacity duration-200 ${loading && !data ? "opacity-40" : "opacity-100"}`}
      >
        {loading && !data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : hasData ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Total Investido</CardTitle>
                    <CardValue className="mt-1 text-emerald-600 dark:text-emerald-400">
                      {brl(totalInvested)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <PiggyBank size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Média Mensal</CardTitle>
                    <CardValue className="mt-1 text-sky-600 dark:text-sky-400">
                      {brl(avgMonthly)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                    <BarChart3 size={18} className="text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Maior Mês</CardTitle>
                    <CardValue className="mt-1 text-violet-600 dark:text-violet-400">
                      {brl(bestMonthValue)}
                    </CardValue>
                    {data?.best_month && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {data.best_month.label}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                    <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Qtd. de Investimentos</CardTitle>
                    <CardValue className="mt-1 text-slate-900 dark:text-white">
                      {data.total_months}
                    </CardValue>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      meses com aporte
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700">
                    <Calendar size={18} className="text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mt-4">
              <div className="mb-4 flex items-center gap-2">
                <Target size={18} className="text-slate-500 dark:text-slate-400" />
                <CardTitle>Evolução Mensal</CardTitle>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-slate-400 dark:text-slate-500"
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "13px",
                      }}
                      formatter={(value) => [brl(Number(value)), "Investido"]}
                    />
                    <Bar
                      dataKey="invested"
                      fill="currentColor"
                      className="fill-sky-500 dark:fill-sky-400"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : null}
      </div>

      {!loading && !hasData && !error && (
        <div className="mt-6">
          <Card>
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <PiggyBank size={36} className="text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Nenhum investimento registrado
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Os investimentos aparecerão aqui conforme você definir metas nos
                  planejamentos mensais.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
