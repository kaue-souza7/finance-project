import { describe, expect, it } from "vitest";
import { nextMonth, prevMonth } from "./date";

describe("navegação de meses", () => {
  it("volta de janeiro para dezembro do ano anterior", () => {
    expect(prevMonth(1, 2026)).toEqual({ month: 12, year: 2025 });
  });

  it("avança de dezembro para janeiro do próximo ano", () => {
    expect(nextMonth(12, 2026)).toEqual({ month: 1, year: 2027 });
  });

  it("mantém o ano em meses normais", () => {
    expect(prevMonth(6, 2026)).toEqual({ month: 5, year: 2026 });
    expect(nextMonth(6, 2026)).toEqual({ month: 7, year: 2026 });
  });
});
