"use client";

import { useTransition } from "react";
import { setGuestRsvpStatus } from "@/lib/rsvp/actions";
import { RSVP_STATUS_OPTIONS, RSVP_STATUS_LABELS, type RsvpStatus } from "@/lib/guests/types";
import { EFFECTIVE_RSVP_STATUS_LABELS, type EffectiveRsvpStatus } from "@/lib/rsvp/status";

const BADGE_CLASSES: Record<EffectiveRsvpStatus, string> = {
  invited: "bg-sand text-ink/60",
  yes: "bg-olive/15 text-olive",
  no: "bg-terracotta/15 text-terracotta",
  deadline_missed: "bg-gold/20 text-gold",
};

export function RsvpStatusSelect({
  guestId,
  status,
  effectiveStatus,
}: {
  guestId: string;
  status: RsvpStatus;
  effectiveStatus: EffectiveRsvpStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(next: RsvpStatus) {
    startTransition(async () => {
      await setGuestRsvpStatus(guestId, next);
    });
  }

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(event) => handleChange(event.target.value as RsvpStatus)}
      className={`rounded-full border-none px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${BADGE_CLASSES[effectiveStatus]}`}
    >
      {RSVP_STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option === "invited" && effectiveStatus === "deadline_missed"
            ? EFFECTIVE_RSVP_STATUS_LABELS.deadline_missed
            : RSVP_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
