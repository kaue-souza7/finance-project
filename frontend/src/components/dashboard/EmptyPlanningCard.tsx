import { Copy, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/Card";

interface EmptyPlanningCardProps {
  monthLabel: string;
  onCopyPrevious: () => void;
}

export function EmptyPlanningCard({
  monthLabel,
  onCopyPrevious,
}: EmptyPlanningCardProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
          <Wallet size={24} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Planejamento de {monthLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            Seu mês ainda não está planejado
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Crie um planejamento para acompanhar o teto diário, as contas a
            pagar e os gastos por categoria.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            to="/onboarding"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            Criar planejamento
          </Link>
          <button
            type="button"
            onClick={onCopyPrevious}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <Copy size={15} />
            Copiar mês anterior
          </button>
        </div>
      </div>
    </Card>
  );
}
