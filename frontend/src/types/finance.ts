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
