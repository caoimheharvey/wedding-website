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

/** Case-insensitive first/last name match. Both parts must align with what is on file. */
export function guestMatchesName(guest: Guest, firstName: string, lastName: string): boolean {
  const inputFirst = normalizeNamePart(firstName);
  const inputLast = normalizeNamePart(lastName);
  if (!inputFirst) return false;

  const guestFirst = normalizeNamePart(guest.firstName ?? "");
  const guestLast = normalizeNamePart(guest.lastName ?? "");
  if (guestFirst !== inputFirst) return false;

  if (guestLast) {
    return Boolean(inputLast) && guestLast === inputLast;
  }

  // No last name on file — only match when the guest did not enter a last name.
  return !inputLast;
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

/** WeChat handles are matched case-insensitively; a leading "@" is ignored. */
export function normalizeWechatHandle(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export function findGuestByWechatHandle(guests: Guest[], handle: string): Guest | null {
  const normalized = normalizeWechatHandle(handle);
  if (!normalized) return null;
  return (
    guests.find(
      (guest) => guest.wechatHandle && normalizeWechatHandle(guest.wechatHandle) === normalized,
    ) ?? null
  );
}

export function findGuestsByName(guests: Guest[], firstName: string, lastName: string): Guest[] {
  return guests.filter((guest) => guestMatchesName(guest, firstName, lastName));
}

function guestsWithFirstName(guests: Guest[], firstName: string): Guest[] {
  const normalizedFirst = normalizeNamePart(firstName);
  return guests.filter((guest) => normalizeNamePart(guest.firstName ?? "") === normalizedFirst);
}

/**
 * When a guest was added with only a first name, allow sign-in by first name alone
 * only if they are the sole guest with that first name.
 */
function uniqueGuestWithFirstNameOnly(guests: Guest[], firstName: string): Guest | null {
  const sameFirst = guestsWithFirstName(guests, firstName);
  if (sameFirst.length !== 1) return null;
  const [guest] = sameFirst;
  if (normalizeNamePart(guest.lastName ?? "")) return null;
  return guest;
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
  let matches = findGuestsByName(guests, firstName, lastName);

  if (matches.length === 0) {
    const uniqueFirstOnly = uniqueGuestWithFirstNameOnly(guests, firstName);
    if (uniqueFirstOnly) {
      matches = [uniqueFirstOnly];
    } else if (contact.trim()) {
      const noLastSameFirst = guestsWithFirstName(guests, firstName).filter(
        (guest) => !normalizeNamePart(guest.lastName ?? ""),
      );
      const contactMatch = noLastSameFirst.find((guest) => guestContactMatches(guest, contact));
      if (contactMatch) return contactMatch;
    }
  }

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
