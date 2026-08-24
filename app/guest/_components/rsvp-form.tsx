"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitRsvp } from "@/lib/rsvp/guest-actions";
import { RSVP_STATUS_OPTIONS, type Guest, type PreferredLanguage, type RsvpStatus } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

export function RsvpForm({
  rsvpSubmittees,
  rsvpDelegatedBy,
  language,
  deadlinePassed,
  previewGuestId,
  title,
}: {
  rsvpSubmittees: Guest[];
  rsvpDelegatedBy: Guest[];
  language: PreferredLanguage;
  deadlinePassed: boolean;
  /** Local-test-only: lets the admin preview route submit without a real session. */
  previewGuestId?: string;
  /** Overrides the default heading — set from the Guest View section's title. */
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].rsvpForm;
  const people = rsvpSubmittees;
  const router = useRouter();

  const [statuses, setStatuses] = useState<Record<string, RsvpStatus>>(
    Object.fromEntries(people.map((person) => [person.id, person.rsvpStatus])),
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (deadlinePassed) return null;

  function setAll(status: RsvpStatus) {
    setStatuses(Object.fromEntries(people.map((person) => [person.id, status])));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const entries = people.map((person) => ({
        guestId: person.id,
        status: statuses[person.id],
      }));
      const result = await submitRsvp(entries, previewGuestId);
      setMessage(result.message ?? null);
      if (result.message === "Thanks — your RSVP has been recorded.") {
        router.refresh();
      }
    });
  }

  const delegateNames = rsvpDelegatedBy.map((person) => guestDisplayName(person));

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card w-full p-4 text-left"
    >
      <h2 className="mb-3 font-display text-lg font-bold text-ink">{title || strings.heading}</h2>
      {delegateNames.length > 0 && (
        <p className="mb-3 text-xs text-foreground/50">{strings.delegateNote(delegateNames)}</p>
      )}
      {people.length > 1 && (
        <div className="mb-3 flex gap-3">
          <button
            type="button"
            onClick={() => setAll("yes")}
            className="text-xs font-medium text-aegean hover:underline"
          >
            {strings.yesToAll}
          </button>
          <button
            type="button"
            onClick={() => setAll("no")}
            className="text-xs font-medium text-terracotta hover:underline"
          >
            {strings.noToAll}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {people.map((person) => (
          <label
            key={person.id}
            className="flex items-center justify-between gap-3 text-sm text-ink"
          >
            <span>{guestDisplayName(person)}</span>
            <select
              value={statuses[person.id]}
              onChange={(event) =>
                setStatuses((prev) => ({
                  ...prev,
                  [person.id]: event.target.value as RsvpStatus,
                }))
              }
              className="glass-input w-auto"
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
