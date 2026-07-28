/**
 * Projects whether a vendor's quoted total cost — not what's been paid so
 * far — would fit within the category's budgeted amount. Lets you compare
 * vendor options against the budget before committing to one, separate from
 * the category's actual (already-spent) figure shown elsewhere.
 */
export interface BudgetFit {
  status: "over" | "in_budget";
  overBy: number;
}

export function getBudgetFit(priceQuote: number | null, categoryBudgeted: number): BudgetFit | null {
  if (priceQuote == null || categoryBudgeted <= 0) return null;

  const overBy = priceQuote - categoryBudgeted;
  return overBy > 0 ? { status: "over", overBy } : { status: "in_budget", overBy: 0 };
}
