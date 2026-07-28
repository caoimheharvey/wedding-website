import type { WeddingCategory } from "@/lib/categories";

export interface BudgetItem {
  id: string;
  name: string;
  category: WeddingCategory;
  budgetedAmount: number;
  actualAmount: number;
  /** DIY items still count toward the category's actual spend, just with no vendor behind them. */
  isDiy: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategorySummary {
  category: WeddingCategory;
  budgeted: number;
  actual: number;
}

export interface BudgetSummary {
  totalBudget: number | null;
  totalBudgeted: number;
  totalActual: number;
  categories: BudgetCategorySummary[];
}
