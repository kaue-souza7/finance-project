import { api } from "./api";
import type { AvatarResponse, PasswordChange, ProfileUpdate, UserResponse } from "@/types/finance";

export async function getProfile(): Promise<UserResponse> {
  return api.get<UserResponse>("/profile");
}

export async function updateProfile(data: ProfileUpdate): Promise<UserResponse> {
  return api.put<UserResponse>("/profile", data);
}

export async function changePassword(data: PasswordChange): Promise<void> {
  await api.post<void>("/profile/change-password", data);
}

export async function uploadAvatar(file: File): Promise<AvatarResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("access_token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL ?? "/api/v1"}/profile/avatar`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    const message =
      data && typeof data.detail === "string"
        ? data.detail
        : "Erro ao enviar avatar";
    throw new Error(message);
  }

  return res.json();
}

export async function removeAvatar(): Promise<AvatarResponse> {
  return api.delete<AvatarResponse>("/profile/avatar");
}
