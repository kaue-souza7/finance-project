import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import type { ShoppingListItemResponse } from "@/types/finance";

interface ShoppingListItemProps {
  item: ShoppingListItemResponse;
  onToggle: (item: ShoppingListItemResponse, checked: boolean) => void;
  onEdit: (item: ShoppingListItemResponse) => void;
  onDelete: (item: ShoppingListItemResponse) => void;
  canEdit?: boolean;
}

export function ShoppingListItem({
  item,
  onToggle,
  onEdit,
  onDelete,
  canEdit = true,
}: ShoppingListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-4">
        {canEdit ? (
          <button
            onClick={() => onToggle(item, !item.checked)}
            className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-colors ${
              item.checked
                ? "text-emerald-500"
                : "text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500"
            }`}
            aria-label={
              item.checked ? "Desmarcar item" : "Marcar como comprado"
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {item.checked ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <CheckCircle2 size={22} />
                </motion.div>
              ) : (
                <motion.div
                  key="unchecked"
                  initial={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Circle size={22} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ) : (
          <div className="flex min-h-[36px] min-w-[36px] items-center justify-center">
            {item.checked
              ? <CheckCircle2 size={22} className="text-emerald-500" />
              : <Circle size={22} className="text-slate-300 dark:text-slate-600" />
            }
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium transition-colors ${
              item.checked
                ? "text-slate-400 line-through dark:text-slate-500"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {item.name}
          </p>
          {item.quantity && (
            <p
              className={`text-xs transition-colors ${
                item.checked
                  ? "text-slate-300 dark:text-slate-600"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {item.quantity}
            </p>
          )}
        </div>

        {canEdit && (
          <div
            className="flex shrink-0 gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="toolbar"
          >
            <button
              onClick={() => onEdit(item)}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Excluir"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
