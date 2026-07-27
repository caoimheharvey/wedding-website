import { getBudgetSummary, listBudgetItems } from "@/lib/budget/queries";
import { TotalBudgetEditor } from "./_components/total-budget-editor";
import { BudgetProgressBar } from "./_components/budget-progress-bar";
import { CategorySummary } from "./_components/category-summary";
import { BudgetItemForm } from "./_components/budget-item-form";
import { BudgetItemRow } from "./_components/budget-item-row";

export default async function PlanningPage() {
  const [summary, items] = await Promise.all([getBudgetSummary(), listBudgetItems()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Planning &amp; Budget</h1>

      <div className="flex flex-col gap-3">
        <TotalBudgetEditor totalBudget={summary.totalBudget} />
        <BudgetProgressBar totalBudget={summary.totalBudget} totalActual={summary.totalActual} />
      </div>

      <CategorySummary categories={summary.categories} />

      <BudgetItemForm />

      {items.length === 0 ? (
        <p className="text-sm text-foreground/60">No budget items yet. Add one above.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
            <tr>
              <th className="py-2 pr-4 font-medium">Item</th>
              <th className="py-2 pr-4 font-medium">Category</th>
              <th className="py-2 pr-4 font-medium">Budgeted</th>
              <th className="py-2 pr-4 font-medium">Actual</th>
              <th className="py-2 pr-4 font-medium" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <BudgetItemRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
