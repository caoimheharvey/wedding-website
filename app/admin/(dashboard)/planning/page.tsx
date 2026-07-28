import { getBudgetSummary, listBudgetItems, listContributions } from "@/lib/budget/queries";
import { formatCurrency } from "@/lib/budget/format";
import { TotalBudgetEditor } from "./_components/total-budget-editor";
import { BudgetProgressBar } from "./_components/budget-progress-bar";
import { CategorySummary } from "./_components/category-summary";
import { BudgetItemForm } from "./_components/budget-item-form";
import { BudgetItemRow } from "./_components/budget-item-row";
import { AddContributionSection } from "./_components/add-contribution-section";
import { ContributionRow } from "./_components/contribution-row";

export default async function PlanningPage() {
  const [summary, items, contributions] = await Promise.all([
    getBudgetSummary(),
    listBudgetItems(),
    listContributions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Planning &amp; Budget</h1>

      <div className="flex flex-col gap-3">
        <TotalBudgetEditor totalBudget={summary.totalBudget} />
        <BudgetProgressBar
          totalBudget={summary.totalBudget}
          totalContributions={summary.totalContributions}
          availableBudget={summary.availableBudget}
          totalActual={summary.totalActual}
        />
      </div>

      <CategorySummary categories={summary.categories} />

      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-1 font-display text-lg text-ink">Family contributions</h2>
        <p className="mb-3 text-xs text-foreground/50">
          Extra money from family, counted toward your available budget above.
        </p>
        {contributions.length > 0 && (
          <table className="mb-4 w-full text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="py-2 pr-4 font-medium">Who gave</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
                <th className="py-2 pr-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {contributions.map((contribution) => (
                <ContributionRow key={contribution.id} contribution={contribution} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-2 pr-4 font-medium text-ink">Total</td>
                <td className="pt-2 pr-4 font-medium text-ink">
                  {formatCurrency(summary.totalContributions)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
        <AddContributionSection />
      </div>

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
