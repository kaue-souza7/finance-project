import {
  NotebookPen,
  Pencil,
  Share2,
  Trash2,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/Card";
import {
  decimalStringToCents,
  formatCentsBRL,
} from "@/utils/format";
import {
  organizationTypeLabel,
} from "@/utils/additionalOrganization";
import type { AdditionalOrganizationSummary } from "@/types/additionalOrganization";

interface OrganizationCardProps {
  organization: AdditionalOrganizationSummary;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  shared?: boolean;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function OrganizationCard({
  organization,
  onOpen,
  onEdit,
  onDelete,
  shared = false,
}: OrganizationCardProps) {
  const isIncome = organization.type === "additional_income";
  const Icon = isIncome ? Wallet : NotebookPen;
  const remainingCents =
    organization.remaining_amount !== null
      ? decimalStringToCents(organization.remaining_amount)
      : null;
  const isOverBudget = remainingCents !== null && remainingCents < 0;

  return (
    <Card
      className={`flex h-full flex-col !p-0 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        shared
          ? "ring-1 ring-sky-200/70 dark:ring-sky-900/60"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex-1 p-4 text-left"
        aria-label={`Abrir ${organization.title}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
            }`}
          >
            <Icon size={21} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 dark:text-white">
                {organization.title}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isIncome
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
                }`}
              >
                {organizationTypeLabel(organization.type)}
              </span>
            </span>

            {isIncome ? (
              <span className="mt-2 block">
                <span className="block text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatCentsBRL(
                    decimalStringToCents(
                      organization.total_amount ?? "0.00",
                    ),
                  )}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    isOverBudget
                      ? "font-medium text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isOverBudget
                    ? `Ultrapassou em ${formatCentsBRL(
                        Math.abs(remainingCents ?? 0),
                      )}`
                    : `Sobra ${formatCentsBRL(remainingCents ?? 0)}`}
                </span>
              </span>
            ) : (
              <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {organization.content_preview ||
                  "Sem anotações ainda. Toque para começar."}
              </span>
            )}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 dark:border-slate-700/70">
        <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
          {shared ? (
            <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400">
              <Share2 size={12} />
              Compartilhada por {organization.owner.name}
            </span>
          ) : (
            <>
              {isIncome
                ? `${organization.item_count} ${
                    organization.item_count === 1 ? "linha" : "linhas"
                  } · `
                : ""}
              {formatUpdatedAt(organization.updated_at)}
            </>
          )}
        </span>

        {!shared && onEdit && onDelete && (
          <div className="flex items-center gap-1">
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
    </Card>
  );
}
