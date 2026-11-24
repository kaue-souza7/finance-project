import { describe, expect, it } from "vitest";
import {
  formatDueLabel,
  getBudgetSummary,
  getDueStatus,
  getTopCategories,
  getUpcomingBills,
} from "./dashboard";
import type { ExpenseResponse } from "@/types/finance";

const TODAY = new Date(2026, 10, 24); // 24 de novembro de 2026

function expense(overrides: Partial<ExpenseResponse> = {}): ExpenseResponse {
  return {
    id: "expense-1",
    planning_id: "planning-1",
    category_id: null,
    category: "Mercado",
    category_name: null,
    category_color: null,
    category_icon: null,
    description: "Compra",
    amount: "100.00",
    recurrence: "once",
    due_date: "2026-11-25",
    paid: false,
    created_at: "2026-11-01T00:00:00",
    updated_at: "2026-11-01T00:00:00",
    ...overrides,
  };
}

describe("getBudgetSummary", () => {
  it("calcula totais, percentuais e teto diário", () => {
    const summary = getBudgetSummary(
      3000,
      [
        expense({ id: "pago", amount: "1000.00", paid: true }),
        expense({ id: "aberto", amount: "500.00", paid: false }),
      ],
      TODAY,
    );

    expect(summary.totalSpent).toBe(1500);
    expect(summary.paidTotal).toBe(1000);
    expect(summary.unpaidTotal).toBe(500);
    expect(summary.available).toBe(1500);
    expect(summary.usedPct).toBe(50);
    expect(summary.paidPct).toBeCloseTo(33.333, 2);
    expect(summary.unpaidPct).toBeCloseTo(16.667, 2);
    expect(summary.daysLeft).toBe(7);
    expect(summary.dailyAllowance).toBeCloseTo(1500 / 7, 4);
    expect(summary.status).toBe("on-track");
  });

  it("marca atenção quando o gasto está acima do ritmo", () => {
    const summary = getBudgetSummary(
      3000,
      [expense({ amount: "2800.00", paid: true })],
      new Date(2026, 10, 10),
    );

    expect(summary.status).toBe("warning");
  });

  it("marca orçamento estourado e zera o teto diário", () => {
    const summary = getBudgetSummary(
      3000,
      [expense({ amount: "3200.00" })],
      TODAY,
    );

    expect(summary.available).toBe(-200);
    expect(summary.usedPct).toBe(100);
    expect(summary.unpaidPct).toBe(100);
    expect(summary.dailyAllowance).toBe(0);
    expect(summary.status).toBe("over");
  });

  it("não calcula ritmo quando não existe orçamento definido", () => {
    const summary = getBudgetSummary(0, [], TODAY);

    expect(summary.status).toBe("none");
    expect(summary.usedPct).toBe(0);
    expect(summary.dailyAllowance).toBe(0);
  });

  it("separa pago e a pagar dentro do orçamento", () => {
    const summary = getBudgetSummary(
      1000,
      [
        expense({ id: "pago", amount: "600.00", paid: true }),
        expense({ id: "aberto", amount: "200.00", paid: false }),
      ],
      TODAY,
    );

    expect(summary.usedPct).toBe(80);
    expect(summary.paidPct).toBe(60);
    expect(summary.unpaidPct).toBe(20);
    expect(summary.available).toBe(200);
  });
});

describe("getUpcomingBills", () => {
  it("remove pagas, ordena por vencimento e limita o resultado", () => {
    const expenses = [
      expense({ id: "28", due_date: "2026-11-28" }),
      expense({ id: "23", due_date: "2026-11-23" }),
      expense({ id: "25", due_date: "2026-11-25" }),
      expense({ id: "paga", due_date: "2026-11-22", paid: true }),
      expense({ id: "27", due_date: "2026-11-27" }),
    ];

    expect(getUpcomingBills(expenses, 3).map((item) => item.id)).toEqual([
      "23",
      "25",
      "27",
    ]);
  });
});

describe("formatDueLabel", () => {
  it("descreve vencimentos próximos de forma curta", () => {
    expect(formatDueLabel("2026-11-23", TODAY)).toBe("Venceu ontem");
    expect(formatDueLabel("2026-11-21", TODAY)).toBe("Atrasada há 3 dias");
    expect(formatDueLabel("2026-11-24", TODAY)).toBe("Vence hoje");
    expect(formatDueLabel("2026-11-25", TODAY)).toBe("Vence amanhã");
    expect(formatDueLabel("2026-11-27", TODAY)).toBe("Em 3 dias");
    expect(formatDueLabel("2026-12-10", TODAY)).toBe("10/12");
  });

  it("classifica o status do vencimento", () => {
    expect(getDueStatus("2026-11-23", TODAY)).toBe("overdue");
    expect(getDueStatus("2026-11-24", TODAY)).toBe("today");
    expect(getDueStatus("2026-11-27", TODAY)).toBe("soon");
    expect(getDueStatus("2026-12-10", TODAY)).toBe("upcoming");
  });
});

describe("getTopCategories", () => {
  it("agrupa por categoria, ordena e aplica cor de fallback", () => {
    const expenses = [
      expense({
        category_id: "c1",
        category_name: "Mercado",
        category_color: "#f00",
        amount: "600.00",
      }),
      expense({
        category_id: "c1",
        category_name: "Mercado",
        category_color: "#f00",
        amount: "200.00",
      }),
      expense({
        category_id: "c2",
        category_name: "Transporte",
        amount: "200.00",
      }),
      expense({
        category_id: "c3",
        category_name: "Lazer",
        amount: "100.00",
      }),
      expense({
        category_id: "c4",
        category_name: "Outros",
        amount: "50.00",
      }),
    ];

    const categories = getTopCategories(expenses, 3);

    expect(categories).toHaveLength(3);
    expect(categories[0]).toMatchObject({
      name: "Mercado",
      total: 800,
      color: "#f00",
    });
    expect(categories[0].percentage).toBeCloseTo(69.565, 2);
    expect(categories[1]).toMatchObject({
      name: "Transporte",
      total: 200,
      color: "#f59e0b",
    });
    expect(categories[2]).toMatchObject({
      name: "Lazer",
      total: 100,
      color: "#06b6d4",
    });
  });

  it("retorna vazio quando não há gastos", () => {
    expect(getTopCategories([])).toEqual([]);
  });
});
