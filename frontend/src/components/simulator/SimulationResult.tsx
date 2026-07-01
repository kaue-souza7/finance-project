import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, PiggyBank, Percent, BarChart3 } from "lucide-react";
import type { SimulationResult } from "@/types/simulator";
import { formatBrl } from "@/utils/format";

interface SimulationResultProps {
  result: SimulationResult;
}

const MONTHS_OF_YEAR = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ResultCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-brand-sm transition-colors sm:p-5 ${
        highlight
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-700 dark:from-indigo-950/30 dark:to-slate-800/50"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2.5 ${
            highlight
              ? "bg-indigo-100 dark:bg-indigo-900/30"
              : "bg-slate-100 dark:bg-slate-700/50"
          }`}
        >
          <Icon
            size={18}
            className={
              highlight
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400"
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p
            className={`truncate text-base font-bold ${
              highlight
                ? "text-indigo-700 dark:text-indigo-300"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SimulationResult({ result }: SimulationResultProps) {
  const [chartView, setChartView] = useState<"area" | "line">("area");

  const chartData = useMemo(
    () =>
      result.months
        .filter((m) => m.month % 6 === 0 || m.month === result.months.length)
        .map((m) => ({
          label: m.month === 1 ? "Mês 1" : `Mês ${m.month}`,
          balance: Math.round(m.balance),
          invested: Math.round(m.totalInvested),
        })),
    [result],
  );

  const tooltipContent = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatBrl(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const totalYieldPercent =
    result.totalInvested > 0
      ? ((result.totalYield / result.totalInvested) * 100).toFixed(2)
      : "0,00";

  const totalReturnPercent =
    result.totalInvested > 0
      ? (((result.finalBalance - result.totalInvested) / result.totalInvested) * 100).toFixed(2)
      : "0,00";

  const monthlyData = useMemo(() => {
    const decs = result.months.filter((m) => m.month % 12 === 0);
    const last5 = decs.slice(-5);
    const last = result.months[result.months.length - 1];
    if (last.month % 12 !== 0) {
      last5.push(last);
    }
    return last5;
  }, [result]);

  return (
    <div className="animate-fade-in space-y-5">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Resultado da Simulação
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <ResultCard
          icon={DollarSign}
          label="Patrimônio Acumulado"
          value={formatBrl(result.finalBalance)}
          highlight
        />
        <ResultCard
          icon={PiggyBank}
          label="Total Investido"
          value={formatBrl(result.totalInvested)}
        />
        <ResultCard
          icon={TrendingUp}
          label="Total de Rendimentos"
          value={formatBrl(result.totalYield)}
        />
        <ResultCard
          icon={Percent}
          label="Rentabilidade Total"
          value={`${totalReturnPercent.replace(".", ",")}%`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ResultCard
          icon={BarChart3}
          label="Taxa de Administração"
          value={formatBrl(result.totalFees)}
        />
        <ResultCard
          icon={BarChart3}
          label="Impostos"
          value={formatBrl(result.totalTaxes)}
        />
        <ResultCard
          icon={Percent}
          label="Rendimento sobre Investido"
          value={`${totalYieldPercent.replace(".", ",")}%`}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Evolução do Patrimônio
          </h3>
          <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setChartView("area")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                chartView === "area"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Área
            </button>
            <button
              type="button"
              onClick={() => setChartView("line")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                chartView === "line"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Linha
            </button>
          </div>
        </div>

        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "area" ? (
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}k`
                        : String(v)
                  }
                />
                <Tooltip content={tooltipContent} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Patrimônio"
                  stroke="#6366f1"
                  fill="url(#colorBalance)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Investido"
                  stroke="#94a3b8"
                  fill="url(#colorInvested)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}k`
                        : String(v)
                  }
                />
                <Tooltip content={tooltipContent} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Patrimônio"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Investido"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Mês
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Ano
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Saldo
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Investido
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Rendimento
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr
                  key={m.month}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/20"
                >
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">
                    {m.month}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                    {MONTHS_OF_YEAR[((m.month - 1) % 12)]}/{m.year}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-indigo-600 dark:text-indigo-400">
                    {formatBrl(m.balance)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    {formatBrl(m.totalInvested)}
                  </td>
                  <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">
                    {formatBrl(m.netYield)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
