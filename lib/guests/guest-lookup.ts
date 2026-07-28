import { phoneDigitsOnly } from "@/lib/phone/countries";
import type { Guest } from "./types";

/** Apostrophe-like characters seen in names (straight, curly, modifier, backtick). */
const APOSTROPHE_LIKE = /[\u0027\u2018\u2019\u201A\u201B\u2032\u02BC`]/g;

export function normalizeNamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(APOSTROPHE_LIKE, "'")
    .replace(/\s+/g, " ");
}

/** Case-insensitive first/last name match. Guests without a last name on file match on first name only. */
export function guestMatchesName(guest: Guest, firstName: string, lastName: string): boolean {
  const inputFirst = normalizeNamePart(firstName);
  const inputLast = normalizeNamePart(lastName);
  if (!inputFirst || !inputLast) return false;

  const guestFirst = normalizeNamePart(guest.firstName);
  const guestLast = normalizeNamePart(guest.lastName ?? "");
  if (guestFirst !== inputFirst) return false;
  if (guestLast) return guestLast === inputLast;
  return true;
}

export function guestHasContactOnFile(guest: Guest): boolean {
  return Boolean(guest.email?.trim() || guest.phone?.trim());
}

/** Case-insensitive email match; phone match ignores formatting. */
export function guestContactMatches(guest: Guest, contact: string): boolean {
  const normalizedContact = contact.trim().toLowerCase();
  if (!normalizedContact) return false;

  const emailMatches = Boolean(guest.email && guest.email.trim().toLowerCase() === normalizedContact);
  const normalizedContactPhone = phoneDigitsOnly(contact);
  const phoneMatches =
    normalizedContactPhone.length >= 4 &&
    Boolean(guest.phone && phoneDigitsOnly(guest.phone) === normalizedContactPhone);

  return emailMatches || phoneMatches;
}

export function findGuestsByName(guests: Guest[], firstName: string, lastName: string): Guest[] {
  return guests.filter((guest) => guestMatchesName(guest, firstName, lastName));
}

/**
 * Resolves a guest for quick sign-in: name match first, then contact when needed
 * to verify identity or disambiguate duplicates.
 */
export function resolveGuestForQuickSignIn(
  guests: Guest[],
  firstName: string,
  lastName: string,
  contact: string,
): Guest | null | "contact_required" | "contact_mismatch" {
  const matches = findGuestsByName(guests, firstName, lastName);
  if (matches.length === 0) return null;

  let guest: Guest | undefined;
  if (matches.length === 1) {
    guest = matches[0];
  } else {
    if (!contact.trim()) return "contact_required";
    guest = matches.find((candidate) => guestContactMatches(candidate, contact));
    if (!guest) return "contact_mismatch";
  }

  if (guestHasContactOnFile(guest)) {
    if (!contact.trim()) return "contact_required";
    if (!guestContactMatches(guest, contact)) return "contact_mismatch";
  }

  return guest;
}
