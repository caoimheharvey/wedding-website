"use client";

import { useActionState, useState } from "react";
import { bulkCreateGuests, type BulkGuestActionState } from "@/lib/guests/actions";
import {
  INVITED_BY_LABELS,
  INVITED_BY_OPTIONS,
  PREFERRED_LANGUAGE_LABELS,
  RELATIONSHIP_PRIORITIES,
  RELATIONSHIP_PRIORITY_LABELS,
} from "@/lib/guests/types";

const initialState: BulkGuestActionState = undefined;

export function BulkAddGuestsForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(bulkCreateGuests, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-aegean px-4 py-2 text-sm font-medium text-aegean transition hover:bg-aegean/10"
      >
        Bulk add guests
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-3 glass-card p-4"
    >
      <h2 className="font-display text-lg text-ink">Bulk add guests</h2>
      <p className="text-xs text-foreground/60">
        One guest per line: <code>First name, Last name, WeChat handle</code>. Leave a field blank
        but keep the commas — e.g. <code>,, mei_wechat88</code> for a WeChat-only guest with no name
        yet. These guests all share the settings below.
      </p>
      <label className="flex flex-col gap-1 text-sm text-ink">
        Guests
        <textarea
          name="entries"
          required
          rows={6}
          placeholder={"Mei,Zhang,\nJulien,Moreau,julien_wechat\n,,mei_wechat88"}
          className="input resize-y font-mono text-xs"
        />
        {state?.errors?.entries && (
          <span className="text-xs text-terracotta">{state.errors.entries[0]}</span>
        )}
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Relationship priority
          <select name="relationshipPriority" required defaultValue="" className="input">
            <option value="" disabled>
              Choose one
            </option>
            {RELATIONSHIP_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}. {RELATIONSHIP_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          {state?.errors?.relationshipPriority && (
            <span className="text-xs text-terracotta">{state.errors.relationshipPriority[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Invited by
          <select name="invitedBy" required defaultValue="" className="input">
            <option value="" disabled>
              Choose one
            </option>
            {INVITED_BY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {INVITED_BY_LABELS[option]}
              </option>
            ))}
          </select>
          {state?.errors?.invitedBy && (
            <span className="text-xs text-terracotta">{state.errors.invitedBy[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Preferred language
          <select name="preferredLanguage" defaultValue="en" className="input">
            {Object.entries(PREFERRED_LANGUAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add guests"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/60 hover:underline"
        >
          Close
        </button>
      </div>
      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
    </form>
  );
}
