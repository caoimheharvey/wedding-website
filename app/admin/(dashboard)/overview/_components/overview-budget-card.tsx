import Link from "next/link";
import { formatCurrency } from "@/lib/budget/format";
import { BudgetProgressBar } from "../../budget/_components/budget-progress-bar";

export function OverviewBudgetCard({
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
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <header className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">Budget</p>
        <Link href="/admin/budget" className="text-xs font-medium text-aegean hover:underline">
          View budget
        </Link>
      </header>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
        <p>
          Total budget:{" "}
          {totalBudget !== null ? (
            <span className="font-medium">{formatCurrency(totalBudget)}</span>
          ) : (
            <span className="text-foreground/50">Not set</span>
          )}
        </p>
        {totalContributions > 0 && (
          <p>
            Family contributions:{" "}
            <span className="font-medium">{formatCurrency(totalContributions)}</span>
          </p>
        )}
        <p>
          Spent: <span className="font-medium">{formatCurrency(totalActual)}</span>
        </p>
      </div>
      <BudgetProgressBar
        totalBudget={totalBudget}
        totalContributions={totalContributions}
        availableBudget={availableBudget}
        totalActual={totalActual}
      />
    </section>
  );
}
