import { api } from "./api";
import type {
  LeisureExpenseCreate,
  LeisureExpenseResponse,
  LeisureExpenseUpdate,
} from "@/types/finance";

export const leisureExpenseApi = {
  list: (leisureId: string) =>
    api.get<LeisureExpenseResponse[]>(`/leisure/${leisureId}/expenses/`),

  create: (leisureId: string, data: LeisureExpenseCreate) =>
    api.post<LeisureExpenseResponse>(`/leisure/${leisureId}/expenses/`, data),

  update: (leisureId: string, expenseId: string, data: LeisureExpenseUpdate) =>
    api.put<LeisureExpenseResponse>(
      `/leisure/${leisureId}/expenses/${expenseId}`,
      data,
    ),

  delete: (leisureId: string, expenseId: string) =>
    api.delete(`/leisure/${leisureId}/expenses/${expenseId}`),
};
