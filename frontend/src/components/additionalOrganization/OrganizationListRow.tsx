import {
  ChevronRight,
  NotebookPen,
  Pencil,
  Share2,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  decimalStringToCents,
  formatCentsBRL,
} from "@/utils/format";
import { organizationTypeLabel } from "@/utils/additionalOrganization";
import type { AdditionalOrganizationSummary } from "@/types/additionalOrganization";

interface OrganizationListRowProps {
  organization: AdditionalOrganizationSummary;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  shared?: boolean;
}

export function OrganizationListRow({
  organization,
  onOpen,
  onEdit,
  onDelete,
  shared = false,
}: OrganizationListRowProps) {
  const isIncome = organization.type === "additional_income";
  const Icon = isIncome ? Wallet : NotebookPen;
  const remainingCents =
    organization.remaining_amount !== null
      ? decimalStringToCents(organization.remaining_amount)
      : null;
  const isOverBudget = remainingCents !== null && remainingCents < 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50 ${
        shared ? "ring-1 ring-sky-200/70 dark:ring-sky-900/60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left"
        aria-label={`Abrir ${organization.title}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isIncome
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          }`}
        >
          <Icon size={19} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
            {organization.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
            {organizationTypeLabel(organization.type)}
            {isIncome
              ? ` · ${formatCentsBRL(
                  decimalStringToCents(
                    organization.total_amount ?? "0.00",
                  ),
                )}`
              : organization.content_preview
                ? ` · ${organization.content_preview}`
                : ""}
          </span>
          {isIncome && isOverBudget && (
            <span className="mt-0.5 block text-xs font-medium text-rose-600 dark:text-rose-400">
              Ultrapassou a receita
            </span>
          )}
          {shared && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-sky-700 dark:text-sky-400">
              <Share2 size={11} />
              Compartilhada por {organization.owner.name}
            </span>
          )}
        </span>

        <ChevronRight
          size={18}
          className="shrink-0 text-slate-400"
          aria-hidden="true"
        />
      </button>

      {!shared && onEdit && onDelete && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label={`Editar ${organization.title}`}
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            aria-label={`Excluir ${organization.title}`}
          >
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
