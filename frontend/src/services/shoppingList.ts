import { api } from "./api";
import type {
  ShoppingListResponse,
  ShoppingListCreate,
  ShoppingListUpdate,
  ShoppingListDetailResponse,
  ShoppingListItemResponse,
  ShoppingListItemCreate,
  ShoppingListItemUpdate,
  ShoppingListItemToggle,
  ShoppingListInviteResponse,
  InviteSendRequest,
  ShoppingListShareResponse,
} from "@/types/finance";

export const shoppingListApi = {
  list: () => api.get<ShoppingListResponse[]>("/shopping-lists/"),

  getById: (id: string) =>
    api.get<ShoppingListDetailResponse>(`/shopping-lists/${id}`),

  create: (data: ShoppingListCreate) =>
    api.post<ShoppingListResponse>("/shopping-lists/", data),

  update: (id: string, data: ShoppingListUpdate) =>
    api.put<ShoppingListResponse>(`/shopping-lists/${id}`, data),

  delete: (id: string) => api.delete(`/shopping-lists/${id}`),

  createItem: (listId: string, data: ShoppingListItemCreate) =>
    api.post<ShoppingListItemResponse>(
      `/shopping-lists/${listId}/items`,
      data,
    ),

  updateItem: (
    listId: string,
    itemId: string,
    data: ShoppingListItemUpdate,
  ) =>
    api.put<ShoppingListItemResponse>(
      `/shopping-lists/${listId}/items/${itemId}`,
      data,
    ),

  deleteItem: (listId: string, itemId: string) =>
    api.delete(`/shopping-lists/${listId}/items/${itemId}`),

  toggleItem: (listId: string, itemId: string, data: ShoppingListItemToggle) =>
    api.patch<ShoppingListItemResponse>(
      `/shopping-lists/${listId}/items/${itemId}/toggle`,
      data,
    ),

  sendInvite: (listId: string, data: InviteSendRequest) =>
    api.post<ShoppingListInviteResponse>(
      `/shopping-lists/${listId}/invite`,
      data,
    ),

  acceptInvite: (inviteId: string) =>
    api.post<ShoppingListInviteResponse>(
      `/shopping-lists/invites/${inviteId}/accept`,
    ),

  declineInvite: (inviteId: string) =>
    api.post<ShoppingListInviteResponse>(
      `/shopping-lists/invites/${inviteId}/decline`,
    ),

  listReceivedInvites: () =>
    api.get<ShoppingListInviteResponse[]>("/shopping-lists/invites/received"),

  listPendingInvites: (listId: string) =>
    api.get<ShoppingListInviteResponse[]>(
      `/shopping-lists/${listId}/invites/pending`,
    ),

  cancelInvite: (listId: string, inviteId: string) =>
    api.delete(`/shopping-lists/${listId}/invites/${inviteId}`),

  listShares: (listId: string) =>
    api.get<ShoppingListShareResponse[]>(`/shopping-lists/${listId}/shares`),

  updateShareRole: (listId: string, shareId: string, data: { role: string }) =>
    api.put<ShoppingListShareResponse>(
      `/shopping-lists/${listId}/shares/${shareId}`,
      data,
    ),

  removeShare: (listId: string, shareId: string) =>
    api.delete(`/shopping-lists/${listId}/shares/${shareId}`),
};
