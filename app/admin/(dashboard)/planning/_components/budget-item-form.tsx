"use client";

import { useActionState } from "react";
import { createBudgetItem, type BudgetItemActionState } from "@/lib/budget/actions";

const initialState: BudgetItemActionState = undefined;

export function BudgetItemForm() {
  const [state, formAction, isPending] = useActionState(createBudgetItem, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink">Add a budget item</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-ink sm:col-span-2">
          Item
          <input name="name" required className="input" placeholder="e.g. Florist deposit" />
          {state?.errors?.name && (
            <span className="text-xs text-terracotta">{state.errors.name[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink sm:col-span-2">
          Category
          <input name="category" required className="input" placeholder="e.g. Flowers & Decor" />
          {state?.errors?.category && (
            <span className="text-xs text-terracotta">{state.errors.category[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Budgeted (€)
          <input type="number" name="budgetedAmount" min="0" step="0.01" defaultValue="0" className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Actual (€)
          <input type="number" name="actualAmount" min="0" step="0.01" defaultValue="0" className="input" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-ink">
        Notes
        <input name="notes" className="input" placeholder="Optional" />
      </label>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add item"}
        </button>
      </div>
    </form>
  );
}
