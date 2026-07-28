export interface BudgetItem {
  id: string;
  name: string;
  category: string;
  budgetedAmount: number;
  actualAmount: number;
  /** DIY items still count toward the category's actual spend, just with no vendor behind them. */
  isDiy: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategorySummary {
  category: string;
  categoryLabel: string;
  budgeted: number;
  actual: number;
}

export interface BudgetContribution {
  id: string;
  contributorName: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  /** The couple's own set-aside amount — unaffected by family contributions. */
  totalBudget: number | null;
  totalContributions: number;
  /** totalBudget + totalContributions, or null if no total budget has been set yet. */
  availableBudget: number | null;
  totalBudgeted: number;
  totalActual: number;
  categories: BudgetCategorySummary[];
}
