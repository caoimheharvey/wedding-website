"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitRsvp } from "@/lib/rsvp/guest-actions";
import { RSVP_STATUS_OPTIONS, type Guest, type PreferredLanguage, type RsvpStatus } from "@/lib/guests/types";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

export function RsvpForm({
  guest,
  delegateFor,
  language,
  deadlinePassed,
  delegateName,
  previewGuestId,
}: {
  guest: Guest;
  delegateFor: Guest[];
  language: PreferredLanguage;
  deadlinePassed: boolean;
  delegateName?: string;
  /** Local-test-only: lets the admin preview route submit without a real session. */
  previewGuestId?: string;
}) {
  const strings = GUEST_SITE_STRINGS[language].rsvpForm;
  const people = [guest, ...delegateFor];

  const [statuses, setStatuses] = useState<Record<string, RsvpStatus>>(
    Object.fromEntries(people.map((person) => [person.id, person.rsvpStatus])),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (deadlinePassed) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const entries = people.map((person) => ({
        guestId: person.id,
        status: statuses[person.id],
      }));
      const result = await submitRsvp(entries, previewGuestId);
      setMessage(result.message ?? null);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-border bg-surface p-4 text-left"
    >
      <h2 className="mb-3 font-display text-lg text-ink">{strings.heading}</h2>
      {guest.rsvpDelegateOf && delegateName && (
        <p className="mb-3 text-xs text-foreground/50">{strings.delegateNote(delegateName)}</p>
      )}
      <div className="flex flex-col gap-3">
        {people.map((person) => (
          <label
            key={person.id}
            className="flex items-center justify-between gap-3 text-sm text-ink"
          >
            <span>
              {person.firstName} {person.lastName}
            </span>
            <select
              value={statuses[person.id]}
              onChange={(event) =>
                setStatuses((prev) => ({
                  ...prev,
                  [person.id]: event.target.value as RsvpStatus,
                }))
              }
              className="input w-auto"
            >
              {RSVP_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {strings.optionLabels[option]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "…" : strings.submit}
      </button>
      {message && <p className="mt-2 text-sm text-foreground/70">{message}</p>}
    </form>
  );
}
