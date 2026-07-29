"use client";

import { useActionState } from "react";
import {
  createDestination,
  updateDestination,
  type DestinationActionState,
} from "@/lib/destinations/actions";
import type { Destination } from "@/lib/destinations/types";

const initialState: DestinationActionState = undefined;

export function DestinationForm({ destination }: { destination?: Destination }) {
  const action = destination ? updateDestination.bind(null, destination.id) : createDestination;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination name" error={state?.errors?.name?.[0]}>
          <input
            name="name"
            defaultValue={destination?.name}
            required
            className="input"
            placeholder="e.g. Amalfi Coast"
          />
        </Field>
        <Field label="Location" error={state?.errors?.location?.[0]}>
          <input
            name="location"
            defaultValue={destination?.location ?? ""}
            className="input"
            placeholder="e.g. Italy"
          />
        </Field>
        <Field label="Estimated total cost (€)" error={state?.errors?.estimatedCost?.[0]}>
          <input
            type="number"
            min="0"
            step="0.01"
            name="estimatedCost"
            defaultValue={destination?.estimatedCost ?? ""}
            className="input"
          />
        </Field>
        <Field label="Cost rationale" error={state?.errors?.costRationale?.[0]}>
          <input
            name="costRationale"
            defaultValue={destination?.costRationale ?? ""}
            className="input"
            placeholder="What the estimate assumes, e.g. venue tier, season"
          />
        </Field>
        <Field label="Guest capacity" error={state?.errors?.guestCapacityNotes?.[0]}>
          <input
            name="guestCapacityNotes"
            defaultValue={destination?.guestCapacityNotes ?? ""}
            className="input"
            placeholder="e.g. Up to 120 guests"
          />
        </Field>
      </div>

      <Field label="Description" error={state?.errors?.description?.[0]}>
        <textarea
          name="description"
          defaultValue={destination?.description ?? ""}
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Travel notes" error={state?.errors?.travelNotes?.[0]}>
        <textarea
          name="travelNotes"
          defaultValue={destination?.travelNotes ?? ""}
          rows={2}
          className="input"
          placeholder="Flight access, transfer time, etc."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pros" error={state?.errors?.pros?.[0]}>
          <textarea name="pros" defaultValue={destination?.pros ?? ""} rows={3} className="input" />
        </Field>
        <Field label="Cons" error={state?.errors?.cons?.[0]}>
          <textarea name="cons" defaultValue={destination?.cons ?? ""} rows={3} className="input" />
        </Field>
      </div>

      <Field label="Notes" error={state?.errors?.notes?.[0]}>
        <textarea name="notes" defaultValue={destination?.notes ?? ""} rows={3} className="input" />
      </Field>

      {state?.message && <p className="text-sm text-terracotta">{state.message}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : destination ? "Save changes" : "Add destination"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      {label}
      {children}
      {error && <span className="text-xs text-terracotta">{error}</span>}
    </label>
  );
}
