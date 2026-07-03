const KNOWN_ERRORS: Record<string, string> = {
  "NetworkError": "Erro de rede — verifique sua conexão",
  "TimeoutError": "O servidor está demorando muito para responder",
  "AbortError": "Requisição cancelada",
};

export function getErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    return KNOWN_ERRORS[err.name] ?? "Erro inesperado";
  }

  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "Erro de conexão — backend offline ou inacessível";
  }

  if (err instanceof Error) {
    if (err.message.startsWith("HTTP ")) return err.message.slice(5);

    if (/^\d{3}$/.test(err.message)) {
      const status = Number(err.message);
      if (status >= 500) return "Erro interno do servidor";
      if (status === 404) return "Recurso não encontrado";
      if (status === 403) return "Acesso negado";
      if (status === 429) return "Muitas requisições — aguarde um momento";
      return "Falha na requisição";
    }

    return err.message;
  }

  if (typeof err === "string") return err;

  return "Ocorreu um erro inesperado";
}
