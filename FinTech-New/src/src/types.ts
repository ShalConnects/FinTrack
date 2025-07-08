export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance?: number;
  calculated_balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  has_dps?: boolean;
  dps_type?: 'monthly' | 'flexible' | null;
  dps_amount_type?: 'fixed' | 'custom' | null;
  dps_fixed_amount?: number | null;
  dps_savings_account_id?: string | null;
  donation_preference?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
  saving_amount?: number;
  note?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  source_account_id: string;
  savings_account_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DashboardStats {
  byCurrency: CurrencyDashboardStats[];
  accountsCount: number;
  transactionsCount: number;
}

export interface CurrencyDashboardStats {
  currency: string;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
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

// ... rest of the types ... 