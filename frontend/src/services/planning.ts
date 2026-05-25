import { api } from "./api";
import type { PlanningCreate, PlanningResponse, PlanningUpdate } from "@/types/finance";

export const planningApi = {
  list: () => api.get<PlanningResponse[]>("/plannings/"),

  getByMonth: (month: number, year: number) =>
    api.get<PlanningResponse | null>(`/plannings/month?month=${month}&year=${year}`),

  create: (data: PlanningCreate) => api.post<PlanningResponse>("/plannings/", data),

  update: (id: string, data: PlanningUpdate) =>
    api.put<PlanningResponse>(`/plannings/${id}`, data),

  delete: (id: string) => api.delete(`/plannings/${id}`),

  copyFromPrevious: (month: number, year: number) =>
    api.post<PlanningResponse>(`/plannings/copy-from/${month}/${year}`),
};
