import type { Guest } from "@/lib/guests/types";

export function guestDisplayName(guest: Pick<Guest, "firstName" | "lastName">): string {
  return `${guest.firstName} ${guest.lastName}`;
}

/** Full names for the logged-in guest and anyone linked as their plus-one party. */
export function plusOnePartyNames(guest: Guest, allGuests: Guest[]): string[] {
  if (guest.isPlusOneOf) {
    const primary = allGuests.find((candidate) => candidate.id === guest.isPlusOneOf);
    if (!primary) return [guestDisplayName(guest)];

    const party = [
      primary,
      ...allGuests.filter((candidate) => candidate.isPlusOneOf === primary.id),
    ];
    return party.map(guestDisplayName);
  }

  const plusOnes = allGuests.filter((candidate) => candidate.isPlusOneOf === guest.id);
  if (plusOnes.length === 0) return [guestDisplayName(guest)];

  return [guestDisplayName(guest), ...plusOnes.map(guestDisplayName)];
}
