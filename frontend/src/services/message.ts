import { api } from "./api";
import type { MessageResponse, MessagePageResponse, MessageSend } from "@/types/finance";

export const messageApi = {
  list: (chatId: string, cursor?: string) => {
    const params = cursor ? `?cursor=${cursor}` : "";
    return api.get<MessagePageResponse>(`/chat/${chatId}/messages${params}`);
  },

  listNew: (chatId: string, after: string) =>
    api.get<MessageResponse[]>(`/chat/${chatId}/messages/new?after=${after}`),

  send: (chatId: string, content: string) =>
    api.post<MessageResponse>(
      `/chat/${chatId}/messages`,
      { content } satisfies MessageSend,
    ),
};
