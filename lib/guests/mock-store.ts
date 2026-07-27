import "server-only";
import { SEATING_SEED_TABLE_IDS } from "@/lib/seating/mock-store";
import type { Guest } from "./types";

/**
 * In-memory guests store used only when LOCAL_TEST_BYPASS_AUTH is set, so
 * the admin UI can be exercised without a real Supabase project. Resets on
 * every dev server restart — intentional, no persistence needed here.
 */
let guests: Guest[] = seed();

type GuestOverrides = Partial<Guest> & Pick<Guest, "firstName" | "lastName">;

function makeGuest(overrides: GuestOverrides): Guest {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    email: null,
    phone: null,
    relationshipPriority: 4,
    preferredLanguage: "en",
    partyRoles: [],
    isPlusOneOf: null,
    rsvpDelegateOf: null,
    plusOneStatus: null,
    plusOneRequestedRelationship: null,
    invitedBy: "joint",
    rsvpDeadlineOverride: null,
    rsvpStatus: "invited",
    seatingTableId: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// 25 guests, majority "yes", covering a mix of priorities, languages,
// invited-by, wedding party roles, plus-ones, and RSVP delegation — enough
// variety to exercise filtering, sorting, and seating at a realistic scale.
function seed(): Guest[] {
  const mom = makeGuest({
    firstName: "Fionnuala",
    lastName: "Harvey",
    email: "fionnuala@example.com",
    phone: "+353 87 123 4567",
    relationshipPriority: 1,
    partyRoles: ["parent_of_the_couple"],
    invitedBy: "caoimhe",
    rsvpStatus: "yes",
    seatingTableId: SEATING_SEED_TABLE_IDS.headTable,
  });
  const julien = makeGuest({
    firstName: "Julien",
    lastName: "Moreau",
    email: "julien@example.com",
    relationshipPriority: 2,
    preferredLanguage: "fr",
    partyRoles: ["best_man"],
    invitedBy: "alexandre",
    rsvpStatus: "no",
    notes: "Vegetarian. Flying in from Lyon the morning of.",
  });
  const amelie = makeGuest({
    firstName: "Amelie",
    lastName: "Moreau",
    relationshipPriority: 5,
    preferredLanguage: "fr",
    isPlusOneOf: julien.id,
    rsvpDelegateOf: julien.id, // Julien RSVPs for his own plus-one.
    invitedBy: "alexandre",
  });
  const mei = makeGuest({
    firstName: "Mei",
    lastName: "Zhang",
    phone: "+86 138 0000 0000",
    relationshipPriority: 3,
    preferredLanguage: "zh",
    rsvpDelegateOf: mom.id, // Not a plus-one — Fionnuala just handles her RSVP.
    invitedBy: "joint",
    // In the past relative to today, and she never responded — demonstrates
    // the "Deadline missed" derived status.
    rsvpDeadlineOverride: "2026-06-01",
  });

  const chenWei = makeGuest({
    firstName: "Chen",
    lastName: "Wei",
    relationshipPriority: 3,
    preferredLanguage: "zh",
    invitedBy: "joint",
    rsvpStatus: "yes",
    seatingTableId: SEATING_SEED_TABLE_IDS.headTable,
  });
  const liNa = makeGuest({
    firstName: "Li",
    lastName: "Na",
    relationshipPriority: 5,
    preferredLanguage: "zh",
    isPlusOneOf: chenWei.id,
    rsvpDelegateOf: chenWei.id,
    invitedBy: "joint",
    rsvpStatus: "yes",
  });

  return [
    mom,
    julien,
    amelie,
    mei,
    makeGuest({
      firstName: "Siobhán",
      lastName: "Byrne",
      relationshipPriority: 1,
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Padraig",
      lastName: "Byrne",
      relationshipPriority: 1,
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Marc",
      lastName: "Dubois",
      relationshipPriority: 2,
      preferredLanguage: "fr",
      partyRoles: ["groomsman"],
      invitedBy: "alexandre",
      rsvpStatus: "yes",
      seatingTableId: SEATING_SEED_TABLE_IDS.table2,
    }),
    makeGuest({
      firstName: "Élodie",
      lastName: "Laurent",
      relationshipPriority: 2,
      preferredLanguage: "fr",
      partyRoles: ["bridesmaid"],
      invitedBy: "alexandre",
      rsvpStatus: "yes",
      seatingTableId: SEATING_SEED_TABLE_IDS.table2,
    }),
    makeGuest({
      firstName: "Thomas",
      lastName: "Kelly",
      relationshipPriority: 2,
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
      seatingTableId: SEATING_SEED_TABLE_IDS.table2,
    }),
    makeGuest({
      firstName: "Grace",
      lastName: "O'Sullivan",
      relationshipPriority: 2,
      partyRoles: ["maid_of_honor"],
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
      seatingTableId: SEATING_SEED_TABLE_IDS.headTable,
    }),
    makeGuest({
      firstName: "Liam",
      lastName: "Walsh",
      relationshipPriority: 3,
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Aoife",
      lastName: "Murphy",
      relationshipPriority: 3,
      rsvpStatus: "yes",
    }),
    chenWei,
    liNa,
    makeGuest({
      firstName: "Sophie",
      lastName: "Martin",
      relationshipPriority: 4,
      preferredLanguage: "fr",
      invitedBy: "alexandre",
    }),
    makeGuest({
      firstName: "Nathan",
      lastName: "Clarke",
      relationshipPriority: 4,
      invitedBy: "caoimhe",
    }),
    makeGuest({
      firstName: "Hannah",
      lastName: "Ryan",
      relationshipPriority: 4,
      invitedBy: "caoimhe",
      rsvpStatus: "no",
    }),
    makeGuest({
      firstName: "Wang",
      lastName: "Fang",
      relationshipPriority: 4,
      preferredLanguage: "zh",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Cathal",
      lastName: "Doyle",
      relationshipPriority: 3,
      partyRoles: ["usher"],
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Emma",
      lastName: "Fitzgerald",
      relationshipPriority: 4,
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Julia",
      lastName: "Roux",
      relationshipPriority: 4,
      preferredLanguage: "fr",
      invitedBy: "alexandre",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Kevin",
      lastName: "O'Brien",
      relationshipPriority: 3,
      partyRoles: ["master_of_ceremonies"],
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Zoe",
      lastName: "Bennett",
      relationshipPriority: 4,
      partyRoles: ["flower_girl"],
      invitedBy: "caoimhe",
    }),
    makeGuest({
      firstName: "Marie",
      lastName: "Laurent",
      relationshipPriority: 4,
      preferredLanguage: "fr",
      partyRoles: ["officiant"],
      invitedBy: "joint",
      rsvpStatus: "yes",
    }),
    makeGuest({
      firstName: "Tommy",
      lastName: "Byrne",
      relationshipPriority: 3,
      partyRoles: ["ring_bearer"],
      invitedBy: "caoimhe",
      rsvpStatus: "yes",
    }),
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

export function mockInsertGuest(
  data: Omit<Guest, "id" | "createdAt" | "updatedAt" | "seatingTableId">,
): Guest {
  const now = new Date().toISOString();
  const guest: Guest = {
    ...data,
    seatingTableId: null,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  guests.push(guest);
  return guest;
}

export function mockUpdateGuest(
  id: string,
  data: Partial<Omit<Guest, "id" | "createdAt" | "updatedAt">>,
): Guest | null {
  const index = guests.findIndex((guest) => guest.id === id);
  if (index === -1) return null;

  const updated: Guest = { ...guests[index], ...data, updatedAt: new Date().toISOString() };
  guests[index] = updated;
  return updated;
}

export function mockAssignGuestToTable(guestId: string, tableId: string | null): void {
  guests = guests.map((guest) =>
    guest.id === guestId ? { ...guest, seatingTableId: tableId } : guest,
  );
}

/** Unassigns every guest currently at a table, mirroring the DB's ON DELETE SET NULL. */
export function mockUnassignAllFromTable(tableId: string): void {
  guests = guests.map((guest) =>
    guest.seatingTableId === tableId ? { ...guest, seatingTableId: null } : guest,
  );
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
