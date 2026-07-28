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

/** Plus-ones and RSVP delegatees whose contact details the signed-in guest may update — never includes the guest themselves. */
export function contactEditableGuests(
  actingGuest: Guest,
  allGuests: Guest[],
  pairs: RsvpDelegatePair[],
): Guest[] {
  const byId = new Map<string, Guest>();

  for (const guest of plusOnePartyGuests(actingGuest, allGuests)) {
    if (guest.id !== actingGuest.id) {
      byId.set(guest.id, guest);
    }
  }
  for (const guest of allGuests) {
    if (
      guest.id !== actingGuest.id &&
      canDelegateRsvpFor(actingGuest.id, guest.id, allGuests, pairs)
    ) {
      byId.set(guest.id, guest);
    }
  }

  return [...byId.values()].sort((a, b) => guestDisplayName(a).localeCompare(guestDisplayName(b)));
}
