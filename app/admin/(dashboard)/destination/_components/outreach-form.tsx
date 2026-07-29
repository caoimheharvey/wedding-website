"use client";

import { useActionState } from "react";
import { updateDestinationOutreach, type OutreachActionState } from "@/lib/destinations/actions";
import type { Destination } from "@/lib/destinations/types";

const initialState: OutreachActionState = undefined;

export function OutreachForm({ destination }: { destination: Destination }) {
  const action = updateDestinationOutreach.bind(null, destination.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-aegean/30 bg-aegean-light/5 p-3"
    >
      <p className="text-xs font-medium tracking-wide text-aegean uppercase">
        Vendor &amp; planner outreach
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="contacted"
              defaultChecked={destination.outreachContacted}
              className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
            />
            Reached out to a vendor/planner
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink">
            Date
            <input
              type="date"
              name="contactedDate"
              defaultValue={destination.outreachContactedDate ?? ""}
              className="input"
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="quotesReceived"
              defaultChecked={destination.outreachQuotesReceived}
              className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
            />
            Got quotes/info back
          </label>
        </div>
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink">
        Notes
        <textarea
          name="notes"
          defaultValue={destination.outreachNotes ?? ""}
          rows={2}
          className="input"
          placeholder="Who you contacted, what they said, quotes received…"
        />
      </label>
      {state?.message && <p className="text-xs text-foreground/60">{state.message}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-4 py-1.5 text-xs font-medium text-whitewash transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save outreach status"}
        </button>
      </div>
    </form>
  );
}
