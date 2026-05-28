import { api } from "./api";
import type {
  LeisureKmCreate,
  LeisureKmResponse,
} from "@/types/finance";

export const leisureKmApi = {
  get: (leisureId: string) =>
    api.get<LeisureKmResponse | null>(`/leisure/${leisureId}/km/`),

  upsert: (leisureId: string, data: LeisureKmCreate) =>
    api.post<LeisureKmResponse>(`/leisure/${leisureId}/km/`, data),

  delete: (leisureId: string) =>
    api.delete(`/leisure/${leisureId}/km/`),
};
