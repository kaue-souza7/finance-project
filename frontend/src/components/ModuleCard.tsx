import { type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/Card";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  comingSoon?: boolean;
  to?: string;
}

export function ModuleCard({ icon: Icon, title, description, comingSoon, to }: ModuleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!comingSoon && to) navigate(to);
  };

  const isInteractive = !comingSoon && !!to;

  return (
    <Card
      onClick={handleClick}
      className={`relative flex flex-col items-center gap-3 py-6 text-center transition-all ${
        comingSoon
          ? "cursor-not-allowed opacity-85 select-none"
          : isInteractive
            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
            : ""
      }`}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(to);
              }
            }
          : undefined
      }
    >
      {comingSoon && (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Em breve
        </span>
      )}

      <div className="rounded-xl bg-sky-100 p-3 dark:bg-sky-900/30">
        <Icon size={28} className="text-sky-600 dark:text-sky-400" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </Card>
  );
}
