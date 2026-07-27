import { formatCurrency } from "@/lib/budget/format";
import type { BudgetCategorySummary } from "@/lib/budget/types";

export function CategorySummary({ categories }: { categories: BudgetCategorySummary[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-2 font-display text-lg text-ink">By category</h2>
      <table className="w-full text-left text-sm">
        <thead className="text-xs tracking-wide text-foreground/50 uppercase">
          <tr>
            <th className="py-1 pr-4 font-medium">Category</th>
            <th className="py-1 pr-4 font-medium">Budgeted</th>
            <th className="py-1 pr-4 font-medium">Actual</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.category} className="border-t border-border/60">
              <td className="py-1.5 pr-4">{category.category}</td>
              <td className="py-1.5 pr-4">{formatCurrency(category.budgeted)}</td>
              <td
                className={`py-1.5 pr-4 ${category.actual > category.budgeted ? "text-terracotta" : "text-foreground/70"}`}
              >
                {formatCurrency(category.actual)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
