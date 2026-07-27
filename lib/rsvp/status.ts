import { RSVP_STATUS_LABELS, type RsvpStatus } from "@/lib/guests/types";

export type EffectiveRsvpStatus = RsvpStatus | "deadline_missed";

export const EFFECTIVE_RSVP_STATUS_LABELS: Record<EffectiveRsvpStatus, string> = {
  ...RSVP_STATUS_LABELS,
  deadline_missed: "Deadline missed",
};

/**
 * "Deadline missed" is derived at read time, not stored: it depends on
 * today's date and the applicable deadline (override or default), both of
 * which can change after the fact — e.g. extending a deadline should bring a
 * missed guest back to "Invited" without an admin needing to touch them.
 */
export function getEffectiveRsvpStatus(
  status: RsvpStatus,
  effectiveDeadline: string | null,
): EffectiveRsvpStatus {
  if (status !== "invited" || !effectiveDeadline) return status;
  const today = new Date().toISOString().slice(0, 10);
  return effectiveDeadline < today ? "deadline_missed" : status;
}
