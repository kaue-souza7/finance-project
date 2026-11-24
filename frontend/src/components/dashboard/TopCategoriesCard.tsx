import { ChevronRight, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { formatBrl } from "@/utils/format";
import type { CategorySummary } from "@/utils/dashboard";

interface TopCategoriesCardProps {
  categories: CategorySummary[];
  totalSpent: number;
  transactionsHref: string;
}

function formatPercentage(value: number): string {
  if (value < 1) return "<1%";
  return `${Math.round(value)}%`;
}

export function TopCategoriesCard({
  categories,
  totalSpent,
  transactionsHref,
}: TopCategoriesCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Gastos por categoria
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Total lançado no mês
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">
          {formatBrl(totalSpent)}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center">
          <PieChart size={22} className="text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nenhum gasto lançado ainda.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {categories.map((category) => (
            <li key={category.key}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true"
                  />
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                    {category.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {formatBrl(category.total)}
                  </p>
                  <span className="w-8 text-right text-[10px] text-slate-400 dark:text-slate-500">
                    {formatPercentage(category.percentage)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 ml-3.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, category.percentage)}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        to={transactionsHref}
        className="mt-auto flex min-h-[44px] items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:border-slate-700/60 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Ver transações
        <ChevronRight size={14} />
      </Link>
    </Card>
  );
}
