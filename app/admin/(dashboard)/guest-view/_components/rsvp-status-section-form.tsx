"use client";

import { useActionState, useEffect } from "react";
import {
  createRsvpStatusSection,
  updateRsvpStatusSection,
  type GuestViewSectionActionState,
} from "@/lib/guest-view/actions";
import { WEDDING_PARTY_ROLE_LABELS, WEDDING_PARTY_ROLES } from "@/lib/guests/types";
import type { GuestViewSection } from "@/lib/guest-view/types";

const initialState: GuestViewSectionActionState = undefined;

export function RsvpStatusSectionForm({
  section,
  onDone,
}: {
  section?: GuestViewSection;
  onDone?: () => void;
}) {
  const action = section
    ? updateRsvpStatusSection.bind(null, section.id)
    : createRsvpStatusSection;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.message === "Section added." || state?.message === "Section updated.") {
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 glass-card p-4"
    >
      <p className="text-sm text-foreground/60">
        Shows each guest their current RSVP status and deadline. Updates automatically when they
        submit or change their RSVP.
      </p>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title (optional)
        <input
          name="title"
          defaultValue={section?.titles.en ?? ""}
          className="input"
          placeholder='Defaults to "Your RSVP status"'
        />
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-ink">Visible to</legend>
        <div className="flex flex-wrap gap-3">
          {WEDDING_PARTY_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1 text-xs text-ink">
              <input
                type="checkbox"
                name="visibleToRoles"
                value={role}
                defaultChecked={section?.visibleToRoles.includes(role)}
                className="h-3.5 w-3.5 rounded border-border text-aegean focus:ring-aegean"
              />
              {WEDDING_PARTY_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        <span className="text-xs text-foreground/50">Leave all unchecked to show everyone.</span>
      </fieldset>

      {state?.message && <p className="text-sm text-terracotta">{state.message}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : section ? "Save changes" : "Add section"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
