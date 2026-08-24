import Link from "next/link";
import { formatCurrency } from "@/lib/budget/format";
import type { BudgetCategorySummary } from "@/lib/budget/types";
import { AddCategorySection } from "./add-category-section";
import { CategoryStackedBar } from "./category-stacked-bar";

export function CategorySummary({
  categories,
  availableBudget,
  totalBudgeted,
}: {
  categories: BudgetCategorySummary[];
  availableBudget: number | null;
  totalBudgeted: number;
}) {
  const remainingToAllocate = availableBudget !== null ? availableBudget - totalBudgeted : null;

  return (
    <div className="glass-card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">By category</h2>
        <AddCategorySection />
      </div>
      <p className="mb-2 text-xs text-foreground/50">
        Click a category for the vendors you&apos;re considering (or booked) for it.
      </p>

      {remainingToAllocate !== null && (
        <p className="mb-3 text-sm">
          {remainingToAllocate < 0 ? (
            <span className="font-medium text-terracotta">
              {formatCurrency(Math.abs(remainingToAllocate))} allocated over your available budget
            </span>
          ) : (
            <span className="font-medium text-ink">
              {formatCurrency(remainingToAllocate)}{" "}
              <span className="font-normal text-foreground/60">left to allocate</span>
            </span>
          )}
        </p>
      )}
      <div className="mb-3">
        <CategoryStackedBar
          categories={categories}
          valueKey="budgeted"
          total={availableBudget ?? totalBudgeted}
          emptyLabel="No budget allocated to a category yet."
        />
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-foreground/60">No categories yet — add one above.</p>
      )}
      {categories.length > 0 && (
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-foreground/50 uppercase">
          <tr>
            <th className="py-1 pr-4 font-medium">Category</th>
            <th className="py-1 pr-4 font-medium">Budgeted</th>
            <th className="py-1 pr-4 font-medium">Actual</th>
            <th className="py-1 pr-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const overBudget = category.actual > category.budgeted;
            return (
              <tr key={category.category} className="border-t border-border/60">
                <td className="py-1.5 pr-4">
                  <Link
                    href={`/admin/vendors/${category.category}`}
                    className="font-medium text-aegean hover:underline"
                  >
                    {category.categoryLabel}
                  </Link>
                </td>
                <td className="py-1.5 pr-4">{formatCurrency(category.budgeted)}</td>
                <td className={`py-1.5 pr-4 ${overBudget ? "text-terracotta" : "text-foreground/70"}`}>
                  {formatCurrency(category.actual)}
                </td>
                <td className="py-1.5 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                      overBudget ? "bg-terracotta/15 text-terracotta" : "bg-olive/15 text-olive"
                    }`}
                  >
                    {overBudget
                      ? `€${(category.actual - category.budgeted).toLocaleString()} over`
                      : "In budget"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}
    </div>
  );
}
