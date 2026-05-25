import {
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "./Card";
import type { ExpenseResponse } from "@/types/finance";
import { getCategoryIcon } from "@/utils/categoryIcons";

const recurrenceLabel: Record<string, string> = {
  once: "Única",
  monthly: "Mensal",
  yearly: "Anual",
};

function formatBRL(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

interface ExpenseCardProps {
  expense: ExpenseResponse;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (id: string, paid: boolean) => void;
}

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onTogglePaid,
}: ExpenseCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          onClick={() => onTogglePaid(expense.id, !expense.paid)}
          className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg ${
            expense.paid
              ? "text-emerald-500"
              : "text-slate-300 dark:text-slate-600"
          }`}
          aria-label={expense.paid ? "Marcar como não pago" : "Marcar como pago"}
        >
          {expense.paid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold truncate ${
                  expense.paid
                    ? "text-slate-400 line-through dark:text-slate-500"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {expense.description}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {expense.category_color && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: expense.category_color }}
                  />
                )}
                {expense.category_icon && getCategoryIcon(expense.category_icon, 12)}
                {expense.category}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-bold ${
                expense.paid
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatBRL(expense.amount)}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Vence {formatDate(expense.due_date)}</span>
            <span>{recurrenceLabel[expense.recurrence]}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(expense)}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
