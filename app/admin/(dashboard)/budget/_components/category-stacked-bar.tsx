import { formatCurrency } from "@/lib/budget/format";
import { colorForIndex } from "@/lib/budget/chart-colors";
import type { BudgetCategorySummary } from "@/lib/budget/types";

/** A stacked, per-category-colored progress bar — one segment per category with a value. */
export function CategoryStackedBar({
  categories,
  valueKey,
  total,
  emptyLabel,
}: {
  categories: BudgetCategorySummary[];
  valueKey: "budgeted" | "actual";
  total: number;
  emptyLabel: string;
}) {
  const withValue = categories.filter((category) => category[valueKey] > 0);

  if (total <= 0 || withValue.length === 0) {
    return <p className="text-xs text-foreground/50">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-sand">
        {withValue.map((category) => {
          const originalIndex = categories.indexOf(category);
          const value = category[valueKey];
          const percent = Math.min((value / total) * 100, 100);
          return (
            <div
              key={category.category}
              title={`${category.categoryLabel}: ${formatCurrency(value)}`}
              className={colorForIndex(originalIndex)}
              style={{ width: `${percent}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/60">
        {withValue.map((category) => {
          const originalIndex = categories.indexOf(category);
          return (
            <span key={category.category} className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 shrink-0 rounded-full ${colorForIndex(originalIndex)}`} />
              {category.categoryLabel} ({formatCurrency(category[valueKey])})
            </span>
          );
        })}
      </div>
    </div>
  );
}
