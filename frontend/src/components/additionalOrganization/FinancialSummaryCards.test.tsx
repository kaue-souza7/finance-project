import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialSummaryCards } from "./FinancialSummaryCards";

describe("FinancialSummaryCards", () => {
  it("exibe sobra positiva e os três indicadores", () => {
    render(
      <FinancialSummaryCards
        totalCents={500000}
        allocatedCents={400000}
        remainingCents={100000}
        isOverBudget={false}
        progressPercent={80}
      />,
    );

    expect(screen.getByText("Sobra")).toBeInTheDocument();
    expect(screen.getByText("Soma de valores")).toBeInTheDocument();
    expect(screen.getByText("Receita adicional")).toBeInTheDocument();
    expect(screen.getByText(/1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/4\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/5\.000,00/)).toBeInTheDocument();
    expect(
      screen.getByText("Disponível para distribuir"),
    ).toBeInTheDocument();
  });

  it("sinaliza quando a soma ultrapassa a receita", () => {
    render(
      <FinancialSummaryCards
        totalCents={500000}
        allocatedCents={550000}
        remainingCents={-50000}
        isOverBudget
        progressPercent={100}
      />,
    );

    expect(
      screen.getByText(/Ultrapassou o valor disponível em R\$\s?500,00/),
    ).toBeInTheDocument();
    expect(screen.getByText(/-R\$\s?500,00/)).toBeInTheDocument();
  });

  it("sinaliza valor totalmente distribuído", () => {
    render(
      <FinancialSummaryCards
        totalCents={500000}
        allocatedCents={500000}
        remainingCents={0}
        isOverBudget={false}
        progressPercent={100}
      />,
    );

    expect(
      screen.getByText("Valor totalmente distribuído"),
    ).toBeInTheDocument();
  });
});
