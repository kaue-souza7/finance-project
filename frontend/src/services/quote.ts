const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export interface QuoteResponse {
  quote: string;
}

export const quoteApi = {
  daily: async (): Promise<QuoteResponse> => {
    const res = await fetch(`${BASE_URL}/quotes/daily`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error("Falha ao carregar frase do dia");
    return res.json();
  },
};
