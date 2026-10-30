import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./error";

describe("getErrorMessage", () => {
  it("traduz erros de rede", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"))).toContain(
      "Erro de conexão",
    );
  });

  it("traduz timeouts", () => {
    expect(getErrorMessage(new DOMException("", "TimeoutError"))).toContain(
      "demorando",
    );
  });

  it("extrai o status de erros HTTP", () => {
    expect(getErrorMessage(new Error("HTTP 500"))).toBe("500");
  });

  it("mantém mensagens de erro comuns", () => {
    expect(getErrorMessage(new Error("Mensagem amigável"))).toBe(
      "Mensagem amigável",
    );
  });
});
