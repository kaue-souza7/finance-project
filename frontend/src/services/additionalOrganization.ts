import { api } from "./api";
import type {
  AdditionalOrganizationContentUpdate,
  AdditionalOrganizationCreate,
  AdditionalOrganizationDetail,
  AdditionalOrganizationItem,
  AdditionalOrganizationItemCreate,
  AdditionalOrganizationItemUpdate,
  AdditionalOrganizationSummary,
  AdditionalOrganizationUpdate,
} from "@/types/additionalOrganization";
import type {
  AdditionalOrganizationInvite,
  AdditionalOrganizationInvitePreview,
  AdditionalOrganizationParticipant,
} from "@/types/additionalOrganizationSharing";

export const additionalOrganizationApi = {
  list: () =>
    api.get<AdditionalOrganizationSummary[]>("/additional-organizations/"),

  listShared: () =>
    api.get<AdditionalOrganizationSummary[]>(
      "/additional-organizations/shared",
    ),

  getById: (id: string) =>
    api.get<AdditionalOrganizationDetail>(
      `/additional-organizations/${id}`,
    ),

  create: (data: AdditionalOrganizationCreate) =>
    api.post<AdditionalOrganizationSummary>(
      "/additional-organizations/",
      data,
    ),

  update: (id: string, data: AdditionalOrganizationUpdate) =>
    api.put<AdditionalOrganizationSummary>(
      `/additional-organizations/${id}`,
      data,
    ),

  updateContent: (id: string, data: AdditionalOrganizationContentUpdate) =>
    api.put<AdditionalOrganizationSummary>(
      `/additional-organizations/${id}/content`,
      data,
    ),

  delete: (id: string) =>
    api.delete(`/additional-organizations/${id}`),

  createItem: (organizationId: string, data: AdditionalOrganizationItemCreate) =>
    api.post<AdditionalOrganizationItem>(
      `/additional-organizations/${organizationId}/items`,
      data,
    ),

  updateItem: (
    organizationId: string,
    itemId: string,
    data: AdditionalOrganizationItemUpdate,
  ) =>
    api.put<AdditionalOrganizationItem>(
      `/additional-organizations/${organizationId}/items/${itemId}`,
      data,
    ),

  deleteItem: (organizationId: string, itemId: string) =>
    api.delete(
      `/additional-organizations/${organizationId}/items/${itemId}`,
    ),

  listParticipants: (organizationId: string) =>
    api.get<AdditionalOrganizationParticipant[]>(
      `/additional-organizations/${organizationId}/participants`,
    ),

  listInvites: (organizationId: string) =>
    api.get<AdditionalOrganizationInvite[]>(
      `/additional-organizations/${organizationId}/invites`,
    ),

  sendInvite: (organizationId: string, email: string) =>
    api.post<AdditionalOrganizationInvite>(
      `/additional-organizations/${organizationId}/invites`,
      { email },
    ),

  resendInvite: (organizationId: string, inviteId: string) =>
    api.post<AdditionalOrganizationInvite>(
      `/additional-organizations/${organizationId}/invites/${inviteId}/resend`,
    ),

  cancelInvite: (organizationId: string, inviteId: string) =>
    api.delete(
      `/additional-organizations/${organizationId}/invites/${inviteId}`,
    ),

  removeParticipant: (organizationId: string, membershipId: string) =>
    api.delete(
      `/additional-organizations/${organizationId}/participants/${membershipId}`,
    ),

  listReceivedInvites: () =>
    api.get<AdditionalOrganizationInvite[]>(
      "/additional-organizations/invites/received",
    ),

  acceptInvite: (inviteId: string) =>
    api.post<AdditionalOrganizationInvite>(
      `/additional-organizations/invites/${inviteId}/accept`,
    ),

  declineInvite: (inviteId: string) =>
    api.post<AdditionalOrganizationInvite>(
      `/additional-organizations/invites/${inviteId}/decline`,
    ),

  resolveInviteToken: (token: string) =>
    api.post<AdditionalOrganizationInvitePreview>(
      "/additional-organizations/invites/resolve",
      { token },
    ),
};
