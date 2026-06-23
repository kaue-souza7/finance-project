import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { Card } from "./Card";
import { useConfetti } from "@/hooks/useConfetti";
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
  const shouldReduceMotion = useReducedMotion();
  const [showGlow, setShowGlow] = useState(false);
  const prevPaidRef = useRef(expense.paid);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const { fire: fireConfetti } = useConfetti({ buttonRef: toggleButtonRef });

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  // detecta transição unpaid → paid para disparar o glow
  useEffect(() => {
    if (expense.paid && !prevPaidRef.current) {
      const t1 = setTimeout(() => setShowGlow(true), 500);
      const t2 = setTimeout(() => setShowGlow(false), 2200);
      timersRef.current = [t1, t2];
    }
    prevPaidRef.current = expense.paid;
  }, [expense.paid]);

  const handleTogglePaid = useCallback(() => {
    if (!expense.paid) {
      clearTimers();
      setShowGlow(false);
      fireConfetti();
    }
    onTogglePaid(expense.id, !expense.paid);
  }, [expense.id, expense.paid, onTogglePaid, clearTimers, fireConfetti]);

  const handleEdit = useCallback(() => onEdit(expense), [expense, onEdit]);
  const handleDelete = useCallback(
    () => onDelete(expense.id),
    [expense.id, onDelete],
  );

  const pressAnimation = !shouldReduceMotion && !expense.paid
    ? { scale: 0.98, rotateX: 3 }
    : undefined;

  return (
    <motion.div layout transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}>
      <motion.div
        animate={
          showGlow
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(16,185,129,0)",
                  "0 0 0 6px rgba(16,185,129,0.15)",
                  "0 0 0 12px rgba(16,185,129,0.05)",
                  "0 0 0 0 rgba(16,185,129,0)",
                ],
              }
            : { boxShadow: "0 0 0 0 rgba(16,185,129,0)" }
        }
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ borderRadius: "12px" }}
      >
        <Card>
          <motion.div
            className="flex items-start gap-2 sm:gap-3"
            whileTap={pressAnimation}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
          >
            <button
              ref={toggleButtonRef}
              onClick={handleTogglePaid}
              className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg ${
                expense.paid
                  ? "text-emerald-500"
                  : "text-slate-300 dark:text-slate-600"
              }`}
              aria-label={
                expense.paid ? "Marcar como não pago" : "Marcar como pago"
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {expense.paid ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.4, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.35,
                      ease: "easeOut",
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="circle"
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                  >
                    <Circle size={22} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm font-semibold truncate ${
                        expense.paid
                          ? "text-slate-400 line-through dark:text-slate-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {expense.description}
                    </p>
                    <AnimatePresence>
                      {expense.paid && (
                        <motion.span
                          key="paid-badge"
                          initial={{ opacity: 0, x: -8, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -8, scale: 0.8 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: shouldReduceMotion ? 0 : 0.15,
                          }}
                          className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        >
                          ✓ Pago
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {expense.category_color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: expense.category_color }}
                      />
                    )}
                    {expense.category_icon &&
                      getCategoryIcon(expense.category_icon, 12)}
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

            <div
              className="flex shrink-0 gap-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleEdit}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
