import { CalendarCheck, ChevronRight, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickActionsProps {
  planningSubtitle: string;
  transactionsSubtitle: string;
  transactionsHref: string;
}

export function QuickActions({
  planningSubtitle,
  transactionsSubtitle,
  transactionsHref,
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/plannings"
        className="group flex min-h-[92px] min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-brand-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
            <CalendarCheck size={17} />
          </span>
          <ChevronRight
            size={15}
            className="text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
          />
        </div>
        <div className="mt-2 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            Planejamentos
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {planningSubtitle}
          </p>
        </div>
      </Link>

      <Link
        to={transactionsHref}
        className="group flex min-h-[92px] min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-brand-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
            <Wallet size={17} />
          </span>
          <ChevronRight
            size={15}
            className="text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600"
          />
        </div>
        <div className="mt-2 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            Transações
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {transactionsSubtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}
