import { describe, expect, it } from "vitest";
import {
  calculateOrganizationTotals,
  centsToEditableInput,
  normalizeSearch,
  organizationTypeLabel,
} from "./additionalOrganization";
import type { AdditionalOrganizationItem } from "@/types/additionalOrganization";

function item(amount: string): AdditionalOrganizationItem {
  return {
    id: amount,
    organization_id: "org",
    name: "Linha",
    amount,
    observation: null,
    position: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("calculateOrganizationTotals", () => {
  it("calcula soma, sobra e progresso", () => {
    const totals = calculateOrganizationTotals("5000.00", [
      item("800.00"),
      item("1500.00"),
      item("1200.00"),
      item("500.00"),
    ]);

    expect(totals.totalCents).toBe(500000);
    expect(totals.allocatedCents).toBe(400000);
    expect(totals.remainingCents).toBe(100000);
    expect(totals.isOverBudget).toBe(false);
    expect(totals.progressPercent).toBe(80);
  });

  it("detecta sobra negativa e limita o progresso visual", () => {
    const totals = calculateOrganizationTotals("100.00", [
      item("150.00"),
    ]);

    expect(totals.remainingCents).toBe(-5000);
    expect(totals.isOverBudget).toBe(true);
    expect(totals.progressPercent).toBe(100);
  });

  it("trata organização sem linhas", () => {
    const totals = calculateOrganizationTotals("5000.00", []);
    expect(totals.allocatedCents).toBe(0);
    expect(totals.remainingCents).toBe(500000);
    expect(totals.progressPercent).toBe(0);
  });
});

describe("normalizeSearch", () => {
  it("remove acentos e normaliza caixa", () => {
    expect(normalizeSearch("  Décimo TERCEIRO  ")).toBe(
      "decimo terceiro",
    );
  });
});

describe("organizationTypeLabel", () => {
  it("traduz os tipos", () => {
    expect(organizationTypeLabel("free_text")).toBe("Texto Livre");
    expect(organizationTypeLabel("additional_income")).toBe(
      "Receita Adicional",
    );
  });
});

describe("centsToEditableInput", () => {
  it("formata para edição", () => {
    expect(centsToEditableInput(150000)).toBe("1500,00");
    expect(centsToEditableInput(null)).toBe("");
  });
});
