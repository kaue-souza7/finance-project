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
  return api.post<AvatarResponse>("/profile/avatar", formData);
}

export async function removeAvatar(): Promise<AvatarResponse> {
  return api.delete<AvatarResponse>("/profile/avatar");
}
