export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number;
  date: string; // YYYY-MM-DD
  note?: string;
  created_at?: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string;
  category_color: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryStat {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  total_amount: number;
  percentage: number;
  count: number;
}

export interface FilterOptions {
  type?: 'all' | TransactionType;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}
