export interface MonthlySummary {
  expectedRevenue: number;
  expectedExpenses: number;
  plannedInvestment: number;
  remainingBalance: number;
}

export interface PlanningResponse {
  id: string;
  user_id: string;
  month: number;
  year: number;
  expected_revenue: string;
  expected_expenses: string;
  planned_investment: string;
  remaining_balance: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningCreate {
  month: number;
  year: number;
  expected_revenue: number;
  expected_expenses: number;
  planned_investment: number;
}

export interface PlanningUpdate {
  expected_revenue?: number;
  expected_expenses?: number;
  planned_investment?: number;
}

export interface CategoryResponse {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  color: string;
  icon: string;
}

export interface ExpenseResponse {
  id: string;
  planning_id: string;
  category_id?: string | null;
  category: string;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  description: string;
  amount: string;
  recurrence: "once" | "monthly" | "yearly";
  due_date: string;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  planning_id: string;
  category_id?: string | null;
  category: string;
  description: string;
  amount: number;
  recurrence: "once" | "monthly" | "yearly";
  due_date: string;
  paid?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface AvatarResponse {
  avatar_url: string | null;
  avatar_public_id: string | null;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ExpenseUpdate {
  category_id?: string | null;
  category?: string;
  description?: string;
  amount?: number;
  recurrence?: "once" | "monthly" | "yearly";
  due_date?: string;
  paid?: boolean;
}

export interface LeisureResponse {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  budget: string | null;
  status: string;
  location_name: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  participant_count: number;
}

export interface LeisureCreate {
  title: string;
  description?: string | null;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  budget?: number | null;
  status?: string;
  location_name?: string | null;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LeisureUpdate {
  title?: string;
  description?: string | null;
  date?: string;
  start_time?: string | null;
  end_time?: string | null;
  budget?: number | null;
  status?: string;
  location_name?: string | null;
  location_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LeisureExpenseResponse {
  id: string;
  leisure_id: string;
  title: string;
  category: string;
  amount: string;
  description: string | null;
  paid: boolean;
  add_to_planning: boolean;
  planning_expense_id: string | null;
  created_by: string;
  created_at: string;
}

export interface LeisureExpenseCreate {
  title: string;
  category: string;
  amount: number;
  description?: string | null;
  paid?: boolean;
  add_to_planning?: boolean;
}

export interface LeisureExpenseUpdate {
  title?: string;
  category?: string;
  amount?: number;
  description?: string | null;
  paid?: boolean;
}

export interface LeisureParticipantResponse {
  id: string;
  leisure_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface InviteResponse {
  id: string;
  leisure_id: string;
  sender_id: string;
  receiver_user_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  leisure_title: string | null;
  leisure_date: string | null;
  sender_name: string | null;
  sender_email: string | null;
  receiver_name: string | null;
  receiver_email: string | null;
}

export interface InviteSendRequest {
  email: string;
}

export interface LeisureKmCreate {
  origin: string;
  destination: string;
  distance_km: number;
  fuel_price: number;
  car_consumption: number;
  tolls?: number;
  estimated_time?: string | null;
}

export interface LeisureKmResponse {
  id: string;
  leisure_id: string;
  origin: string;
  destination: string;
  distance_km: string;
  fuel_price: string;
  car_consumption: string;
  tolls: string;
  total_cost: string;
  fuel_cost: string;
  estimated_time: string | null;
  created_by: string;
  created_at: string;
}

export interface MonthlyInvestment {
  month: number;
  year: number;
  label: string;
  invested: string;
}

export interface InvestmentSummary {
  total_invested: string;
  total_months: number;
  average_monthly: string;
  best_month: MonthlyInvestment | null;
  monthly_breakdown: MonthlyInvestment[];
}

export interface ChatResponse {
  id: string;
  participant: ChatParticipantResponse;
  last_message: string | null;
  last_interaction_at: string | null;
  created_at: string;
}

export interface ChatParticipantResponse {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export interface MessageResponse {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  expires_at: string;
}

export interface MessagePageResponse {
  messages: MessageResponse[];
  next_cursor: string | null;
}

export interface ChatInviteResponse {
  id: string;
  sender_id: string;
  receiver_user_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  sender_name: string | null;
  sender_email: string | null;
  chat_id: string | null;
}

export interface MessageSend {
  content: string;
}

export interface UserBrief {
  id: string;
  name: string;
  email: string;
}

export interface ShoppingListResponse {
  id: string;
  user_id: string;
  title: string;
  color: string;
  icon: string;
  completed_at: string | null;
  item_count: number;
  checked_count: number;
  role: string;
  shared_by: UserBrief | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListCreate {
  title: string;
  color: string;
  icon: string;
}

export interface ShoppingListUpdate {
  title?: string;
  color?: string;
  icon?: string;
}

export interface ShoppingListItemResponse {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: string | null;
  checked: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItemCreate {
  name: string;
  quantity?: string | null;
  order?: number;
}

export interface ShoppingListItemUpdate {
  name?: string;
  quantity?: string | null;
  order?: number;
}

export interface ShoppingListItemToggle {
  checked: boolean;
}

export interface ShoppingListInviteResponse {
  id: string;
  shopping_list_id: string;
  sender_id: string;
  receiver_user_id: string;
  role: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  shopping_list_title: string | null;
  sender_name: string | null;
  sender_email: string | null;
  receiver_name: string | null;
  receiver_email: string | null;
}

export interface ShoppingListInviteRequest {
  user_email: string;
  role: "editor" | "viewer";
}

export interface ShoppingListShareResponse {
  id: string;
  shopping_list_id: string;
  user_id: string;
  role: string;
  created_at: string;
  created_by: string;
  last_seen_at: string | null;
  user_name: string | null;
  user_email: string | null;
}

export interface UserSearchResponse {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ShoppingListDetailResponse {
  id: string;
  user_id: string;
  title: string;
  color: string;
  icon: string;
  completed_at: string | null;
  items: ShoppingListItemResponse[];
  role: string;
  shared_by: UserBrief | null;
  created_at: string;
  updated_at: string;
}
