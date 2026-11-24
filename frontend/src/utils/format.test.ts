import { describe, expect, it } from "vitest";
import {
  centsToDecimalString,
  decimalStringToCents,
  formatBrl,
  formatCentsBRL,
  parseBrl,
  parseBrlToCents,
} from "./format";

describe("formatBrl", () => {
  it("formata valores em reais", () => {
    const formatted = formatBrl(1234.5).replace(/\u00a0/g, " ");
    expect(formatted).toMatch(/R\$\s?1\.234,50/);
  });
});

describe("parseBrl", () => {
  it("aceita o formato brasileiro", () => {
    expect(parseBrl("1.234,56")).toBe(1234.56);
    expect(parseBrl("10,5")).toBe(10.5);
  });

  it("rejeita valores inválidos", () => {
    expect(parseBrl("")).toBeNaN();
    expect(parseBrl("abc")).toBeNaN();
  });
});

describe("parseBrlToCents", () => {
  it("converte formatos brasileiros e decimais", () => {
    expect(parseBrlToCents("1.234,56")).toBe(123456);
    expect(parseBrlToCents("1234,56")).toBe(123456);
    expect(parseBrlToCents("1234.56")).toBe(123456);
    expect(parseBrlToCents("R$ 1.500,00")).toBe(150000);
    expect(parseBrlToCents("1.500")).toBe(150000);
    expect(parseBrlToCents("10,5")).toBe(1050);
    expect(parseBrlToCents("0,01")).toBe(1);
  });

  it("rejeita valores inválidos, negativos ou com mais de 2 casas", () => {
    expect(parseBrlToCents("")).toBeNull();
    expect(parseBrlToCents("abc")).toBeNull();
    expect(parseBrlToCents("-10,00")).toBeNull();
    expect(parseBrlToCents("10,001")).toBeNull();
  });
});

describe("decimalStringToCents", () => {
  it("converte strings decimais da API", () => {
    expect(decimalStringToCents("5000.00")).toBe(500000);
    expect(decimalStringToCents("0.01")).toBe(1);
    expect(decimalStringToCents("-50.00")).toBe(-5000);
  });
});

describe("centsToDecimalString", () => {
  it("converte centavos em string decimal", () => {
    expect(centsToDecimalString(500000)).toBe("5000.00");
    expect(centsToDecimalString(1)).toBe("0.01");
    expect(centsToDecimalString(-5000)).toBe("-50.00");
  });
});

describe("formatCentsBRL", () => {
  it("formata centavos como moeda", () => {
    const formatted = formatCentsBRL(123456).replace(/\u00a0/g, " ");
    expect(formatted).toMatch(/R\$\s?1\.234,56/);
  });
});
