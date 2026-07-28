import type { Guest } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";

export interface RsvpDelegatePair {
  guestId: string;
  delegateId: string;
}

/** Whether `actingGuestId` may submit or update the RSVP for `targetGuestId`. */
export function canDelegateRsvpFor(
  actingGuestId: string,
  targetGuestId: string,
  allGuests: Guest[],
  pairs: RsvpDelegatePair[],
): boolean {
  if (actingGuestId === targetGuestId) return true;

  const target = allGuests.find((guest) => guest.id === targetGuestId);
  if (!target) return false;

  if (target.isPlusOneOf === actingGuestId) return true;

  return pairs.some((pair) => pair.guestId === targetGuestId && pair.delegateId === actingGuestId);
}

/** Guests whose RSVP `actingGuest` may submit (always includes themselves). */
export function rsvpSubmitteesFor(
  actingGuest: Guest,
  allGuests: Guest[],
  pairs: RsvpDelegatePair[],
): Guest[] {
  return allGuests
    .filter((guest) => canDelegateRsvpFor(actingGuest.id, guest.id, allGuests, pairs))
    .sort((a, b) => {
      if (a.id === actingGuest.id) return -1;
      if (b.id === actingGuest.id) return 1;
      return guestDisplayName(a).localeCompare(guestDisplayName(b));
    });
}

/** Explicit delegate guest ids configured in admin for this guest (not plus-one auto). */
export function explicitDelegateIdsForGuest(
  guestId: string,
  pairs: RsvpDelegatePair[],
): string[] {
  return pairs.filter((pair) => pair.guestId === guestId).map((pair) => pair.delegateId);
}

/** Other guests who may submit this guest's RSVP (excludes the guest themselves). */
export function rsvpDelegatesForGuest(
  guest: Guest,
  allGuests: Guest[],
  pairs: RsvpDelegatePair[],
): Guest[] {
  return allGuests.filter(
    (candidate) =>
      candidate.id !== guest.id &&
      canDelegateRsvpFor(candidate.id, guest.id, allGuests, pairs),
  );
}
