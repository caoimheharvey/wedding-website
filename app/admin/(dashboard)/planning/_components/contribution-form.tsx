"use client";

import { useActionState, useEffect } from "react";
import { createContribution, type BudgetItemActionState } from "@/lib/budget/actions";

const initialState: BudgetItemActionState = undefined;

export function ContributionForm({ onDone }: { onDone?: () => void }) {
  const [state, formAction, isPending] = useActionState(createContribution, initialState);

  useEffect(() => {
    if (state?.message === "Contribution added.") onDone?.();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink">Add a contribution</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Who gave
          <input
            name="contributorName"
            required
            className="input"
            placeholder="e.g. Caoimhe's parents"
          />
          {state?.errors?.contributorName && (
            <span className="text-xs text-terracotta">{state.errors.contributorName[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Amount (€)
          <input type="number" name="amount" min="0" step="0.01" defaultValue="0" className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Notes
          <input name="notes" className="input" placeholder="Optional — e.g. earmarked for X" />
        </label>
      </div>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add contribution"}
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
