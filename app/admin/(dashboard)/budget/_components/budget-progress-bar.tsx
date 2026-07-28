import { formatCurrency } from "@/lib/budget/format";

export function BudgetProgressBar({
  totalBudget,
  totalContributions,
  availableBudget,
  totalActual,
}: {
  totalBudget: number | null;
  totalContributions: number;
  availableBudget: number | null;
  totalActual: number;
}) {
  if (availableBudget === null || availableBudget === 0) return null;

  const percent = Math.min((totalActual / availableBudget) * 100, 100);
  const isOver = totalActual > availableBudget;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm text-ink">
        <span>
          {formatCurrency(totalActual)} spent of {formatCurrency(availableBudget)}
          {totalContributions > 0 && (
            <span className="text-foreground/50">
              {" "}
              ({formatCurrency(totalBudget ?? 0)} yours + {formatCurrency(totalContributions)}{" "}
              from family)
            </span>
          )}
        </span>
        <span className={isOver ? "font-medium text-terracotta" : "font-medium text-olive"}>
          {isOver ? "Over budget" : `${Math.round(percent)}%`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-sand">
        <div
          className={`h-full rounded-full ${isOver ? "bg-terracotta" : "bg-olive"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
