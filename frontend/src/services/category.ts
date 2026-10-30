import { api } from "./api";
import type { CategoryResponse, CategoryCreate } from "@/types/finance";

export const categoryApi = {
  list: () => api.get<CategoryResponse[]>("/categories/"),

  create: (data: CategoryCreate) => api.post<CategoryResponse>("/categories/", data),

  seedDefaults: () =>
    api.post<CategoryResponse[]>("/categories/defaults"),

  update: (id: string, data: Partial<CategoryCreate>) =>
    api.put<CategoryResponse>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};
