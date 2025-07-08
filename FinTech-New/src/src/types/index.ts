export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance: number;
  calculated_balance: number;
  currency: string;
  isActive: boolean;
  created_at: string;
  description?: string;
  has_dps: boolean;
  dps_type: 'monthly' | 'flexible' | null;
  dps_amount_type: 'fixed' | 'custom' | null;
  dps_fixed_amount: number | null;
  dps_savings_account_id: string | null;
  donation_preference?: number | null;
}

export interface AccountInput {
  id?: string;
  user_id?: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance: number;
  currency: string;
  isActive?: boolean;
  created_at?: string;
  description?: string;
  has_dps: boolean;
  dps_type: 'monthly' | 'flexible' | null;
  dps_amount_type: 'fixed' | 'custom' | null;
  dps_fixed_amount: number | null;
  dps_savings_account_id: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  saving_amount?: number;
  donation_amount?: number;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
  createdAt: Date;
}

export interface CurrencyDashboardStats {
  currency: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  mrr: number;
}

export interface DashboardStats {
  byCurrency: CurrencyDashboardStats[];
  accountsCount: number;
  transactionsCount: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  source_account_id: string;
  savings_account_id: string;
  created_at: string;
  description?: string;
  current_amount: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

// Purchase Management Types
export interface Purchase {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  price: number;
  purchase_date: string;
  status: 'planned' | 'purchased' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseCategory {
  id: string;
  user_id: string;
  category_name: string;
  description?: string;
  monthly_budget: number;
  category_color: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseAnalytics {
  total_spent: number;
  monthly_spent: number;
  planned_count: number;
  purchased_count: number;
  cancelled_count: number;
  top_category?: string;
  category_breakdown: Array<{
    category: string;
    total_spent: number;
    item_count: number;
    percentage: number;
  }>;
}

export interface User {
  id: string;
  fullName?: string;
  email?: string;
  profilePicture?: string;
  local_currency?: string;
  subscription?: 'free' | 'premium';
}