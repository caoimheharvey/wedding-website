"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { deleteBudgetItem, updateBudgetItem, type BudgetItemActionState } from "@/lib/budget/actions";
import { formatCurrency } from "@/lib/budget/format";
import type { BudgetItem } from "@/lib/budget/types";
import { WEDDING_CATEGORIES, WEDDING_CATEGORY_LABELS } from "@/lib/categories";

const initialState: BudgetItemActionState = undefined;

export function BudgetItemRow({ item }: { item: BudgetItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateAction = updateBudgetItem.bind(null, item.id);
  const [state, formAction, isSaving] = useActionState(updateAction, initialState);
  const [isPending, startTransition] = useTransition();

  // Adjust state during render (React's recommended alternative to an
  // effect here) rather than after commit, avoiding an extra render tick.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.message === "Item updated.") setIsEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    startTransition(async () => {
      await deleteBudgetItem(item.id);
    });
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border/60 align-top">
        <td colSpan={5} className="py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink">
              Item
              <input name="name" defaultValue={item.name} required className="input" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Category
              <select name="category" defaultValue={item.category} required className="input">
                {WEDDING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {WEDDING_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Budgeted (€)
              <input
                type="number"
                name="budgetedAmount"
                min="0"
                step="0.01"
                defaultValue={item.budgetedAmount}
                className="input w-28"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Actual (€)
              <input
                type="number"
                name="actualAmount"
                min="0"
                step="0.01"
                defaultValue={item.actualAmount}
                className="input w-28"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Notes
              <input name="notes" defaultValue={item.notes ?? ""} className="input" />
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs text-ink">
              <input
                type="checkbox"
                name="isDiy"
                defaultChecked={item.isDiy}
                className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
              />
              DIY
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
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{item.name}</span>
          {item.isDiy && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
              DIY
            </span>
          )}
        </div>
        {item.notes && <div className="text-xs text-foreground/50 italic">{item.notes}</div>}
      </td>
      <td className="py-2 pr-4">
        <Link href={`/admin/vendors/${item.category}`} className="text-aegean hover:underline">
          {WEDDING_CATEGORY_LABELS[item.category]}
        </Link>
      </td>
      <td className="py-2 pr-4">{formatCurrency(item.budgetedAmount)}</td>
      <td
        className={`py-2 pr-4 ${item.actualAmount > item.budgetedAmount ? "text-terracotta" : "text-foreground/70"}`}
      >
        {formatCurrency(item.actualAmount)}
      </td>
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
