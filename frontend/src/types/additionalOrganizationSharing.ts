import type {
  AdditionalOrganizationRole,
  AdditionalOrganizationType,
} from "@/types/additionalOrganization";

export type AdditionalOrganizationInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export type AdditionalOrganizationEmailStatus =
  | "queued"
  | "sent"
  | "failed"
  | "unavailable";

export interface AdditionalOrganizationParticipant {
  membership_id: string | null;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: AdditionalOrganizationRole;
  joined_at: string | null;
}

export interface AdditionalOrganizationInvite {
  id: string;
  organization_id: string;
  organization_title: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  invited_email: string;
  receiver_user_id: string | null;
  status: AdditionalOrganizationInviteStatus;
  email_status: AdditionalOrganizationEmailStatus;
  created_at: string;
  expires_at: string;
  last_sent_at: string;
  responded_at: string | null;
}

export interface AdditionalOrganizationInvitePreview {
  invite_id: string;
  organization_id: string;
  title: string;
  type: AdditionalOrganizationType;
  owner_name: string;
  expires_at: string;
  status: AdditionalOrganizationInviteStatus;
}
