import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/Card";
import { formatCentsBRL } from "@/utils/format";

interface FinancialSummaryCardsProps {
  totalCents: number;
  allocatedCents: number;
  remainingCents: number;
  isOverBudget: boolean;
  progressPercent: number;
}

export function FinancialSummaryCards({
  totalCents,
  allocatedCents,
  remainingCents,
  isOverBudget,
  progressPercent,
}: FinancialSummaryCardsProps) {
  const isZero = remainingCents === 0;
  const statusText = isOverBudget
    ? `Ultrapassou o valor disponível em ${formatCentsBRL(
        Math.abs(remainingCents),
      )}`
    : isZero
      ? "Valor totalmente distribuído"
      : "Disponível para distribuir";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <Card
        className={`col-span-2 overflow-hidden p-4 md:col-span-1 ${
          isOverBudget
            ? "border-rose-200 dark:border-rose-900/60"
            : "border-emerald-200 dark:border-emerald-900/60"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sobra
            </p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight ${
                isOverBudget
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
              aria-live="polite"
            >
              {formatCentsBRL(remainingCents)}
            </p>
          </div>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isOverBudget
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            }`}
          >
            {isOverBudget ? (
              <AlertTriangle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
          </span>
        </div>

        <p
          className={`mt-2 text-xs font-medium ${
            isOverBudget
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {statusText}
        </p>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          role="progressbar"
          aria-label="Percentual da receita distribuída"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverBudget ? "bg-rose-500" : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Soma de valores
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {formatCentsBRL(allocatedCents)}
            </p>
          </div>
          <TrendingUp
            size={18}
            className="shrink-0 text-sky-500"
            aria-hidden="true"
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receita adicional
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              {formatCentsBRL(totalCents)}
            </p>
          </div>
          <Wallet
            size={18}
            className="shrink-0 text-violet-500"
            aria-hidden="true"
          />
        </div>
      </Card>
    </div>
  );
}
