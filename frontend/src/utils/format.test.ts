import { describe, expect, it } from "vitest";
import { formatBrl, parseBrl } from "./format";

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
