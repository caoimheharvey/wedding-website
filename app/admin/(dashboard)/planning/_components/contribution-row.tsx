"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteContribution,
  updateContribution,
  type BudgetItemActionState,
} from "@/lib/budget/actions";
import { formatCurrency } from "@/lib/budget/format";
import type { BudgetContribution } from "@/lib/budget/types";

const initialState: BudgetItemActionState = undefined;

export function ContributionRow({ contribution }: { contribution: BudgetContribution }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateAction = updateContribution.bind(null, contribution.id);
  const [state, formAction, isSaving] = useActionState(updateAction, initialState);
  const [isPending, startTransition] = useTransition();

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.message === "Contribution updated.") setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Delete the contribution from "${contribution.contributorName}"?`)) return;
    startTransition(async () => {
      await deleteContribution(contribution.id);
    });
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border/60 align-top">
        <td colSpan={4} className="py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink">
              Who gave
              <input
                name="contributorName"
                defaultValue={contribution.contributorName}
                required
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Amount (€)
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                defaultValue={contribution.amount}
                className="input w-28"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Notes
              <input name="notes" defaultValue={contribution.notes ?? ""} className="input" />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-foreground/60 hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
          {state?.message && <p className="mt-1 text-xs text-terracotta">{state.message}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="py-2 pr-4 font-medium text-ink">{contribution.contributorName}</td>
      <td className="py-2 pr-4">{formatCurrency(contribution.amount)}</td>
      <td className="py-2 pr-4 text-foreground/60 italic">{contribution.notes}</td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-aegean hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
