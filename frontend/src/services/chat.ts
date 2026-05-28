import { api } from "./api";
import type { ChatResponse } from "@/types/finance";

export const chatApi = {
  list: () => api.get<ChatResponse[]>("/chat/"),

  getById: (id: string) => api.get<ChatResponse>(`/chat/${id}`),
};
