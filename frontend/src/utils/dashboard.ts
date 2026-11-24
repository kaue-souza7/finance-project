import type { ExpenseResponse } from "@/types/finance";

export type BudgetStatus = "none" | "on-track" | "warning" | "over";

export interface BudgetSummary {
  plannedExpenses: number;
  totalSpent: number;
  paidTotal: number;
  unpaidTotal: number;
  available: number;
  usedPct: number;
  paidPct: number;
  unpaidPct: number;
  dailyAllowance: number;
  daysLeft: number;
  status: BudgetStatus;
}

export interface CategorySummary {
  key: string;
  name: string;
  total: number;
  percentage: number;
  color: string;
}

const FALLBACK_CATEGORY_COLORS = ["#6366f1", "#f59e0b", "#06b6d4"];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function diffInDays(dueDate: string, today: Date): number {
  const due = startOfDay(parseDateOnly(dueDate));
  const base = startOfDay(today);
  return Math.round((due.getTime() - base.getTime()) / DAY_IN_MS);
}

export function getBudgetSummary(
  plannedExpenses: number,
  expenses: ExpenseResponse[],
  today: Date = new Date(),
): BudgetSummary {
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  const paidTotal = expenses.reduce(
    (sum, expense) => sum + (expense.paid ? Number(expense.amount) : 0),
    0,
  );
  const unpaidTotal = totalSpent - paidTotal;

  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const elapsedDays = Math.min(Math.max(today.getDate(), 1), daysInMonth);
  const daysLeft = Math.max(1, daysInMonth - elapsedDays + 1);

  const available = plannedExpenses - totalSpent;
  const usedPct =
    plannedExpenses > 0
      ? Math.min(100, (totalSpent / plannedExpenses) * 100)
      : 0;
  const paidPct =
    plannedExpenses > 0
      ? Math.min(100, (paidTotal / plannedExpenses) * 100)
      : 0;
  const unpaidPct =
    plannedExpenses > 0
      ? Math.min(100 - paidPct, (unpaidTotal / plannedExpenses) * 100)
      : 0;

  const dailyAllowance =
    plannedExpenses > 0 && available > 0 ? available / daysLeft : 0;

  const paceExpected = plannedExpenses * (elapsedDays / daysInMonth);
  const warningThreshold = Math.max(paceExpected * 1.2, plannedExpenses * 0.1);

  let status: BudgetStatus = "on-track";
  if (plannedExpenses <= 0) {
    status = "none";
  } else if (totalSpent > plannedExpenses) {
    status = "over";
  } else if (totalSpent > warningThreshold) {
    status = "warning";
  }

  return {
    plannedExpenses,
    totalSpent,
    paidTotal,
    unpaidTotal,
    available,
    usedPct,
    paidPct,
    unpaidPct,
    dailyAllowance,
    daysLeft,
    status,
  };
}

export function getUpcomingBills(
  expenses: ExpenseResponse[],
  limit = 3,
): ExpenseResponse[] {
  return expenses
    .filter((expense) => !expense.paid)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, limit);
}

export function getDueStatus(
  dueDate: string,
  today: Date = new Date(),
): "overdue" | "today" | "soon" | "upcoming" {
  const diff = diffInDays(dueDate, today);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 6) return "soon";
  return "upcoming";
}

export function formatDueLabel(
  dueDate: string,
  today: Date = new Date(),
): string {
  const diff = diffInDays(dueDate, today);

  if (diff === -1) return "Venceu ontem";
  if (diff < 0) return `Atrasada há ${Math.abs(diff)} dias`;
  if (diff === 0) return "Vence hoje";
  if (diff === 1) return "Vence amanhã";
  if (diff <= 6) return `Em ${diff} dias`;

  return parseDateOnly(dueDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function getTopCategories(
  expenses: ExpenseResponse[],
  limit = 3,
): CategorySummary[] {
  const totalSpent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  if (totalSpent <= 0) return [];

  const grouped = new Map<
    string,
    { name: string; total: number; color: string | null }
  >();

  for (const expense of expenses) {
    const name = expense.category_name || expense.category || "Sem categoria";
    const key = expense.category_id || name;
    const current = grouped.get(key);
    const amount = Number(expense.amount);

    if (current) {
      current.total += amount;
      current.color = current.color || expense.category_color || null;
    } else {
      grouped.set(key, {
        name,
        total: amount,
        color: expense.category_color || null,
      });
    }
  }

  return [...grouped.entries()]
    .map(([key, category]) => ({
      key,
      name: category.name,
      total: category.total,
      color: category.color,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((category, index) => ({
      key: category.key,
      name: category.name,
      total: category.total,
      percentage: (category.total / totalSpent) * 100,
      color:
        category.color ||
        FALLBACK_CATEGORY_COLORS[index % FALLBACK_CATEGORY_COLORS.length],
    }));
}
