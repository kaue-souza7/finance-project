export type AdditionalOrganizationType =
  | "free_text"
  | "additional_income";

export type AdditionalOrganizationRole = "owner" | "participant";

export interface AdditionalOrganizationOwner {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface AdditionalOrganizationSummary {
  id: string;
  user_id: string;
  title: string;
  type: AdditionalOrganizationType;
  total_amount: string | null;
  content_preview: string | null;
  show_observations: boolean;
  content_version: number;
  item_count: number;
  allocated_amount: string;
  remaining_amount: string | null;
  role: AdditionalOrganizationRole;
  owner: AdditionalOrganizationOwner;
  created_at: string;
  updated_at: string;
}

export interface AdditionalOrganizationItem {
  id: string;
  organization_id: string;
  name: string;
  amount: string;
  observation: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AdditionalOrganizationDetail
  extends AdditionalOrganizationSummary {
  content: string | null;
  items: AdditionalOrganizationItem[];
}

export interface AdditionalOrganizationCreate {
  title: string;
  type: AdditionalOrganizationType;
  content?: string | null;
  total_amount?: string | null;
  show_observations?: boolean;
}

export interface AdditionalOrganizationUpdate {
  title?: string;
  total_amount?: string | null;
  show_observations?: boolean;
}

export interface AdditionalOrganizationContentUpdate {
  content: string | null;
  expected_version: number;
}

export interface AdditionalOrganizationItemCreate {
  name: string;
  amount: string;
  observation?: string | null;
  position?: number;
}

export interface AdditionalOrganizationItemUpdate {
  name?: string;
  amount?: string;
  observation?: string | null;
  expected_updated_at?: string;
}
