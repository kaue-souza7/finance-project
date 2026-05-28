import { api } from "./api";
import type { ChatInviteResponse, InviteSendRequest } from "@/types/finance";

export const chatInviteApi = {
  send: (email: string) =>
    api.post<ChatInviteResponse>(
      "/chat/invite",
      { email } satisfies InviteSendRequest,
    ),

  listReceived: () => api.get<ChatInviteResponse[]>("/chat/invites/received"),

  accept: (id: string) =>
    api.post<ChatInviteResponse>(`/chat/invites/${id}/accept`),

  decline: (id: string) =>
    api.post<ChatInviteResponse>(`/chat/invites/${id}/decline`),
};
