import type { Guest } from "@/lib/guests/types";
import {
  canDelegateRsvpFor,
  type RsvpDelegatePair,
} from "@/lib/guests/rsvp-delegates";
import { guestDisplayName } from "./party-names";

function plusOnePartyGuests(guest: Guest, allGuests: Guest[]): Guest[] {
  if (guest.isPlusOneOf) {
    const primary = allGuests.find((candidate) => candidate.id === guest.isPlusOneOf);
    if (!primary) return [guest];
    return [primary, ...allGuests.filter((candidate) => candidate.isPlusOneOf === primary.id)];
  }

  const plusOnes = allGuests.filter((candidate) => candidate.isPlusOneOf === guest.id);
  if (plusOnes.length === 0) return [guest];
  return [guest, ...plusOnes];
}

/** Guests whose contact details the signed-in guest may view and update. */
export function contactEditableGuests(
  actingGuest: Guest,
  allGuests: Guest[],
  pairs: RsvpDelegatePair[],
): Guest[] {
  const byId = new Map<string, Guest>();

  for (const guest of plusOnePartyGuests(actingGuest, allGuests)) {
    byId.set(guest.id, guest);
  }
  for (const guest of allGuests) {
    if (canDelegateRsvpFor(actingGuest.id, guest.id, allGuests, pairs)) {
      byId.set(guest.id, guest);
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.id === actingGuest.id) return -1;
    if (b.id === actingGuest.id) return 1;
    return guestDisplayName(a).localeCompare(guestDisplayName(b));
  });
}
