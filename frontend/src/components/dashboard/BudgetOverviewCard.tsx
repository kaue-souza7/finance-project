import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { formatBrl } from "@/utils/format";
import type { BudgetStatus, BudgetSummary } from "@/utils/dashboard";

const statusStyles: Record<Exclude<BudgetStatus, "none">, string> = {
  "on-track":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  over: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const statusLabels: Record<Exclude<BudgetStatus, "none">, string> = {
  "on-track": "No ritmo",
  warning: "Atenção",
  over: "Estourado",
};

interface BudgetOverviewCardProps {
  summary: BudgetSummary;
  remainingBalance: number;
  monthLabel: string;
  transactionsHref: string;
}

export function BudgetOverviewCard({
  summary,
  remainingBalance,
  monthLabel,
  transactionsHref,
}: BudgetOverviewCardProps) {
  const hasBudget = summary.plannedExpenses > 0;
  const status = summary.status === "none" ? null : summary.status;
  const isRemainingNegative = remainingBalance < 0;

  return (
    <Card className="bg-gradient-to-br from-white via-white to-indigo-50/60 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-indigo-950/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resumo de {monthLabel}
          </p>

          <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {isRemainingNegative
              ? "Falta para passar o mês"
              : "Disponível para passar o mês"}
          </p>
          <p
            className={`text-3xl font-bold tracking-tight ${
              isRemainingNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {formatBrl(Math.abs(remainingBalance))}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {hasBudget
              ? `Despesas previstas: ${formatBrl(summary.plannedExpenses)}`
              : "Nenhuma despesa prevista no planejamento."}
          </p>
        </div>

        {status && (
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[status]}`}
          >
            {statusLabels[status]}
          </span>
        )}
      </div>

      {hasBudget ? (
        <>
          <div
            className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            role="progressbar"
            aria-label="Despesas pagas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(summary.paidPct)}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${summary.paidPct}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Pago{" "}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {formatBrl(summary.paidTotal)}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />A pagar{" "}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {formatBrl(summary.unpaidTotal)}
              </strong>
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {Math.round(summary.paidPct)}% das despesas pagas
            </span>
            <Link
              to={transactionsHref}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Transações
              <ChevronRight size={14} />
            </Link>
          </div>
        </>
      ) : (
        <Link
          to="/plannings"
          className="mt-3 inline-flex min-h-[44px] items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Ajustar planejamento
          <ChevronRight size={14} />
        </Link>
      )}
    </Card>
  );
}
