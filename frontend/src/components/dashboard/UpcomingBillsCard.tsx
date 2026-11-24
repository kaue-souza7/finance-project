import { Check, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { formatBrl } from "@/utils/format";
import { formatDueLabel, getDueStatus } from "@/utils/dashboard";
import type { ExpenseResponse } from "@/types/finance";

interface UpcomingBillsCardProps {
  bills: ExpenseResponse[];
  totalUnpaidCount: number;
  totalUnpaidAmount: number;
  today: Date;
  onMarkPaid: (id: string) => void;
  transactionsHref: string;
}

const dueDotStyles = {
  overdue: "bg-rose-500",
  today: "bg-amber-500",
  soon: "bg-sky-500",
  upcoming: "bg-slate-300 dark:bg-slate-600",
} as const;

const dueTextStyles = {
  overdue: "text-rose-600 dark:text-rose-400",
  today: "text-amber-600 dark:text-amber-400",
  soon: "text-slate-500 dark:text-slate-400",
  upcoming: "text-slate-500 dark:text-slate-400",
} as const;

export function UpcomingBillsCard({
  bills,
  totalUnpaidCount,
  totalUnpaidAmount,
  today,
  onMarkPaid,
  transactionsHref,
}: UpcomingBillsCardProps) {
  const countLabel =
    totalUnpaidCount === 1
      ? "1 conta em aberto"
      : `${totalUnpaidCount} contas em aberto`;

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            A pagar
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {totalUnpaidCount > 0 ? countLabel : "Nenhuma conta em aberto"}
          </p>
        </div>
        {totalUnpaidCount > 0 && (
          <p className="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-400">
            {formatBrl(totalUnpaidAmount)}
          </p>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-1 items-center gap-2 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            {totalUnpaidCount === 0
              ? "Tudo pago neste mês."
              : "Nenhuma conta pendente."}
          </span>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700/60">
          {bills.map((bill) => {
            const dueStatus = getDueStatus(bill.due_date, today);

            return (
              <li
                key={bill.id}
                className="flex items-center gap-2 py-2.5 first:pt-1 last:pb-1"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${dueDotStyles[dueStatus]}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {bill.description}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[11px] ${dueTextStyles[dueStatus]}`}
                  >
                    {formatDueLabel(bill.due_date, today)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                  {formatBrl(Number(bill.amount))}
                </p>
                <button
                  type="button"
                  onClick={() => onMarkPaid(bill.id)}
                  aria-label={`Marcar ${bill.description} como paga`}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                >
                  <Check size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalUnpaidCount > 0 && (
        <Link
          to={transactionsHref}
          className="mt-auto flex min-h-[44px] items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:border-slate-700/60 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Ver transações
          <ChevronRight size={14} />
        </Link>
      )}
    </Card>
  );
}
