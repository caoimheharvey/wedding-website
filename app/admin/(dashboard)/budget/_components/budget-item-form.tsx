"use client";

import { useActionState, useEffect } from "react";
import { createBudgetItem, type BudgetItemActionState } from "@/lib/budget/actions";
import type { Category } from "@/lib/categories/types";

const initialState: BudgetItemActionState = undefined;

export function BudgetItemForm({
  categories,
  onDone,
}: {
  categories: Category[];
  onDone?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createBudgetItem, initialState);

  useEffect(() => {
    if (state?.message === "Item added.") onDone?.();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 glass-card p-4"
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
          <select name="category" required defaultValue="" className="input">
            <option value="" disabled>
              Choose one
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
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
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isDiy"
          className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
        />
        We&apos;re doing this ourselves (DIY) — no vendor
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink">
        Notes
        <input name="notes" className="input" placeholder="Optional" />
      </label>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add item"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
