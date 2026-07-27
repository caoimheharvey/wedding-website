import { formatCurrency } from "@/lib/budget/format";

export function BudgetProgressBar({
  totalBudget,
  totalActual,
}: {
  totalBudget: number | null;
  totalActual: number;
}) {
  if (totalBudget === null || totalBudget === 0) return null;

  const percent = Math.min((totalActual / totalBudget) * 100, 100);
  const isOver = totalActual > totalBudget;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm text-ink">
        <span>
          {formatCurrency(totalActual)} spent of {formatCurrency(totalBudget)}
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
