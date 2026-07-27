export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  budgetedAmount: number;
  actualAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategorySummary {
  category: string;
  budgeted: number;
  actual: number;
}

export interface BudgetSummary {
  totalBudget: number | null;
  totalBudgeted: number;
  totalActual: number;
  categories: BudgetCategorySummary[];
}
