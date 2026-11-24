import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";
import { expenseApi } from "@/services/expense";
import { planningApi } from "@/services/planning";
import { getCurrentMonth, MONTHS } from "@/utils/date";
import type { ExpenseResponse, PlanningResponse } from "@/types/finance";

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Kauê Teste" } }),
}));

vi.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({ toast: showToast }),
}));

vi.mock("@/services/planning", () => ({
  planningApi: {
    getByMonth: vi.fn(),
    copyFromPrevious: vi.fn(),
  },
}));

vi.mock("@/services/expense", () => ({
  expenseApi: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

const mockedGetByMonth = vi.mocked(planningApi.getByMonth);
const mockedListExpenses = vi.mocked(expenseApi.list);
const mockedUpdateExpense = vi.mocked(expenseApi.update);

const { month, year } = getCurrentMonth();
const dueDate = `${year}-${String(month).padStart(2, "0")}-05`;

function buildPlan(): PlanningResponse {
  return {
    id: "planning-1",
    user_id: "user-1",
    month,
    year,
    expected_revenue: "5000.00",
    expected_expenses: "3000.00",
    planned_investment: "500.00",
    remaining_balance: "1500.00",
    created_at: "2026-11-01T00:00:00",
    updated_at: "2026-11-01T00:00:00",
  };
}

function buildExpense(
  overrides: Partial<ExpenseResponse> = {},
): ExpenseResponse {
  return {
    id: "expense-1",
    planning_id: "planning-1",
    category_id: "category-1",
    category: "Moradia",
    category_name: "Moradia",
    category_color: "#6366f1",
    category_icon: "home",
    description: "Aluguel",
    amount: "1200.00",
    recurrence: "monthly",
    due_date: dueDate,
    paid: false,
    created_at: "2026-11-01T00:00:00",
    updated_at: "2026-11-01T00:00:00",
    ...overrides,
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetByMonth.mockResolvedValue(buildPlan());
    mockedListExpenses.mockResolvedValue([
      buildExpense(),
      buildExpense({
        id: "expense-2",
        description: "Internet",
        amount: "120.00",
        category_id: "category-2",
        category: "Serviços",
        category_name: "Serviços",
        category_color: "#f59e0b",
        paid: true,
      }),
    ]);
  });

  it("mostra o resumo do mês, atalhos e contas em aberto", async () => {
    renderDashboard();

    expect(await screen.findByText("Olá, Kauê")).toBeInTheDocument();
    expect(
      screen.getByText(`Resumo de ${MONTHS[month - 1]}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Disponível para passar o mês"),
    ).toBeInTheDocument();
    expect(screen.getByText("R$ 1.500,00")).toBeInTheDocument();
    expect(
      screen.getByText("Despesas previstas: R$ 3.000,00"),
    ).toBeInTheDocument();
    expect(screen.getByText("4% das despesas pagas")).toBeInTheDocument();
    expect(screen.getByText("Planejamentos")).toBeInTheDocument();
    expect(screen.getAllByText("Transações").length).toBeGreaterThan(0);
    expect(await screen.findByText("Aluguel")).toBeInTheDocument();
    expect(screen.getAllByText("A pagar").length).toBeGreaterThan(0);
  });

  it("permite marcar uma conta como paga direto no dashboard", async () => {
    mockedUpdateExpense.mockResolvedValue(buildExpense({ paid: true }));

    renderDashboard();

    const payButton = await screen.findByRole("button", {
      name: "Marcar Aluguel como paga",
    });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockedUpdateExpense).toHaveBeenCalledWith("expense-1", {
        paid: true,
      });
    });
    await waitFor(() => {
      expect(screen.queryByText("Aluguel")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Conta marcada como paga.",
        "success",
      );
    });
  });

  it("mostra o estado vazio quando não existe planejamento", async () => {
    mockedGetByMonth.mockResolvedValue(null);

    renderDashboard();

    expect(
      await screen.findByText("Seu mês ainda não está planejado"),
    ).toBeInTheDocument();
    expect(mockedListExpenses).not.toHaveBeenCalled();
    expect(screen.getByText("Copiar mês anterior")).toBeInTheDocument();
  });
});
