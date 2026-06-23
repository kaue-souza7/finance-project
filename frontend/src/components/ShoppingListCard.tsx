import { motion } from "framer-motion";
import { Pencil, Shield, Trash2, Users } from "lucide-react";
import { Card } from "./Card";
import { getCategoryIcon } from "@/utils/categoryIcons";
import type { ShoppingListResponse } from "@/types/finance";

interface ShoppingListCardProps {
  list: ShoppingListResponse;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  shared?: boolean;
}

export function ShoppingListCard({
  list,
  onClick,
  onEdit,
  onDelete,
  shared = false,
}: ShoppingListCardProps) {
  const percentage =
    list.item_count > 0
      ? Math.round((list.checked_count / list.item_count) * 100)
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={onClick}
        className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: list.color }}
          >
            {getCategoryIcon(list.icon, 20, "#fff")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {list.title}
              </h3>

              {list.completed_at && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  ✓ Concluída
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {list.checked_count} / {list.item_count} itens
            </p>

            {shared && list.shared_by && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Users size={12} />
                <span>
                  Compartilhado por {list.shared_by.name}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  <Shield size={10} />
                  {list.role === "editor" ? "Editor" : "Visualizador"}
                </span>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage === 100
                      ? "bg-emerald-500"
                      : "bg-sky-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {percentage}%
              </span>
            </div>
          </div>

          {!shared && (
            <div
              className="flex shrink-0 gap-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="toolbar"
            >
              <button
                onClick={onEdit}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={onDelete}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
