import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockCountLinkedPlusOnes,
  mockGetGuestByEmail,
  mockGetGuestById,
  mockListGuests,
} from "./mock-store";
import type { Guest, GuestWithPlusOnes, RelationshipPriority } from "./types";

interface GuestRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  relationship_priority: number;
  preferred_language: Guest["preferredLanguage"];
  party_roles: Guest["partyRoles"] | null;
  is_plus_one_of: string | null;
  rsvp_delegate_of: string | null;
  plus_one_status: Guest["plusOneStatus"];
  plus_one_requested_relationship: string | null;
  invited_by: Guest["invitedBy"];
  rsvp_deadline_override: string | null;
  rsvp_status: Guest["rsvpStatus"];
  seating_table_id: string | null;
  notes: string | null;
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
    relationshipPriority: row.relationship_priority as RelationshipPriority,
    preferredLanguage: row.preferred_language,
    partyRoles: row.party_roles ?? [],
    isPlusOneOf: row.is_plus_one_of,
    rsvpDelegateOf: row.rsvp_delegate_of,
    plusOneStatus: row.plus_one_status,
    plusOneRequestedRelationship: row.plus_one_requested_relationship,
    invitedBy: row.invited_by,
    rsvpDeadlineOverride: row.rsvp_deadline_override,
    rsvpStatus: row.rsvp_status,
    seatingTableId: row.seating_table_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
 * (independently) who each guest RSVPs on behalf of.
 */
export async function listGuestsWithPlusOnes(): Promise<GuestWithPlusOnes[]> {
  const guests = await listGuests();
  const guestIds = new Set(guests.map((guest) => guest.id));

  const withExtras: GuestWithPlusOnes[] = guests.map((guest) => ({
    ...guest,
    plusOnes: [],
    rsvpDelegateFor: [],
  }));
  const byId = new Map(withExtras.map((guest) => [guest.id, guest]));

  for (const guest of guests) {
    const holder = guest.rsvpDelegateOf && byId.get(guest.rsvpDelegateOf);
    if (holder) holder.rsvpDelegateFor.push(guest);
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

export async function getGuestByEmail(email: string): Promise<Guest | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  if (isLocalTestMode()) return mockGetGuestByEmail(normalized);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .ilike("email", normalized)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up guest: ${error.message}`);
  return data ? mapRow(data as GuestRow) : null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * Matches a guest by full name plus either their email or phone on file —
 * used for the "quick sign-in" flow so guests without easy email access
 * (e.g. checking on a shared family device) can get in without a mailed
 * link. Requires both the name AND a contact detail to match, since name
 * alone is guessable within a family that shares a surname.
 */
export async function findGuestByNameAndContact(
  fullName: string,
  contact: string,
): Promise<Guest | null> {
  const normalizedName = fullName.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedContact = contact.trim().toLowerCase();
  if (!normalizedName || !normalizedContact) return null;

  const normalizedContactPhone = normalizePhone(contact);
  const guests = await listGuests();

  return (
    guests.find((guest) => {
      const guestName = `${guest.firstName} ${guest.lastName}`.trim().toLowerCase();
      if (guestName !== normalizedName) return false;

      const emailMatches = guest.email && guest.email.toLowerCase() === normalizedContact;
      const phoneMatches =
        normalizedContactPhone.length >= 4 &&
        guest.phone &&
        normalizePhone(guest.phone) === normalizedContactPhone;

      return Boolean(emailMatches || phoneMatches);
    }) ?? null
  );
}

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
