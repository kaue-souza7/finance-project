import { Pencil, Trash2 } from "lucide-react";
import {
  decimalStringToCents,
  formatCentsBRL,
} from "@/utils/format";
import type { AdditionalOrganizationItem } from "@/types/additionalOrganization";

interface AllocationCardProps {
  item: AdditionalOrganizationItem;
  showObservations: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function AllocationCard({
  item,
  showObservations,
  onEdit,
  onDelete,
}: AllocationCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
            {item.name}
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCentsBRL(decimalStringToCents(item.amount))}
          </p>
          {showObservations && item.observation && (
            <p className="mt-1 break-words text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {item.observation}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label={`Editar ${item.name}`}
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            aria-label={`Excluir ${item.name}`}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
