import "server-only";
import type { Guest } from "./types";

/**
 * In-memory guests store used only when LOCAL_TEST_BYPASS_AUTH is set, so
 * the admin UI can be exercised without a real Supabase project. Resets on
 * every dev server restart — intentional, no persistence needed here.
 */
let guests: Guest[] = seed();

function seed(): Guest[] {
  const now = new Date().toISOString();
  const momId = crypto.randomUUID();
  const bestManId = crypto.randomUUID();

  return [
    {
      id: momId,
      firstName: "Fionnuala",
      lastName: "Harvey",
      email: "fionnuala@example.com",
      phone: "+353 87 123 4567",
      relationshipPriority: 1,
      preferredLanguage: "en",
      partyRoles: ["parent_of_the_couple"],
      isPlusOneOf: null,
      rsvpDelegateOf: null,
      plusOneStatus: null,
      plusOneRequestedRelationship: null,
      invitedBy: "caoimhe",
      rsvpDeadlineOverride: null,
      rsvpStatus: "yes",
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: bestManId,
      firstName: "Julien",
      lastName: "Moreau",
      email: "julien@example.com",
      phone: null,
      relationshipPriority: 2,
      preferredLanguage: "fr",
      partyRoles: ["best_man"],
      isPlusOneOf: null,
      rsvpDelegateOf: null,
      plusOneStatus: null,
      plusOneRequestedRelationship: null,
      invitedBy: "alexandre",
      rsvpDeadlineOverride: null,
      rsvpStatus: "no",
      notes: "Vegetarian. Flying in from Lyon the morning of.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      firstName: "Amelie",
      lastName: "Moreau",
      email: null,
      phone: null,
      relationshipPriority: 5,
      preferredLanguage: "fr",
      partyRoles: [],
      isPlusOneOf: bestManId,
      // Julien RSVPs for his own plus-one.
      rsvpDelegateOf: bestManId,
      plusOneStatus: null,
      plusOneRequestedRelationship: null,
      invitedBy: "alexandre",
      rsvpDeadlineOverride: null,
      rsvpStatus: "invited",
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      firstName: "Mei",
      lastName: "Zhang",
      email: null,
      phone: "+86 138 0000 0000",
      relationshipPriority: 3,
      preferredLanguage: "zh",
      partyRoles: [],
      isPlusOneOf: null,
      // Not a plus-one relationship — Fionnuala just handles her RSVP.
      rsvpDelegateOf: momId,
      plusOneStatus: null,
      plusOneRequestedRelationship: null,
      invitedBy: "joint",
      // In the past relative to today, and she never responded — demonstrates
      // the "Deadline missed" derived status.
      rsvpDeadlineOverride: "2026-06-01",
      rsvpStatus: "invited",
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function mockListGuests(): Guest[] {
  return [...guests].sort(
    (a, b) =>
      a.relationshipPriority - b.relationshipPriority ||
      a.lastName.localeCompare(b.lastName) ||
      a.firstName.localeCompare(b.firstName),
  );
}

export function mockGetGuestById(id: string): Guest | null {
  return guests.find((guest) => guest.id === id) ?? null;
}

export function mockCountLinkedPlusOnes(id: string): number {
  return guests.filter((guest) => guest.isPlusOneOf === id).length;
}

export function mockInsertGuest(data: Omit<Guest, "id" | "createdAt" | "updatedAt">): Guest {
  const now = new Date().toISOString();
  const guest: Guest = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  guests.push(guest);
  return guest;
}

export function mockUpdateGuest(
  id: string,
  data: Omit<Guest, "id" | "createdAt" | "updatedAt">,
): Guest | null {
  const index = guests.findIndex((guest) => guest.id === id);
  if (index === -1) return null;

  const updated: Guest = { ...guests[index], ...data, updatedAt: new Date().toISOString() };
  guests[index] = updated;
  return updated;
}

export function mockSetRsvpDeadlineOverrides(ids: string[], deadline: string | null): void {
  const idSet = new Set(ids);
  guests = guests.map((guest) =>
    idSet.has(guest.id) ? { ...guest, rsvpDeadlineOverride: deadline } : guest,
  );
}

export function mockSetGuestRsvpStatus(id: string, status: Guest["rsvpStatus"]): void {
  guests = guests.map((guest) => (guest.id === id ? { ...guest, rsvpStatus: status } : guest));
}

/** Deletes a guest and unlinks any plus-ones/RSVP delegations, mirroring the DB's ON DELETE SET NULL. */
export function mockDeleteGuest(id: string): void {
  guests = guests
    .filter((guest) => guest.id !== id)
    .map((guest) => {
      const isPlusOneOf = guest.isPlusOneOf === id ? null : guest.isPlusOneOf;
      const rsvpDelegateOf = guest.rsvpDelegateOf === id ? null : guest.rsvpDelegateOf;
      return isPlusOneOf !== guest.isPlusOneOf || rsvpDelegateOf !== guest.rsvpDelegateOf
        ? { ...guest, isPlusOneOf, rsvpDelegateOf }
        : guest;
    });
}
