import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthSelector({ month, year, onPrev, onNext }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800/50 sm:px-4 sm:py-3">
      <button
        onClick={onPrev}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={22} />
      </button>

      <span className="select-none text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
        {MONTHS[month]} {year}
      </span>

      <button
        onClick={onNext}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        aria-label="Próximo mês"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
