import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SimulatorOptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

export function SimulatorOptionCard({
  icon: Icon,
  title,
  description,
  to,
}: SimulatorOptionCardProps) {
  return (
    <Link
      to={to}
      className="group block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
          <Icon size={22} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400"
        />
      </div>
    </Link>
  );
}
