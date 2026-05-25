import { api } from "./api";
import type { ExpenseCreate, ExpenseResponse, ExpenseUpdate } from "@/types/finance";

export const expenseApi = {
  list: (planningId: string) =>
    api.get<ExpenseResponse[]>(`/expenses/?planning_id=${planningId}`),

  create: (data: ExpenseCreate) => api.post<ExpenseResponse>("/expenses/", data),

  update: (id: string, data: ExpenseUpdate) =>
    api.put<ExpenseResponse>(`/expenses/${id}`, data),

  delete: (id: string) => api.delete(`/expenses/${id}`),
};
