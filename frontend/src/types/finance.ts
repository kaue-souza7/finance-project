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
  created_at: string;
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
