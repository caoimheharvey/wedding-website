"use client";

import { useActionState } from "react";
import { createSeatingTable, type SeatingTableActionState } from "@/lib/seating/actions";

const initialState: SeatingTableActionState = undefined;

export function AddTableForm() {
  const [state, formAction, isPending] = useActionState(createSeatingTable, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink">Add a table</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Name
          <input name="name" required className="input" placeholder="e.g. Table 1" />
          {state?.errors?.name && (
            <span className="text-xs text-terracotta">{state.errors.name[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Description
          <input name="description" className="input" placeholder="e.g. Near the dance floor" />
        </label>
      </div>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add table"}
        </button>
      </div>
    </form>
  );
}
