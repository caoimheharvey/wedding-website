"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createDestinationRequirement,
  deleteDestinationRequirement,
  type RequirementActionState,
} from "@/lib/destinations/actions";
import type { DestinationRequirement } from "@/lib/destinations/types";

const initialState: RequirementActionState = undefined;

function AddRequirementForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createDestinationRequirement, initialState);

  useEffect(() => {
    if (state?.message === "Requirement added.") onDone();
  }, [state?.message, onDone]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="requirement"
        required
        autoFocus
        placeholder="e.g. Connected to an airport"
        className="input min-w-[220px] flex-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
      >
        {isPending ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
        Cancel
      </button>
      {state?.message && state.message !== "Requirement added." && (
        <p className="w-full text-xs text-terracotta">{state.message}</p>
      )}
    </form>
  );
}

function RequirementChip({ requirement }: { requirement: DestinationRequirement }) {
  const [isPending, startTransition] = useTransition();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-sm text-ink">
      {requirement.requirement}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteDestinationRequirement(requirement.id);
          });
        }}
        aria-label={`Remove ${requirement.requirement}`}
        className="text-foreground/40 hover:text-terracotta disabled:opacity-50"
      >
        ×
      </button>
    </span>
  );
}

export function DestinationRequirements({
  requirements,
}: {
  requirements: DestinationRequirement[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="flex flex-col gap-3 glass-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">What we want from our destination</h2>
          <p className="text-xs text-foreground/60">
            A checklist the AI weighs candidates against when researching destinations below.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 rounded-full border border-aegean px-3 py-1.5 text-xs font-medium text-aegean transition hover:bg-aegean/10"
          >
            + Add requirement
          </button>
        )}
      </div>

      {requirements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {requirements.map((requirement) => (
            <RequirementChip key={requirement.id} requirement={requirement} />
          ))}
        </div>
      )}

      {adding && <AddRequirementForm onDone={() => setAdding(false)} />}
    </section>
  );
}
