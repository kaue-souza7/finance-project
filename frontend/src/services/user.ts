import { api } from "./api";
import type { UserSearchResponse } from "@/types/finance";

export const userApi = {
  search: (q: string) =>
    api.get<UserSearchResponse[]>(`/users/search?q=${encodeURIComponent(q)}`),
};
