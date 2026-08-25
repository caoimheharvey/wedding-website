import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  canDelegateRsvpFor,
  type RsvpDelegatePair,
} from "@/lib/guests/rsvp-delegates";
import {
  mockCountLinkedPlusOnes,
  mockGetGuestById,
  mockListGuests,
  mockListRsvpDelegatePairs,
} from "./mock-store";
import type { Guest, GuestWithPlusOnes, RelationshipPriority } from "./types";
import {
  findGuestsByName,
  guestContactMatches,
  guestMatchesName,
  resolveGuestForQuickSignIn,
} from "./guest-lookup";

interface GuestRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  wechat_handle: string | null;
  relationship_priority: number;
  preferred_language: Guest["preferredLanguage"];
  party_roles: Guest["partyRoles"] | null;
  is_plus_one_of: string | null;
  plus_one_status: Guest["plusOneStatus"];
  plus_one_requested_relationship: string | null;
  plus_one_allowed: boolean;
  children_allowed: boolean;
  invited_by: Guest["invitedBy"];
  rsvp_deadline_override: string | null;
  rsvp_status: Guest["rsvpStatus"];
  seating_table_id: string | null;
  notes: string | null;
  dietary_restrictions: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: GuestRow): Guest {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    wechatHandle: row.wechat_handle,
    relationshipPriority: row.relationship_priority as RelationshipPriority,
    preferredLanguage: row.preferred_language,
    partyRoles: row.party_roles ?? [],
    isPlusOneOf: row.is_plus_one_of,
    plusOneStatus: row.plus_one_status,
    plusOneRequestedRelationship: row.plus_one_requested_relationship,
    plusOneAllowed: row.plus_one_allowed,
    childrenAllowed: row.children_allowed,
    invitedBy: row.invited_by,
    rsvpDeadlineOverride: row.rsvp_deadline_override,
    rsvpStatus: row.rsvp_status,
    seatingTableId: row.seating_table_id,
    notes: row.notes,
    dietaryRestrictions: row.dietary_restrictions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listRsvpDelegatePairs(): Promise<RsvpDelegatePair[]> {
  if (isLocalTestMode()) return mockListRsvpDelegatePairs();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guest_rsvp_delegates")
    .select("guest_id, delegate_id");

  if (error) throw new Error(`Failed to load RSVP delegates: ${error.message}`);

  return ((data as { guest_id: string; delegate_id: string }[]) ?? []).map((row) => ({
    guestId: row.guest_id,
    delegateId: row.delegate_id,
  }));
}

export async function listGuests(): Promise<Guest[]> {
  if (isLocalTestMode()) return mockListGuests();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("relationship_priority", { ascending: true })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(`Failed to load guests: ${error.message}`);
  return (data as GuestRow[]).map(mapRow);
}

/**
 * Guests grouped with their linked plus-ones nested underneath them, plus
 * who each guest may RSVP for and who may RSVP for them.
 */
export async function listGuestsWithPlusOnes(): Promise<GuestWithPlusOnes[]> {
  const [guests, pairs] = await Promise.all([listGuests(), listRsvpDelegatePairs()]);
  const guestIds = new Set(guests.map((guest) => guest.id));

  const withExtras: GuestWithPlusOnes[] = guests.map((guest) => ({
    ...guest,
    plusOnes: [],
    rsvpDelegateFor: [],
    rsvpDelegatedBy: [],
  }));
  const byId = new Map(withExtras.map((guest) => [guest.id, guest]));

  for (const guest of withExtras) {
    for (const other of guests) {
      if (other.id === guest.id) continue;
      if (canDelegateRsvpFor(guest.id, other.id, guests, pairs)) {
        guest.rsvpDelegateFor.push(other);
      }
      if (canDelegateRsvpFor(other.id, guest.id, guests, pairs)) {
        guest.rsvpDelegatedBy.push(other);
      }
    }
  }

  const primaries = withExtras.filter(
    (guest) => !guest.isPlusOneOf || !guestIds.has(guest.isPlusOneOf),
  );
  const primaryById = new Map(primaries.map((guest) => [guest.id, guest]));
  for (const guest of withExtras) {
    const primary = guest.isPlusOneOf && primaryById.get(guest.isPlusOneOf);
    if (primary && primary.id !== guest.id) primary.plusOnes.push(guest);
  }

  return primaries;
}

export async function getGuestById(guestId: string): Promise<Guest | null> {
  if (isLocalTestMode()) return mockGetGuestById(guestId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guestId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load guest: ${error.message}`);
  return data ? mapRow(data as GuestRow) : null;
}

/**
 * @deprecated Use resolveGuestForQuickSignIn via guest-lookup instead.
 * Kept for any external callers — matches first + last name and contact.
 */
export async function findGuestByNameAndContact(
  firstName: string,
  lastName: string,
  contact: string,
): Promise<Guest | null> {
  const guests = await listGuests();
  const result = resolveGuestForQuickSignIn(guests, firstName, lastName, contact);
  return result && typeof result === "object" ? result : null;
}

export { findGuestsByName, guestContactMatches, guestMatchesName };

export async function countLinkedPlusOnes(guestId: string): Promise<number> {
  if (isLocalTestMode()) return mockCountLinkedPlusOnes(guestId);

  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("is_plus_one_of", guestId);

  if (error) throw new Error(`Failed to check linked plus-ones: ${error.message}`);
  return count ?? 0;
}
