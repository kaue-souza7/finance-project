import { api } from "./api";
import type {
  InviteResponse,
  InviteSendRequest,
  LeisureParticipantResponse,
} from "@/types/finance";

export const leisureInviteApi = {
  getReceived: () =>
    api.get<InviteResponse[]>("/leisure/invites/received"),

  sendInvite: (leisureId: string, email: string) =>
    api.post<InviteResponse>(`/leisure/${leisureId}/invite`, {
      email,
    } satisfies InviteSendRequest),

  acceptInvite: (inviteId: string) =>
    api.post<InviteResponse>(`/leisure/invites/${inviteId}/accept`),

  declineInvite: (inviteId: string) =>
    api.post<InviteResponse>(`/leisure/invites/${inviteId}/decline`),

  getParticipants: (leisureId: string) =>
    api.get<LeisureParticipantResponse[]>(
      `/leisure/${leisureId}/participants`,
    ),

  getPendingInvites: (leisureId: string) =>
    api.get<InviteResponse[]>(`/leisure/${leisureId}/invites/pending`),
};
