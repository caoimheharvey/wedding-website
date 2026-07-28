"use client";

import { useActionState, useEffect } from "react";
import { createCategory, type CategoryActionState } from "@/lib/categories/actions";

const initialState: CategoryActionState = undefined;

export function CategoryForm({ onDone }: { onDone?: () => void }) {
  const [state, formAction, isPending] = useActionState(createCategory, initialState);

  useEffect(() => {
    if (state?.message === "Category added.") onDone?.();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-ink">
        Category name
        <input name="label" required className="input" placeholder="e.g. Wedding Party Gifts" />
        {state?.errors?.label && (
          <span className="text-xs text-terracotta">{state.errors.label[0]}</span>
        )}
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add category"}
      </button>
      {onDone && (
        <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
          Cancel
        </button>
      )}
      {state?.message && state.message !== "Category added." && (
        <p className="w-full text-xs text-terracotta">{state.message}</p>
      )}
    </form>
  );
}
