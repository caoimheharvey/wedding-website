import Link from "next/link";
import { formatCurrency } from "@/lib/budget/format";
import type { BudgetCategorySummary } from "@/lib/budget/types";
import { WEDDING_CATEGORY_LABELS } from "@/lib/categories";

export function CategorySummary({ categories }: { categories: BudgetCategorySummary[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-1 font-display text-lg text-ink">By category</h2>
      <p className="mb-2 text-xs text-foreground/50">
        Click a category for the vendors you&apos;re considering (or booked) for it.
      </p>
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
                    {WEDDING_CATEGORY_LABELS[category.category]}
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
    </div>
  );
}
