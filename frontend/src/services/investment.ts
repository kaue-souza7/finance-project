import { api } from "./api";
import type { InvestmentSummary } from "@/types/finance";

export const investmentApi = {
  summary: () => api.get<InvestmentSummary>("/investments/summary"),
};
