"use client";

import { useState, useTransition } from "react";
import { updateTotalBudget } from "@/lib/budget/actions";
import { formatCurrency } from "@/lib/budget/format";

export function TotalBudgetEditor({ totalBudget }: { totalBudget: number | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(totalBudget?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink">
        <span>
          Total budget:{" "}
          {totalBudget !== null ? (
            formatCurrency(totalBudget)
          ) : (
            <span className="text-foreground/50">Not set</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs font-medium text-foreground/40 hover:text-aegean"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <label htmlFor="totalBudget" className="text-sm font-medium text-ink">
        Total budget (€)
      </label>
      <input
        id="totalBudget"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="input w-auto"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await updateTotalBudget(value === "" ? null : Number(value));
            setIsEditing(false);
          });
        }}
        className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setValue(totalBudget?.toString() ?? "");
          setIsEditing(false);
        }}
        className="text-sm text-foreground/60 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
