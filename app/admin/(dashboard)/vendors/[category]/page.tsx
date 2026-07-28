import Link from "next/link";
import { notFound } from "next/navigation";
import { listVendorsByCategory } from "@/lib/vendors/queries";
import { listCategories } from "@/lib/categories/queries";
import { getCategoryBudgetSummary } from "@/lib/budget/queries";
import { formatCurrency } from "@/lib/budget/format";
import { VendorList } from "./_components/vendor-list";

export default async function VendorCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const [vendors, budget, categories] = await Promise.all([
    listVendorsByCategory(category),
    getCategoryBudgetSummary(category),
    listCategories(),
  ]);
  const categoryLabel = categories.find((c) => c.id === category)?.label;
  if (!categoryLabel) notFound();

  const overBudget = budget.actual > budget.budgeted;
  const hasBudget = budget.budgeted > 0 || budget.actual > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/vendors" className="text-sm text-aegean hover:underline">
          ← Back to vendors
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">{categoryLabel}</h1>
          <Link
            href={`/admin/vendors/${category}/new`}
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
          >
            Add vendor
          </Link>
        </div>
      </div>

      {hasBudget ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
          <span className="text-foreground/70">
            Budgeted <span className="font-medium text-ink">{formatCurrency(budget.budgeted)}</span>
          </span>
          <span className="text-foreground/30">·</span>
          <span className="text-foreground/70">
            Spent so far{" "}
            <span className={`font-medium ${overBudget ? "text-terracotta" : "text-ink"}`}>
              {formatCurrency(budget.actual)}
            </span>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
              overBudget ? "bg-terracotta/15 text-terracotta" : "bg-olive/15 text-olive"
            }`}
          >
            {overBudget ? `${formatCurrency(budget.actual - budget.budgeted)} over` : "In budget"}
          </span>
          <Link href="/admin/budget" className="ml-auto text-xs text-aegean hover:underline">
            View in Budget →
          </Link>
        </div>
      ) : (
        <p className="text-sm text-foreground/50">
          No budget line item for this category yet —{" "}
          <Link href="/admin/budget" className="text-aegean hover:underline">
            add one in Budget
          </Link>{" "}
          to track spend here.
        </p>
      )}

      <VendorList vendors={vendors} category={category} categoryBudgeted={budget.budgeted} />
    </div>
  );
}
