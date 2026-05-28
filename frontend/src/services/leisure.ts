import { api } from "./api";
import type { LeisureCreate, LeisureResponse, LeisureUpdate } from "@/types/finance";

export const leisureApi = {
  list: () => api.get<LeisureResponse[]>("/leisure/"),

  getById: (id: string) => api.get<LeisureResponse>(`/leisure/${id}`),

  create: (data: LeisureCreate) => api.post<LeisureResponse>("/leisure/", data),

  update: (id: string, data: LeisureUpdate) =>
    api.put<LeisureResponse>(`/leisure/${id}`, data),

  delete: (id: string) => api.delete(`/leisure/${id}`),
};
